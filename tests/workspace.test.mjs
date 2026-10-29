import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { temporary, fixtureBrief } from './helpers.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { TaskStore } from '../packages/media-workflow-skill/lib/store.mjs';
import { skillProvider } from '../packages/dsh-media-workflow/dsh/index.js';

test('工作目录引导在宿主启动和 CLI 创建时补建，并保留用户自定义内容与小写文件', async t => {
  const base = await temporary(t), host = new MediaService({ root: join(base, 'host') }); t.after(() => host.dispose());
  await host.recover();
  const guidance = await readFile(join(host.store.root, 'AGENTS.md'), 'utf8');
  assert.ok(guidance.includes('state.json')); assert.ok(guidance.includes('import-artifacts'));
  assert.deepEqual(await readdir(host.store.root), ['AGENTS.md']);
  await writeFile(join(host.store.root, 'AGENTS.md'), '# 用户的目录约定\n');
  await host.recover();
  assert.equal(await readFile(join(host.store.root, 'AGENTS.md'), 'utf8'), '# 用户的目录约定\n');
  const store = new TaskStore(join(base, 'cli')); await store.create(fixtureBrief());
  assert.equal(await readFile(join(store.root, 'AGENTS.md'), 'utf8'), guidance);
  const lowercase = join(base, 'custom'); await mkdir(lowercase); await writeFile(join(lowercase, 'agents.md'), '# 自定义小写约定\n');
  await new TaskStore(lowercase).prepareWorkspace();
  assert.deepEqual(await readdir(lowercase), ['agents.md']);
  assert.equal(await readFile(join(lowercase, 'agents.md'), 'utf8'), '# 自定义小写约定\n');
});

test('工作目录切换保留原任务，只读取目标目录，技能同步当前实际目录', async t => {
  const base = await temporary(t), oldRoot = join(base, 'old'), newRoot = join(base, '内容创作'), locationFile = join(base, 'host/location.json');
  const host = new MediaService({ root: oldRoot, locationFile }); t.after(() => host.dispose());
  const old = await host.create({ brief: fixtureBrief({ title: '旧目录任务' }) });
  const oldPath = join(oldRoot, 'tasks', old.state.id, 'state.json'), oldBytes = await readFile(oldPath);
  const target = new TaskStore(newRoot), next = await target.create(fixtureBrief({ title: '目标目录已有任务' }));
  await target.saveSettings({ defaultVoice: 'zh-CN-YunxiNeural' }, 0);
  const provider = skillProvider({ root: () => host.store.root }), candidate = (await provider.list())[0];
  assert.ok((await provider.get(candidate)).content.includes(oldRoot));
  const result = await host.dispatch('storage.set', { root: newRoot, expectedRoot: oldRoot }); assert.equal(result.changed, true);
  assert.ok((await readFile(join(newRoot, 'AGENTS.md'), 'utf8')).includes('内容创作工作目录'));
  assert.deepEqual(await readFile(oldPath), oldBytes);
  assert.equal((await host.dispatch('tasks.list')).tasks[0].id, next.state.id);
  assert.equal((await host.settings()).value.defaultVoice, 'zh-CN-YunxiNeural');
  await assert.rejects(host.dispatch('settings.save', { storageRoot: oldRoot, value: { defaultVoice: 'old-window' }, revision: 1 }), { code: 'workspace-changed' });
  assert.equal((await host.settings()).value.defaultVoice, 'zh-CN-YunxiNeural');
  assert.equal(JSON.parse(await readFile(locationFile)).root, newRoot);
  const skill = await provider.get(candidate); assert.ok(skill.content.includes(newRoot)); assert.ok(!skill.content.includes(oldRoot));
  await assert.rejects(host.dispatch('storage.set', { root: oldRoot, expectedRoot: oldRoot }), { code: 'conflict' });
  await assert.rejects(host.dispatch('storage.set', { root: 'relative/path', expectedRoot: newRoot }), { code: 'invalid-path' });
});

