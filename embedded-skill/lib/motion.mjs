import { mkdir, copyFile, readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { command, findOm } from './process.mjs';
import { atomic, htmlEscape, digest, fail } from './common.mjs';
import { huashuTemplate, DEFAULT_TEMPLATE, sanitizeTemplateVariables } from './templates.mjs';

// 模板变量交给 om set 写入工程的 index.html。值是 JSON 数组或含空格的 JSON 时要原样传，
// 所以逐个 key=value 传参，不用 shell 拼接。
async function applyVariables(om, root, template, variables, { signal, onProcess }) {
  const entries = Object.entries(sanitizeTemplateVariables(template.id, variables));
  if (!entries.length) return;
  for (const [key, value] of entries) {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    await command(om, ['set', `${key}=${text}`, root], { signal, onProcess, timeoutMs: 30000 });
  }
}

export async function motionProject(project, directory, settings, signal, onProcess) {
  const om = await findOm(settings), root = join(directory, 'project');
  const template = huashuTemplate(project.template || DEFAULT_TEMPLATE);
  await command(om, ['new', root, '--template', template.id], { signal, onProcess, timeoutMs: 30000 });
  await mkdir(join(root, 'assets', 'materials'), { recursive: true });
  const sceneFiles = [];
  for (const scene of project.scenes) {
    const visual = scene.materials.find(m => /^(image|video)\//.test(m.mime) && m.role !== 'logo') ?? scene.materials.find(m => m.mime.startsWith('image/'));
    let file = null;
    if (visual) { file = `assets/materials/${digest(visual.path).slice(0, 12)}-${basename(visual.path).replace(/[^\w.-]/g, '_')}`; await copyFile(visual.path, join(root, file)); }
    sceneFiles.push({ visual, file });
    for (const logo of scene.materials.filter(m => m.role === 'logo' && m.mime.startsWith('image/'))) { const name = `assets/materials/logo-${digest(logo.path).slice(0, 10)}-${basename(logo.path).replace(/[^\w.-]/g, '_')}`; await copyFile(logo.path, join(root, name)); sceneFiles.at(-1).logo = name; }
  }
  // 只有 blank 是"工作台自己拼 HTML"的模板；其余模板保留生成的工程本体，
  // 改用 om set 填变量，否则模板的 grammar 与 cue 会被覆盖掉。
  if (template.id === DEFAULT_TEMPLATE) {
  const variables = [{ id: 'accent', type: 'color', label: '品牌主色', default: project.brand.primary }, ...project.scenes.map((s, i) => ({ id: `title${i}`, type: 'string', label: `镜头 ${i + 1} 标题`, default: s.title }))];
  const font = /<style id="om-fonts">([\s\S]*?)<\/style>/.exec(await readFile(join(root, 'index.html'), 'utf8'))?.[1] ?? '';
  const w = project.width, h = project.height;
  const html = `<!doctype html>
<html lang="zh-CN" data-composition-variables='${htmlEscape(JSON.stringify(variables))}'>
<head><meta charset="utf-8"><title>${htmlEscape(project.title)}</title><script src="vendor/gsap.min.js"></script><script src="vendor/om.js"></script>
<style id="om-fonts">${font}</style><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden}#film{position:relative;width:100%;height:100%;overflow:hidden;background:#101723;color:#f6f7fa;font-family:'Noto Sans SC',sans-serif;font-weight:500}.scene{position:absolute;inset:0;visibility:hidden;overflow:hidden}.scene:first-child{visibility:visible}.visual{position:absolute;inset:13% 5% 19%;width:90%;height:68%;object-fit:contain}.heading{position:absolute;margin:0;left:6%;top:4%;width:88%;font-weight:900;font-size:${Math.round(w / 29 * (project.presentation?.titleScale ?? 1))}px;line-height:1.22}.caption{position:absolute;bottom:${8 * (project.presentation?.captionMarginV ?? 12) / 12}%;left:7%;width:86%;margin:0;text-align:center;font-size:${Math.round(Math.min(w / 22, h / 22) * (project.presentation?.captionFontSize ?? 16) / 16)}px;line-height:1.4;text-shadow:0 2px 7px #000;white-space:pre-wrap}.source{position:absolute;bottom:3%;left:6%;width:78%;color:#b9c5d9;font-size:${Math.max(16, Math.round(w / 75))}px;overflow-wrap:anywhere}.logo{position:absolute;right:5%;bottom:3%;max-width:12%;height:5%;object-fit:contain}.type-content{position:absolute;inset:27% 8% 28%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(w / 20)}px;line-height:1.4;font-weight:900;color:var(--accent);text-align:center}
</style></head><body><div id="film" data-composition-id="film" data-width="${w}" data-height="${h}" data-fps="${project.fps}" data-duration="${project.timeline.duration}">
${project.scenes.map((s, i) => { const { visual, file, logo } = sceneFiles[i]; return `<section id="scene-${i}" class="scene" data-om-id="scene-${htmlEscape(s.id)}"><h1 class="heading" data-var-text="title${i}" data-om-id="title-${i}">${htmlEscape(s.title)}</h1>${file ? visual.mime.startsWith('video/') ? `<video class="visual" src="${htmlEscape(file)}" muted playsinline data-om-id="visual-${i}"></video>` : `<img class="visual" src="${htmlEscape(file)}" data-om-id="visual-${i}" alt="${htmlEscape(visual.attribution)}">` : `<div class="type-content" data-om-id="text-${i}">${htmlEscape(s.narration)}</div>`}<p class="caption" data-om-id="caption-${i}">${htmlEscape(s.narration)}</p><div class="source" data-om-id="source-${i}">${htmlEscape(visual?.attribution || s.materials[0]?.attribution || '来源见随片素材清单')}</div>${logo ? `<img src="${htmlEscape(logo)}" class="logo" alt="产品原始 Logo" data-om-id="logo-${i}">` : ''}</section>`; }).join('\n')}
</div><script>
const V=OM.vars();const tl=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
${project.scenes.map((s, i) => `tl.addLabel('scene:${i + 1}',${s.start}).set('#scene-${i}',{visibility:'visible'},${s.start})${i ? `.set('#scene-${i - 1}',{visibility:'hidden'},${s.start})` : ''};tl.fromTo('#scene-${i} ${sceneFiles[i].file ? '.visual' : '.type-content'}',{scale:1,x:0},{scale:${s.motion === 'hold' ? 1 : 1.04},x:${s.motion === 'pan' ? Math.round(w * .01) : 0},duration:${s.end - s.start},ease:'none'},${s.start});tl.fromTo('#scene-${i} .heading',{x:${i ? Math.round(w * .02) : 0},opacity:1},{x:0,opacity:1,duration:${Math.min(.45, s.end - s.start)}},${s.start});`).join('\n')}
tl.to({},{duration:${Math.max(0.01, project.timeline.duration - project.scenes.at(-1).start)}},${project.scenes.at(-1).start});window.__timelines=window.__timelines||{};window.__timelines.film=tl;
</script></body></html>`;
  await atomic(join(root, 'index.html'), html);
  }
  else await applyVariables(om, root, template, project.templateVariables || {}, { signal, onProcess });
  await atomic(join(root, 'materials.md'), project.scenes.map((s, i) => `## ${s.title}\n\n${s.materials.map(m => `${m.id}: ${m.attribution}; SHA256 ${m.sha256}`).join('\n')}`).join('\n\n'));
  const check = await command(om, ['check', root], { signal, onProcess, timeoutMs: 180000, allowFailure: true });
  await atomic(join(directory, 'motion-check.txt'), `${check.stdout}\n${check.stderr}`); if (check.code !== 0) fail('motion-check-failed', 'huashu-motion 工程检查未通过，检查结果保留在当前工作目录');
  await command(om, ['render', root, '--out', join(directory, 'motion-raw.mp4')], { signal, onProcess, timeoutMs: 1200000 });
  return { root, rawVideo: join(directory, 'motion-raw.mp4') };
}
export async function motionRender(project, output, settings, signal, onProcess) {
  const om = await findOm(settings);
  await command(om, ['check', project.motionProject], { signal, onProcess, timeoutMs: 180000 });
  await command(om, ['render', project.motionProject, '--out', output], { signal, onProcess, timeoutMs: 1200000 });
}
export async function recursiveFiles(root, prefix = '') {
  const found = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    if (entry.name === '.om' || entry.name === 'out' || entry.name === 'node_modules') continue;
    const path = join(prefix, entry.name); if (entry.isDirectory()) found.push(...await recursiveFiles(root, path)); else if (entry.isFile()) found.push(path);
  }
  return found;
}
