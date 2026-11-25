import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { IdeaStore, applyIdeaOps, normalizeIdeas } from '../packages/media-workflow-skill/lib/ideas.mjs';
import { StyleStore } from '../packages/media-workflow-skill/lib/styles.mjs';
import { STYLE_PRESETS, STYLE_CATEGORIES, extractStyleCard } from '../packages/media-workflow-skill/lib/style-presets.mjs';
import { RuleStore, analyzeMetrics, exportSkill } from '../packages/media-workflow-skill/lib/insights.mjs';
import { main as workflow } from '../packages/media-workflow-skill/scripts/workflow.mjs';
import { temporary, fixtureBrief, publicationFixture } from './helpers.mjs';

test('灵感墙存在插件数据根独立文件，白名单字段之外的数据被丢弃', async t => {
  const root = await temporary(t), store = new IdeaStore(root);
  const created = await store.apply([{ op: 'add', kind: 'note', title: '第一张卡', body: '真实笔记', tags: ['灵感'], extra: 'DROP' }]);
  assert.equal(created.errors.length, 0);
  const items = (await store.list()).items;
  assert.equal(items.length, 1);
  assert.equal(items[0].title, '第一张卡');
  assert.equal(Object.hasOwn(items[0], 'extra'), false, '多余字段不应落盘');
  assert.ok(items[0].pos && Number.isFinite(items[0].pos.x), '新卡片有默认位置');
  const moved = await store.apply([{ op: 'move', id: items[0].id, pos: { x: 12, y: 34 } }]);
  assert.deepEqual(moved.state.items[0].pos, { x: 12, y: 34 });
  await store.apply([{ op: 'update', id: items[0].id, title: '改过的卡', kind: 'link', url: 'javascript:alert(1)' }]);
  const after = (await store.list()).items[0];
  assert.equal(after.title, '改过的卡');
  assert.equal(after.url, null, '非 http(s) 链接被拒绝');
  await store.apply([{ op: 'delete', id: items[0].id }]);
  assert.equal((await store.list()).items.length, 0);
  // 数据落在临时根，不写 ~/.dsh/media-desk
  const raw = JSON.parse(await readFile(join(root, 'ideas.json'), 'utf8'));
  assert.equal(raw.items.length, 0);
});

test('灵感媒体只接受本插件相对路径与常见格式', async t => {
  const root = await temporary(t), store = new IdeaStore(root);
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
  const media = await store.saveMedia({ name: 'a.png', mime: 'image/png', base64: png });
  assert.match(media.src, /^ideas-media\/.+\.png$/);
  const asset = await store.media(media.src);
  assert.equal((await stat(asset.file)).size > 0, true);
  await assert.rejects(store.saveMedia({ name: 'a.exe', mime: 'application/octet-stream', base64: png }), { code: 'invalid-media' });
  await assert.rejects(store.media('../../etc/passwd'), { code: 'invalid-media' });
});

test('风格预设 8 板块 15 个且 MIT 来源保留，文本可提炼专属风格卡', async t => {
  assert.equal(STYLE_CATEGORIES.length, 8);
  assert.equal(STYLE_PRESETS.length, 15);
  const source = await readFile(new URL('../packages/media-workflow-skill/lib/style-presets.mjs', import.meta.url), 'utf8');
  assert.match(source, /MIT/);
  assert.match(source, /woniuniuniu\/dsh-media-desk/);
  const card = extractStyleCard('说白了，这件事没那么复杂。我试了一下，先看结论，再看细节。关键在于，别被标题带跑。', { name: '我的口播' });
  assert.equal(card.name, '我的口播');
  assert.equal(card.preset, false);
  await assert.rejects(async () => extractStyleCard('太短'), { code: 'style-too-short' });
});

