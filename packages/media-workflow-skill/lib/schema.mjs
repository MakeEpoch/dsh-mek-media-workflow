import { stepsFor, workType } from './profiles.mjs';
import workflow from '../workflow.json' with { type: 'json' };
import { text, fail, now, clone, webUrl, digest } from './common.mjs';
import { DEFAULT_TEMPLATE, TEMPLATE_IDS, huashuTemplate, sanitizeTemplateVariables } from './templates.mjs';

export { workflow };
export const STEPS = workflow.steps;
export const GATES = STEPS.filter(s => s.gate).map(s => s.key);
export const stepOf = (key, profile) => stepsFor(profile).find(s => s.key === key) ?? fail('invalid-step', '不存在的制作阶段');
const choice = (v, values, label) => values.includes(v) ? v : fail('invalid-input', `${label}必须是 ${values.join(' / ')}`);
// 模板只对 huashu 后端有意义；ffmpeg 后端忽略它，避免给出会失效的选项。
export const resolveTemplate = (template, backend) => backend === 'huashu' ? (template || DEFAULT_TEMPLATE) : null;
const validateTemplate = (value, backend) => {
  if (backend !== 'huashu') return null;
  if (value == null || value === '') return DEFAULT_TEMPLATE;
  return TEMPLATE_IDS.includes(value) ? value : fail('invalid-input', `画面模板必须是 ${TEMPLATE_IDS.join(' / ')}`);
};
const validateTemplateVariables = (template, value) => {
  if (!template) return null;
  if (value == null) return null;
  return sanitizeTemplateVariables(template, value);
};
const number = (v, min, max, label) => Number.isFinite(v) && v >= min && v <= max ? v : fail('invalid-input', `${label}超出允许范围`);

export function voiceOf(brief, settings = {}) {
  const provider = (brief?.voice?.provider || settings.ttsProvider) === 'mimo' ? 'mimo' : 'edge';
  const fallback = provider === 'mimo' ? (settings.mimoVoice || '冰糖') : 'zh-CN-XiaoxiaoNeural';
  return { provider, voice: brief?.voice?.voice || fallback };
}
// The provider is resolved once, when the brief is written, so the saved request and every later
// step agree. MiMo speech models return no word timing, so a MiMo task records sentence alignment.
export function resolveVoice(brief, settings = {}) {
  const provider = voiceOf(brief, settings).provider;
  const untouched = !brief.voice.voice || brief.voice.voice === 'zh-CN-XiaoxiaoNeural';
  const voice = provider === 'mimo' && untouched ? (settings.mimoVoice || '冰糖') : brief.voice.voice || voiceOf(brief, settings).voice;
  return { ...brief, voice: { ...brief.voice, provider, voice, requiredAlignment: provider === 'mimo' ? 'sentence' : brief.voice.requiredAlignment } };
}

