import { readFile, mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomic, digest, fileDigest, json, now, fail, text, inside, safeError } from './common.mjs';
import { command, parseOutput } from './process.mjs';

export const understandingAdapter = fileURLToPath(new URL('../scripts/understand.py', import.meta.url));
export const VISUAL_SHAPE = { observations: [{ id: '输入 images 中的准确 id', summary: '仅描述实际像素中可观察的主体、动作、界面和信息关系', readableText: '能辨认的文字，无法确认处写 [不清楚]', unknowns: ['不可见、含糊、需要其他证据的内容'] }] };
export function validateVisual(value, context) {
  if (!Array.isArray(value.observations) || value.observations.some(o => !o || typeof o !== 'object' || !Array.isArray(o.unknowns ?? [])) || value.observations.length !== context.images.length || new Set(value.observations.map(x => x.id)).size !== context.images.length) fail('invalid-generation', '每张输入图片需要且仅需要一条观察记录');
  return { observations: value.observations.map(o => {
    if (!context.images.some(i => i.id === o.id)) fail('invalid-reference', '图像观察引用了未提供的图片');
    return { id: o.id, summary: text(o.summary, '图像观察', { required: true, max: 5000 }), readableText: text(o.readableText, '可辨认文字', { max: 15000 }), unknowns: (o.unknowns ?? []).map(x => text(x, '图像待核实项', { max: 2000 })), evidence: 'model-image-observation-unverified' };
  }) };
}
function validateTranscript(value, duration) {
  if (value.alignmentMethod !== 'asr-word-timestamps' || !Array.isArray(value.segments) || value.segments.length > 30000) fail('invalid-analysis', '转录缺少真实时间段');
  let previous = 0;
  for (const s of value.segments) {
    if (!Number.isFinite(s.start) || !Number.isFinite(s.end) || s.start < previous - .05 || s.end < s.start || s.end > duration + 1 || typeof s.text !== 'string') fail('invalid-analysis', '转录时间段超出实际媒体或顺序无效');
    previous = s.end;
    for (const w of s.words ?? []) if (!Number.isFinite(w.start) || !Number.isFinite(w.end) || w.start < s.start - .1 || w.end > s.end + .1 || w.end < w.start) fail('invalid-analysis', '转录词边界无效');
  }
  return value;
}
export async function understandMaterials({ runner, id, task, materials, dir, signal, onProcess }) {
  const settings = task.state.execution, mode = settings.analysisMode ?? 'off';
  if (mode === 'off') return { materials, files: [], checks: [] };
  const files = [], checks = [], images = [], cacheRoot = join(runner.store.taskDir(id), 'analysis-cache'); await mkdir(cacheRoot, { recursive: true });
  const invoke = async (action, args) => parseOutput(await command(settings.mediaPython || settings.python || 'python3', [understandingAdapter, action, ...args], { signal, timeoutMs: 30 * 60 * 1000, maxOutput: 16 * 1024 * 1024, onProcess }));
  for (const m of materials) {
    signal?.throwIfAborted(); const source = inside(dir, m.file), supported = /^(image|audio|video)\//.test(m.mime) || m.mime === 'application/pdf'; if (!supported) continue;
    const key = digest([m.sha256, m.id, settings.mediaPython, settings.asrModel, settings.analysisLanguage, settings.videoFrames, 'understanding-v1']), cache = join(cacheRoot, key); await mkdir(cache, { recursive: true });
    const recordFile = join(cache, 'analysis.json'); let record = await json(recordFile, null);
    if (record?.data?.unknowns?.length) record = null;
    if (record) {
      if (record.digest !== digest(record.data)) fail('external-edit', '素材理解缓存被修改，请重做素材阶段');
      for (const f of record.files) if (await fileDigest(inside(cache, f.path)) !== f.sha256) fail('external-edit', '素材衍生文件被修改，请重新提取');
    } else {
      const analysis = { sourceId: m.id, sourceHash: m.sha256, createdAt: now(), unknowns: [], frames: [], verification: 'machine-extraction-unverified' }, derived = [];
      const attempt = async (name, fn) => { try { return await fn(); } catch (e) { if (signal?.aborted) throw e; if (mode === 'required') throw e; analysis.unknowns.push(`${name}：${safeError(e)}`); return null; } };
      if (m.mime.startsWith('image/')) analysis.ocr = await attempt('图片文字识别', () => invoke('--ocr', [source]));
      if (m.mime === 'application/pdf' && !m.text) await attempt('扫描 PDF 识别', async () => {
        // Every page is retained; excessive documents require an explicit split rather than silent truncation.
        const info = await command('pdfinfo', [source], { signal }); const pages = Number(/Pages:\s+(\d+)/.exec(info.stdout)?.[1]);
        if (!pages || pages > 40) fail('analysis-budget', '扫描 PDF 需分成每份不超过 40 页后识别');
        const rows = [];
        for (let i = 1; i <= pages; i++) { const name = `pdf-${i}`; await command('pdftoppm', ['-f', String(i), '-singlefile', '-scale-to', '1800', '-png', source, join(cache, name)], { signal, onProcess }); const file = `${name}.png`; derived.push(file); const ocr = await invoke('--ocr', [join(cache, file)]); rows.push({ page: i, ...ocr }); }
        analysis.ocr = { tool: 'rapidocr-onnxruntime', text: rows.map(r => `[第 ${r.page} 页]\n${r.text}`).join('\n\n'), pages: rows, verification: 'machine-ocr-unverified' };
      });
      if (/^(audio|video)\//.test(m.mime)) await attempt('音视频解析', async () => {
        const probe = parseOutput(await command(settings.ffprobe || 'ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', source], { signal, onProcess }));
        const duration = Number(probe.format?.duration); if (!Number.isFinite(duration) || duration <= 0) fail('invalid-analysis', '无法确认素材实际时长'); analysis.media = { duration, streams: probe.streams.map(s => ({ type: s.codec_type, codec: s.codec_name, width: s.width, height: s.height })) };
        if (probe.streams.some(s => s.codec_type === 'audio')) await attempt('语音转录', async () => {
          if (duration > (settings.analysisMaxMinutes ?? 120) * 60) fail('analysis-budget', '原片超过本次转录预算，请分段或调高素材处理时长设置');
          const audio = join(cache, 'audio.wav'); await command(settings.ffmpeg || 'ffmpeg', ['-y', '-i', source, '-vn', '-ac', '1', '-ar', '16000', audio], { signal, timeoutMs: 10 * 60 * 1000, onProcess }); derived.push('audio.wav');
          analysis.transcript = validateTranscript(await invoke('--asr', [audio, '--model', settings.asrModel || '', '--language', settings.analysisLanguage || 'auto']), duration);
        });
        if (m.mime.startsWith('video/')) for (let i = 0, count = settings.videoFrames ?? 4; i < count; i++) {
          const time = Math.min(duration - .05, duration * (i + .5) / count), file = `frame-${i + 1}.jpg`;
          await command(settings.ffmpeg || 'ffmpeg', ['-y', '-ss', String(Math.max(0, time)), '-i', source, '-frames:v', '1', '-vf', 'scale=1280:1280:force_original_aspect_ratio=decrease', join(cache, file)], { signal, onProcess }); derived.push(file); analysis.frames.push({ file, time });
        }
      });
      const hashes = []; for (const path of derived) hashes.push({ path, sha256: await fileDigest(join(cache, path)) });
      record = { data: analysis, digest: digest(analysis), files: hashes }; await atomic(recordFile, record);
    }
    const prefix = `analysis-${key.slice(0, 16)}`; m.analysis = structuredClone(record.data);
    for (const f of record.files) { const name = `${prefix}-${f.path}`; await copyFile(inside(cache, f.path), join(dir, name)); files.push(name); for (const frame of m.analysis.frames) if (frame.file === f.path) frame.file = name; }
    const analysisName = `${prefix}.json`; await atomic(join(dir, analysisName), m.analysis); files.push(analysisName); m.analysisFile = analysisName;
    const extracted = [m.analysis.ocr?.text, m.analysis.transcript?.text].filter(Boolean).join('\n\n');
    if (!m.text && extracted) { m.text = extracted; m.textEvidence = m.analysis.transcript ? 'machine-transcript-unverified' : 'machine-ocr-unverified'; }
    if (images.length >= 12 && (m.mime.startsWith('image/') || m.analysis.frames.length)) { m.analysis.unknowns.push('单批图像输入已达到 12 张，其余画面需另行实际查看'); await atomic(join(dir, analysisName), m.analysis); }
    if (m.mime.startsWith('image/') && images.length < 12) images.push({ id: m.id, sourceId: m.id, absolutePath: source, mimeType: m.mime });
    for (const f of m.analysis.frames) if (images.length < 12) images.push({ id: `${m.id}@${f.time.toFixed(3)}`, sourceId: m.id, time: f.time, absolutePath: join(dir, f.file), mimeType: 'image/jpeg' });
    checks.push({ id: `analysis-${m.id}`, label: `${m.name}：素材解析`, status: m.analysis.unknowns.length ? 'unknown' : 'pass', severity: 'info', detail: [...m.analysis.unknowns, 'OCR/ASR 为机器提取，语义仍需结合原件核对。'].join('；') });
  }
  if (images.length) {
    const hash = digest([images.map(i => [i.id, materials.find(m => m.id === i.sourceId).sha256]), settings.visionProvider || settings.provider, settings.visionModel || settings.model]), cache = join(cacheRoot, `visual-${hash}.json`);
    let result = await json(cache, null);
    if (result && digest(result.value) !== result.sha256) fail('external-edit', '图像观察缓存被修改');
    try {
      if (!result) { const value = await runner.generated(id, task, 'materials', 'visual-analysis', { brief: task.brief, materials, images, feedback: [] }, signal); result = { value, sha256: digest(value) }; await atomic(cache, result); }
      for (const m of materials) m.visualObservations = result.value.observations.filter(o => images.some(i => i.id === o.id && i.sourceId === m.id));
      await atomic(join(dir, 'visual-analysis.json'), result.value); files.push('visual-analysis.json');
    } catch (e) { if (signal?.aborted || mode === 'required' || e.code === 'generation-required') throw e; checks.push({ id: 'vision', label: '图像语义理解', status: 'unknown', severity: 'info', detail: safeError(e) }); }
  } else if (images.length) checks.push({ id: 'vision', label: '图像语义理解', status: 'unknown', severity: 'info', detail: '未选择可读取图像的模型；可由当前对话读取实际图片并导入观察，OCR 不等于图像语义。' });
  return { materials, files, checks };
}
