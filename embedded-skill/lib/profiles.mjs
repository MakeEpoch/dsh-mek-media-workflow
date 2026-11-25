import video from '../workflow.json' with { type: 'json' };

export const workType = value => value?.brief?.work?.type ?? value?.work?.type ?? value?.workType ?? 'video';
const publication = type => ({
  schemaVersion: 1, version: 'publication-v1', type,
  steps: video.steps.filter(s => s.key !== 'voice').map(s => ({ ...s, dependencies: s.dependencies.filter(d => d !== 'voice'), ...({
    script: { label: type === 'article' ? '文章写作' : '图文文案', output: '完整正文、来源引用与事实依据' },
    storyboard: { label: type === 'article' ? '文章编排' : '分页设计', output: '内容顺序、标题层级、图文布局与配图引用' },
    composition: { label: '排版预览', output: '可编辑排版与实际阅读预览' },
    render: { label: '正式交付', output: type === 'article' ? '文章 HTML、Markdown、可编辑工程与出处清单' : '有序 PNG 图片、阅读预览、配文与可编辑工程' },
  }[s.key] ?? {}) })),
});
export const PROFILES = { video: { ...video, type: 'video' }, article: publication('article'), 'image-post': publication('image-post') };
export const workflowFor = value => value?.state?.workflowProfile ?? value?.workflowProfile ?? PROFILES[typeof value === 'string' ? value : workType(value)] ?? PROFILES.video;
export const stepsFor = value => workflowFor(value).steps;
