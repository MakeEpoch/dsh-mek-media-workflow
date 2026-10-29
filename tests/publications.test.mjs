import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { validateGeneration } from '../packages/media-workflow-skill/lib/generation.mjs';
import { normalizeBrief, briefHash } from '../packages/media-workflow-skill/lib/schema.mjs';
import { validatePublication, publicationHtml, pngSize } from '../packages/media-workflow-skill/lib/publications.mjs';
import { temporary, fixtureBrief, publicationFixture } from './helpers.mjs';


test('原生文章完整交付、四关评审与改版历史，不经过配音或 ffmpeg', async t => {
  const root = await temporary(t), runner = new WorkflowRunner({ root, generate: publicationFixture }); t.after(() => runner.dispose());
  let task = await runner.create(fixtureBrief({ work: { type: 'article' } }));
  assert.equal(task.state.steps.length, 9); assert.equal(task.state.steps.some(s => s.key === 'voice'), false);
  task = await runner.start(task.state.id, { approveBrief: true }); assert.equal(task.state.pendingReview.step, 'storyboard');
  task = await runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.pendingReview.step, 'render');
  const oldId = task.state.pendingReview.id;
  task = await runner.review(task.state.id, { reviewId: oldId, decision: 'changes', feedback: '换自然主题，调整标题' });
  assert.equal(task.state.pendingReview.step, 'render'); assert.notEqual(task.state.pendingReview.id, oldId);
  const render = task.state.steps.find(s => s.key === 'render'); assert.equal(render.history.length, 1);
  const html = render.artifacts.find(a => a.name === 'article.html');
  const content = await readFile(join(runner.store.taskDir(task.state.id), html.path), 'utf8');
  assert.match(content, /调整后的测试说明/); assert.match(content, /三个虚构测试项目/); assert.match(content, /来源与待核实/); assert.match(content, /class="natural"/);
  task = await runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.status, 'complete');
  assert.equal(render.artifacts.some(a => a.mime.startsWith('video/')), false);
  await assert.rejects(runner.revise(task.state.id, { ...task.brief, work: { type: 'image-post' } }, { newRequirement: true }), { code: 'type-change-requires-task' });
});

test('旧视频需求 hash 不添加作品字段；草稿切换类型后使用对应阶段', async t => {
  const brief = normalizeBrief(fixtureBrief()); assert.equal(Object.hasOwn(brief, 'work'), false); assert.equal(briefHash(brief), briefHash(normalizeBrief(brief)));
  const runner = new WorkflowRunner({ root: await temporary(t) }); let task = await runner.create(fixtureBrief(), { draft: true });
  task = await runner.store.saveDraft(task.state.id, { ...task.brief, work: { type: 'article' } }); assert.equal(task.state.steps.length, 9); assert.equal(task.state.workType, 'article');
  assert.deepEqual((await runner.store.read(task.state.id)).state.steps, task.state.steps);
});

test('排版拒绝遗漏、重复、虚构素材及过长卡片；HTML 文本不会执行', () => {
  const brief = normalizeBrief(fixtureBrief({ work: { type: 'image-post' } })), script = { sections: [{ id: 's1', text: '正文', sourceIds: [] }, { id: 's2', text: '正文2', sourceIds: [] }] };
  const base = { title: '测试', treatment: '实际布局', theme: 'editorial', pages: [{ id: 'p', title: '标题', sectionIds: ['s1', 's2'], materialIds: [], layout: 'text' }] };
  const context = { brief, script }; validatePublication(base, context);
  for (const sectionIds of [['s1'], ['s1', 's1'], ['missing']]) assert.throws(() => validatePublication({ ...base, pages: [{ ...base.pages[0], sectionIds }] }, context), { code: 'invalid-reference' });
  assert.throws(() => validatePublication({ ...base, pages: [{ ...base.pages[0], materialIds: ['invented'] }] }, context), { code: 'invalid-reference' });
  script.sections[0].text = '<script>alert(1)</script>';
  const html = publicationHtml({ type: 'article', title: '测试', primary: '#315abb', width: 780, height: 1080, theme: 'editorial', plan: base, script, images: {}, sources: [], unknowns: [] });
  assert.match(html, /&lt;script&gt;/); assert.equal(html.includes('<script>'), false);
});

test('交付文件导入创建新版本，拒绝旧输入、路径越界和旧审批，包装使用导入正文', async t => {
  const runner = new WorkflowRunner({ root: await temporary(t), generate: publicationFixture }); t.after(() => runner.dispose());
  let task = await runner.create(fixtureBrief({ work: { type: 'article' } }));
  task = await runner.start(task.state.id, { approveBrief: true });
  task = await runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  const oldId = task.state.pendingReview.id, old = task.state.steps.find(s => s.key === 'render'), inputDigest = runner.importDigest(task);
  const files = [];
  for (const name of ['article.html', 'article.md', 'publication.json']) {
    const artifact = old.artifacts.find(a => a.name === name); let bytes = await readFile(join(runner.store.taskDir(task.state.id), artifact.path));
    if (name === 'publication.json') { const p = JSON.parse(bytes); p.script.sections[0].text = '导入后完整正文，仍是虚构回归夹具。'; bytes = Buffer.from(JSON.stringify(p)); }
    if (name === 'article.html') bytes = Buffer.from('<!doctype html><meta charset="utf-8"><h1>外部编辑后的文章</h1><p>导入后完整正文，仍是虚构回归夹具。</p>');
    files.push({ name, base64: bytes.toString('base64') });
  }
  const bundle = { note: '本地编辑文章，待人工阅读检查。', files };
  await assert.rejects(runner.importArtifacts(task.state.id, bundle, 'old'), { code: 'stale-input' });
  await assert.rejects(runner.importArtifacts(task.state.id, { ...bundle, files: [{ name: '../escape.html', base64: 'YQ==' }] }, inputDigest), { code: 'invalid-bundle' });
  await assert.rejects(runner.importArtifacts(task.state.id, { ...bundle, files: [{ name: 'article.html', path: '/etc/passwd' }] }, inputDigest), { code: 'invalid-bundle' });
  task = await runner.importArtifacts(task.state.id, bundle, inputDigest);
  assert.equal(task.state.pendingReview.step, 'render'); assert.notEqual(task.state.pendingReview.id, oldId);
  const imported = task.state.steps.find(s => s.key === 'render'); assert.equal(imported.history.length, 1); assert.equal(imported.revision, 2);
  const html = imported.artifacts.find(a => a.name === 'article.html'); assert.match(await readFile(join(runner.store.taskDir(task.state.id), html.path), 'utf8'), /外部编辑后的文章/);
  assert.equal(imported.checks.find(c => c.id === 'import-content').status, 'unknown');
  await assert.rejects(runner.importArtifacts(task.state.id, bundle, inputDigest), { code: 'stale-input' });
  await assert.rejects(runner.review(task.state.id, { reviewId: oldId, decision: 'approve' }), { code: 'stale-review' });
  task = await runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.status, 'complete');
  const packaging = await runner.data(task.state.id, task, 'package', 'package.json'); assert.match(packaging.description, /导入后完整正文/);
});


test('原创生活素材允许没有外部事实，仍保留作者归属与未知', () => {
  const brief = normalizeBrief(fixtureBrief({ style: 'original', work: { type: 'article' } }));
  const value = validateGeneration('facts', { facts: [], unknowns: [] }, { brief }); assert.deepEqual(value.facts, []); assert.match(value.unknowns[0], /作者自述/);
  assert.throws(() => validateGeneration('facts', { facts: [], unknowns: [] }, { brief: { ...brief, style: 'news' } }), { code: 'invalid-generation' });
});
