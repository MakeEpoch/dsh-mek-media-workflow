import { readFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { atomic, fail, text, uuid } from './common.mjs';
import { command } from './process.mjs';
import { canvasHtml, applyCanvas } from './canvas.mjs';
import { fileDigest, json, digest, inside } from './common.mjs';
import { workType } from './profiles.mjs';

export const PUBLICATION_SHAPE = { title: '作品标题', treatment: '实际编排及对用户修改意见的处理', theme: 'editorial/knowledge-cards/collage/natural', pages: [{ id: 'page-1', title: '章节或卡片标题', sectionIds: ['输入文稿段落，可合并，每段恰好出现一次'], materialIds: ['真实图片素材，可为空，最多四张'], layout: 'text/image/split' }] };
export function validatePublication(value, { brief, script, materials = [] }) {
  if (!Array.isArray(value.pages) || !value.pages.length || value.pages.length > 30) fail('invalid-generation', '编排需要 1–30 页或章节');
  const sections = new Set(script.sections.map(s => s.id)), seen = new Set(), ids = new Set();
  const pages = value.pages.map(p => {
    const id = text(p.id, '页面标识', { required: true, max: 100 });
    if (ids.has(id)) fail('invalid-generation', '页面标识重复'); ids.add(id);
    if (!Array.isArray(p.sectionIds) || !p.sectionIds.length || p.sectionIds.some(id => !sections.has(id) || seen.has(id))) fail('invalid-reference', '每个文稿段落需且仅需编排一次');
    for (const id of p.sectionIds) { if (seen.has(id)) fail('invalid-reference', '编排重复引用文稿'); seen.add(id); }
    if (!Array.isArray(p.materialIds) || p.materialIds.length > 4 || new Set(p.materialIds).size !== p.materialIds.length || p.materialIds.some(id => !materials.some(m => m.id === id && ['image/png', 'image/jpeg', 'image/webp'].includes(m.mime)))) fail('invalid-reference', '配图必须引用实际 PNG、JPEG 或 WebP 素材，每页最多四张');
    if (!['text', 'image', 'split'].includes(p.layout)) fail('invalid-generation', '版式必须是 text/image/split');
    if (p.layout !== 'text' && !p.materialIds.length) fail('invalid-reference', '图文版式需要真实图片');
    if (p.layout === 'text' && p.materialIds.length) fail('invalid-generation', '纯文字版式不能隐藏已引用配图');
    if (workType(brief) === 'image-post' && p.sectionIds.reduce((n, id) => n + script.sections.find(s => s.id === id).text.length, 0) > 600) fail('invalid-generation', '单张贴图正文超过 600 字，请精简文案或增加分页');
    return { id, title: text(p.title, '章节标题', { required: true, max: 100 }), sectionIds: [...p.sectionIds], materialIds: [...p.materialIds], layout: p.layout };
  });
  if (seen.size !== sections.size) fail('invalid-reference', '编排遗漏文稿段落');
  if (!['editorial', 'knowledge-cards', 'collage', 'natural'].includes(value.theme)) fail('invalid-generation', '请选择实际支持的静态排版主题');
  return { title: text(value.title, '作品标题', { required: true, max: 200 }), treatment: text(value.treatment, '编排说明', { required: true, max: 6000 }), theme: value.theme, pages };
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const check = (id, label, status, detail = '') => ({ id, label, status, severity: 'info', detail });
export function pngSize(bytes) {
  if (bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || bytes.toString('ascii', 12, 16) !== 'IHDR') fail('invalid-file', '图片不是有效 PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
async function projectFiles(brief, script, plan, materials, facts, dir) {
  const images = {};
  for (const id of new Set(plan.pages.flatMap(p => p.materialIds))) {
    const m = materials.find(m => m.id === id), bytes = await readFile(m.absolutePath);
    if (bytes.length > 20 * 1024 * 1024) fail('source-too-large', '配图超过 20MB');
    images[id] = { data: `data:${m.mime};base64,${bytes.toString('base64')}`, name: m.name, attribution: m.attribution || m.url || '用户提供', usage: m.usage || '未声明' };
  }
  const project = { schemaVersion: 1, type: workType(brief), title: plan.title, theme: plan.theme, primary: brief.brand.primary, width: brief.output.width, height: brief.output.height, plan, script, images, sources: materials.map(({ id, name, url, attribution, usage, sha256 }) => ({ id, name, url, attribution, usage, sha256 })), unknowns: facts.unknowns ?? [] };
  return savePublication(project, dir);
}
async function savePublication(project, dir) {
  const { plan, script, images } = project;
  await atomic(join(dir, 'publication.json'), project);
  const md = `# ${plan.title}\n\n${project.canvas ? project.canvas.pages.map(p => p.elements.filter(e => e.kind === 'text').map(e => e.text).join('\n\n')).join('\n\n') : plan.pages.map(p => `## ${p.title}\n\n${p.sectionIds.map(id => script.sections.find(s => s.id === id).text).join('\n\n')}\n\n${p.materialIds.map(id => `配图：${images[id].name}；出处：${images[id].attribution}；可用范围：${images[id].usage}`).join('\n\n')}`).join('\n\n')}\n\n## 来源与待核实\n\n${project.sources.map(m => `- ${m.id}：${m.name}；${m.url || m.attribution || '用户提供'}；可用范围：${m.usage || '未声明'}`).join('\n')}\n\n${project.unknowns.join('\n')}\n`;
  await atomic(join(dir, 'article.md'), md); await atomic(join(dir, 'sources.json'), { sources: project.sources, unknowns: project.unknowns });
  return project;
}
export function publicationHtml(p, { singlePage, measure = false } = {}) {
  if (p.canvas) return canvasHtml(p, { singlePage, measure });
  const gallery = p.type === 'image-post', pages = singlePage == null ? p.plan.pages : [p.plan.pages[singlePage]];
  const css = `*{box-sizing:border-box}html,body{margin:0;background:#e9e9e6;color:#19242a;font-family:"Noto Sans CJK SC","Microsoft YaHei",sans-serif}body{padding:${singlePage == null ? '24px' : '0'}}main{margin:auto;max-width:${p.width}px}h1,h2,p{margin:0}h1{font-size:36px;line-height:1.4;margin-bottom:24px}header{background:white;padding:40px}section.page{position:relative;background:#fff;padding:${gallery ? '6%' : '40px'};${gallery ? `width:${p.width}px;height:${p.height}px;overflow:hidden;margin-bottom:${singlePage == null ? 24 : 0}px;display:flex;flex-direction:column;` : 'margin-bottom:2px;'}}.eyebrow{color:${p.primary};font-size:${gallery ? Math.max(14, Math.round(p.width * .019)) : 13}px;letter-spacing:.12em;margin-bottom:20px}h2{font-size:${gallery ? Math.round(p.width * .06) : 26}px;line-height:1.35;margin-bottom:24px;overflow-wrap:anywhere}.body{font-size:${gallery ? Math.round(p.width * .038) : 18}px;line-height:1.85;overflow-wrap:anywhere;min-height:0}.body p{white-space:pre-wrap;margin-bottom:1em}.images{display:grid;grid-template-columns:repeat(${Math.min(2, Math.max(1, pages[0]?.materialIds.length ?? 1))},minmax(0,1fr));gap:16px;min-height:0;margin:12px 0 24px;${gallery ? 'flex:1;' : ''}}figure{margin:0;min-height:0;display:flex;flex-direction:column}img{width:100%;object-fit:contain;min-height:0;${gallery ? 'flex:1;height:0;' : 'max-height:700px;'}}figcaption{font-size:${gallery ? Math.round(p.width * .014) : 12}px;color:#617078;line-height:1.5;padding-top:8px;overflow-wrap:anywhere}.split .content{display:grid;grid-template-columns:1fr 1fr;gap:28px;flex:1;min-height:0}.content{display:flex;flex-direction:column;min-height:0;flex:1}.footer{margin-top:auto;padding-top:20px;font-size:${gallery ? Math.round(p.width * .015) : 12}px;color:#617078;overflow-wrap:anywhere}.knowledge-cards .page{border-top:12px solid ${p.primary};border-radius:12px}.collage .page{background:#f8f2e5;border:12px solid #fff}.collage h2{transform:rotate(-1deg)}.natural .page{background:#f5f7f0}.natural h2{font-weight:500}.sources{background:white;padding:40px;font-size:14px;line-height:1.8;overflow-wrap:anywhere}a{color:${p.primary}}`;
  const images = page => page.materialIds.length ? `<div class="images" style="grid-template-columns:repeat(${Math.min(2, page.materialIds.length)},minmax(0,1fr))">${page.materialIds.map(id => `<figure><img src="${p.images[id].data}" alt="${esc(p.images[id].name)}"><figcaption>${esc(p.images[id].attribution)} · ${esc(p.images[id].usage)}</figcaption></figure>`).join('')}</div>` : '';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; ${measure ? "script-src 'unsafe-inline'" : "script-src 'none'"}"><title>${esc(p.title)}</title><style>${css}</style></head><body class="${p.theme}"><main>${!gallery ? `<header><div class="eyebrow">${esc(p.theme)}</div><h1>${esc(p.title)}</h1></header>` : ''}${pages.map(page => `<section class="page ${page.layout}" data-page="${esc(page.id)}"><div class="eyebrow">${esc(p.title)} · ${String(p.plan.pages.indexOf(page) + 1).padStart(2, '0')}</div><h2>${esc(page.title)}</h2><div class="content"><div class="body">${page.sectionIds.map(id => `<p>${esc(p.script.sections.find(s => s.id === id).text)}</p>`).join('')}</div>${images(page)}</div><footer class="footer">${esc([...new Set(page.sectionIds.flatMap(id => p.script.sections.find(s => s.id === id).sourceIds))].join(' · '))}</footer></section>`).join('')}${singlePage == null ? `<aside class="sources"><h2>来源与待核实</h2>${p.sources.map(s => `<p>${esc(s.id)} · ${esc(s.name)} · ${esc(s.url || s.attribution || '用户提供')} · 可用范围：${esc(s.usage || '未声明')}</p>`).join('')}${p.unknowns.map(x => `<p>${esc(x)}</p>`).join('')}</aside>` : ''}</main>${measure ? `<script>addEventListener('load',()=>{const p=document.querySelector('.page'),f=p.querySelector('.footer'),c=p.querySelector('.content');p.dataset.imagesValid=String([...p.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0));p.dataset.overflow=String(p.scrollHeight>p.clientHeight+2||c.scrollHeight>c.clientHeight+2||f.getBoundingClientRect().bottom>p.getBoundingClientRect().bottom);});</script>` : ''}</body></html>`;
}
async function exportPublication(project, dir, settings, signal, onProcess) {
  const html = project.type === 'article' ? 'article.html' : 'gallery.html'; await atomic(join(dir, html), publicationHtml(project));
  const files = [{ path: html, role: 'document' }, 'article.md', { path: 'publication.json', role: 'project' }, 'sources.json'];
  const checks = [check('content-coverage', '文稿段落完整编排', 'pass'), check('visual-review', '表达质量与视觉效果', 'unknown', '结构检查不能代替阅读审稿和图片检查。')];
  if (project.type === 'image-post') {
    const profile = join(dir, `.chrome-${uuid()}`); await mkdir(profile);
    try {
      for (let i = 0; i < (project.canvas?.pages.length ?? project.plan.pages.length); i++) {
        signal?.throwIfAborted(); const name = `page-${String(i + 1).padStart(2, '0')}`, htmlPath = join(dir, `${name}.html`), pngPath = join(dir, `${name}.png`);
        await atomic(htmlPath, publicationHtml(project, { singlePage: i, measure: true }));
        const result = await command(settings.browser || 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--force-device-scale-factor=1', '--hide-scrollbars', `--window-size=${project.width},${project.height}`, '--virtual-time-budget=1500', `--screenshot=${pngPath}`, '--dump-dom', pathToFileURL(htmlPath).href], { signal, timeoutMs: 45000, maxOutput: 32 * 1024 * 1024, onProcess });
        if (!result.stdout.includes('data-images-valid="true"')) fail('invalid-image', `第 ${i + 1} 张含无法解码的配图，请补充可读取图片`);
        if (!result.stdout.includes('data-overflow="false"')) fail('layout-overflow', `第 ${i + 1} 张排版未通过溢出检查；请减少本页文字、配图或拆页`);
        const size = pngSize(await readFile(pngPath)); if (size.width !== project.width || size.height !== project.height) fail('layout-size', '图片导出尺寸与需求不一致');
        // Saved pages never execute JavaScript; measurement runs only in the isolated export process.
        await atomic(htmlPath, publicationHtml(project, { singlePage: i })); files.push(`${name}.html`, { path: `${name}.png`, role: 'gallery-page' });
      }
    } finally { await rm(profile, { recursive: true, force: true }); }
    const pages = project.canvas?.pages ?? project.plan.pages;
    const reader = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src 'self' data:;style-src 'unsafe-inline';script-src 'none'"><title>${esc(project.title)}</title><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#e9e9e6;color:#19242a;font:16px/1.7 sans-serif}main{max-width:${project.width}px;margin:auto}figure{margin:0 0 20px}img{display:block;width:100%;height:auto}figcaption{padding:8px 4px}aside{background:white;padding:20px;overflow-wrap:anywhere}</style><main>${pages.map((p, i) => `<figure><img src="page-${String(i + 1).padStart(2, '0')}.png" alt="第 ${i + 1} 页：${esc(p.title || p.elements?.find(e => e.headingPageId)?.text || project.title)}"><figcaption>${i + 1} / ${pages.length}</figcaption></figure>`).join('')}<aside><h2>来源与待核实</h2>${project.sources.map(s => `<p>${esc(s.id)} · ${esc(s.name)} · ${esc(s.url || s.attribution || '用户提供')} · ${esc(s.usage || '可用范围未声明')}</p>`).join('')}${project.unknowns.map(s => `<p>${esc(s)}</p>`).join('')}</aside></main></html>`;
    await atomic(join(dir, html), reader);
    checks.unshift(check('page-size', 'PNG 数量、尺寸与正文溢出检查', 'pass'));
  }
  await atomic(join(dir, 'qa.json'), { checks }); files.push('qa.json'); return { files, checks };
}
export async function executePublication({ runner, id, task, key, dir, signal, materials, onProcess }) {
  const b = task.brief, facts = await runner.data(id, task, 'materials', 'facts.json');
  if (key === 'script') {
    const result = await runner.generated(id, task, key, 'script', { brief: b, materials, facts, feedback: task.state.feedback.filter(f => f.step === key) }, signal);
    await atomic(join(dir, 'script.json'), result); await atomic(join(dir, 'script.md'), `# ${result.title}\n\n${result.sections.map(s => `${s.text}\n\n来源：${s.sourceIds.join('、')}`).join('\n\n')}`); return { files: ['script.json', 'script.md'], checks: [] };
  }
  let script = await runner.data(id, task, 'script', 'script.json');
  if (key === 'package') { const artifacts = task.state.steps.find(s => s.key === 'render').artifacts; if (artifacts.some(a => a.name === 'import-content.json')) script = await runner.data(id, task, 'render', 'import-content.json'); else if (artifacts.some(a => a.name === 'publication.json')) script = (await runner.data(id, task, 'render', 'publication.json')).script; }
  if (key === 'storyboard') {
    const plan = await runner.generated(id, task, key, 'publication', { brief: b, materials, facts, script, feedback: task.state.feedback.filter(f => f.step === key) }, signal);
    await atomic(join(dir, 'layout.json'), plan); await atomic(join(dir, 'layout.md'), `# ${plan.title}\n\n${plan.treatment}\n\n${plan.pages.map((p, i) => `## ${i + 1}. ${p.title}\n\n版式：${p.layout}；段落：${p.sectionIds.join('、')}；配图：${p.materialIds.join('、')}`).join('\n\n')}`); return { files: ['layout.json', 'layout.md'], checks: [] };
  }
  if (['composition', 'render'].includes(key)) {
    if (key === 'render') {
      const saved = await json(join(runner.store.taskDir(id), 'inputs', 'render.canvas.json'), null);
      if (saved?.inputDigest === runner.inputDigest(task, key) && saved.runRevision === task.state.runRevision) {
        const path = inside(runner.store.taskDir(id), saved.source.path); if (await fileDigest(path) !== saved.source.sha256) fail('external-edit', '画布源工程被修改');
        const base = await json(path);
        for (const image of saved.imageSources ?? []) { const source = inside(runner.store.taskDir(id), image.sourcePath); if (await fileDigest(source) !== image.sourceHash) fail('external-edit', '画布引用素材已改变'); const bytes = await readFile(source); base.images[image.id] = { name: image.name, attribution: image.attribution, usage: image.usage, data: `data:${image.mime};base64,${bytes.toString('base64')}` }; }
        const project = applyCanvas(base, saved.canvas, saved.note); project.baseInputDigest = runner.inputDigest(task, key, false);
        await savePublication(project, dir); const result = await exportPublication(project, dir, task.state.execution, signal, onProcess); result.checks.push({ id: 'canvas-edit', label: '画布修改与文字可读性', status: project.type === 'image-post' ? 'pass' : 'unknown', severity: 'info', detail: saved.note }); return result;
      }
    }
    if (runner.feedback(task, key).length) {
      const prior = await runner.priorData(id, task, key, 'publication.json');
      if (key === 'render' && task.state.steps.find(s => s.key === key).history.at(-1)?.artifacts.some(a => a.name === 'import-record.json') && !prior?.value.canvas) fail('revision-input-required', '本版来自外部工程，请在原工具落实意见后导入新版本，或明确改用原生画布；原版正文与工程已保留');
      if (prior?.value.canvas && prior.value.baseInputDigest === runner.inputDigest(task, key, false)) {
        const projectForModel = { ...prior.value, images: Object.fromEntries(Object.entries(prior.value.images).map(([id, { data, ...m }]) => [id, m])) };
        const edit = await runner.generated(id, task, key, 'canvas-edit', { brief: b, materials, script: prior.value.script, project: projectForModel, feedback: runner.feedback(task, key) }, signal);
        if (digest(edit.canvas) === digest(prior.value.canvas)) fail('revision-input-required', '画布没有实际改变；请提供可执行调整或使用画布编辑');
        const project = applyCanvas(prior.value, edit.canvas, edit.note); project.baseInputDigest = runner.inputDigest(task, key, false); await savePublication(project, dir); return exportPublication(project, dir, task.state.execution, signal, onProcess);
      }
    }
    let plan = await runner.data(id, task, 'storyboard', 'layout.json');
    if (runner.feedback(task, key).length) {
      const prior = await runner.priorData(id, task, key, 'publication.json');
      plan = await runner.generated(id, task, key, 'publication', { brief: b, materials, facts, script, existingLayout: prior?.value.plan ?? plan, feedback: runner.feedback(task, key) }, signal);
      if (JSON.stringify(plan) === JSON.stringify(prior?.value.plan)) fail('revision-input-required', '编排未发生实际变化；修改正文请重做文章写作或图文文案阶段');
    } else if (key === 'render') plan = (await runner.data(id, task, 'composition', 'publication.json')).plan;
    const project = await projectFiles(b, script, plan, materials, facts, dir);
    return exportPublication(project, dir, task.state.execution, signal, onProcess);
  }
  if (key === 'qa') { const result = await runner.data(id, task, 'composition', 'qa.json'); await atomic(join(dir, 'qa.json'), result); return { files: ['qa.json'], checks: result.checks }; }
  if (key === 'package') {
    const result = b.publish.enabled || runner.feedback(task, key).length ? await runner.generated(id, task, key, 'package', { brief: b, materials, script, feedback: runner.feedback(task, key) }, signal) : { title: script.title, description: script.sections.map(s => s.text).join('\n\n'), tags: [], targets: [], purpose: 'local-delivery' };
    await atomic(join(dir, 'package.json'), result); await atomic(join(dir, 'package.md'), `# ${result.title}\n\n${result.description}`); return { files: ['package.json', 'package.md'], checks: [] };
  }
  fail('invalid-step', '此类型没有该制作阶段');
}
