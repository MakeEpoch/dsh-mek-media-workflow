// Work type, narrative, visual treatment and destination are independent choices.
export const CONTENT_TYPES = [
  { id: 'article', label: '文章', nativeWorkflow: true, skillWorkflow: true, reference: 'references/formats.md', outputs: ['正文 Markdown', '排版 HTML', '配图与出处清单'] },
  { id: 'image-post', label: '图文 / 贴图', nativeWorkflow: true, skillWorkflow: true, reference: 'references/formats.md', outputs: ['有序图片', '配文', '可编辑页面与素材清单'] },
  { id: 'video', label: '视频', nativeWorkflow: true, skillWorkflow: true, reference: 'references/formats.md', outputs: ['成片', '字幕与音频', '可编辑工程', '封面与检查记录'] },
];
export const EXPRESSIONS = [
  { id: 'auto', label: '按需求判断', guidance: '结合受众、资料与本次目的选择表达方式，不套统一叙事结构。' },
  { id: 'explainer', label: '解释科普', guidance: '围绕一个问题讲清机制，用有边界的类比、可核查证据和具体例子，避免名词堆叠。' },
  { id: 'tutorial', label: '实操教程', guidance: '给出可复现的前提、步骤、结果与常见失败点；说明适用版本，画面或配图支持正在讲的动作。' },
  { id: 'review', label: '实测 / 对比', guidance: '先交代测试条件与评价维度，再给观察及取舍；没有实际测试不能写成亲测或给虚构评分。' },
  { id: 'case-study', label: '案例 / 场景', guidance: '以具体问题、过程和结果组织；产品宣传优先展示真实使用价值，同时保留限制与适用对象。' },
  { id: 'personal-story', label: '个人叙事', guidance: '围绕真实事件、细节与感受建立叙事，不替用户编造经历、引语、关系或第一人称见闻。' },
  { id: 'documentary', label: '生活记录', guidance: '让人物、过程、环境声和时间变化承载内容；按资料选择平实、温暖或观察式语气，避免把日常强行写成广告。' },
  { id: 'launch', label: '产品发布', guidance: '聚焦新变化、受众价值和真实演示；视觉与节奏可加强品牌表达，但不得用特效代替能力证据。' },
  { id: 'humor', label: '轻松 / 玩梗', guidance: '用与内容有关的幽默或反差帮助理解，避免为了跟热点歪曲事实；不伪装为真实事件或用户体验。' },
];
export const VISUAL_STYLES = [
  { id: 'auto', label: '按内容选择', guidance: '先考虑信息、素材和阅读场景，参考风格不等于复制别人的作品。' },
  { id: 'editorial', label: '编辑 / 杂志', guidance: '强调标题层级、留白、图文节奏和细节图注；适合解释文章、观点和产品故事。' },
  { id: 'knowledge-cards', label: '知识卡片', guidance: '每页或每屏一个重点，利用层级、图示和短文案帮助理解；不把整段正文截图塞满画面。' },
  { id: 'collage', label: '手账 / 拼贴', guidance: '用真实照片、便签、手绘标注组织细节和个人感受；装饰服从阅读，不遮挡证据。' },
  { id: 'screen-demo', label: '真实操作', guidance: '以截图或录屏为主体，让操作焦点、局部放大与说明对应；保持真实界面与示例数据边界。' },
  { id: 'natural', label: '自然纪实', guidance: '保留生活细节和合理的不完美，用自然画面、克制文字与声音建立可信感；不人为制造伪经历。' },
  { id: 'motion', label: '动态设计', guidance: '使用与信息对应的图层、卡片和动效，按节奏揭示内容；需要实际制作工程，不能靠描述宣称已实现。' },
];
export function contentCapabilities() {
  return structuredClone({
    positioning: '多风格、多类型内容制作',
    types: CONTENT_TYPES, expressions: EXPRESSIONS, visualStyles: VISUAL_STYLES,
    destinationPolicy: '交付渠道单独选择，不决定主题、内容类型或创作风格。',
    nativeInput: { text: '正文读取、文字 PDF 与事实引述', image: '实际 OCR 及图像模型像素输入，保留观察与未知', video: '真实音轨转录与带时间码抽样帧，保留取样范围', audio: '实际语音转录与 ASR 词时间码，不冒充强制对齐' },
    editing: { canvas: ['text', 'image', 'shape', 'position', 'size', 'rotation', 'layer-order', 'page-order', 'body-text'], supportedTypes: ['article', 'image-post'], preservesReview: true },
    delivery: { resumableUpload: true, maxFileBytes: 2147483648, maxBundleBytes: 8589934592, nestedDependencies: true },
    publishing: { video: 'shortVideo', article: 'article', 'image-post': 'imageText', discovery: 'selected-bridge-live-capabilities' },
    nativeLimitations: ['图像语义需要明确支持 image 的模型或当前对话实际看图；OCR 和 ASR 保留待核实标记', '图文 PNG 导出需要本机 Chrome，使用临时独立目录，不读取用户登录会话', '自由画布用于静态文章和图组，视频复杂动画通过实际工程制作后回纳', '发布按所选桥接实时能力与账号执行，平台审核和公共发布状态依实际回执确认'],
  });
}
export function creativeGuidance(creative) {
  if (!creative) return undefined;
  return {
    ...creative,
    expressionGuidance: EXPRESSIONS.find(x => x.id === creative.expression)?.guidance ?? '尊重用户自定义的表达方式，结合具体资料设计。',
    visualGuidance: VISUAL_STYLES.find(x => x.id === creative.visualStyle)?.guidance ?? '尊重用户自定义的视觉方向，核对实际工具能否实现。',
  };
}
