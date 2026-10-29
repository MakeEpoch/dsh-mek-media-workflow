import { validateGeneration } from '../packages/media-workflow-skill/lib/generation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { cp, mkdir } from 'node:fs/promises';
import { temporary, protocolFixture, publishingBrief, fixtureBrief, generationFixture } from './helpers.mjs';
import { receiptResult } from '../packages/media-workflow-skill/lib/publishing.mjs';
import { command } from '../packages/media-workflow-skill/lib/process.mjs';
import { synthesizeVoice, resolveComposition, renderComposition, probe } from '../packages/media-workflow-skill/lib/media.mjs';
import { validateSettings, normalizeBrief } from '../packages/media-workflow-skill/lib/schema.mjs';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';

test('原始 PostFaro 嵌套回执保留状态；单纯 completed 不确认发布', () => {
  const response = { ok: true, result: { requestId: 'fixture', status: 'completed', result: { platforms: [{ platform: 'fixture', outcome: { lifecycle: { status: 'published' }, publishEvidence: 'public_url', publicUrl: 'https://example.invalid/real-receipt', fields: { publish: { status: 'applied' } } } }] } } };
  assert.equal(receiptResult(response, 'fixture').status, 'verified');
  delete response.result.result.platforms[0].outcome.fields.publish;
  assert.equal(receiptResult(response, 'fixture').status, 'needs_check');
});

test('不确定目标必须先核查；显式重试只补未成功目标并保留原请求', async t => {
  const brief = publishingBrief('none'); brief.publish.targets.push({ id: 'target-b', platform: 'fixture-b', account: '第二个虚构账号' });
  const f = await protocolFixture(t, brief); let first = true;
  f.publisher.execute = async item => { f.executions.push(item.input.requestId); if (first) { first = false; return { status: 'needs_check', raw: { fixture: true } }; } return { status: 'verified', raw: { fixture: true }, url: 'https://example.invalid/fixture' }; };
  let task = await f.runner.start(f.task.state.id); task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  const original = task.state.receipts[0]; await assert.rejects(f.runner.retryTarget(task.state.id, original.id), { code: 'publish-check-required' });
  await f.runner.recordVerification(task.state.id, original.id, { outcome: 'not_published', note: '虚构人工核查夹具，明确不存在此作品' });
  task = await f.runner.retryTarget(task.state.id, original.id);
  assert.equal(task.state.status, 'complete'); assert.equal(f.executions.length, 3); assert.equal(new Set(f.executions).size, 3);
  assert.equal(task.state.receipts[0].toolStatus, 'needs_check'); assert.equal(task.state.receipts[0].status, 'not_published_manual');
  assert.equal(task.state.receipts[1].retryOf, original.id); assert.equal(task.state.receipts[2].targetId, 'target-b');
  await assert.rejects(f.runner.verify(task.state.id, original.id), { code: 'stale-receipt' });
  await f.runner.run(task.state.id); assert.equal(f.executions.length, 3);
});

test('重新提交更严格评审时复用产物，仍逐一评审当前需求版本', async t => {
  const f = await protocolFixture(t, fixtureBrief({ review: { mode: 'none' } })); let task = await f.runner.start(f.task.state.id); assert.equal(task.state.status, 'complete');
  task = await f.runner.revise(task.state.id, { ...task.brief, review: { mode: 'steps' } }, { newRequirement: true });
  const reviewed = [];
  while (task.state.pendingReview) { const r = task.state.pendingReview; reviewed.push(r.step); task = await f.runner.review(task.state.id, { reviewId: r.id, decision: 'approve' }); }
  assert.deepEqual(reviewed, ['materials', 'script', 'storyboard', 'voice', 'composition', 'qa', 'render', 'package']);
  assert.equal(f.counts.materials, 1); assert.equal(f.counts.render, 1); assert.equal(task.state.status, 'complete');
});

