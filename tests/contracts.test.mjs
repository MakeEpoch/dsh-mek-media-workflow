import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { symlink, writeFile } from 'node:fs/promises';
import { TaskStore } from '../packages/media-workflow-skill/lib/store.mjs';
import { normalizeBrief, validateSettings } from '../packages/media-workflow-skill/lib/schema.mjs';
import { validateGeneration } from '../packages/media-workflow-skill/lib/generation.mjs';
import { receiptResult } from '../packages/media-workflow-skill/lib/publishing.mjs';
import { lineDiff } from '../packages/dsh-media-workflow/src/client.js';
import { registerRpc, skillProvider } from '../packages/dsh-media-workflow/dsh/index.js';
import { temporary, fixtureBrief } from './helpers.mjs';
import { defaultRoot } from '../packages/media-workflow-skill/lib/common.mjs';
import { main } from '../packages/media-workflow-skill/scripts/workflow.mjs';
import { args } from '../packages/media-workflow-skill/scripts/args.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';

test('DSH CLI 默认任务根与 Host 相同，聊天创建后 Host 可读且不另建任务', async t => {
  const root = await temporary(t), before = { DSH_HOME: process.env.DSH_HOME, MEDIA_WORKFLOW_HOME: process.env.MEDIA_WORKFLOW_HOME };
  t.after(() => { for (const [key, value] of Object.entries(before)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  process.env.DSH_HOME = root; delete process.env.MEDIA_WORKFLOW_HOME;
  assert.equal(defaultRoot(), join(root, 'media-workflow'));
  const input = join(root, 'brief.json'); await writeFile(input, JSON.stringify(fixtureBrief()));
  const created = await main({ _: ['create'], brief: input });
  const host = new MediaService({ root: join(root, 'media-workflow') }); t.after(() => host.dispose());
  const list = await host.dispatch('tasks.list'); assert.equal(list.total, 1); assert.equal(list.tasks[0].id, created.state.id);
  assert.equal((await host.dispatch('tasks.get', { id: created.state.id })).state.revision, created.state.revision);
  process.env.MEDIA_WORKFLOW_HOME = join(root, 'explicit'); assert.equal(defaultRoot(), join(root, 'explicit'));
});

test('CLI 与 Host 共用归档状态，归档任务不在默认列表出现', async t => {
  const root = await temporary(t), input = join(root, 'brief.json');
  await writeFile(input, JSON.stringify(fixtureBrief({ title: '待归档的虚构任务' })));
  const created = await main({ _: ['create'], root, brief: input });
  assert.equal((await main({ _: ['list'], root })).total, 1);
  await main({ _: ['archive', created.state.id], root });
  const listed = await main({ _: ['list'], root });
  assert.equal(listed.total, 0); assert.equal(listed.summary.archived, 1);
  const parsed = args(['list', '--group', 'archived', '--root', root]);
  assert.equal(parsed.group, 'archived');
  const archived = await main(parsed);
  assert.equal(archived.total, 1); assert.equal(archived.tasks[0].id, created.state.id);
  const host = new MediaService({ root }); t.after(() => host.dispose());
  assert.equal((await host.dispatch('tasks.list')).total, 0);
  const page = await host.dispatch('tasks.list', { group: 'archived' }); assert.equal(page.tasks[0].id, created.state.id);
  await main({ _: ['unarchive', created.state.id], root });
  assert.equal((await host.dispatch('tasks.list')).total, 1);
  assert.equal((await main({ _: ['list'], root })).total, 1);
});

test('Host 归档操作拒绝运行中的任务，且不影响其他任务', async t => {
  const host = new MediaService({ root: await temporary(t) }); t.after(() => host.dispose());
  const busy = await host.create({ brief: fixtureBrief({ title: '运行中的虚构任务' }) }), idle = await host.create({ brief: fixtureBrief({ title: '空闲的虚构任务' }) });
  await host.store.mutate(busy.state.id, state => { state.status = 'running'; });
  await assert.rejects(host.dispatch('tasks.archive', { id: busy.state.id }), { code: 'task-running' });
  const result = await host.dispatch('tasks.archive', { id: idle.state.id });
  assert.ok(result.state.archivedAt);
  assert.equal((await host.dispatch('tasks.list')).total, 1);
  assert.equal((await host.dispatch('tasks.get', { id: idle.state.id })).state.archivedAt, result.state.archivedAt);
});

test('来源引述需实际存在，产品分镜必须使用真实素材', () => {
  const brief = normalizeBrief(fixtureBrief()), material = { id: 'source-1', text: '只有这段原文', role: 'source' };
  assert.throws(() => validateGeneration('facts', { facts: [{ id: 'f', claim: '不存在', sourceId: 'source-1', quote: '编造引述' }] }, { brief, materials: [material] }), { code: 'unsupported-quote' });
  const product = { ...brief, style: 'product' }; assert.throws(() => validateGeneration('storyboard', { scenes: [{ id: 's', sectionId: 'p', title: 'title', visual: 'placeholder', materialIds: ['source-1'], durationSeconds: 1 }], treatment: 't' }, { brief: product, materials: [material], script: { sections: [{ id: 'p' }] } }), { code: 'real-ui-required' });
});
test('媒体成功不能冒充发布成功；需要平台发布状态、生命周期、证据和链接', () => {
  const wrap = p => ({ result: { results: [{ platform: 'fixture', ...p }] } });
  assert.equal(receiptResult(wrap({ status: 'filled', fields: { media: { status: 'applied' } } }), 'fixture').status, 'filled');
  assert.equal(receiptResult(wrap({ lifecycle: 'published', fields: { publish: { status: 'applied' } } }), 'fixture').status, 'needs_check');
  assert.equal(receiptResult(wrap({ lifecycle: 'published', publicUrl: 'https://example.invalid/post', fields: { publish: { status: 'applied', evidence: { kind: 'public_url' } } } }), 'fixture').status, 'verified');
  assert.equal(receiptResult({ ok: true, result: { status: 'completed' } }, 'fixture').status, 'needs_check');
});
test('配置冲突保留旧值，未知秘密字段不进入配置回读', async t => {
  const store = new TaskStore(await temporary(t)); const initial = await store.settings(); await store.saveSettings({ ...initial.value, provider: 'test', token: 'do-not-store' }, initial.revision);
  await assert.rejects(store.saveSettings(initial.value, initial.revision), { code: 'conflict' }); const saved = await store.settings(); assert.equal(saved.value.provider, 'test'); assert.equal(Object.hasOwn(saved.value, 'token'), false);
});
test('产物预览拒绝路径越界和符号链接逃逸', async t => {
  const root = await temporary(t), store = new TaskStore(root), task = await store.create(fixtureBrief()), outside = join(root, 'outside.txt'); await writeFile(outside, 'private fixture');
  await assert.rejects(store.artifact(task.state.id, '../outside.txt'), { code: 'invalid-path' });
  const uploaded = await store.upload(task.state.id, { name: 'safe.txt', base64: Buffer.from('hello').toString('base64') });
  const escape = join(store.taskDir(task.state.id), 'uploads', 'escape.txt'); await symlink(outside, escape); await assert.rejects(store.artifact(task.state.id, 'uploads/escape.txt'), { code: 'invalid-path' });
  assert.equal((await store.artifact(task.state.id, uploaded.path)).size, 5);
});
test('行级差异保留顺序和重复行', () => {
  assert.deepEqual(lineDiff('a\nb\na', 'a\nc\na').lines.filter(x => x.kind !== 'same').map(x => [x.kind, x.text]), [['add', 'c'], ['remove', 'b']]);
});
test('Host RPC 严格匹配信封；注册失败释放已注册路由', async () => {
  const routes = new Map(), ctx = { connection: { fetch: { register(route) { routes.set(route.path, route); return async () => routes.delete(route.path); } } } };
  const service = { async dispatch(method, p) { assert.equal(method, 'test'); return p; } }; const stop = registerRpc(ctx, service);
  const route = routes.get('/api/dsh-media-workflow'); const response = await route.fetch(new Request('http://local/api/dsh-media-workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', method: 'dsh-media-workflow', rpcId: 'r1', payload: { method: 'test', payload: { n: 1 } } }) }));
  const result = await response.json(); assert.equal(result.result.value.n, 1); await stop(); assert.equal(routes.size, 0);
  let cleaned = false, count = 0; assert.throws(() => registerRpc({ connection: { fetch: { register() { if (++count === 2) throw new Error('fixture registration failure'); return () => { cleaned = true; }; } } } }, service)); await new Promise(r => setTimeout(r, 0)); assert.equal(cleaned, true);
});
