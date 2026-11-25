// 复盘 → 规则 → Skill：录入真实数据、给出可解释建议、确认后落成写作规则，
// 再导出为普通 DSH Skill（写在插件数据根 skills/ 下，或调用方指定的工作区 skills 目录）。
// 不接入任何第三方按次付费接口。
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { atomic, fail, json, lock, now, uuid, safeId } from './common.mjs';
import { styleGuidance } from './style-presets.mjs';

const RULE_FILE = 'rules.json';
const METRIC_FILE = 'metrics.json';
const MAX_ROWS = 5000;
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const num = value => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : 0);
const text = (value, max = 400) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function normalizeMetric(row) {
  if (!isObject(row)) return null;
  const platform = text(row.platform, 60);
  if (!platform) return null;
  const date = text(row.date, 40) || now();
  return { id: `m_${uuid()}`, platform, title: text(row.title, 200), date, views: num(row.views), likes: num(row.likes), comments: num(row.comments), shares: num(row.shares), saves: num(row.saves) };
}

export function normalizeMetrics(rows) {
  const list = [];
  for (const row of Array.isArray(rows) ? rows.slice(0, MAX_ROWS) : []) { const metric = normalizeMetric(row); if (metric) list.push(metric); }
  return list;
}

const engagement = row => (row.likes || 0) + (row.comments || 0) + (row.shares || 0) + (row.saves || 0);

/** 从真实数据算建议。样本不足时明确不凑数。 */
export function analyzeMetrics(metrics) {
  const rows = normalizeMetrics(metrics);
  if (!rows.length) return { total: 0, summary: { views: 0, engaged: 0, engagementRate: 0, platforms: 0 }, platforms: [], daily: [], proposals: [], note: '还没有真实数据，先录入或导入平台的阅读/互动数据。' };
  const platforms = new Map(), daily = new Map();
  let views = 0, engaged = 0;
  for (const row of rows) {
    views += row.views; engaged += engagement(row);
    const p = platforms.get(row.platform) || { platform: row.platform, views: 0, engaged: 0, count: 0 };
    p.views += row.views; p.engaged += engagement(row); p.count += 1; platforms.set(row.platform, p);
    const day = String(row.date).slice(0, 10);
    const d = daily.get(day) || { date: day, views: 0, engaged: 0 };
    d.views += row.views; d.engaged += engagement(row); daily.set(day, d);
  }
  const rankedPlatforms = [...platforms.values()].sort((a, b) => b.views - a.views || b.engaged - a.engaged);
  const rankedDaily = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const proposals = [];
  if (rankedPlatforms.length >= 2 && rankedPlatforms[0].views > rankedPlatforms[1].views * 1.3) {
    const best = rankedPlatforms[0], second = rankedPlatforms[1];
    proposals.push({ name: `首发放在${best.platform}`, rule: `同一选题优先在${best.platform}首发，再改写分发到其他平台。`, evidence: `${best.platform}累计 ${best.views} 阅读，高于第二名${second.platform}的 ${second.views}`, confidence: Math.min(0.85, 0.4 + best.count * 0.1), source: '数据复盘' });
  }
  const withViews = rankedDaily.filter(row => row.views > 0);
  if (withViews.length >= 3) {
    const avg = withViews.reduce((sum, row) => sum + row.views, 0) / withViews.length;
    const top = [...withViews].sort((a, b) => b.views - a.views)[0];
    if (top.views > avg * 1.4) proposals.push({ name: `高阅读日：${top.date}`, rule: `复盘 ${top.date} 这天的选题与发布时间，优先复刻它的做法。`, evidence: `当日 ${top.views} 阅读，高于日均 ${Math.round(avg)}`, confidence: 0.55, source: '数据复盘' });
  }
  if (views > 0) {
    const rate = engaged / views;
    proposals.push({ name: '当前互动率基线', rule: `以互动率 ${(rate * 100).toFixed(1)}% 作为下一阶段的对照基线，低于它时优先改开头与标题。`, evidence: `累计 ${engaged} 次互动 / ${views} 阅读`, confidence: 0.5, source: '数据复盘' });
  }
  return { total: rows.length, summary: { views, engaged, engagementRate: views ? engaged / views : 0, platforms: platforms.size }, platforms: rankedPlatforms, daily: rankedDaily, proposals };
}

