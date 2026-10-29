// Browser-safe scene graph. No HTML, scripts, arbitrary CSS or remote image URLs are accepted.
const error = message => { const e = new Error(message); e.code = 'invalid-canvas'; throw e; };
const num = (value, min, max, name) => Number.isFinite(value) && value >= min && value <= max ? value : error(`${name}超出允许范围`);
const str = (value, max, name) => typeof value === 'string' && value.length <= max ? value : error(`${name}无效`);
const color = v => /^#[\da-f]{6}$/i.test(v) ? v : error('颜色需为六位十六进制');
export function validateCanvas(input, project) {
  if (input?.version !== 1 || !Array.isArray(input.pages) || !input.pages.length || input.pages.length > 40) error('画布需要 1–40 页');
  const ids = new Set(), sections = new Set(project.script.sections.map(s => s.id)), bound = new Set();
  const result = { version: 1, pages: input.pages.map(p => {
    if (!p || typeof p !== 'object') error('页面结构无效');
    if (ids.has(p.id)) error('页面标识重复'); ids.add(p.id);
    if (!Array.isArray(p.elements) || p.elements.length > 150) error('每页最多 150 个图层');
    const elements = new Set();
    return { id: str(p.id, 100, '页面标识'), background: color(p.background || '#ffffff'), elements: p.elements.map(e => {
      if (!e || typeof e !== 'object') error('图层结构无效');
      if (elements.has(e.id)) error('图层标识重复'); elements.add(e.id);
      if (!['text', 'image', 'shape'].includes(e.kind)) error('不支持的图层类型');
      const result = { id: str(e.id, 100, '图层标识'), kind: e.kind, x: num(e.x, 0, project.width, '横坐标'), y: num(e.y, 0, project.height, '纵坐标'), width: num(e.width, 1, project.width, '宽度'), height: num(e.height, 1, project.height, '高度'), rotate: num(e.rotate ?? 0, -180, 180, '旋转角度'), opacity: num(e.opacity ?? 1, 0, 1, '透明度'), radius: num(e.radius ?? 0, 0, 400, '圆角') };
      if (result.x + result.width > project.width + .5 || result.y + result.height > project.height + .5) error('图层超出画布，请调整位置或尺寸');
      if (e.kind === 'text') {
        Object.assign(result, { text: str(e.text ?? '', 30000, '文字'), color: color(e.color || '#19242a'), fontSize: num(e.fontSize ?? 32, 8, 300, '字号'), fontWeight: e.fontWeight === 700 ? 700 : 400, align: ['left', 'center', 'right'].includes(e.align) ? e.align : 'left', lineHeight: num(e.lineHeight ?? 1.6, 1, 3, '行距') });
        if (e.sectionId) { if (!sections.has(e.sectionId) || bound.has(e.sectionId)) error('正文绑定不存在或重复'); bound.add(e.sectionId); result.sectionId = e.sectionId; }
        if (e.headingPageId) result.headingPageId = str(e.headingPageId, 100, '标题绑定');
      }
      if (e.kind === 'image') { if (!project.images[e.imageId]) error('图层图片不存在'); result.imageId = e.imageId; result.fit = e.fit === 'cover' ? 'cover' : 'contain'; }
      if (e.kind === 'shape') { result.fill = color(e.fill || '#315abb'); result.shape = e.shape === 'ellipse' ? 'ellipse' : 'rect'; }
      return result;
    }) };
  }) };
  if (bound.size !== sections.size) error('每段正文需要保留对应图层；删除正文请先修改文稿');
  return result;
}
export function makeCanvas(project) {
  if (project.canvas) return validateCanvas(project.canvas, project);
  const w = project.width, h = project.height, margin = Math.round(w * .06), titleSize = Math.round(w * .06), font = Math.round(w * .038);
  return { version: 1, pages: project.plan.pages.map(p => {
    const elements = [{ id: `${p.id}-title`, kind: 'text', x: margin, y: margin, width: w - margin * 2, height: titleSize * 3, text: p.title, color: project.primary, fontSize: titleSize, fontWeight: 700, headingPageId: p.id }];
    const top = margin + titleSize * 3, bottom = h - margin, hasImages = p.materialIds.length > 0, bodyWidth = p.layout === 'split' && hasImages ? (w - 3 * margin) / 2 : w - 2 * margin;
    const bodyHeight = hasImages && p.layout !== 'split' ? (bottom - top) * .42 : bottom - top;
    p.sectionIds.forEach((id, i) => elements.push({ id: `${p.id}-body-${i}`, kind: 'text', sectionId: id, text: project.script.sections.find(s => s.id === id).text, x: margin, y: top + i * bodyHeight / p.sectionIds.length, width: bodyWidth, height: bodyHeight / p.sectionIds.length, fontSize: font, color: '#19242a', lineHeight: 1.6 }));
    const imageX = p.layout === 'split' ? margin * 2 + bodyWidth : margin, imageY = p.layout === 'split' ? top : top + bodyHeight, imageWidth = w - margin - imageX, imageHeight = bottom - imageY;
    p.materialIds.forEach((id, i) => { const cols = p.materialIds.length > 1 ? 2 : 1, rows = Math.ceil(p.materialIds.length / cols); elements.push({ id: `${p.id}-image-${i}`, kind: 'image', imageId: id, x: imageX + (i % cols) * imageWidth / cols, y: imageY + Math.floor(i / cols) * imageHeight / rows, width: imageWidth / cols - 8, height: imageHeight / rows - 8, fit: 'contain' }); });
    return { id: p.id, background: project.theme === 'collage' ? '#f8f2e5' : project.theme === 'natural' ? '#f5f7f0' : '#ffffff', elements };
  }) };
}
export function applyCanvas(project, input, note) {
  const result = structuredClone(project), canvas = validateCanvas(input, project); result.canvas = canvas;
  for (const p of canvas.pages) for (const e of p.elements) if (e.kind === 'text') {
    if (e.sectionId) result.script.sections.find(s => s.id === e.sectionId).text = e.text;
    if (e.headingPageId) { const page = result.plan.pages.find(p => p.id === e.headingPageId); if (page) page.title = e.text; }
  }
  result.authoredEdit = { actor: 'user', note, verification: 'human-edit-not-fact-verification' }; return result;
}
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export function canvasHtml(project, { singlePage, measure = false } = {}) {
  const canvas = validateCanvas(project.canvas, project), pages = singlePage == null ? canvas.pages : [canvas.pages[singlePage]];
  const unit = (value, vertical = false) => singlePage == null ? `${value / (vertical ? project.height : project.width) * 100}%` : `${value}px`;
  const scaleLength = value => singlePage == null ? `min(${value}px,${value / project.width * 100}vw)` : `${value}px`;
  const body = pages.map(p => `<section class="page" data-canvas="true" style="width:${project.width}px;${singlePage == null ? `height:auto;aspect-ratio:${project.width}/${project.height};max-width:100%` : `height:${project.height}px`};background:${p.background}">${p.elements.map(e => {
    const style = `position:absolute;left:${unit(e.x)};top:${unit(e.y, true)};width:${unit(e.width)};height:${unit(e.height, true)};opacity:${e.opacity};border-radius:${scaleLength(e.radius)};transform:rotate(${e.rotate}deg);overflow:hidden;`;
    if (e.kind === 'text') return `<div data-text="true" style="${style}font-size:${scaleLength(e.fontSize)};font-weight:${e.fontWeight};text-align:${e.align};line-height:${e.lineHeight};color:${e.color};white-space:pre-wrap;overflow-wrap:anywhere">${esc(e.text)}</div>`;
    if (e.kind === 'shape') return `<div style="${style}background:${e.fill};${e.shape === 'ellipse' ? 'border-radius:50%' : ''}"></div>`;
    const img = project.images[e.imageId]; if (!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(img.data)) error('画布图片需要实际内嵌位图');
    return `<img style="${style}object-fit:${e.fit}" src="${img.data}" alt="${esc(img.name)}">`;
  }).join('')}</section>`).join('');
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data:;style-src 'unsafe-inline';script-src ${measure ? "'unsafe-inline'" : "'none'"}"><title>${esc(project.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#e9e9e6;font-family:'Noto Sans CJK SC','Microsoft YaHei',sans-serif}.page{position:relative;overflow:hidden;margin:0 auto ${singlePage == null ? 24 : 0}px}img{display:block}</style><body>${body}${measure ? `<script>addEventListener('load',()=>{const p=document.querySelector('.page');p.dataset.imagesValid=String([...p.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));p.dataset.overflow=String([...p.querySelectorAll('[data-text]')].some(e=>e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2));});</script>` : ''}</body></html>`;
}