test('运行或发布中的任务不允许切换工作目录', async t => {
  const base = await temporary(t), host = new MediaService({ root: join(base, 'old') }); t.after(() => host.dispose());
  const task = await host.create({ brief: fixtureBrief() });
  for (const status of ['running', 'publishing', 'pausing']) {
    await host.store.mutate(task.state.id, state => { state.status = status; });
    await assert.rejects(host.dispatch('storage.set', { root: join(base, 'new'), expectedRoot: host.store.root }), { code: 'busy' });
  }
  assert.equal(host.store.root, join(base, 'old'));
});

test('任务分组统计覆盖完整会话范围，筛选和分页不改变总数', async t => {
  const store = new TaskStore(await temporary(t));
  for (const [status, sessionId] of [['draft', 'current'], ['running', 'current'], ['needs_review', 'current'], ['complete', 'current'], ['failed', 'other']]) {
    const task = await store.create(fixtureBrief({ title: status }), { sessionId }); await store.mutate(task.state.id, state => { state.status = status; });
  }
  const page = await store.list({ sessionId: 'current', group: 'attention', limit: 1 });
  assert.equal(page.total, 1); assert.equal(page.tasks[0].status, 'needs_review');
  assert.deepEqual(page.summary, { all: 4, attention: 1, active: 1, done: 1, draft: 1, archived: 0 });
});

test('归档任务离开工作分组，只在归档分组可见且可恢复', async t => {
  const store = new TaskStore(await temporary(t));
  const keep = await store.create(fixtureBrief({ title: '保留' }), { sessionId: 'current' });
  const done = await store.create(fixtureBrief({ title: '已完成的归档候选' }), { sessionId: 'current' });
  await store.mutate(done.state.id, state => { state.status = 'complete'; });
  await store.archive(done.state.id);
  const working = await store.list({ sessionId: 'current' });
  assert.equal(working.total, 1); assert.equal(working.tasks[0].id, keep.state.id);
  assert.equal(working.summary.all, 1); assert.equal(working.summary.done, 0); assert.equal(working.summary.archived, 1);
  const archived = await store.list({ sessionId: 'current', group: 'archived' });
  assert.equal(archived.total, 1); assert.equal(archived.tasks[0].id, done.state.id); assert.ok(archived.tasks[0].archivedAt);
  assert.equal((await store.list({ sessionId: 'current', group: 'done' })).total, 0);
  // Archived tasks keep their data and can be restored without losing status.
  await store.archive(done.state.id, { archived: false });
  const restored = await store.read(done.state.id);
  assert.equal(restored.state.archivedAt, null); assert.equal(restored.state.status, 'complete');
  assert.equal((await store.list({ sessionId: 'current', group: 'done' })).total, 1);
  assert.equal((await store.list({ sessionId: 'current', group: 'archived' })).total, 0);
});

test('执行中、待评审或发布未核验的任务不能归档', async t => {
  const store = new TaskStore(await temporary(t));
  const task = await store.create(fixtureBrief());
  for (const status of ['running', 'publishing', 'pausing']) {
    await store.mutate(task.state.id, state => { state.status = status; });
    await assert.rejects(store.archive(task.state.id), { code: 'task-running' });
  }
  await store.mutate(task.state.id, state => { state.status = 'needs_review'; state.pendingReview = { id: 'fixture-review', step: 'brief' }; });
  await assert.rejects(store.archive(task.state.id), { code: 'review-pending' });
  await store.mutate(task.state.id, state => { state.pendingReview = null; state.status = 'needs_check'; state.receipts.push({ id: 'fixture-receipt', runRevision: state.runRevision, status: 'submitted' }); });
  await assert.rejects(store.archive(task.state.id), { code: 'publish-check-required' });
  await store.mutate(task.state.id, state => { state.receipts[0].status = 'verified'; state.status = 'complete'; });
  const archived = await store.archive(task.state.id);
  assert.ok(archived.state.archivedAt);
});
