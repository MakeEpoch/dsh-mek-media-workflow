import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WorkflowRunner } from '../embedded-skill/lib/runner.mjs';
import { modelJson } from '../embedded-skill/lib/generation.mjs';
import { stageGuidance, rendererCapabilities } from '../embedded-skill/lib/guidance.mjs';
import { MediaService } from '../host/service.js';
import { temporary, fixtureBrief, generationFixture } from './helpers.mjs';

test('CLI 的连续阶段请求附带制作指导、原始资料和当前渲染能力，导入协议不变', async t => {
  const root = await temporary(t), runner = new WorkflowRunner({ root });
  t.after(() => runner.dispose());
  let task = await runner.create(fixtureBrief({ review: { mode: 'none' }, render: { backend: 'huashu' } }));
  task = await runner.start(task.state.id);
  for (const [step, kind] of [['materials', 'facts'], ['script', 'script'], ['storyboard', 'storyboard']]) {
    assert.equal(task.state.activeStep, step); assert.equal(task.state.error.code, 'generation-required');
    const request = JSON.parse(await readFile(join(root, 'tasks', task.state.id, 'requests', `${step}.json`), 'utf8'));
    assert.deepEqual(request.guidance, stageGuidance(kind, request.payload));
    assert.equal(request.payload.materials[0].text, task.brief.sources[0].text);
    if (kind === 'storyboard') {
      assert.equal(request.guidance.renderer.arbitraryLayout, false);
      assert.equal(request.guidance.renderer.maxVisualsPerScene, 1);
      assert.deepEqual(request.guidance.renderer, rendererCapabilities('huashu'));
      break; // No live TTS, motion tool, or user approval is involved in this test.
    }
    task = await runner.fulfill(task.state.id, step, await generationFixture(kind, request.payload), request.inputDigest);
  }
});

test('DSH 模型实际请求携带相同阶段指导，来源和反馈不能替换可信指导', async () => {
  let captured;
  const llm = { async prepareCall() { return { config: {}, async *stream(input) {
    captured = input;
    yield { type: 'block-end', index: 0, block: { type: 'text', text: '{}' } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  } }; } };
  const writing = { style: null, rules: [{ id: 'rule-1', name: '结论优先', rule: '首段给结论' }] };
  const payload = { brief: fixtureBrief({ render: { backend: 'ffmpeg' }, writing }), materials: [{ id: 'real-source', text: '原文' }], feedback: [{ text: '用户实际反馈' }], guidance: { arbitraryLayout: true } };
  await modelJson(llm, { provider: 'fixture', model: 'fixture' }, 'storyboard', payload);
  const sent = JSON.parse(captured.messages[0].content[0].text);
  assert.deepEqual(sent.guidance, stageGuidance('storyboard', payload));
  assert.deepEqual(sent.guidance.writing.rules, writing.rules);
  assert.match(sent.guidance.writing.priority, /不得改变发布范围/);
  assert.equal(sent.brief.writing, undefined);
  assert.deepEqual(sent.materials, payload.materials); assert.deepEqual(sent.feedback, payload.feedback);
  assert.deepEqual(captured.tools, []);
});

test('宿主存在 LLM 服务但任务选择当前对话时，保留生成请求且不尝试调用空模型', async t => {
  let calls = 0;
  const llm = { async prepareCall() { calls++; throw new Error('不应调用模型'); } };
  const service = new MediaService({ root: await temporary(t), ctx: { get: name => name === 'llm' ? llm : undefined } });
  t.after(() => service.dispose());
  const created = await service.create({ brief: fixtureBrief({ review: { mode: 'none' } }) });
  await service.runner.start(created.state.id);
  const result = await service.runner.run(created.state.id);
  assert.equal(result.state.error.code, 'generation-required'); assert.equal(calls, 0);
  const request = await service.request({ id: created.state.id });
  assert.equal(request.guidance.stage, 'facts'); assert.equal(request.taskId, created.state.id);
  assert.equal(result.state.pendingReview, null);
});

test('一句话整理采用 Agent 提取的创作信息，保留显式类型、风格、素材和发布边界', async t => {
  const result = {
    title: '示例短片', audience: '初学者', requirements: '先解释核心步骤', creative: { expression: 'tutorial', visualStyle: 'motion', tone: '轻松' },
    work: { type: 'article' }, output: { width: 1920, height: 1080, durationSeconds: 45 },
    sources: [{ url: 'https://example.invalid/unsupported' }], publish: { enabled: true, confirm: false }, review: { mode: 'none' },
  };
  const llm = { async prepareCall() { return { config: {}, async *stream() {
    yield { type: 'block-end', index: 0, block: { type: 'text', text: JSON.stringify(result) } };
    yield { type: 'finish', reason: { kind: 'stop' } };
  } }; } };
  const host = new MediaService({ root: await temporary(t), ctx: { get: name => name === 'llm' ? llm : undefined } });
  t.after(() => host.dispose());
  const { value, revision } = await host.store.settings();
  await host.store.saveSettings({ ...value, provider: 'fixture', model: 'fixture' }, revision);
  const text = '给初学者做一条横版视频，45秒，语气轻松。';
  const current = fixtureBrief({ description: text, work: { type: 'video' }, creative: { visualStyle: 'editorial' } });
  const brief = await host.dispatch('brief.parse', { current, text, quick: true, autoTitle: true, autoOutput: true });
  assert.equal(brief.title, result.title);
  assert.equal(brief.description, text);
  assert.equal(brief.audience, '初学者');
  assert.equal(brief.creative.tone, '轻松');
  assert.equal(brief.creative.visualStyle, 'editorial');
  assert.equal(brief.work.type, 'video');
  assert.deepEqual(brief.output, { width: 1920, height: 1080, durationSeconds: 45, fps: 24 });
  assert.deepEqual(brief.sources.map(s => s.id), ['source-1']);
  assert.equal(brief.review.mode, 'gates');
  assert.equal(brief.publish.enabled, false);
});
