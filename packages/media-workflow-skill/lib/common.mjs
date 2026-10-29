import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, stat, open } from 'node:fs/promises';
import { resolve, relative, dirname, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { createReadStream } from 'node:fs';

export class WorkflowError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'WorkflowError'; this.code = code; this.details = details; }
}
export const fail = (code, message, details) => { throw new WorkflowError(code, message, details); };
export const now = () => new Date().toISOString();
export const uuid = () => randomUUID();
export const clone = value => structuredClone(value);
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, canonical(value[k])]));
  return value;
}
export const digest = value => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(canonical(value))).digest('hex');
export async function fileDigest(path) { const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex'); }
export const expand = path => path === '~' ? homedir() : path?.startsWith('~/') ? resolve(homedir(), path.slice(2)) : resolve(path);
export const defaultRoot = () => resolve(process.env.MEDIA_WORKFLOW_HOME || (process.env.DSH_HOME ? `${expand(process.env.DSH_HOME)}/media-workflow` : `${homedir()}/.media-workflow`));
export function inside(root, path) {
  const full = resolve(root, path), rel = relative(resolve(root), full);
  if (rel === '..' || rel.startsWith('../') || isAbsolute(rel)) fail('invalid-path', '路径超出任务目录');
  return full;
}
export function safeId(id) { if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(id)) fail('invalid-id', '任务或产物标识无效'); return id; }
export function text(value, name, { required = false, max = 30000 } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail('invalid-input', `${name}${required ? '为必填项，且' : ''}必须是有效文本`);
  return value.trim();
}
export function webUrl(value) {
  let url; try { url = new URL(value); } catch { fail('invalid-url', '请输入完整的 HTTP(S) 来源链接'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail('invalid-url', '来源链接仅支持不带凭据的 HTTP(S) 地址');
  return url.href;
}
export async function json(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT' && arguments.length > 1) return clone(fallback); if (error instanceof SyntaxError) fail('corrupt-data', `JSON 文件无法解析：${path}`); throw error; }
}
export async function atomic(path, value) {
  await mkdir(dirname(path), { recursive: true }); const temp = `${path}.${uuid()}.tmp`;
  try { await writeFile(temp, typeof value === 'string' || Buffer.isBuffer(value) ? value : `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 }); await rename(temp, path); }
  finally { await rm(temp, { force: true }).catch(() => {}); }
}
export async function regular(path, max = 2 * 1024 * 1024 * 1024) {
  const info = await stat(path); if (!info.isFile() || info.size > max) fail('invalid-file', '需要大小在允许范围内的普通文件'); return info;
}
export const isAlive = pid => { if (!Number.isInteger(pid) || pid < 1) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
export async function lock(path, fn, { signal, waitMs = 6000 } = {}) {
  await mkdir(dirname(path), { recursive: true }); const token = uuid(), started = Date.now();
  while (true) {
    signal?.throwIfAborted();
    try { const handle = await open(path, 'wx', 0o600); await handle.writeFile(JSON.stringify({ pid: process.pid, token, createdAt: now() })); await handle.close(); break; }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const owner = await json(path, null).catch(() => null);
      if (owner && !isAlive(owner.pid)) { await rm(path, { force: true }); continue; }
      if (Date.now() - started >= waitMs) fail('busy', '任务正由另一个执行器处理，请读取当前状态后重试');
      await new Promise(r => setTimeout(r, 30));
    }
  }
  try { return await fn(); }
  finally { const owner = await json(path, null).catch(() => null); if (owner?.token === token) await rm(path, { force: true }); }
}
export function safeError(error) {
  return String(error?.message ?? error).replace(/(authorization|api[_-]?key|token|password|cookie)\s*[:=]\s*[^\s,;]+/ig, '$1=[redacted]').slice(0, 2000);
}
export const mime = name => ({ mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', json: 'application/json', md: 'text/markdown', txt: 'text/plain', srt: 'text/plain', vtt: 'text/vtt', html: 'text/html', pdf: 'application/pdf', css: 'text/css', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' })[name.split('.').pop().toLowerCase()] ?? 'application/octet-stream';
export const htmlEscape = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
