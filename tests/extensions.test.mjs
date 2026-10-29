import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { modelJson } from '../packages/media-workflow-skill/lib/generation.mjs';
import { PostFaroPublisher } from '../packages/media-workflow-skill/lib/publishing.mjs';
import { digest, json, atomic } from '../packages/media-workflow-skill/lib/common.mjs';
import { TaskStore } from '../packages/media-workflow-skill/lib/store.mjs';
import { validateCanvas } from '../packages/media-workflow-skill/lib/canvas.mjs';
import { rewriteDocumentAssets } from '../packages/media-workflow-skill/lib/document-assets.mjs';
import { fixtureBrief, publicationFixture, temporary } from './helpers.mjs';

test('实际图像字节通过宿主附件服务进入模型；文本模型不能冒充视觉模型', async t => {
  const root = await temporary(t), path = join(root, 'image.png'); await writeFile(path, 'actual-input-bytes'); let admitted, request;
  const llm = { async prepareCall() { return { config: {}, inputModalities: ['text','image'], async *stream(p) { request = p; yield { type: 'block-end', index: 0, block: { type: 'text', text: '{}' } }; yield { type: 'finish', reason: { kind: 'stop' } }; } }; } };
  const attachments = { async admitPromptContent(parts) { admitted = parts; return parts.map(p => p.type === 'image' ? { type: 'image', attachment: { attachmentId: 'fixture-image' } } : p); } };
  const payload = { brief: fixtureBrief(), materials: [], images: [{ id: 'source-1', sourceId: 'source-1', absolutePath: path, mimeType: 'image/png' }] };
  await modelJson(llm, { provider: 'fixture', model: 'vision-fixture' }, 'visual-analysis', payload, undefined, { attachments });
  assert.equal(Buffer.from(admitted.find(b => b.type === 'image').data, 'base64').toString(), 'actual-input-bytes');
  assert.equal(request.messages[0].content.find(b => b.type === 'image').attachment.attachmentId, 'fixture-image');
  await assert.rejects(modelJson({ async prepareCall() { return { inputModalities: ['text'] }; } }, { provider: 'fixture', model: 'text-fixture' }, 'visual-analysis', payload, undefined, { attachments }), { code: 'vision-unavailable' });
});

test('画布保存创建新交付，正文与包装同步，旧窗口不能覆盖新版', async t => {
  const runner = new WorkflowRunner({ root: await temporary(t), generate: publicationFixture }); t.after(() => runner.dispose());
  let task = await runner.create(fixtureBrief({ work: { type: 'article' }, review: { mode: 'none' }, output: { width: 780, height: 1080 } })); task = await runner.start(task.state.id);
  const initial = await runner.canvasProject(task.state.id), canvas = structuredClone(initial.canvas);
  canvas.pages[0].elements.find(e => e.sectionId).text = '用户通过画布编辑的正文，仍为虚构测试。';
  canvas.pages[0].elements.find(e => e.headingPageId).text = '画布新标题';
  canvas.pages[0].elements.push({ id: 'box', kind: 'shape', x: 20, y: 800, width: 100, height: 80, fill: '#eeaa44', shape: 'ellipse', rotate: 15 });
  task = await runner.editCanvas(task.state.id, canvas, initial.inputDigest, '调整正文、标题和形状'); assert.equal(task.state.status, 'complete', JSON.stringify(task.state.error));
  const render = task.state.steps.find(s => s.key === 'render'); assert.equal(render.history.length, 1);
  const html = await readFile(join(runner.store.taskDir(task.state.id), render.artifacts.find(a => a.name === 'article.html').path), 'utf8'); assert.match(html, /画布新标题/); assert.match(html, /用户通过画布编辑/); assert.match(html, /rotate\(15deg\)/);
  const packaging = await runner.data(task.state.id, task, 'package', 'package.json'); assert.match(packaging.description, /用户通过画布编辑/);
  await assert.rejects(runner.editCanvas(task.state.id, canvas, initial.inputDigest), { code: 'stale-input' });
  const bad = structuredClone(canvas); bad.pages[0].elements[0].x = -100;
  assert.throws(() => validateCanvas(bad, initial.project), { code: 'invalid-canvas' });
  const hidden = structuredClone(canvas); hidden.pages[0].elements = hidden.pages[0].elements.filter(e => !e.sectionId); assert.throws(() => validateCanvas(hidden, initial.project), { code: 'invalid-canvas' });
});

test('画布版本的评审修改应用到现有工程，保留已编辑正文', async t => {
  const generate = async (kind, payload) => {
    if (kind === 'canvas-edit') { const canvas = structuredClone(payload.project.canvas); canvas.pages[0].elements.find(e => e.headingPageId).fontSize += 3; return { canvas, note: '只放大标题，保留现有正文与图层' }; }
    return publicationFixture(kind, payload);
  };
  const runner = new WorkflowRunner({ root: await temporary(t), generate }); t.after(() => runner.dispose());
  let task = await runner.create(fixtureBrief({ work: { type: 'article' }, output: { width: 780, height: 1080 } })); task = await runner.start(task.state.id, { approveBrief: true });
  task = await runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  const base = await runner.canvasProject(task.state.id), canvas = structuredClone(base.canvas); canvas.pages[0].elements.find(e => e.sectionId).text = '需要保留的画布正文';
  task = await runner.editCanvas(task.state.id, canvas, base.inputDigest, '修改正文');
  task = await runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'changes', feedback: '放大标题，保留正文' });
  assert.equal(task.state.pendingReview.step, 'render'); const project = await runner.data(task.state.id, task, 'render', 'publication.json');
  assert.equal(project.script.sections[0].text, '需要保留的画布正文'); assert.equal(project.canvas.pages[0].elements.find(e => e.headingPageId).fontSize, canvas.pages[0].elements.find(e => e.headingPageId).fontSize + 3);
});

