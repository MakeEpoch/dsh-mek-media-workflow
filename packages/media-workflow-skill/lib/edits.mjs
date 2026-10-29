import { fail, text, clone, digest } from './common.mjs';

const presentationDefaults = { captionFontSize: 16, captionMarginV: 12, titleScale: 1 };
export function validateStageEdit(value, { step, brief, storyboard, project, materials = [] }) {
  if (value.step !== step) fail('invalid-generation', '修改结果必须对应当前阶段');
  const result = { step, note: text(value.note, '修改说明', { required: true, max: 4000 }) };
  if (step === 'voice') {
    if (brief.voice.mode !== 'tts') fail('revision-input-required', '录音或无旁白模式的修改需要实际新输入，请重新提交需求');
    if (!value.voice || Object.keys(value.voice).some(k => !['voice', 'rate'].includes(k))) fail('invalid-generation', '配音修改只接受音色和语速');
    result.voice = { voice: text(value.voice.voice ?? brief.voice.voice, '音色', { required: true, max: 150 }), rate: text(value.voice.rate ?? brief.voice.rate, '语速', { required: true, max: 20 }) };
    if (!/^[+-]\d{1,3}%$/.test(result.voice.rate)) fail('invalid-generation', '修改后的语速格式无效');
    if (digest(result.voice) === digest({ voice: brief.voice.voice, rate: brief.voice.rate })) fail('invalid-generation', '配音修改没有产生任何实际参数变化');
    return result;
  }
  if (!['composition', 'render'].includes(step)) fail('invalid-generation', '该阶段不接受画面参数修改');
  const base = project?.scenes ?? storyboard.scenes, seen = new Set();
  if (!Array.isArray(value.scenes) || value.scenes.length > base.length) fail('invalid-generation', '画面修改需列出本次调整的镜头，可以为空数组');
  result.scenes = value.scenes.map(s => {
    const original = base.find(x => x.id === s.id);
    if (!original || seen.has(s.id) || Object.keys(s).some(k => !['id', 'title', 'motion', 'materialIds'].includes(k))) fail('invalid-generation', '镜头修改包含未知标识、重复条目或不支持的字段'); seen.add(s.id);
    const item = { id: s.id };
    if (s.title !== undefined) item.title = text(s.title, '镜头标题', { required: true, max: 200 });
    if (s.motion !== undefined) { if (!['hold', 'push', 'pan'].includes(s.motion)) fail('invalid-generation', '不支持的镜头运动'); item.motion = s.motion; }
    if (s.materialIds !== undefined) { if (!Array.isArray(s.materialIds) || new Set(s.materialIds).size !== s.materialIds.length || s.materialIds.some(id => !materials.some(m => m.id === id))) fail('invalid-reference', '修改只能引用已登记的真实素材'); if (brief.style === 'product' && !s.materialIds.some(id => materials.some(m => m.id === id && /^(image|video)\//.test(m.mime)))) fail('real-ui-required', '产品修改仍需保留真实视觉素材'); item.materialIds = s.materialIds; }
    return item;
  });
  result.presentation = {};
  const bounds = { captionFontSize: [8, 36], captionMarginV: [4, 48], titleScale: [.6, 1.6] };
  for (const [key, number] of Object.entries(value.presentation ?? {})) { const limit = bounds[key]; if (!limit || !Number.isFinite(number) || number < limit[0] || number > limit[1]) fail('invalid-generation', '字幕或标题参数超出支持范围'); result.presentation[key] = number; }
  const changedScene = result.scenes.some(s => { const old = base.find(x => x.id === s.id); return Object.entries(s).some(([k, v]) => k !== 'id' && digest(v) !== digest(old[k])); });
  const changedPresentation = Object.entries(result.presentation).some(([k, v]) => v !== (project?.presentation?.[k] ?? presentationDefaults[k]));
  if (!changedScene && !changedPresentation) fail('invalid-generation', '修改没有改变实际镜头或文字参数，不能把重新渲染当成已修改');
  return result;
}
export function editStoryboard(storyboard, edit) {
  return { ...clone(storyboard), scenes: storyboard.scenes.map(s => ({ ...s, ...edit.scenes.find(x => x.id === s.id) })) };
}
export function editProject(project, edit, materials) {
  const value = clone(project); value.presentation = { ...value.presentation, ...edit.presentation };
  for (const change of edit.scenes) {
    const scene = value.scenes.find(s => s.id === change.id); Object.assign(scene, change);
    if (change.materialIds) scene.materials = change.materialIds.map(id => { const m = materials.find(x => x.id === id); return { id, path: m.absolutePath, mime: m.mime, role: m.role, attribution: m.url || m.attribution || m.name, sha256: m.sha256 }; });
  }
  return value;
}