export function normalizeBrief(input, { draft = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('invalid-brief', '需求必须是 JSON 对象');
  if (input.work != null && (typeof input.work !== 'object' || Array.isArray(input.work))) fail('invalid-brief', '作品类型需要 work 对象');
  if (input.creative != null && (typeof input.creative !== 'object' || Array.isArray(input.creative))) fail('invalid-brief', '创作方向必须是 JSON 对象');
  const type = choice(input.work?.type ?? 'video', ['video', 'article', 'image-post'], '作品类型');
  const steps = stepsFor(type);
  const style = choice(input.style ?? (draft ? 'news' : ''), ['news', 'product', 'original'], '素材核对策略');
  if (!input.review && !draft) fail('review-required', '请在需求中一次确定评审方式');
  const mode = choice(input.review?.mode ?? (draft ? 'gates' : ''), ['none', 'gates', 'steps'], '评审方式');
  const gates = mode === 'gates' ? clone(input.review?.gates ?? steps.filter(s => s.gate).map(s => s.key)) : [];
  if (!Array.isArray(gates) || new Set(gates).size !== gates.length || gates.some(s => !steps.some(x => x.key === s))) fail('invalid-review', '评审关口无效');
  const sources = (input.sources ?? []).map((s, i) => {
    if (!s || typeof s !== 'object') fail('invalid-source', '素材条目无效');
    const source = { id: text(s.id || `source-${i + 1}`, '来源标识', { required: true, max: 100 }), name: text(s.name || `资料 ${i + 1}`, '资料名称', { max: 200 }),
      role: choice(s.role ?? 'source', ['source', 'screenshot', 'logo', 'image', 'video', 'audio', 'music'], '素材用途'),
      url: s.url ? webUrl(s.url) : '', path: text(s.path, '资料路径', { max: 4096 }), text: text(s.text, '资料正文', { max: 200000 }),
      attribution: text(s.attribution, '素材出处', { max: 2000 }), usage: text(s.usage, '可用范围', { max: 2000 }), capturedAt: text(s.capturedAt, '采集时间', { max: 100 }) };
    if (!source.url && !source.path && !source.text) fail('invalid-source', '每份资料需要链接、本地文件或正文');
    return source;
  });
  if (sources.length > 100 || new Set(sources.map(s => s.id)).size !== sources.length) fail('invalid-source', '来源标识重复或条目超过 100');
  const targets = (input.publish?.targets ?? []).map(t => ({
    id: text(t.id || t.platform, '目标标识', { required: true, max: 100 }), platform: text(t.platform, '平台', { required: true, max: 100 }),
    account: text(t.account, '预期账号', { required: true, max: 200 }), expectedTarget: text(t.expectedTarget, '圈子或目标', { max: 200 }),
    extra: t.extra && typeof t.extra === 'object' && !Array.isArray(t.extra) ? clone(t.extra) : {},
  }));
  if (targets.length > 30 || new Set(targets.map(t => t.id)).size !== targets.length) fail('invalid-target', '发布目标重复或过多');
  const enabled = input.publish?.enabled === true;
  if (enabled && !targets.length && !draft) fail('target-required', '发布任务需要明确平台和账号');
  const confirm = input.publish?.confirm ?? input.publishConfirm ?? true;
  if (typeof confirm !== 'boolean') fail('invalid-input', '发布确认必须是布尔值');
  const authorization = input.publish?.authorization ? {
    explicit: input.publish.authorization.explicit === true,
    statement: text(input.publish.authorization.statement, '发布授权原文', { max: 4000 }),
    declaredAt: text(input.publish.authorization.declaredAt || now(), '授权时间', { max: 100 }),
  } : null;
  if (enabled && !confirm && (!authorization?.explicit || !authorization.statement) && !draft) fail('publish-authorization-required', '免发布确认需要本次需求中明确的发布授权原文');
  const width = number(Number(input.output?.width ?? (type === 'article' ? 780 : type === 'image-post' ? 1080 : 1920)), 160, 3840, '画面宽度');
  const height = number(Number(input.output?.height ?? (type === 'image-post' ? 1440 : 1080)), 160, 3840, '画面高度');
  if (width % 2 || height % 2) fail('invalid-input', '视频宽高需要为偶数');
  const brief = {
    schemaVersion: 1, ...(input.work ? { work: { type } } : {}), title: text(input.title, '任务名称', { required: !draft, max: 200 }),
    description: text(input.description, '制作需求', { required: !draft, max: 30000 }), style,
    audience: text(input.audience, '受众', { max: 2000 }), requirements: text(input.requirements, '验收与限制', { max: 10000 }),
    ...(input.creative ? { creative: {
      expression: text(input.creative.expression || 'auto', '表达方式', { max: 200 }),
      visualStyle: text(input.creative.visualStyle || 'auto', '视觉风格', { max: 200 }),
      tone: text(input.creative.tone, '语气', { max: 2000 }),
      reference: text(input.creative.reference, '参考方向', { max: 4000 }),
    } } : {}),
    timezone: text(input.timezone || 'Asia/Shanghai', '时区', { max: 100 }), asOf: text(input.asOf, '资讯截止时间', { max: 100 }),
    review: { mode, gates, editedAt: text(input.review?.editedAt || now(), '评审声明时间', { max: 100 }) }, sources,
    brand: { primary: text(input.brand?.primary || '#315abb', '品牌配色', { max: 30 }), attribution: text(input.brand?.attribution, '品牌配色出处', { max: 2000 }) },
    output: { width, height, fps: number(Number(input.output?.fps ?? 30), 10, 60, '帧率'), durationSeconds: number(Number(input.output?.durationSeconds ?? 75), 1, 3600, '目标时长') },
    voice: { provider: choice(input.voice?.provider ?? '', ['', 'edge', 'mimo'], '配音服务'), mode: choice(input.voice?.mode ?? (type === 'video' ? 'tts' : 'none'), ['tts', 'provided', 'none'], '配音方式'),
      voice: text(input.voice?.voice || (input.voice?.provider === 'mimo' ? '冰糖' : 'zh-CN-XiaoxiaoNeural'), '音色', { max: 150 }),
      style: text(input.voice?.style, '配音风格指令', { max: 2000 }),
      rate: text(input.voice?.rate || '+0%', '语速', { max: 20 }), requiredAlignment: choice(input.voice?.requiredAlignment ?? (input.voice?.provider === 'mimo' ? 'sentence' : 'word'), ['word', 'sentence'], '时间轴精度') },
    render: { backend: choice(input.render?.backend ?? 'ffmpeg', ['ffmpeg', 'huashu'], '画面后端'), codec: choice(input.render?.codec ?? 'libx264', ['libx264', 'h264_nvenc'], '编码器'), template: validateTemplate(input.render?.template, input.render?.backend) },
    templateVariables: validateTemplateVariables(resolveTemplate(input.render?.template, input.render?.backend), input.templateVariables),
    publish: { enabled, confirm, targets, authorization, bridgeId: text(input.publish?.bridgeId, '浏览器桥接标识', { max: 100 }), browserContext: choice(input.publish?.browserContext ?? 'regular', ['regular', 'incognito'], '浏览器上下文') },
  };
  try { new Intl.DateTimeFormat('zh-CN', { timeZone: brief.timezone }); } catch { fail('invalid-input', '时区无效'); }
  if (!/^#[0-9a-fA-F]{6}$/.test(brief.brand.primary)) fail('invalid-input', '品牌配色应为六位十六进制颜色');
  if (!/^[+-]\d{1,3}%$/.test(brief.voice.rate)) fail('invalid-input', '语速格式应为 +0%、-10% 等');
  return brief;
}
export function briefHash(brief) { const b = clone(brief); delete b.review.editedAt; if (b.publish.authorization) delete b.publish.authorization.declaredAt; return digest(b); }
export function needsReview(brief, step) {
  if (step === 'publish') return brief.publish.enabled && (brief.publish.confirm || !brief.publish.authorization?.explicit);
  return brief.review.mode === 'steps' || (brief.review.mode === 'gates' && brief.review.gates.includes(step));
}
export function validateSettings(input = {}) {
  return {
    provider: text(input.provider, '模型提供商', { max: 200 }), model: text(input.model, '模型', { max: 200 }),
    maxTokens: number(Number(input.maxTokens ?? 12000), 1000, 64000, '模型输出预算'),
    ffmpeg: text(input.ffmpeg || 'ffmpeg', 'ffmpeg 路径', { max: 4096 }), ffprobe: text(input.ffprobe || 'ffprobe', 'ffprobe 路径', { max: 4096 }),
    analysisMode: choice(input.analysisMode ?? 'auto', ['off', 'auto', 'required'], '素材理解策略'),
    mediaPython: text(input.mediaPython || 'python3', '素材识别 Python', { max: 4096 }),
    asrModel: text(input.asrModel, '语音模型本地目录', { max: 4096 }),
    analysisLanguage: text(input.analysisLanguage || 'auto', '识别语言', { max: 30 }),
    analysisMaxMinutes: number(Number(input.analysisMaxMinutes ?? 120), 1, 1440, '素材转录时长预算'),
    videoFrames: Number.isInteger(Number(input.videoFrames ?? 4)) ? number(Number(input.videoFrames ?? 4), 1, 12, '视频关键帧数') : fail('invalid-input', '视频关键帧数需为整数'),
    visionProvider: text(input.visionProvider, '图像模型提供商', { max: 200 }), visionModel: text(input.visionModel, '图像模型', { max: 200 }),
    browser: text(input.browser || 'google-chrome', '图片导出浏览器路径', { max: 4096 }),
    python: text(input.python || 'python3', 'Python 路径', { max: 4096 }), postfaro: text(input.postfaro || 'postfaro', 'PostFaro 路径', { max: 4096 }),
    om: text(input.om || '', 'huashu-motion 路径', { max: 4096 }), font: text(input.font || '', '字幕字体文件', { max: 4096 }),
    // 硬件编码需要宿主实际放行设备访问。auto 会先实测再决定是否启用，失败即回退 CPU，不静默申请提权。
    hardwareAcceleration: choice(input.hardwareAcceleration ?? 'auto', ['auto', 'gpu', 'cpu'], '硬件编码授权'),
    bridgeId: text(input.bridgeId, '默认浏览器桥接', { max: 100 }), browserContext: choice(input.browserContext ?? 'regular', ['regular', 'incognito'], '浏览器上下文'),
    defaultReview: choice(input.defaultReview ?? 'gates', ['gates', 'steps'], '新任务推荐评审'),
    defaultVoice: text(input.defaultVoice || 'zh-CN-XiaoxiaoNeural', '默认音色', { max: 150 }),
    ttsProvider: choice(input.ttsProvider ?? 'edge', ['edge', 'mimo'], '默认配音服务'),
    mimoVoice: text(input.mimoVoice || '冰糖', 'MiMo 默认音色', { max: 150 }),
    mimoModel: choice(input.mimoModel ?? 'mimo-v2.5-tts', ['mimo-v2.5-tts', 'mimo-v2.5-tts-voicedesign', 'mimo-v2.5-tts-voiceclone'], 'MiMo 语音模型'),
    mimoBaseUrl: text(input.mimoBaseUrl || 'https://api.xiaomimimo.com/v1', 'MiMo 接口地址', { max: 2048 }),
    // Stored in the workspace settings file only; the host masks it before answering the GUI.
    mimoApiKey: text(input.mimoApiKey, 'MiMo API Token', { max: 400 }),
    outputDirectory: text(input.outputDirectory, '默认交付目录', { max: 4096 }),
  };
}