test('真实录音对齐导入核查文稿、音频时长和边界，保留工具出处', async t => {
  const root = await temporary(t), settings = validateSettings(), audio = join(root, 'fixture.wav');
  await command(settings.ffmpeg, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', audio]);
  const brief = normalizeBrief(fixtureBrief({ voice: { mode: 'provided', requiredAlignment: 'word' } }));
  const script = { sections: [{ id: 'a', text: '甲' }, { id: 'b', text: '乙' }] }, materials = [{ role: 'audio', absolutePath: audio }], alignment = { evidence: { tool: 'synthetic-test-fixture (not live forced alignment)', source: '本地正弦音，仅核查导入协议' }, timeline: { alignmentMethod: 'forced-alignment', duration: 1, segments: [{ sectionId: 'a', text: '甲', start: 0, end: .5 }, { sectionId: 'b', text: '乙', start: .5, end: 1 }], words: [{ sectionId: 'a', text: '甲', start: .1, end: .4 }, { sectionId: 'b', text: '乙', start: .6, end: .9 }] } };
  const files = await synthesizeVoice(brief, script, {}, materials, join(root, 'valid'), settings, undefined, undefined, alignment); assert.ok(files.includes('alignment-evidence.json'));
  alignment.timeline.segments[1].text = '变更后的文稿';
  await assert.rejects(synthesizeVoice(brief, script, {}, materials, join(root, 'invalid'), settings, undefined, undefined, alignment), { code: 'invalid-timeline' });
});

test('可编辑工程搬迁后相对引用仍能实际渲染', { timeout: 120000 }, async t => {
  const root = await temporary(t), runner = new WorkflowRunner({ root, generate: generationFixture });
  let task = await runner.create(fixtureBrief({ review: { mode: 'none' } })); task = await runner.start(task.state.id); assert.equal(task.state.status, 'complete');
  const moved = join(root, 'moved'); await cp(runner.store.taskDir(task.state.id), moved, { recursive: true });
  const item = task.state.steps.find(s => s.key === 'composition').artifacts.find(a => a.name === 'composition.json');
  const project = await runner.data(task.state.id, task, 'composition', 'composition.json'); assert.equal(project.captions.startsWith('/'), false);
  const resolved = resolveComposition(project, join(moved, item.path, '..')); assert.ok(resolved.captions.startsWith(moved));
  await renderComposition(resolved, join(moved, 'rerender.mp4'), task.state.execution); assert.equal((await probe(join(moved, 'rerender.mp4'), task.state.execution)).streams[0].width, 320);
});

test('宿主恢复不重放中断的发布；原生评审失败时保留工作台审批', async t => {
  const f = await protocolFixture(t, publishingBrief()); let task = await f.runner.start(f.task.state.id, { approveBrief: true });
  const reviewId = task.state.pendingReview.id;
  const service = new MediaService({ root: f.root, ctx: { get(name) { return name === 'userQuestions' ? { ask: async () => { throw new Error('fixture missing answerer'); } } : undefined; } } });
  await service.syncReview(task.state.id); await new Promise(r => setTimeout(r, 0)); assert.equal((await service.store.read(task.state.id)).state.pendingReview.id, reviewId);
  await service.store.mutate(task.state.id, state => { state.pendingReview = null; state.status = 'publishing'; state.receipts.push({ id: 'fixture-interrupted', runRevision: state.runRevision, status: 'submitted' }); });
  await service.recover(); task = await service.store.read(task.state.id); assert.equal(task.state.status, 'needs_check'); assert.equal(task.state.receipts[0].id, 'fixture-interrupted'); assert.equal(f.executions.length, 0);
  await service.dispose();
});


test('已经发布的版本不能重做后冒用旧回执，新需求另行确认发布', async t => {
  const f = await protocolFixture(t, publishingBrief('none')); let task = await f.runner.start(f.task.state.id);
  task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.status, 'complete');
  await assert.rejects(f.runner.redo(task.state.id, 'render'), { code: 'new-requirement-required' });
  task = await f.runner.revise(task.state.id, { ...task.brief, description: '新版虚构需求，重新制作内容' }, { newRequirement: true });
  assert.equal(task.state.pendingReview.step, 'publish'); assert.equal(f.executions.length, 1);
  task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  assert.equal(task.state.status, 'complete'); assert.equal(f.executions.length, 2); assert.equal(new Set(f.executions).size, 2); assert.equal(task.state.receipts[1].runRevision, 2);
});

