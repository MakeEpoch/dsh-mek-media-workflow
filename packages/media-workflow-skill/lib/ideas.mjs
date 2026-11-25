// 灵感墙数据层：卡片存在本插件数据根下的独立文件（<root>/ideas.json），
// 与 ~/.dsh/media-desk 完全隔离。交互样式吸收自 woniuniuniu/dsh-media-desk（MIT）。
// 模型或外部内容都是不可信输入，所以写操作只放行白名单字段。
import { join } from 'node:path';
import { mkdir, readdir, readFile, stat } from 'node:fs/promises';
import { atomic, fail, json, lock, now, uuid } from './common.mjs';

export const IDEA_KINDS = ['note', 'quote', 'link', 'image', 'video'];
const IDEA_FILE = 'ideas.json';
const MEDIA_DIR = 'ideas-media';
const MAX_ITEMS = 2000;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function isHttpUrl(value) {
  try { const url = new URL(value); return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password; }
  catch { return false; }
}

const MEDIA_SRC = /^ideas-media\/[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/;

const FIELDS = { title: 'text', body: 'text', kind: 'kind', url: 'url', source: 'text', tags: 'list', pinned: 'bool', media: 'media', pos: 'pos' };

function coerce(type, value) {
  switch (type) {
    case 'text': return typeof value === 'string' ? value.slice(0, 40000) : undefined;
    case 'kind': return IDEA_KINDS.includes(value) ? value : undefined;
    case 'list': return Array.isArray(value) ? value.filter(v => typeof v === 'string').slice(0, 24) : undefined;
    case 'bool': return typeof value === 'boolean' ? value : undefined;
    case 'url': return value === null || value === '' ? null : isHttpUrl(value) ? value : undefined;
    case 'pos': return isObject(value) && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: value.x, y: value.y } : undefined;
    case 'media': {
      if (value === null) return null;
      if (!isObject(value) || typeof value.src !== 'string' || !MEDIA_SRC.test(value.src)) return undefined;
      const out = { src: value.src };
      if (typeof value.mime === 'string' && /^(image|video)\//.test(value.mime)) out.mime = value.mime.slice(0, 80);
      if (Number.isFinite(value.w) && value.w > 0) out.w = value.w;
      if (Number.isFinite(value.h) && value.h > 0) out.h = value.h;
      return out;
    }
    default: return undefined;
  }
}

function pick(input) {
  const out = {};
  for (const [key, type] of Object.entries(FIELDS)) {
    if (!isObject(input) || input[key] === undefined) continue;
    const value = coerce(type, input[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function emptyIdeas() { return { version: 1, updatedAt: now(), items: [] }; }

/** 只保留认识的字段，丢掉模型可能塞进来的多余内容。 */
export function normalizeIdeas(raw) {
  if (!isObject(raw) || !Array.isArray(raw.items)) return emptyIdeas();
  const items = [];
  for (const row of raw.items.slice(0, MAX_ITEMS)) {
    if (!isObject(row) || typeof row.id !== 'string' || !IDEA_KINDS.includes(row.kind)) continue;
    const clean = pick(row);
    items.push({ id: row.id, kind: clean.kind || row.kind, title: clean.title ?? '', body: clean.body ?? '', url: clean.url ?? null, source: clean.source ?? '', tags: clean.tags ?? [], pinned: clean.pinned === true, media: clean.media ?? null, pos: clean.pos ?? null, createdAt: typeof row.createdAt === 'string' ? row.createdAt : now(), updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : now() });
  }
  return { version: 1, updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now(), items };
}

const short = (text, n = 24) => { const s = String(text || '').trim(); return s.length > n ? `${s.slice(0, n)}…` : s; };

function nextPos(items) {
  const n = items.filter(row => row.pos).length, scale = 1 + (n % 6) * 0.2;
  return { x: Math.round(Math.cos(n * 2.39996) * 520 * scale), y: Math.round(Math.sin(n * 2.39996) * 300 * scale) };
}

const handlers = {
  add(state, op) {
    const fields = pick(op);
    const kind = fields.kind || 'note';
    const item = { id: `idea_${uuid()}`, kind, title: fields.title ?? '', body: fields.body ?? '', url: fields.url ?? null, source: fields.source ?? '', tags: fields.tags ?? [], pinned: fields.pinned === true, media: fields.media ?? null, pos: fields.pos ?? null, createdAt: now(), updatedAt: now() };
    if (!item.title && !item.body && !item.media && !item.url) fail('invalid-idea', '灵感内容为空');
    if (!item.title) item.title = short(item.body, 28) || (item.media ? (kind === 'video' ? '视频灵感' : '图片灵感') : item.url || '未命名灵感');
    if (!item.pos) item.pos = nextPos(state.items);
    state.items.unshift(item);
    return { text: `记下灵感《${short(item.title)}》`, target: item.id, kind: 'idea' };
  },
  update(state, op) {
    const item = state.items.find(row => row.id === op.id);
    if (!item) fail('not-found', '灵感不存在或已删除');
    const fields = pick(op);
    Object.assign(item, fields); item.updatedAt = now();
    return { text: `更新《${short(item.title)}》`, target: item.id, kind: 'idea' };
  },
  delete(state, op) {
    const item = state.items.find(row => row.id === op.id);
    if (!item) fail('not-found', '灵感不存在或已删除');
    state.items = state.items.filter(row => row.id !== op.id);
    return { text: `删除《${short(item.title)}》`, target: item.id, kind: 'idea' };
  },
  move(state, op) {
    const item = state.items.find(row => row.id === op.id);
    if (!item) fail('not-found', '灵感不存在或已删除');
    const pos = coerce('pos', op.pos);
    if (!pos) fail('invalid-position', '位置无效');
    item.pos = pos; item.updatedAt = now();
    return { text: `移动《${short(item.title)}》`, target: item.id, kind: 'idea' };
  },
};

/** 依次执行一批白名单操作；单条失败不影响其他成功操作。 */
export function applyIdeaOps(state, ops) {
  const receipts = [], errors = [];
  for (const op of Array.isArray(ops) ? ops : []) {
    const handler = isObject(op) && Object.hasOwn(handlers, op.op) ? handlers[op.op] : undefined;
    if (!handler) { errors.push(`不支持的操作：${String(op?.op)}`); continue; }
    try { const receipt = handler(state, op); if (receipt) receipts.push(receipt); }
    catch (error) { errors.push(error.message); }
  }
  state.updatedAt = now();
  if (state.items.length > MAX_ITEMS) state.items = state.items.slice(0, MAX_ITEMS);
  return { receipts, errors };
}

export class IdeaStore {
  constructor(root) { this.root = root; }
  get file() { return join(this.root, IDEA_FILE); }
  get mediaDir() { return join(this.root, MEDIA_DIR); }
  async read() {
    await mkdir(this.mediaDir, { recursive: true });
    return normalizeIdeas(await json(this.file, emptyIdeas()));
  }
  async list() { return this.read(); }
  async apply(ops) {
    return lock(join(this.root, 'ideas.lock'), async () => {
      const state = await this.read();
      const { receipts, errors } = applyIdeaOps(state, ops);
      await atomic(this.file, state);
      return { state, receipts, errors };
    });
  }
  async saveMedia({ name, mime, base64 }) {
    const safe = String(name || '').replace(/[^\w.-]+/g, '_').slice(-80) || 'file';
    const ext = (safe.match(/\.([A-Za-z0-9]+)$/)?.[1] || '').toLowerCase();
    const allowed = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
    if (!allowed[ext]) fail('invalid-media', '只支持常见图片或视频格式');
    if (typeof base64 !== 'string' || !base64) fail('invalid-media', '上传内容为空');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > 40 * 1024 * 1024) fail('media-too-large', '单个图片或视频最多 40MB');
    await mkdir(this.mediaDir, { recursive: true });
    const file = `${uuid()}.${ext}`;
    await atomic(join(this.mediaDir, file), buffer);
    return { src: `${MEDIA_DIR}/${file}`, mime: mime || allowed[ext], bytes: buffer.length, name: safe };
  }
  async media(src) {
    if (!MEDIA_SRC.test(String(src || ''))) fail('invalid-media', '媒体路径无效');
    const file = join(this.root, String(src));
    const info = await stat(file);
    if (!info.isFile()) fail('not-found', '媒体不存在');
    return { file, size: info.size, mime: ({ mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' })[src.split('.').pop().toLowerCase()] || 'application/octet-stream' };
  }
  async unusedMedia() {
    const state = await this.read();
    const used = new Set(state.items.map(row => row.media?.src).filter(Boolean));
    const files = await readdir(this.mediaDir).catch(() => []);
    return files.filter(name => !used.has(`${MEDIA_DIR}/${name}`));
  }
}

export { IDEA_FILE, MEDIA_DIR };
