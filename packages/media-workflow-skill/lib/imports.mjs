import { copyFile, readFile, realpath, mkdir } from 'node:fs/promises';
import { join, dirname, posix } from 'node:path';
import { atomic, inside, fileDigest, fail, text, uuid, json, regular, now } from './common.mjs';
import { workType } from './profiles.mjs';
import { pngSize } from './publications.mjs';
import { validateGeneration } from './generation.mjs';
import { inspectMedia } from './media.mjs';

// Capture imported files before replacing the current version. No source path is kept as a live dependency.
export async function captureBundle(runner, id, task, bundle, signal) {
  const note = text(bundle.note, '交付修改说明', { required: true, max: 4000 });
  if (!Array.isArray(bundle.files) || !bundle.files.length || bundle.files.length > 64) fail('invalid-bundle', '请提供 1–64 个交付文件');
  const directory = join(runner.store.taskDir(id), 'imports', uuid()); await mkdir(directory, { recursive: true });
  const files = [], names = new Set(); let size = 0;
  for (const file of bundle.files) {
    const name = text(file.name, '交付文件名', { required: true, max: 160 });
    if (['import-record.json', 'import-content.json'].includes(name)) fail('invalid-bundle', '交付文件占用了内部记录名称');
    if (!/^[\p{L}\p{N}_. /-]+$/u.test(name) || name.split('/').some(s => !s || s.startsWith('.')) || name !== posix.normalize(name) || names.has(name)) fail('invalid-bundle', '文件路径需要唯一，不能越界或包含隐藏文件'); names.add(name);
    const destination = inside(directory, name); await mkdir(dirname(destination), { recursive: true });
    if (file.path) {
      // Browser imports may reference only files already uploaded into this task.
      if (!file.path.startsWith('uploads/')) fail('invalid-bundle', '只能引用本任务的已上传文件');
      const source = await realpath(inside(runner.store.taskDir(id), file.path)); inside(join(runner.store.taskDir(id), 'uploads'), source);
      const info = await regular(source, 2 * 1024 * 1024 * 1024); size += info.size; if (size > 8 * 1024 * 1024 * 1024) fail('invalid-bundle', '交付文件总量最多 8GB'); await copyFile(source, destination);
    } else {
      if (typeof file.base64 !== 'string' || file.base64.length > 28 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64)) fail('invalid-bundle', '文件内容无效或超过 20MB');
      const data = Buffer.from(file.base64, 'base64'); size += data.length; if (size > 8 * 1024 * 1024 * 1024) fail('invalid-bundle', '交付文件总量最多 8GB'); await atomic(destination, data);
    }
    files.push({ name, sha256: await fileDigest(destination) });
  }
  const dependencies = bundle.dependencies ?? [];
  if (!Array.isArray(dependencies) || dependencies.some(d => !names.has(d.path) || (d.sha256 && files.find(f => f.name === d.path)?.sha256 !== d.sha256))) fail('invalid-bundle', '工程依赖缺失或摘要与清单不一致');
  for (const f of files.filter(f => /\.(html|css)$/i.test(f.name))) {
    const content = await readFile(inside(directory, f.name), 'utf8');
    const refs = [...content.matchAll(/(?:src|poster)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^"')\s]+)["']?\s*\)/gi)].map(m => m[1] || m[2]);
    for (const match of content.matchAll(/<link\b[^>]*href\s*=\s*["']([^"']+)["']/gi)) refs.push(match[1]);
    for (const ref of refs) { if (/^(data:|#)/i.test(ref)) continue; if (/^(?:[a-z]+:|\/|\\)/i.test(ref)) fail('invalid-bundle', `工程素材需一并保存为本地依赖：${f.name}`); let path; try { path = posix.normalize(posix.join(posix.dirname(f.name), decodeURIComponent(ref.split(/[?#]/)[0]))); } catch { fail('invalid-bundle', '工程依赖路径编码无效'); } if (!names.has(path)) fail('invalid-bundle', `工程缺少引用文件：${path}`); }
  }
  const type = workType(task), required = type === 'video' ? ['final.mp4', 'cover.png', 'render-project.json'] : ['publication.json', 'article.md', type === 'article' ? 'article.html' : 'gallery.html'];
  if (required.some(n => !names.has(n))) fail('invalid-bundle', `交付缺少必要文件：${required.join('、')}`);
  const checks = [{ id: 'import-files', label: '导入文件已保存并核对内容摘要', status: 'pass', severity: 'info', detail: note }, { id: 'import-content', label: '导入内容与原稿、来源及表达质量', status: 'unknown', severity: 'info', detail: '导入检查不等于语义、版权或视觉验收，请阅读当前文件。' }];
  if (type === 'video') {
    pngSize(await readFile(join(directory, 'cover.png'))); await json(join(directory, 'render-project.json'));
    const result = await inspectMedia(join(directory, 'final.mp4'), task.brief, task.state.execution, signal);
    if (result.checks.some(c => c.status === 'fail' && c.severity === 'error')) fail('invalid-bundle', '导入视频未通过媒体检查'); checks.push(...result.checks);
  } else {
    const project = await json(join(directory, 'publication.json'));
    if (project.type !== type) fail('invalid-bundle', '工程类型与任务不一致');
    const materials = await runner.materials(id, task), facts = await runner.data(id, task, 'materials', 'facts.json');
    const script = validateGeneration('script', project.script, { brief: task.brief, materials, facts });
    // Preserve the editable content as the packaging source. Custom layouts may use any local editing tool.
    await atomic(join(directory, 'import-content.json'), script); files.push({ name: 'import-content.json', sha256: await fileDigest(join(directory, 'import-content.json')) });
    if (type === 'image-post') {
      const pages = files.filter(f => /^page-\d{2}\.png$/.test(f.name)).sort((a, b) => a.name.localeCompare(b.name));
      if (!pages.length || pages.some((p, i) => p.name !== `page-${String(i + 1).padStart(2, '0')}.png`)) fail('invalid-bundle', '图片必须从 page-01.png 连续编号');
      for (const page of pages) { const size = pngSize(await readFile(join(directory, page.name))); if (size.width !== task.brief.output.width || size.height !== task.brief.output.height) fail('invalid-bundle', '导入图片尺寸与需求不一致'); }
    }
  }
  const record = { schemaVersion: 1, inputDigest: runner.inputDigest(task, 'render'), runRevision: task.state.runRevision, directory, files, checks, note, importedAt: now() };
  await atomic(join(directory, 'import-record.json'), { ...record, directory: undefined });
  record.files.push({ name: 'import-record.json', sha256: await fileDigest(join(directory, 'import-record.json')) }); return record;
}
export async function useBundle(record, dir, task, inputDigest) {
  if (!record || record.inputDigest !== inputDigest || record.runRevision !== task.state.runRevision) return null;
  const files = [];
  for (const file of record.files) {
    const source = inside(record.directory, file.name); if (await fileDigest(source) !== file.sha256) fail('external-edit', '导入快照被修改，请重新导入新版本');
    await mkdir(dirname(inside(dir, file.name)), { recursive: true }); await copyFile(source, inside(dir, file.name));
    files.push({ path: file.name, ...(/^page-\d{2}\.png$/.test(file.name) ? { role: 'gallery-page' } : file.name.endsWith('.html') ? { role: 'document' } : {}) });
  }
  return { files, checks: record.checks };
}