test('工作台与 CLI 共享写作快照，明确采用新配置时只重做正文及其后续', async t => {
  const root = await temporary(t), host = new MediaService({ root });
  t.after(() => host.dispose());
  const brief = fixtureBrief({ work: { type: 'article' }, review: { mode: 'none' } });
  const draft = await host.dispatch('tasks.create', { brief });
  assert.equal(draft.brief.writing, undefined);
  const styles = await host.dispatch('styles.save', { ops: [{ op: 'add', name: '锐评风', tone: '直接、不绕弯', structure: '结论 → 依据 → 行动', words: ['说实话'] }] });
  const styleId = styles.styles.find(row => row.name === '锐评风').id;
  await host.dispatch('styles.save', { ops: [{ op: 'setActive', id: styleId }] });
  const { rules } = await host.rules.apply([{ op: 'add', name: '开头给结论', rule: '第一段写出结论' }, { op: 'add', name: '旧写法', rule: '以长背景开篇' }]);
  await host.rules.apply([{ op: 'update', id: rules.find(row => row.name === '旧写法').id, status: 'archived' }]);
  const guidance = {};
  host.runner.generate = (kind, payload) => { guidance[kind] = payload.guidance; return publicationFixture(kind, payload); };
  const id = draft.state.id;
  await host.runner.start(id);
  const original = await host.runner.run(id);
  assert.equal(original.state.status, 'complete');
  assert.equal(original.state.steps.length, 9);
  assert.match(original.brief.writing.style.guidance, /结论 → 依据 → 行动/);
  assert.deepEqual(original.brief.writing.rules.map(row => row.name), ['开头给结论']);
  assert.deepEqual(guidance.script.writing.rules, original.brief.writing.rules);
  assert.equal(guidance.facts.writing, undefined);
  assert.equal(guidance.publication.writing.style.id, styleId);
  const input = join(root, 'brief-input.json');
  await writeFile(input, JSON.stringify(brief));
  const cli = await workflow({ _: ['create'], root, brief: input, start: true });
  assert.deepEqual(cli.brief.writing, original.brief.writing);
  assert.equal(cli.state.error.code, 'generation-required');

  await host.styles.apply([{ op: 'setActive', id: null }]);
  await host.rules.apply([{ op: 'update', id: original.brief.writing.rules[0].id, rule: '开头先给可核查的例子' }]);
  await host.runner.revise(id, brief, { newRequirement: true });
  const unchanged = await host.runner.run(id);
  assert.deepEqual(unchanged.brief.writing, original.brief.writing);
  assert.equal(unchanged.state.steps.find(s => s.key === 'script').revision, 1);
  const updated = await workflow({ _: ['requirements', id], root, brief: input, 'new-requirement': true, 'refresh-writing': true });
  assert.equal(updated.state.activeStep, 'script');
  assert.equal(updated.brief.writing.style, null);
  assert.equal(updated.state.steps.find(s => s.key === 'materials').revision, 1);
  assert.equal(updated.state.steps.find(s => s.key === 'script').history.length, 1);
  const request = await host.request({ id, step: 'script' });
  assert.equal(request.guidance.writing.rules[0].rule, '开头先给可核查的例子');
  assert.notEqual(request.inputDigest, original.state.steps.find(s => s.key === 'script').inputDigest);
  const saved = JSON.parse(await readFile(join(host.store.taskDir(id), 'requirements', '1.json'), 'utf8'));
  assert.deepEqual(saved.writing, original.brief.writing);
});

test('作品创作风格独立于工作区默认，草稿和修改都能应用指定风格', async t => {
  const root = await temporary(t);
  const host = new MediaService({ root });
  t.after(() => host.dispose());
  await host.styles.apply([{ op: 'setActive', id: 'preset_ai_tech' }]);
  const brief = fixtureBrief({ work: { type: 'article' }, review: { mode: 'none' } });
  const { state } = await host.dispatch('tasks.create', { brief: { ...brief, writingStyleId: 'deleted-style' }, draft: true });
  await assert.rejects(host.runner.start(state.id), { code: 'style-not-found' });
  assert.equal((await host.store.read(state.id)).state.status, 'draft');
  await host.dispatch('tasks.draft', { id: state.id, brief: { ...brief, writingStyleId: 'preset_tutorial' } });
  host.runner.generate = publicationFixture;
  await host.runner.start(state.id);
  const created = await host.runner.run(state.id);
  assert.equal(created.brief.writing.style.id, 'preset_tutorial');
  assert.match(created.brief.writing.style.guidance, /最终效果/);
  await host.rules.apply([{ op: 'add', name: '新的写作规则', rule: '用一个例子开场' }]);
  await host.runner.revise(state.id, { ...brief, writingStyleId: 'preset_travel' }, { newRequirement: true });
  const updated = await host.store.read(state.id);
  assert.equal(updated.brief.writing.style.id, 'preset_travel');
  assert.deepEqual(updated.brief.writing.rules, []);
  assert.equal(updated.state.steps.find(step => step.key === 'materials').revision, 1);
  assert.equal(updated.state.steps.find(step => step.key === 'script').status, 'pending');
  assert.equal((await host.styles.active()).id, 'preset_ai_tech');
});

