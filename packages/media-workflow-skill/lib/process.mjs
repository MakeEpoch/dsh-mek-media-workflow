import { workType } from './profiles.mjs';
import { voiceOf } from './schema.mjs';
import { spawn } from 'node:child_process';
import { access, realpath, readdir, stat, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { WorkflowError, now, safeError, digest } from './common.mjs';

export async function command(bin, args, { cwd, signal, timeoutMs = 120000, env = {}, maxOutput = 4 * 1024 * 1024, allowFailure = false, onEvent, onProcess } = {}) {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    let child, timer, forceTimer, stdout = '', stderr = '', lines = '', stopped = false, reason;
    const stop = error => {
      if (stopped) return; stopped = true; reason = error;
      try { process.platform === 'win32' ? child.kill('SIGTERM') : process.kill(-child.pid, 'SIGTERM'); } catch { /* already exited */ }
      forceTimer = setTimeout(() => { try { process.platform === 'win32' ? child.kill('SIGKILL') : process.kill(-child.pid, 'SIGKILL'); } catch {} }, 3000);
      forceTimer.unref();
    };
    const abort = () => stop(signal.reason ?? new DOMException('已暂停', 'AbortError'));
    const cleanup = () => { clearTimeout(timer); clearTimeout(forceTimer); signal?.removeEventListener('abort', abort); try { onProcess?.(null); } catch {} };
    try { child = spawn(bin, args, { cwd, shell: false, windowsHide: true, detached: process.platform !== 'win32', env: { ...process.env, POSTFARO_NO_UPDATE_CHECK: '1', ...env }, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) { reject(error); return; }
    try { onProcess?.({ pid: child.pid, command: bin, startedAt: now() }); } catch { /* telemetry cannot own child lifecycle */ }
    signal?.addEventListener('abort', abort, { once: true });
    if (timeoutMs) timer = setTimeout(() => stop(new WorkflowError('tool-timeout', `工具超时：${bin}`)), timeoutMs);
    child.stdout.on('data', b => { stdout += b.toString(); if (Buffer.byteLength(stdout) > maxOutput) stop(new WorkflowError('tool-output-limit', '工具输出超过上限')); });
    child.stderr.on('data', b => {
      const chunk = b.toString(); stderr = (stderr + chunk).slice(-maxOutput); lines = (lines + chunk).slice(-maxOutput);
      while (lines.includes('\n')) { const at = lines.indexOf('\n'), line = lines.slice(0, at); lines = lines.slice(at + 1); try { onEvent?.(JSON.parse(line)); } catch { /* ordinary diagnostic line */ } }
    });
    child.once('error', error => { cleanup(); reject(new WorkflowError(error.code === 'ENOENT' ? 'tool-missing' : 'tool-start-failed', `无法启动 ${bin}：${safeError(error)}`)); });
    child.once('close', (code, exitSignal) => {
      cleanup(); if (reason) return reject(reason);
      const result = { code, signal: exitSignal, stdout, stderr };
      if (code !== 0 && !allowFailure) reject(new WorkflowError('tool-failed', `${bin} 执行失败：${safeError(stderr || stdout || `退出码 ${code}`)}`, { code }));
      else resolve(result);
    });
  });
}
export function parseOutput(result) {
  const parse = value => { try { return JSON.parse(value.trim()); } catch { return null; } };
  const value = parse(result.stdout) ?? result.stdout.split('\n').reverse().map(parse).find(Boolean) ?? result.stderr.split('\n').reverse().map(parse).find(Boolean);
  if (!value) throw new WorkflowError('tool-invalid-json', '工具未返回可识别的 JSON 回执'); return value;
}
export async function findOm(config = {}) {
  if (config.om) return config.om;
  const candidates = [join(homedir(), '.agents/skills/huashu-motion/bin/om'), join(homedir(), '.codex/skills/huashu-motion/bin/om')];
  // Resolve the installed CLI directly; never invoke a skill wrapper's npx auto-install fallback.
  for (const path of candidates) { try { const resolved = await realpath(path); const cli = join(resolved, '../../../..', 'cli', 'om.js'); await access(cli, constants.X_OK); return cli; } catch {} }
  for (const entry of await readdir(join(homedir(), '.npm/_npx')).catch(() => [])) {
    const cli = join(homedir(), '.npm/_npx', entry, 'node_modules/huashu-motion/cli/om.js');
    try { await access(cli, constants.X_OK); return cli; } catch {}
  }
  return 'om';
}
export const ttsAdapter = fileURLToPath(new URL('../scripts/tts-adapter.py', import.meta.url));
export const mimoAdapter = fileURLToPath(new URL('../scripts/mimo-tts.py', import.meta.url));
// A listed encoder is not a working encoder: NVENC is present in most builds but fails on machines
// with no usable device node. Probe by actually encoding one frame; cache the verdict per ffmpeg path.
const encoderProbe = new Map();
export async function probeEncoder(bin, codec, { signal, timeoutMs = 60000 } = {}) {
  const key = `${bin}::${codec}`;
  if (encoderProbe.has(key)) return encoderProbe.get(key);
  const run = (async () => {
    const out = join(tmpdir(), `mw-enc-probe-${digest(key).slice(0, 12)}.mp4`);
    try {
      await command(bin, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=256x144:rate=10:duration=1', '-c:v', codec, '-pix_fmt', 'yuv420p', '-y', out], { signal, timeoutMs, allowFailure: true, maxOutput: 100000 });
      const info = await stat(out).catch(() => null);
      const ok = !!info && info.size > 0;
      return { codec, available: ok, detail: ok ? '实测编码通过，可直接使用。' : '实测编码未产出文件；已回退 CPU 编码。' };
    } catch (e) {
      return { codec, available: false, detail: `实测编码失败：${safeError(e)}；已回退 CPU 编码。` };
    } finally { await rm(out, { force: true }).catch(() => {}); }
  })();
  encoderProbe.set(key, run);
  return run;
}
export const GPU_CODECS = ['h264_nvenc', 'hevc_nvenc'];
// 设置决定"要不要试"，实测决定"能不能用"。gpu 是用户明确授权，但仍要实测；
// 实测失败一律回退 CPU 并说明原因，不静默申请提权，也不假装加速成功。
export function encodeRequest(requested, settings = {}) {
  const mode = settings.hardwareAcceleration ?? 'auto';
  if (mode === 'cpu') return 'libx264';
  if (mode === 'gpu') return GPU_CODECS.includes(requested) ? requested : GPU_CODECS[0];
  // auto：任务显式选了 GPU 编码器就尊重它，否则主动尝试硬件编码。
  return GPU_CODECS.includes(requested) ? requested : 'auto';
}
// Pick the fastest encoder that actually works: probe before committing, never assume from the encoder list.
export async function resolveCodec(bin, requested, { signal } = {}) {
  const candidates = [];
  if (GPU_CODECS.includes(requested)) candidates.push(requested);
  else if (requested === 'auto') candidates.push(...GPU_CODECS);
  else return { codec: requested, accelerated: false, detail: '' };
  for (const codec of candidates) {
    const probe = await probeEncoder(bin, codec, { signal });
    if (probe.available) return { codec, accelerated: true, detail: probe.detail };
  }
  return { codec: 'libx264', accelerated: false, detail: `${candidates.join(' / ')} 实测不可用，已回退 CPU 编码 libx264。` };
}
// The token is handed to the adapter through the environment, never through task input files.
export const mimoEnv = settings => ({ MIMO_API_KEY: String(settings.mimoApiKey || '').trim(), MIMO_BASE_URL: settings.mimoBaseUrl || '' });
export async function doctor(settings, { brief, signal } = {}) {
  const voice = voiceOf(brief, settings), mimo = voice.provider === 'mimo';
  const definitions = [
    { id: 'browser', label: 'Chrome / 图文 PNG 导出', bin: settings.browser || 'google-chrome', args: ['--version'], required: workType(brief) === 'image-post' },
    { id: 'understanding', label: '本地 OCR / ASR', bin: settings.mediaPython || 'python3', args: [fileURLToPath(new URL('../scripts/understand.py', import.meta.url)), '--check'], required: settings.analysisMode === 'required' && brief?.sources.some(s => ['image','screenshot','video','audio'].includes(s.role)), json: true },
    { id: 'ffmpeg', label: 'ffmpeg', bin: settings.ffmpeg, args: ['-version'], required: !brief || workType(brief) === 'video' },
    { id: 'ffprobe', label: 'ffprobe', bin: settings.ffprobe, args: ['-version'], required: !brief || workType(brief) === 'video' },
    { id: mimo ? 'mimo-tts' : 'edge-tts', label: mimo ? `MiMo 语音 · ${settings.mimoModel || 'mimo-v2.5-tts'}` : 'edge-tts / 词边界', bin: settings.python, args: [mimo ? mimoAdapter : ttsAdapter, '--check'], env: mimo ? mimoEnv(settings) : {}, required: (!brief || workType(brief) === 'video') && brief?.voice.mode === 'tts', json: true },
    { id: 'postfaro', label: 'PostFaro CLI', bin: settings.postfaro, args: ['version'], required: brief?.publish.enabled ?? false, json: true },
    { id: 'huashu', label: 'huashu-motion', bin: await findOm(settings), args: ['--version'], required: (!brief || workType(brief) === 'video') && brief?.render.backend === 'huashu' },
    { id: 'vips', label: 'vips / 图像处理（可选）', bin: 'vips', args: ['--version'], required: false },
  ];
  const capabilities = await Promise.all(definitions.map(async d => {
    try {
      const out = await command(d.bin, d.args, { signal, timeoutMs: 15000, allowFailure: true, maxOutput: 100000, env: d.env });
      let value; if (d.json) { try { value = parseOutput(out); } catch {} }
      const valid = !!out.stdout.trim() && (!d.json || value && value.ok !== false);
      return { id: d.id, label: d.label, required: !!d.required, path: d.bin, status: out.code !== 0 ? 'unavailable' : valid ? 'available' : 'unknown', version: value?.version ?? value?.result?.version ?? out.stdout.split('\n')[0].slice(0, 200), details: value ?? (out.code ? safeError(out.stderr) : valid ? '' : '进程结束但未返回可核实的版本输出'), checkedAt: now() };
    } catch (e) { if (signal?.aborted) throw e; return { id: d.id, label: d.label, required: !!d.required, path: d.bin, status: 'unavailable', details: safeError(e), checkedAt: now() }; }
  }));
  // 实测优先：编码器存在不等于设备可用，只有真编码出文件才算可用。
  try {
    const out = await command(settings.ffmpeg, ['-hide_banner', '-encoders'], { signal, timeoutMs: 10000 });
    const listed = GPU_CODECS.filter(c => out.stdout.includes(c));
    if (!listed.length) capabilities.push({ id: 'nvenc', label: 'GPU 硬件编码（可选加速）', required: false, status: 'unavailable', details: 'ffmpeg 未列出 NVENC 编码器；使用 CPU 编码。', checkedAt: now() });
    else {
      const probe = await resolveCodec(settings.ffmpeg, encodeRequest('h264_nvenc', settings), { signal });
      capabilities.push({ id: 'nvenc', label: 'GPU 硬件编码（可选加速）', required: false, status: probe.accelerated ? 'available' : 'unavailable', version: probe.accelerated ? probe.codec : undefined, details: probe.detail || `${listed.join(' / ')} 已列出但实测未通过。`, checkedAt: now() });
    }
  }
  catch (e) { capabilities.push({ id: 'nvenc', label: 'GPU 硬件编码（可选加速）', required: false, status: 'unavailable', details: safeError(e), checkedAt: now() }); }
  const modelReady = settings.asrModel && await stat(join(settings.asrModel, 'model.bin')).then(s => s.isFile(), () => false);
  capabilities.push({ id: 'asr-model', label: '本地语音模型', required: settings.analysisMode === 'required' && brief?.sources.some(s => ['audio','video'].includes(s.role)), status: modelReady ? 'available' : 'unavailable', details: modelReady ? settings.asrModel : '请通过显式运行环境安装准备模型；制作过程中不会静默联网下载。', checkedAt: now() });
  capabilities.push({ id: 'extension', label: 'PostFaro 扩展 ≥ 1.0.6', required: brief?.publish.enabled ?? false, status: 'unknown', details: '需选择实际浏览器桥接后，通过 capabilities 核对版本和所需平台能力。', checkedAt: now() });
  return { checkedAt: now(), capabilities, ready: capabilities.filter(c => c.required).every(c => c.status === 'available') };
}
