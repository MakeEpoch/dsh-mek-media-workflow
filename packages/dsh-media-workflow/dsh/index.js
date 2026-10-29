import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { MediaService } from '../host/service.js';
import { common, core, coreBase } from '../host/core.js';

export const name = 'dsh-media-workflow';
export const inject = ['connection'];
export const ENDPOINT = 'dsh-media-workflow';

async function boundedBody(request, max) {
  let size = 0; const chunks = [];
  for await (const chunk of request.body ?? []) { size += chunk.length; if (size > max) common.fail('request-too-large', '请求体超过允许大小'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
// 试听样本由 MiMo 实际合成（mimo-v2.5-tts，同一句台词），标签只描述测得的基频，不臆造性格。
export const VOICE_SAMPLES = [
  { name: '冰糖', file: 'mimo-1.mp3', pitch: 279, label: '女声 · 高音' },
  { name: '茉莉', file: 'mimo-2.mp3', pitch: 229, label: '女声 · 偏中' },
  { name: '苏打', file: 'mimo-3.mp3', pitch: 216, label: '女声 · 中音' },
  { name: '白桦', file: 'mimo-4.mp3', pitch: 103, label: '男声 · 低音' },
  { name: 'Mia', file: 'mimo-5.mp3', pitch: 261, label: '女声 · 偏高' },
  { name: 'Chloe', file: 'mimo-6.mp3', pitch: 261, label: '女声 · 偏高' },
  { name: 'Milo', file: 'mimo-7.mp3', pitch: 104, label: '男声 · 低音' },
  { name: 'Dean', file: 'mimo-8.mp3', pitch: 107, label: '男声 · 低音' }
];
const voiceSamples = Object.fromEntries(VOICE_SAMPLES.map(item => [item.name, item.file]));
export function registerRpc(ctx, service) {
  const disposers = [];
  const stop = async () => { for (const dispose of disposers.reverse()) { try { await dispose(); } catch {} } };
  try {
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}`, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return new Response('JSON required', { status: 415 });
      let message;
      try { message = JSON.parse((await boundedBody(request, 2 * 1024 * 1024)).toString('utf8')); } catch { return new Response('Invalid or oversized JSON', { status: 400 }); }
      if (message.type !== 'client-request' || message.method !== ENDPOINT || typeof message.rpcId !== 'string' || typeof message.payload?.method !== 'string') return new Response('Invalid RPC', { status: 400 });
      let result;
      try { result = { ok: true, value: await service.dispatch(message.payload.method, message.payload.payload ?? {}) }; }
      catch (error) { result = { ok: false, error: { code: error.code ?? 'execution-failed', message: common.safeError(error), details: error.details ?? {} } }; }
      return Response.json({ type: 'server-response', rpcId: message.rpcId, result });
    } }));
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}/artifact`, methods: ['GET'], requestBody: 'buffered', async fetch(request) {
      try {
        const url = new URL(request.url), asset = await service.store.artifact(url.searchParams.get('task'), url.searchParams.get('path'));
        const range = request.headers.get('range'); let start = 0, end = asset.size - 1;
        if (range) { const match = /^bytes=(\d*)-(\d*)$/.exec(range); if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416 }); if (!match[1]) start = Math.max(0, asset.size - Number(match[2])); else { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; } if (start > end || start >= asset.size) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${asset.size}` } }); }
        const headers = { 'content-type': asset.mime, 'accept-ranges': 'bytes', 'content-length': String(Math.max(0, end - start + 1)), 'x-content-type-options': 'nosniff', 'cache-control': 'private, no-cache', 'content-security-policy': "sandbox allow-same-origin; default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; script-src 'none'; base-uri 'none'; form-action 'none'", 'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(asset.path.split('/').pop())}` };
        if (!range && ['text/html', 'text/css'].includes(asset.mime) && asset.size <= 32 * 1024 * 1024) {
          const path = relative(service.store.taskDir(url.searchParams.get('task')), asset.path), content = core.rewriteDocumentAssets(await readFile(asset.path, 'utf8'), path, target => { const u = new URL(url); u.searchParams.set('path', target); return u.pathname + u.search; }, { css: asset.mime === 'text/css' }); const bytes = Buffer.from(content); headers['content-length'] = String(bytes.length); return new Response(bytes, { headers });
        }
        if (range) headers['content-range'] = `bytes ${start}-${end}/${asset.size}`;
        return new Response(asset.size ? Readable.toWeb(createReadStream(asset.path, { start, end })) : null, { status: range ? 206 : 200, headers });
      } catch (error) { return new Response(common.safeError(error), { status: error.code === 'not-found' || error.code === 'ENOENT' ? 404 : 400 }); }
    } }));
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}/upload-chunk`, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      try { const url = new URL(request.url), bytes = await boundedBody(request, 8 * 1024 * 1024), value = await service.store.transfers.chunk(url.searchParams.get('task'), url.searchParams.get('transfer'), Number(url.searchParams.get('offset')), bytes); return Response.json({ ok: true, value }); } catch (e) { return Response.json({ ok: false, error: { code: e.code, message: common.safeError(e), details: e.details } }, { status: 400 }); }
    } }));
    // 预置音色试听：随插件打包的固定样本，离线播放，不消耗 Token
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}/sample`, methods: ['GET'], requestBody: 'buffered', async fetch(request) {
      try {
        const name = String(new URL(request.url).searchParams.get('name') || ''), file = voiceSamples[name];
        if (!file) return new Response('Sample not found', { status: 404 });
        const path = fileURLToPath(new URL(`../embedded-media/voices/${file}`, import.meta.url)), buffer = await readFile(path);
        return new Response(buffer, { status: 200, headers: { 'content-type': 'audio/mpeg', 'content-length': String(buffer.length), 'cache-control': 'public, max-age=604800, immutable', 'x-content-type-options': 'nosniff' } });
      } catch (error) { return new Response(common.safeError(error), { status: error.code === 'ENOENT' ? 404 : 400 }); }
    } }));
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}/canvas-image`, methods: ['GET'], requestBody: 'buffered', async fetch(request) {
      try { const url = new URL(request.url), asset = await service.store.artifact(url.searchParams.get('task'), url.searchParams.get('path')); if (!asset.path.endsWith('/publication.json')) common.fail('invalid-file', '不是排版工程'); const project = await common.json(asset.path), data = project.images?.[url.searchParams.get('image')]?.data, match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(data || ''); if (!match) common.fail('not-found', '图片不存在'); return new Response(Buffer.from(match[2], 'base64'), { headers: { 'content-type': match[1], 'cache-control': 'private, no-cache', 'x-content-type-options': 'nosniff' } }); } catch (e) { return new Response(common.safeError(e), { status: 400 }); }
    } }));
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}/upload`, methods: ['POST'], requestBody: 'streaming', async fetch(request) {
      try { const url = new URL(request.url), data = await boundedBody(request, 20 * 1024 * 1024); const value = await service.store.upload(url.searchParams.get('task'), { name: url.searchParams.get('name'), role: url.searchParams.get('role') || 'source', attribution: url.searchParams.get('attribution') || '', usage: url.searchParams.get('usage') || '', staged: url.searchParams.get('staged') === 'true', base64: data.toString('base64') }); return Response.json({ ok: true, value }); }
      catch (error) { return Response.json({ ok: false, error: { code: error.code, message: common.safeError(error) } }, { status: 400 }); }
    } }));
    disposers.push(ctx.connection.fetch.register({ path: `/api/${ENDPOINT}/export`, methods: ['GET'], requestBody: 'buffered', async fetch(request) {
      try { const url = new URL(request.url), key = common.safeId(url.searchParams.get('id')), record = await common.json(join(service.store.root, 'exports', `${key}.json`)); const path = join(service.store.root, 'exports', `${key}.tar.gz`); return new Response(Readable.toWeb(createReadStream(path)), { headers: { 'content-type': 'application/gzip', 'content-length': String(record.size), 'cache-control': 'private, no-store', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.name)}` } }); }
      catch { return new Response('Export not found', { status: 404 }); }
    } }));
    return stop;
  } catch (error) { void stop(); throw error; }
}
const taskRoot = configured => configured ? common.expand(configured) : join(process.env.DSH_HOME ? common.expand(process.env.DSH_HOME) : join(homedir(), '.dsh'), 'media-workflow');
export function skillProvider({ root } = {}) {
  const path = fileURLToPath(new URL('SKILL.md', coreBase)), resourceBase = { kind: 'directory', path: fileURLToPath(coreBase) };
  const runtime = async () => { const currentRoot = taskRoot(typeof root === 'function' ? await root() : root); return `\n\n## 当前 DSH 工作台连接\n\n本宿主任务数据根（所有命令的 --root）：${JSON.stringify(currentRoot)}\n任务目录：${JSON.stringify(join(currentRoot, 'tasks', '<taskId>'))}\nCLI 入口：${JSON.stringify(fileURLToPath(new URL('scripts/workflow.mjs', coreBase)))}\n\n开始制作前读取该数据根的 AGENTS.md（如已有小写 agents.md 则读取它），遵守目录用途、版本回纳与评审约定。\n\n在本 DSH 会话中直接使用上述数据根，不在当前工作区另建任务库。先用 list 核对已有任务，创建后用 status 回读同一 ID；工作台会读取这份状态。素材和阶段响应可以保存在工作区。设置切换目录后重新加载本技能，不沿用旧上下文中的 root。遇到目录写入权限不足时明确报告并取得该目录权限，不换根创建平行任务。\n`; };
  const summary = { name: 'media-workflow', description: '多风格、多类型内容制作：文章、图文贴图和视频的制作指导，以及三类原生任务、实际素材理解、自由排版、版本评审与发布核验。', source: 'bundled', provider: 'dsh-media-workflow', invocation: { modelInvocable: true, userInvocable: true }, resourceBase, path };
  return { name: 'dsh-media-workflow', async list({ signal } = {}) { signal?.throwIfAborted(); return [{ ...summary, rank: 600, locator: 'media-workflow' }]; }, async get(candidate, { signal } = {}) { signal?.throwIfAborted(); if (candidate.name !== summary.name) return undefined; const raw = await readFile(path, 'utf8'); return { ...summary, content: await runtime() + '\n' + raw.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '') }; } };
}
export function apply(ctx, config = {}) {
  const locationFile = config.locationFile || join(taskRoot(), 'location.json'), location = common.json(locationFile, null);
  let currentRoot = taskRoot(config.root);
  ctx.effect(() => {
    let disposed = false, service, stop;
    const ready = Promise.resolve().then(async () => {
      currentRoot = (await location)?.root || currentRoot;
      service = new MediaService({ ctx, root: currentRoot, locationFile, onRootChange: root => { currentRoot = root; } }); await service.recover(); stop = registerRpc(ctx, service);
      if (disposed) return stop();
      service.background('startup-doctor', () => service.checks());
    }).catch(async error => { await stop?.(); await service?.dispose().catch(() => {}); ctx.logger?.error?.(`[media-workflow] 初始化失败：${common.safeError(error)}`); });
    return async () => { disposed = true; await ready; try { await stop?.(); } finally { await service?.dispose(); } };
  }, 'media-workflow: host');
  ctx.inject(['skills'], child => { child.effect(() => { try { return child.skills.registerProvider(() => skillProvider({ root: async () => { await location; return currentRoot; } })); } catch (error) { child.logger?.warn?.(`[media-workflow] 技能登记失败：${common.safeError(error)}`); } }, 'media-workflow: skill'); });
}
