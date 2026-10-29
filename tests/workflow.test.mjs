import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeBrief, needsReview } from '../packages/media-workflow-skill/lib/schema.mjs';
import { atomic, digest, isAlive } from '../packages/media-workflow-skill/lib/common.mjs';
import { command } from '../packages/media-workflow-skill/lib/process.mjs';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { fixtureBrief, protocolFixture, publishingBrief } from './helpers.mjs';

test('完整需求必须声明评审；发布预授权必须有本次原文', () => {
  const brief = fixtureBrief(); delete brief.review; assert.throws(() => normalizeBrief(brief), { code: 'review-required' });
  assert.throws(() => normalizeBrief(publishingBrief('none').publish.confirm = false), /需求必须/);
  const p = publishingBrief('none'); p.publish.confirm = false; assert.throws(() => normalizeBrief(p), { code: 'publish-authorization-required' });
  p.publish.authorization = { explicit: true, statement: '允许将本次约定内容发布到指定虚构目标' }; assert.equal(needsReview(normalizeBrief(p), 'publish'), false);
});
test('标准模式仅四关；需求创建确认复用第一关；发布只提交一次', async t => {
  const f = await protocolFixture(t, publishingBrief());
  let task = await f.runner.start(f.task.state.id, { approveBrief: true });
  assert.equal(task.state.pendingReview.step, 'storyboard'); assert.equal(f.counts.voice, undefined);
  const seen = [];
  while (task.state.pendingReview) { const r = task.state.pendingReview; seen.push(r.step); task = await f.runner.review(task.state.id, { reviewId: r.id, decision: 'approve' }); }
  assert.deepEqual(seen, ['storyboard', 'render', 'publish']); assert.equal(task.state.status, 'complete'); assert.equal(f.executions.length, 1);
  const records = await readdir(join(f.root, 'tasks', task.state.id, 'review')); assert.equal(records.length, 4);
  await f.runner.run(task.state.id); assert.equal(f.executions.length, 1);
});
test('none 无阶段中断；默认仍有一次发布确认', async t => {
  const f = await protocolFixture(t, publishingBrief('none')); let task = await f.runner.start(f.task.state.id);
  assert.equal(task.state.pendingReview.step, 'publish');
  task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.status, 'complete');
  assert.equal((await readdir(join(f.root, 'tasks', task.state.id, 'review'))).length, 1);
});
test('逐步模式审十个业务阶段，内部执行不增加关口', async t => {
  const f = await protocolFixture(t, publishingBrief('steps')); let task = await f.runner.start(f.task.state.id); const stages = [];
  while (task.state.pendingReview) { stages.push(task.state.pendingReview.step); task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); }
  assert.equal(stages.length, 10); assert.equal(new Set(stages).size, 10); assert.equal(task.state.status, 'complete');
});
test('打回只重做本关及依赖，旧产物保留，恢复不重复问已批准的关', async t => {
  const f = await protocolFixture(t); let task = await f.runner.start(f.task.state.id, { approveBrief: true });
  const previous = task.state.steps.find(s => s.key === 'storyboard').artifacts[0];
  task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'changes', feedback: '调整分镜开场' });
  assert.equal(task.state.pendingReview.step, 'storyboard'); assert.equal(f.counts.materials, 1); assert.equal(f.counts.script, 1); assert.equal(f.counts.storyboard, 2);
  assert.equal(task.state.steps.find(s => s.key === 'storyboard').history.length, 1); assert.ok(await readFile(join(f.root, 'tasks', task.state.id, previous.path)));
  task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.pendingReview.step, 'render');
  const snapshot = await f.runner.run(task.state.id); assert.equal(snapshot.state.pendingReview.id, task.state.pendingReview.id);
});
test('同一审批幂等；外部编辑不能沿用旧版批准', async t => {
  const f = await protocolFixture(t); let task = await f.runner.start(f.task.state.id, { approveBrief: true }); const review = task.state.pendingReview;
  task = await f.runner.review(task.state.id, { reviewId: review.id, decision: 'approve' });
  await f.runner.review(task.state.id, { reviewId: review.id, decision: 'approve' }); assert.equal(f.counts.voice, 1);
  const current = task.state.pendingReview, asset = current.artifacts[0]; await atomic(join(f.root, 'tasks', task.state.id, asset.path), 'externally edited');
  await assert.rejects(f.runner.review(task.state.id, { reviewId: current.id, decision: 'approve' }), { code: 'external-edit' });
  assert.equal((await f.runner.store.read(task.state.id)).state.pendingReview.id, current.id);
});
test('暂停等实际子进程退出，恢复从有效阶段继续', async t => {
  let childPid, reached; const started = new Promise(r => { reached = r; });
  const f = await protocolFixture(t, fixtureBrief({ review: { mode: 'none' } }), { adapters: { materials: async ({ signal }) => { await command(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { signal, onProcess: p => { if (p) { childPid = p.pid; reached(); } } }); return { files: [] }; } } });
  const run = f.runner.start(f.task.state.id); await started; assert.equal(isAlive(childPid), true);
  const paused = await f.runner.pause(f.task.state.id); await run; assert.equal(paused.state.status, 'paused'); assert.equal(isAlive(childPid), false);
});
test('不确定发布持久化原请求，重复运行不重发，核验后可继续', async t => {
  const f = await protocolFixture(t, publishingBrief('none')); f.publisher.execute = async item => { f.executions.push(item.input.requestId); return { status: 'needs_check', raw: { fixture: true } }; };
  let task = await f.runner.start(f.task.state.id); task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  assert.equal(task.state.status, 'needs_check'); assert.equal(f.executions.length, 1);
  await f.runner.run(task.state.id); await assert.rejects(f.runner.redo(task.state.id, 'publish'), { code: 'publish-check-required' }); assert.equal(f.executions.length, 1);
  task = await f.runner.verify(task.state.id, task.state.receipts[0].id); assert.equal(task.state.status, 'complete');
});