test('只改编码参数时沿用未变化分镜的批准，不追加无关评审', async t => {
  const f = await protocolFixture(t); let task = await f.runner.start(f.task.state.id, { approveBrief: true });
  while (task.state.pendingReview) task = await f.runner.review(task.state.id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  task = await f.runner.revise(task.state.id, { ...task.brief, render: { ...task.brief.render, codec: 'h264_nvenc' } }, { newRequirement: true });
  assert.equal(task.state.pendingReview.step, 'render'); assert.equal(f.counts.storyboard, 1); assert.equal(f.counts.voice, 1); assert.equal(f.counts.render, 2);
});

test('仅制作改为发布时重新生成平台包装，不沿用 skipped 发布阶段', async t => {
  const brief = publishingBrief('none'); brief.publish.enabled = false;
  const f = await protocolFixture(t, brief); let task = await f.runner.start(f.task.state.id); assert.equal(task.state.status, 'complete');
  task = await f.runner.revise(task.state.id, { ...task.brief, publish: { ...task.brief.publish, enabled: true } }, { newRequirement: true });
  assert.equal(f.counts.package, 2); assert.equal(f.counts.render, 1); assert.equal(task.state.pendingReview.step, 'publish'); assert.equal(f.executions.length, 0);
});

test('原生评审使用同一版本审批，只登记一次并按用户选项继续', async t => {
  const f = await protocolFixture(t); let task = await f.runner.start(f.task.state.id, { approveBrief: true }); const id = task.state.id, reviewId = task.state.pendingReview.id;
  let calls = 0, request, answer;
  const service = new MediaService({ root: f.root, ctx: { get(name) { return name === 'userQuestions' ? { ask(spec) { calls++; request = spec; return new Promise(resolve => { answer = resolve; }); } } : undefined; } } });
  service.runner = f.runner; await service.syncReview(id); await service.syncReview(id); assert.equal(calls, 1);
  assert.equal(request.questions[0].id, reviewId); assert.equal(request.questions[0].intent.kind, 'plan-review');
  answer({ answers: [{ id: reviewId, selected: ['通过'] }] });
  for (let n = 0; n < 200; n++) { task = await service.store.read(id); if (task.state.pendingReview?.step === 'render') break; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.equal(task.state.pendingReview.step, 'render'); assert.equal(f.counts.voice, 1);
  await service.decide({ id, reviewId, decision: 'approve' }); assert.equal(f.counts.voice, 1); await service.dispose();
});

test('成片修改实际改变字幕画面，保留上游，并拒绝旧修改请求', { timeout: 120000 }, async t => {
  const root = await temporary(t); let calls = 0;
  const runner = new WorkflowRunner({ root, generate: async (kind, payload) => kind === 'stage-edit' ? (++calls, { step: 'render', note: '根据本关意见调大实际字幕字号', scenes: [], presentation: { captionFontSize: 22 } }) : generationFixture(kind, payload) });
  let task = await runner.create(fixtureBrief()); const id = task.state.id; task = await runner.start(id, { approveBrief: true });
  task = await runner.review(id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); const first = task.state.steps.find(s => s.key === 'render').artifacts.find(a => a.name === 'final.mp4').sha256;
  task = await runner.review(id, { reviewId: task.state.pendingReview.id, decision: 'changes', feedback: '字幕调大一些' });
  assert.equal(task.state.pendingReview.step, 'render'); assert.equal(task.state.steps.find(s => s.key === 'render').revision, 2); assert.equal(task.state.steps.find(s => s.key === 'voice').revision, 1); assert.equal(task.state.steps.find(s => s.key === 'composition').revision, 1);
  assert.notEqual(task.state.steps.find(s => s.key === 'render').artifacts.find(a => a.name === 'final.mp4').sha256, first);
  assert.equal((await runner.data(id, task, 'render', 'render-project.json')).presentation.captionFontSize, 22);
  const { json } = await import('../packages/media-workflow-skill/lib/common.mjs'); const old = await json(join(runner.store.taskDir(id), 'requests/render.json'));
  runner.generate = undefined; task = await runner.review(id, { reviewId: task.state.pendingReview.id, decision: 'changes', feedback: '再加大一点' }); assert.equal(task.state.status, 'blocked');
  const current = await json(join(runner.store.taskDir(id), 'requests/render.json')); assert.notEqual(current.inputDigest, old.inputDigest);
  await assert.rejects(runner.fulfill(id, 'render', { step: 'render', note: '旧请求', scenes: [], presentation: { captionFontSize: 24 } }, old.inputDigest), { code: 'stale-input' });
  task = await runner.fulfill(id, 'render', { step: 'render', note: '根据新增意见调至24', scenes: [], presentation: { captionFontSize: 24 } }, current.inputDigest);
  assert.equal(task.state.pendingReview.step, 'render'); assert.equal((await runner.data(id, task, 'render', 'render-project.json')).presentation.captionFontSize, 24); assert.equal(calls, 1);
});

test('不支持的修改明确保留所需输入，画面修改不能注入路径或脚本', () => {
  const brief = normalizeBrief(fixtureBrief());
  assert.throws(() => { const input = { step: 'render', note: '编造界面', scenes: [{ id: 's', path: '/private' }], presentation: {} }; return validateEditFixture(input, brief); }, { code: 'invalid-generation' });
});
function validateEditFixture(value, brief) { return validateGeneration('stage-edit', value, { step: 'render', brief, materials: [], storyboard: { scenes: [{ id: 's', title: '真实标题', materialIds: [], motion: 'hold' }] } }); }

test('发布关修改包装实际应用，保留已通过的成片且只提交一次', { timeout: 120000 }, async t => {
  const root = await temporary(t), prepared = [], executed = [], { atomic } = await import('../packages/media-workflow-skill/lib/common.mjs');
  const publisher = { preflight: async () => ({}), async prepare(args) { prepared.push(args.packaging); const target = args.brief.publish.targets[0], input = { requestId: `fixture-${args.taskId}-${args.runRevision}`, bridgeId: args.brief.publish.bridgeId }, file = join(args.dir, 'fixture.task.json'); await atomic(file, input); return { prepared: [{ target, input, file }], preflight: {} }; }, async execute(item) { executed.push(item.input.requestId); return { status: 'verified', raw: { fixture: true }, url: 'https://example.invalid/fixture' }; } };
  const runner = new WorkflowRunner({ root, adapters: { publisher }, generate: async (kind, payload) => { const value = await generationFixture(kind, payload); if (kind === 'package' && payload.existingPackage) value.targets[0].title = '本关修改后的标题'; return value; } });
  let task = await runner.create(publishingBrief()); const id = task.state.id; task = await runner.start(id, { approveBrief: true });
  while (task.state.pendingReview.step !== 'publish') task = await runner.review(id, { reviewId: task.state.pendingReview.id, decision: 'approve' });
  task = await runner.review(id, { reviewId: task.state.pendingReview.id, decision: 'changes', feedback: '只修改发布标题' });
  assert.equal(task.state.pendingReview.step, 'publish'); assert.equal(prepared[1].targets[0].title, '本关修改后的标题'); assert.equal(task.state.steps.find(s => s.key === 'render').revision, 1); assert.equal(executed.length, 0);
  task = await runner.review(id, { reviewId: task.state.pendingReview.id, decision: 'approve' }); assert.equal(task.state.status, 'complete'); assert.equal(executed.length, 1);
});

test('需求整理不接受模型新编的文件、账号或免评审声明', async t => {
  const root = await temporary(t); let result;
  const llm = { async prepareCall() { return { config: {}, async *stream() { yield { type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify(result) } }; yield { type: 'finish', reason: { kind: 'stop' } }; } }; } };
  const service = new MediaService({ root, ctx: { get(name) { return name === 'llm' ? llm : undefined; } } });
  const settings = await service.store.settings(); await service.store.saveSettings({ ...settings.value, provider: 'fixture', model: 'fixture' }, settings.revision);
  const current = normalizeBrief(fixtureBrief()); result = { sources: [{ id: 'invented', role: 'source', path: '/private/invented.txt' }] };
  await assert.rejects(service.parseBrief({ current, text: '根据已有资料整理需求' }), { code: 'unsupported-source' });
  result = { review: { mode: 'none' } }; await assert.rejects(service.parseBrief({ current, text: '根据已有资料整理需求' }), { code: 'unsupported-review' });
  result = { output: { width: 640, height: 360 } }; const parsed = await service.parseBrief({ current, text: '改为640×360' }); assert.equal(parsed.output.width, 640); assert.equal(parsed.voice.mode, current.voice.mode); assert.equal(parsed.sources[0].text, current.sources[0].text);
  await service.dispose();
});
