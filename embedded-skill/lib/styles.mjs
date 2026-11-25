// 风格卡存储：预设 + 自定义卡存在本插件数据根下的 <root>/styles.json。
// 预设数据来自 style-presets.mjs（移植自 woniuniuniu/dsh-media-desk，MIT）。
import { join } from 'node:path';
import { atomic, fail, json, lock, now, uuid } from './common.mjs';
import { STYLE_CATEGORIES, STYLE_TEXT_FIELDS, seedPresets, extractStyleCard, styleGuidance, presetById } from './style-presets.mjs';

const STYLE_FILE = 'styles.json';
const MAX_STYLES = 500;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const FIELDS = { name: 'text', icon: 'text', source: 'text', summary: 'text', tone: 'text', sentences: 'text', opening: 'text', structure: 'text', words: 'list', avoid: 'list', samples: 'list', category: 'text' };

function coerce(type, value) {
  if (type === 'text') return typeof value === 'string' ? value.slice(0, 4000) : undefined;
  if (type === 'list') return Array.isArray(value) ? value.filter(v => typeof v === 'string').slice(0, 24).map(v => v.slice(0, 200)) : undefined;
  return undefined;
}
function pick(input) { const out = {}; for (const [key, type] of Object.entries(FIELDS)) { if (!isObject(input) || input[key] === undefined) continue; const value = coerce(type, input[key]); if (value !== undefined) out[key] = value; } return out; }

export function emptyStyles() { return { version: 1, updatedAt: now(), activeId: null, styles: seedPresets() }; }

export function normalizeStyles(raw) {
  const presets = seedPresets();
  const known = new Set(presets.map(row => row.id));
  const rows = [];
  if (isObject(raw) && Array.isArray(raw.styles)) for (const row of raw.styles.slice(0, MAX_STYLES)) {
    if (!isObject(row) || typeof row.id !== 'string' || !row.id) continue;
    const clean = pick(row);
    const presetRow = presets.find(p => p.id === row.id);
    rows.push({ ...(presetRow || {}), ...clean, id: row.id, source: presetRow ? '预设' : (clean.source || row.source || '手动'), preset: Boolean(presetRow || row.preset), icon: clean.icon || presetRow?.icon || '🎨', category: presetRow?.category || clean.category || '自定义' });
  }
  // 保证内置预设始终可浏览/可选（用户删除的预设会在下次读取时补回，仅作为可选起点）
  for (const preset of presets) if (!rows.some(row => row.id === preset.id)) rows.push(preset);
  const activeId = isObject(raw) && typeof raw.activeId === 'string' && rows.some(row => row.id === raw.activeId) ? raw.activeId : null;
  return { version: 1, updatedAt: isObject(raw) && typeof raw.updatedAt === 'string' ? raw.updatedAt : now(), activeId, styles: rows };
}

const handlers = {
  add(state, op) {
    const fields = pick(op);
    if (!fields.name) fail('invalid-style', '风格需要名字');
    const style = { id: `style_${uuid()}`, source: '手动', preset: false, icon: '🎨', category: '自定义', words: [], avoid: [], samples: [], summary: '', tone: '', sentences: '', opening: '', structure: '', ...fields, createdAt: now() };
    state.styles.unshift(style);
    if (state.styles.length > MAX_STYLES) state.styles = state.styles.slice(0, MAX_STYLES);
    return { text: `添加风格「${style.name}」`, target: style.id, kind: 'style' };
  },
  update(state, op) {
    const style = state.styles.find(row => row.id === op.id);
    if (!style) fail('not-found', '风格不存在');
    Object.assign(style, pick(op), { updatedAt: now() });
    return { text: `更新风格「${style.name}」`, target: style.id, kind: 'style' };
  },
  delete(state, op) {
    const style = state.styles.find(row => row.id === op.id);
    if (!style) fail('not-found', '风格不存在');
    if (style.preset) fail('preset-readonly', '内置预设不可删除，可改用它或新建自定义风格');
    state.styles = state.styles.filter(row => row.id !== op.id);
    if (state.activeId === op.id) state.activeId = null;
    return { text: `删除风格「${style.name}」`, target: op.id, kind: 'style' };
  },
  setActive(state, op) {
    if (op.id === null || op.id === '') { state.activeId = null; return { text: '不再使用特定风格' }; }
    const style = state.styles.find(row => row.id === op.id);
    if (!style) fail('not-found', '风格不存在');
    state.activeId = style.id;
    return { text: `之后按「${style.name}」的风格写`, target: style.id, kind: 'style' };
  },
};

export function applyStyleOps(state, ops) {
  const receipts = [], errors = [];
  for (const op of Array.isArray(ops) ? ops : []) {
    const handler = isObject(op) && Object.hasOwn(handlers, op.op) ? handlers[op.op] : undefined;
    if (!handler) { errors.push(`不支持的操作：${String(op?.op)}`); continue; }
    try { const receipt = handler(state, op); if (receipt) receipts.push(receipt); }
    catch (error) { errors.push(error.message); }
  }
  state.updatedAt = now();
  return { receipts, errors };
}

export class StyleStore {
  constructor(root) { this.root = root; }
  get file() { return join(this.root, STYLE_FILE); }
  async read() {
    const state = normalizeStyles(await json(this.file, emptyStyles()));
    return state;
  }
  async list() {
    const state = await this.read();
    return { categories: STYLE_CATEGORIES, styles: state.styles, activeId: state.activeId, active: state.styles.find(row => row.id === state.activeId) || null };
  }
  async active() { const state = await this.read(); return state.styles.find(row => row.id === state.activeId) || null; }
  async apply(ops) {
    return lock(join(this.root, 'styles.lock'), async () => {
      const state = await this.read();
      const { receipts, errors } = applyStyleOps(state, ops);
      await atomic(this.file, state);
      return { ...(await this.list()), receipts, errors };
    });
  }
  async extract(text, options) {
    const card = extractStyleCard(text, options);
    return this.apply([{ op: 'add', ...card }]);
  }
}

export { STYLE_FILE, styleGuidance, presetById, extractStyleCard };
