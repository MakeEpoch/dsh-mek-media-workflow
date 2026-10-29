// huashu-motion 起始模板与工作台风装。
// 变量清单取自 `om scan` 对每个模板的实际输出；改动前请重新核对，不要凭记忆增删字段。
// 每个模板声明 shape，决定工作台模型产出什么结构、以及能否沿用现有 script 分段。
export const TEMPLATE_SHAPES = {
  segments: 'segments',   // 一拍一页 / 逐条要点：直接沿用 script 的 sections
  dataset: 'dataset',     // 单一图表或数据序列：需要一份数据系列
  hero: 'hero',           // 单一连续镜头：整体一支，不分镜
  talking: 'talking',     // 口播包装：需要人像素材
};

export const HUASHU_TEMPLATES = [
  {
    id: 'blank', name: '空白起点', shape: TEMPLATE_SHAPES.segments,
    summary: '标题、一个大数字、尾板。最小可用工程。',
    bestFor: '自定义、动态标题、作为起点',
    requires: [],
    variables: ['kicker', 'title', 'subtitle', 'stat', 'statLabel', 'accent', 'paper', 'ink', 'endHold'],
    note: '结构最简单，任何内容都能装；复杂效果从这里手写扩展。',
  },
  {
    id: 'kinetic-type', name: '动态文字', shape: TEMPLATE_SHAPES.segments,
    summary: '文字是主角：一拍一页，关键词砸入，色带转场，荧光笔刷重点词。',
    bestFor: '列表与阶段（三个理由、三个步骤）、章节卡、一句话结论',
    requires: [],
    variables: ['titleWord', 'titleSub', 'item1', 'item1Sub', 'item1Key', 'item1Label', 'item2', 'item2Sub', 'item2Key', 'item2Label', 'item3', 'item3Sub', 'item3Key', 'item3Label', 'highlightWord', 'palette', 'duration', 'pace'],
    note: '每项 = 一页，最多三项；item 清空即少一页。适合把 script 分段直接对上页面。',
  },
  {
    id: 'whiteboard', name: '白板推导', shape: TEMPLATE_SHAPES.segments,
    summary: '马克笔边说边写，画图标、连线，最后圈住重点并拉远看全板。',
    bestFor: '逐步推理、为什么会发生 X、因果链、讲授式旁白',
    requires: [],
    variables: ['title', 'point1', 'draw1Text', 'draw1Icon', 'point2', 'draw2Text', 'draw2Icon', 'point3', 'draw3Text', 'draw3Icon', 'highlightIndex', 'highlightStyle', 'accent', 'duration', 'pace'],
    note: '要点最多三条，每条可配一个图标；highlightIndex 决定最后圈住哪条。',
  },
  {
    id: 'kurzgesagt', name: '科普星球', shape: TEMPLATE_SHAPES.segments,
    summary: '发光星球当概念，每要点一颗卫星，镜头钻进其中一颗展开里层。',
    bestFor: 'X 里面有什么、系统与组成、尺度与层级、冷静的科普旁白',
    requires: [],
    variables: ['title', 'center', 'point1', 'point2', 'point3', 'diveIndex', 'dive', 'point4', 'point5', 'highlightIndex', 'flow', 'planetColor', 'duration', 'pace'],
    note: '外层三颗卫星 + 里层两颗；diveIndex 指定钻进第几颗，讲先后关系时开 flow。',
  },
  {
    id: 'math-3b1b', name: '黑板公式', shape: TEMPLATE_SHAPES.segments,
    summary: '黑板一屏一个概念：标题写出、公式变形、曲线演化、要点框住。',
    bestFor: '机制如何推到下一步、数学与算法讲解、符号与屏幕配色对应',
    requires: [],
    variables: ['title', 'eq1', 'eq2', 'mathColors', 'point1', 'point2', 'highlightIndex', 'curve1Label', 'curve1', 'curve1Color', 'curve2Label', 'curve2', 'curve2Color', 'duration', 'pace'],
    note: '需要真实公式与曲线数据；mathColors 让同一符号在公式间保持同色。',
  },
  {
    id: 'finance-chart', name: '财经图表', shape: TEMPLATE_SHAPES.dataset,
    summary: '经济学人式：先出坐标，再长数据，最后只标一件事。柱状 / 折线 / K 线。',
    bestFor: '营收、增长、占比，一个转折点，观众会截图核对的数字',
    requires: ['需要一份真实数据序列（label + value）'],
    variables: ['title', 'unit', 'source', 'badge', 'series', 'chart', 'decimals', 'prefix', 'suffix', 'highlightIndex', 'highlightText', 'highlightSub', 'mainColor', 'dimColor', 'duration', 'pace'],
    note: 'series 是 JSON 数组；K 线每项写 o/h/l/c。整片一支图表，不按旁白分段。',
  },
  {
    id: 'keynote-ui', name: '发布卡片', shape: TEMPLATE_SHAPES.hero,
    summary: '深色发光背景，玻璃卡片弹出、截图高亮框、大数字滚动。',
    bestFor: '产品与功能发布、更新说明、带截图的一步教程、一个头条数字',
    requires: ['需要真实产品截图（放在 assets/）'],
    variables: ['eyebrow', 'title', 'subtitle', 'card1Title', 'card1Sub', 'card1Icon', 'card2Title', 'card2Sub', 'card2Icon', 'card2Value', 'card2Suffix', 'card2Label', 'card3Title', 'card3Sub', 'card3Icon', 'numberValue', 'numberDecimals', 'numberPrefix', 'numberSuffix', 'numberCaption', 'shotTitle', 'shotSub', 'shotImage', 'highlightRect', 'accent', 'duration', 'pace'],
    note: '一屏一物，最多三张卡片 + 一个大数字 + 一张截图卡。',
  },
  {
    id: 'vox-collage', name: '剪报拼贴', shape: TEMPLATE_SHAPES.hero,
    summary: '截图与索引卡贴在纸面桌上，红线串联，红圈与荧光笔标出那一行。',
    bestFor: '用真实截图论证、文档与剪报、新闻与历史解说、请看这一行',
    requires: ['需要至少一张真实截图或剪报'],
    variables: ['title', 'image1', 'image1Label', 'highlightRect', 'note', 'image2', 'image2Label', 'halftone', 'accent', 'duration', 'pace'],
    note: '图片路径相对 index.html，放进 assets/；highlightRect 用 0–1 相对坐标。',
  },
  {
    id: 'ui-space', name: '界面空间', shape: TEMPLATE_SHAPES.hero,
    summary: '真实截图分层飞散，3D 镜头巡游、推进到一处留言再拉回标题。',
    bestFor: '软件与 App 发布、展示界面如何构成、开场第一秒就在动',
    requires: ['需要真实界面截图（1600×1000 的 2 倍图）'],
    variables: ['screen', 'comment', 'reply', 'title', 'subtitle', 'paper', 'ink', 'accent', 'green', 'endHold'],
    note: '一支连续镜头，不分镜；文字保持清晰可点选。',
  },
  {
    id: 'object-3d', name: '实物影棚', shape: TEMPLATE_SHAPES.hero,
    summary: '产品实物打光，截图悬在设备上，一条连续镜头做揭示与推进。',
    bestFor: '高端发布与主视觉、Logo 或图标做成实体、强镜头运动',
    requires: ['需要产品截图与可挤出的 Logo / 图标 SVG'],
    variables: ['screen', 'cursorSvg', 'bubbleSvg', 'comment', 'title', 'subtitle', 'paper', 'ink', 'accent', 'body', 'endHold'],
    note: '依赖 Three.js；素材缺失会退化成占位，先备好截图与 SVG。',
  },
  {
    id: 'storytime', name: '小人故事', shape: TEMPLATE_SHAPES.segments,
    summary: '小人角色在房间里说话，切到电脑屏幕给出数字包袱，最后反应特写。',
    bestFor: '第一人称经历与翻车、需要停顿的笑点、我问了 AI 然后……',
    requires: [],
    variables: ['line1', 'bubble1', 'line1Pose', 'typed', 'bigText', 'count', 'unit', 'app', 'hit', 'line2', 'line2Pose', 'mark', 'duration', 'pace'],
    note: '两句口播定张嘴时长（约 6.5 字/秒），包袱后至少留 0.9 秒。',
  },
  {
    id: 'talking-head', name: '口播包装', shape: TEMPLATE_SHAPES.talking,
    summary: '人像视频配名牌、数字卡、关键词花字、章节卡与角标，按说话的词落定。',
    bestFor: '口播与访谈包装、人名条、给剪映 / Premiere 的透明叠加层、竖版',
    requires: ['需要人像视频 assets/talk.mp4'],
    variables: ['talk', 'transparent', 'videoFit', 'focusX', 'focusY', 'backdrop', 'length', 'subjectX', 'subjectW', 'subjectTop', 'subjectBottom', 'cardBottom', 'side', 'name', 'role', 'nameTag', 'nameCue', 'nameAt', 'nameHold', 'stats', 'statTint', 'keywords', 'highlight', 'chapter', 'chapterNo', 'chapterCue', 'chapterAt', 'chapterHold', 'corner', 'cornerPos', 'cornerAt', 'accent', 'ink', 'card', 'lead', 'hold'],
    note: 'stats 与 keywords 是 JSON 数组，靠 cue 锚定到说出的词；缺人像素材只出占位。',
  },
];