test('分片上传支持进程恢复、重复分片与完成回读，拒绝冲突内容和错位', async t => {
  const root = await temporary(t), store = new TaskStore(root), task = await store.create(fixtureBrief(), { draft: true });
  const data = Buffer.from('first-half-second-half'), begin = await store.transfers.begin(task.state.id, { name: 'test.txt', size: data.length, sha256: digest(data) });
  await store.transfers.chunk(task.state.id, begin.id, 0, data.subarray(0, 10));
  const recovered = new TaskStore(root); assert.equal((await recovered.transfers.status(task.state.id, begin.id)).offset, 10);
  assert.equal((await recovered.transfers.chunk(task.state.id, begin.id, 0, data.subarray(0, 10))).retried, true);
  await assert.rejects(recovered.transfers.chunk(task.state.id, begin.id, 0, Buffer.from('xxxxxxxxxx')), { code: 'chunk-conflict' });
  await assert.rejects(recovered.transfers.chunk(task.state.id, begin.id, 15, Buffer.from('x')), { code: 'chunk-offset' });
  await recovered.transfers.chunk(task.state.id, begin.id, 10, data.subarray(10)); const receipt = await recovered.transfers.complete(task.state.id, begin.id);
  assert.equal((await readFile(receipt.descriptor.path)).toString(), data.toString()); assert.equal(receipt.sha256, digest(data));
  assert.deepEqual(await recovered.transfers.complete(task.state.id, begin.id), receipt);
  assert.equal((await recovered.read(task.state.id)).brief.sources.filter(s => s.id === receipt.id).length, 1);
});

test('文章与图组各按真实类型能力准备参数，图片顺序与正文保留', async t => {
  const root = await temporary(t), bridgeId = `bridge-${'a'.repeat(32)}`;
  const document = { absolutePath: join(root, 'article.html'), sha256: 'article-hash' }; await writeFile(document.absolutePath, '<h1>实际文章正文</h1>');
  for (const [type, expected, platform] of [['article','article','weixin'], ['image-post','imageText','xiaohongshu']]) {
    const publisher = new PostFaroPublisher({ postfaro: 'fixture', bridgeId });
    publisher.call = async args => args[0] === 'capabilities' ? { ok: true, result: { extensionVersion: '1.0.7', platforms: { [expected]: [platform] } } } : args[0] === 'accounts' ? { ok: true, result: { accounts: [{ platform, displayName: '测试账号', loggedIn: true, source: 'detector', checkedAt: Date.now() }] } } : { ok: true };
    const brief = { ...fixtureBrief({ work: { type } }), publish: { bridgeId, browserContext: 'regular', targets: [{ id: 't', platform, account: '测试账号', extra: {} }] } };
    const packaging = { targets: [{ targetId: 't', title: '标题', content: '图组配文', tags: ['科普'], extra: {} }] }, images = ['page-01.png','page-02.png'].map((name, i) => ({ absolutePath: join(root, name), sha256: String(i) }));
    for (const image of images) await writeFile(image.absolutePath, 'fixture-only-image-bytes');
    const result = await publisher.prepare({ brief, packaging, document, images: type === 'image-post' ? images : [], dir: root, taskId: 'fixture-task', runRevision: 1 }); const input = result.prepared[0].input;
    assert.equal(input.type, expected); assert.equal(input.data.publishGuard.requirePublicUrl, true);
    if (type === 'article') assert.match(input.data.content, /实际文章正文/); else assert.deepEqual(input.assets.map(a => a.path), images.map(a => a.absolutePath));
  }
});

test('带目录的交付依赖需完整且摘要正确，预览只映射当前产物版本', async t => {
  const runner = new WorkflowRunner({ root: await temporary(t), generate: publicationFixture }); t.after(() => runner.dispose());
  let task = await runner.create(fixtureBrief({ work: { type: 'article' }, review: { mode: 'none' } })); task = await runner.start(task.state.id); const render = task.state.steps.find(s => s.key === 'render');
  const files = []; for (const name of ['article.md','publication.json']) files.push({ name, base64: (await readFile(join(runner.store.taskDir(task.state.id), render.artifacts.find(a => a.name === name).path))).toString('base64') });
  files.push({ name: 'article.html', base64: Buffer.from('<link rel="stylesheet" href="assets/style.css"><h1>本地工程</h1>').toString('base64') }, { name: 'assets/style.css', base64: Buffer.from('h1{color:#315abb}').toString('base64') });
  const input = runner.importDigest(task); await assert.rejects(runner.importArtifacts(task.state.id, { note: '缺少依赖', files: files.slice(0, -1) }, input), { code: 'invalid-bundle' });
  task = await runner.importArtifacts(task.state.id, { note: '完整工程', files, dependencies: [{ path: 'assets/style.css', sha256: digest('h1{color:#315abb}') }] }, input); assert.equal(task.state.status, 'complete');
  assert.equal(task.state.steps.find(s => s.key === 'render').artifacts.some(a => a.name === 'assets/style.css'), true);
  const rewritten = rewriteDocumentAssets('<img src="assets/p.png"><img src="../../../state.json">', 'artifacts/render/2/article.html', path => `/file?path=${path}`);
  assert.match(rewritten, /path=artifacts\/render\/2\/assets\/p.png/); assert.equal(rewritten.includes('../../../state.json'), false);
});