test('复盘导入真实数据给出建议，确认后写入规则并可导出 Skill；无规则时拒绝导出', async t => {
  const root = await temporary(t), store = new RuleStore(root);
  await store.saveMetrics([
    { platform: 'xiaohongshu', date: '2026-11-01', views: 1200, likes: 80, comments: 12, shares: 6, saves: 20 },
    { platform: 'xiaohongshu', date: '2026-11-02', views: 900, likes: 60, comments: 9 },
    { platform: 'douyin', date: '2026-11-01', views: 200, likes: 4 },
    { platform: 'douyin', date: '2026-11-02', views: 150, likes: 3 },
  ]);
  const analysis = analyzeMetrics(await store.metrics());
  assert.equal(analysis.total, 4);
  assert.ok(analysis.proposals.some(p => /首发放在xiaohongshu/.test(p.name)));
  await assert.rejects(exportSkill({ root }), { code: 'nothing-to-export' });
  const saved = await store.apply([{ op: 'add', name: '首发小红书', rule: '同一选题优先在小红书首发。', evidence: '测试数据', source: '数据复盘', confidence: 0.7 }]);
  assert.equal(saved.rules.length, 1);
  assert.equal(saved.rules[0].status, 'active');
  const exported = await exportSkill({ root, rules: saved.rules });
  const body = await readFile(exported.path, 'utf8');
  assert.match(body, /首发小红书/);
  assert.match(body, /name: media-workflow-voice/);
  assert.ok(exported.path.startsWith(join(root, 'skills')));
});

test('同一灵感并发成稿只创建一份正式任务，链接和附件可随任务继续使用', async t => {
  const root = await temporary(t), links = [];
  const options = { root, adapters: { fetcher: async url => { links.push(url); return new Response('夹具链接正文'); } } };
  const host = new MediaService(options), second = new MediaService(options);
  t.after(() => Promise.all([host.dispose(), second.dispose()]));
  const buffer = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const media = await host.ideas.saveMedia({ name: 'fixture.png', base64: buffer.toString('base64') });
  const result = await host.ideas.apply([{ op: 'add', kind: 'link', title: '测试灵感', body: '原始卡片正文', url: 'https://example.invalid/article', media }]);
  const idea = result.state.items[0], start = service => service.dispatch('ideas.start-article', { id: idea.id });
  const [{ id }, repeat, other] = await Promise.all([start(host), start(host), start(second)]);
  assert.deepEqual([repeat.id, other.id], [id, id]);
  await Promise.all([host.operations.get(id), second.operations.get(id)]);
  const { state, brief } = await second.store.read(id);
  assert.equal(state.ideaId, idea.id);
  assert.equal(state.workType, 'article');
  assert.equal(state.status, 'blocked');
  assert.equal(state.error.code, 'generation-required');
  assert.equal(brief.publish.enabled, false);
  assert.equal(brief.sources.find(row => row.id === 'idea-text').text, '测试灵感\n\n原始卡片正文');
  assert.deepEqual(links, ['https://example.invalid/article']);
  for (const type of ['image-post', 'video']) {
    const started = await host.dispatch('ideas.start-work', { id: idea.id, type });
    assert.notEqual(started.id, id);
    assert.deepEqual(await second.dispatch('ideas.start-work', { id: idea.id, type }), started);
    await host.operations.get(started.id);
    assert.equal((await host.store.read(started.id)).state.workType, type);
  }
  const snapshot = brief.sources.find(row => row.role === 'image');
  assert.equal(snapshot.path, join(second.store.taskDir(id), 'uploads', 'upload-idea', 'idea-attachment.png'));
  await rm(join(root, media.src));
  assert.deepEqual(await readFile(snapshot.path), buffer);
  assert.deepEqual(await start(second), { id });
  assert.equal((await second.store.read(id)).state.revision, state.revision);
  assert.equal((await second.store.list()).total, 3);
  await assert.rejects(host.dispatch('draft.part', { id, part: 'script' }), { code: 'bad-request' });
});

test('灵感/风格/复盘 RPC 只接受白名单操作，未知方法仍报错', async t => {
  const host = new MediaService({ root: await temporary(t) }); t.after(() => host.dispose());
  const saved = await host.dispatch('ideas.save', { ops: [{ op: 'add', kind: 'quote', title: '一句金句', bogus: 'x' }] });
  assert.equal(saved.errors.length, 0);
  const bad = await host.dispatch('ideas.save', { ops: [{ op: 'drop-table' }] });
  assert.equal(bad.errors.length, 1);
  await assert.rejects(host.dispatch('nope.unknown'), { code: 'bad-request' });
  // 归一化丢弃未知 kind
  assert.equal(normalizeIdeas({ items: [{ id: 'x', kind: 'evil', title: 't' }] }).items.length, 0);
});