export const TEMPLATE_IDS = HUASHU_TEMPLATES.map(t => t.id);
export const DEFAULT_TEMPLATE = 'blank';

export function huashuTemplate(id) {
  return HUASHU_TEMPLATES.find(t => t.id === id) ?? HUASHU_TEMPLATES.find(t => t.id === DEFAULT_TEMPLATE);
}

export const templateShape = id => huashuTemplate(id).shape;

// 供模型与面板使用的紧凑说明：选什么、需要什么前提。
export function templateBrief(id) {
  const t = huashuTemplate(id);
  return { id: t.id, name: t.name, shape: t.shape, summary: t.summary, bestFor: t.bestFor, requires: t.requires, note: t.note };
}

export function templateOptions() {
  return HUASHU_TEMPLATES.map(t => ({ id: t.id, name: t.name, summary: t.summary, bestFor: t.bestFor, requires: t.requires, shape: t.shape }));
}

// 沿用到 storyboard / 生成阶段的约束：模板决定了能承诺什么。
export function templateGuidance(id) {
  const t = huashuTemplate(id);
  const lines = {
    segments: `模板「${t.name}」按一条要点一屏展开，最多容纳三条要点；分镜保持与 script 分段一致的顺序，不要把多个信息点塞进同一屏。`,
    dataset: `模板「${t.name}」整片是一份数据图表，不按旁白分段；需要产出真实数据序列，并指定标注哪一项。不要承诺多屏分镜。`,
    hero: `模板「${t.name}」是一支连续镜头，不分镜；先备齐素材，再围绕一个主视觉组织文案。不要按分段数量承诺切镜。`,
    talking: `模板「${t.name}」为人像素材做包装层，元素靠说话的词锚定；需要先有人像视频。不要承诺生成人物画面。`,
  };
  const requires = t.requires.length ? `前提：${t.requires.join('；')}。` : '';
  return [`画面模板为「${t.name}」：${t.summary}`, lines[t.shape], requires].filter(Boolean).join('');
}

// 变量白名单：只接受模板实际声明的变量。空字符串保留——它是"主动清空默认值"的合法手段。
export function sanitizeTemplateVariables(id, input) {
  const t = huashuTemplate(id);
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out = {};
  for (const key of t.variables) if (input[key] !== undefined && input[key] !== null) out[key] = input[key];
  return out;
}