export class RuleStore {
  constructor(root) { this.root = root; }
  get file() { return join(this.root, RULE_FILE); }
  get metricFile() { return join(this.root, METRIC_FILE); }
  async read() { const raw = await json(this.file, { version: 1, rules: [] }); const rules = Array.isArray(raw.rules) ? raw.rules.filter(r => isObject(r) && typeof r.id === 'string' && text(r.name) && text(r.rule)) : []; return { version: 1, rules }; }
  async list() { return this.read(); }
  async saveMetrics(rows) { const metrics = normalizeMetrics(rows); await lock(join(this.root, 'metrics.lock'), async () => atomic(this.metricFile, { version: 1, updatedAt: now(), metrics })); return { total: metrics.length, metrics }; }
  async metrics() { const raw = await json(this.metricFile, { metrics: [] }); return Array.isArray(raw.metrics) ? raw.metrics : []; }
  async apply(ops) {
    return lock(join(this.root, 'rules.lock'), async () => {
      const state = await this.read(); const receipts = [], errors = [];
      for (const op of Array.isArray(ops) ? ops : []) {
        try {
          if (op?.op === 'add') {
            const name = text(op.name, 120), rule = text(op.rule, 2000);
            if (!name || !rule) fail('invalid-rule', '规则需要名字和内容');
            const existing = state.rules.find(r => r.name === name);
            if (existing) { Object.assign(existing, { rule, evidence: text(op.evidence, 1000), status: 'active', confidence: Number(op.confidence) || 0.5, updatedAt: now() }); receipts.push({ text: `更新规则「${name}」`, target: existing.id, kind: 'rule' }); }
            else { const row = { id: `rule_${uuid()}`, name, rule, evidence: text(op.evidence, 1000), source: text(op.source, 80) || '复盘', status: 'active', confidence: Number(op.confidence) || 0.5, createdAt: now() }; state.rules.unshift(row); receipts.push({ text: `确认规则「${name}」`, target: row.id, kind: 'rule' }); }
          } else if (op?.op === 'update') {
            const row = state.rules.find(r => r.id === op.id); if (!row) fail('not-found', '规则不存在');
            if (op.status && ['proposed', 'active', 'archived'].includes(op.status)) row.status = op.status;
            if (op.rule !== undefined) row.rule = text(op.rule, 2000);
            row.updatedAt = now(); receipts.push({ text: `更新规则「${row.name}」`, target: row.id, kind: 'rule' });
          } else if (op?.op === 'delete') {
            const row = state.rules.find(r => r.id === op.id); if (!row) fail('not-found', '规则不存在');
            state.rules = state.rules.filter(r => r.id !== op.id); receipts.push({ text: `删除规则「${row.name}」`, target: op.id, kind: 'rule' });
          } else errors.push(`不支持的操作：${String(op?.op)}`);
        } catch (error) { errors.push(error.message); }
      }
      await atomic(this.file, { version: 1, rules: state.rules });
      return { ...state, receipts, errors };
    });
  }
}

export const confirmedRules = rules => rules.filter(row => row && ['active', 'exported'].includes(row.status) && text(row.name) && text(row.rule));

/** 导出为普通 DSH Skill。只导出确认规则和自定义风格。 */
export async function exportSkill({ root, rules = [], style = null, name = 'media-workflow-voice', skillsRoot } = {}) {
  const active = confirmedRules(rules);
  const customStyle = style && !style.preset ? style : null;
  if (!active.length && !customStyle) fail('nothing-to-export', '还没有确认的规则或自定义风格，无法导出 Skill');
  const dir = join(skillsRoot ? skillsRoot : join(root, 'skills'), safeId(name));
  await mkdir(dir, { recursive: true });
  const description = '作者在媒体工作流里沉淀的写作风格与规则；写选题、脚本、标题或封面文案时使用。';
  const styleBlock = customStyle ? `## 风格：${customStyle.name}\n\n${styleGuidance(customStyle)}\n\n` : '';
  const ruleBlock = active.length ? `## 必须遵守的规则\n\n${active.map(row => `- **${row.name}**：${row.rule}${row.evidence ? `（依据：${row.evidence}）` : ''}`).join('\n')}\n` : '';
  const body = `---\nname: ${name}\ndescription: ${description}\n---\n\n# 媒体写作风格与规则\n\n由「媒体工作流」复盘沉淀，更新于 ${new Date().toISOString().slice(0, 10)}。\n\n${styleBlock}${ruleBlock}`;
  const path = join(dir, 'SKILL.md');
  await atomic(path, body);
  return { name, path, rules: active.length, style: customStyle ? customStyle.name : null };
}
