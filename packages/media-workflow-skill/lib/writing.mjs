import { fail, text } from './common.mjs';
import { RuleStore, confirmedRules } from './insights.mjs';
import { StyleStore, styleGuidance } from './styles.mjs';

export function normalizeWriting(input) {
  if (input == null) return undefined;
  if (typeof input !== 'object' || Array.isArray(input) || !Array.isArray(input.rules)) fail('invalid-writing', '任务写作配置无效');
  const style = input.style == null ? null : {
    id: text(input.style.id, '风格标识', { required: true, max: 128 }),
    name: text(input.style.name, '风格名称', { required: true, max: 120 }),
    guidance: text(input.style.guidance, '风格指导', { required: true, max: 1800 }),
  };
  const rules = input.rules.map(row => ({
    id: text(row?.id, '规则标识', { required: true, max: 128 }),
    name: text(row?.name, '规则名称', { required: true, max: 120 }),
    rule: text(row?.rule, '规则正文', { required: true, max: 2000 }),
  }));
  const writing = { style, rules };
  if (JSON.stringify(writing).length > 24000) fail('writing-too-large', '已确认规则总量过长，请归档或精简部分规则后再应用');
  return style || rules.length ? writing : undefined;
}

export async function snapshotWriting(root, { includeStyle = true, styleId, rules } = {}) {
  const store = new StyleStore(root);
  const selected = styleId
    ? store.read().then(state => state.styles.find(row => row.id === styleId))
    : includeStyle ? store.active() : null;
  const confirmed = rules ?? new RuleStore(root).read().then(state => confirmedRules(state.rules));
  const [style, writingRules] = await Promise.all([selected, confirmed]);
  if (styleId && !style) fail('style-not-found', '所选创作风格已不可用，请重新选择');
  return normalizeWriting({
    style: style ? { id: style.id, name: style.name?.trim().slice(0, 120) || '自定义风格', guidance: styleGuidance(style) } : null,
    rules: writingRules,
  });
}