test('另一个 CLI 控制器暂停时，原执行器也等待实际子进程退出', async t => {
  let childPid, reached; const started = new Promise(r => { reached = r; });
  const f = await protocolFixture(t, fixtureBrief({ review: { mode: 'none' } }), { adapters: { materials: async ({ signal }) => { await command(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { signal, onProcess: p => { if (p) { childPid = p.pid; reached(); } } }); return { files: [] }; } } });
  const execution = f.runner.start(f.task.state.id); await started;
  const second = new WorkflowRunner({ root: f.root }), paused = await second.pause(f.task.state.id); await execution;
  assert.equal(paused.state.status, 'paused'); assert.equal(isAlive(childPid), false);
});

test('归档后不能静默继续执行，恢复后从原进度接着做', async t => {
  const f = await protocolFixture(t, fixtureBrief({ review: { mode: 'none' } })); let task = await f.runner.start(f.task.state.id);
  assert.equal(task.state.status, 'complete');
  const paused = fixtureBrief({ review: { mode: 'none' } });
  const g = await protocolFixture(t, paused); await g.runner.store.mutate(g.task.state.id, state => { state.status = 'paused'; });
  await g.runner.store.archive(g.task.state.id);
  const archived = await g.runner.store.read(g.task.state.id);
  for (const run of [() => g.runner.resume(g.task.state.id), () => g.runner.pause(g.task.state.id), () => g.runner.redo(g.task.state.id, 'script'), () => g.runner.revise(g.task.state.id, { ...archived.brief, description: '归档后新需求' }, { newRequirement: true }), () => g.runner.fulfill(g.task.state.id, 'script', {}, 'digest')]) {
    await assert.rejects(run, { code: 'task-archived' });
  }
  assert.equal((await g.runner.store.read(g.task.state.id)).state.pauseRequested, false);
  await g.runner.store.archive(g.task.state.id, { archived: false });
  task = await g.runner.resume(g.task.state.id);
  assert.equal(task.state.status, 'complete'); assert.equal(g.counts.script, 1);
});

test('归档撤销原生评审卡；恢复后重新呈现待评审事项', async t => {
  const f = await protocolFixture(t, publishingBrief());
  let task = await f.runner.start(f.task.state.id, { approveBrief: true });
  const reviewId = task.state.pendingReview.id, asked = [];
  const service = new MediaService({ root: f.root, ctx: { get(name) { return name === 'userQuestions' ? { ask: question => { asked.push(question); return new Promise(() => {}); } } : undefined; } } });
  await service.syncReview(task.state.id); assert.equal(service.native.has(reviewId), true); assert.equal(asked.length, 1);
  // A pending review blocks archiving, so the guard is verified before any card is withdrawn.
  await assert.rejects(service.setArchived(task.state.id, true), { code: 'review-pending' });
  assert.equal(service.native.has(reviewId), true);
  const pending = (await service.store.read(task.state.id)).state.pendingReview;
  // Another tool may archive a task that still holds a pending review; the host must not keep asking for it.
  await service.store.mutate(task.state.id, state => { state.archivedAt = new Date().toISOString(); });
  await service.syncReview(task.state.id); assert.equal(service.native.size, 0); assert.equal(asked.length, 1);
  await service.setArchived(task.state.id, false);
  assert.equal((await service.store.read(task.state.id)).state.archivedAt, null);
  assert.equal(service.native.has(pending.id), true); assert.equal(asked.length, 2);
  await service.dispose();
});
