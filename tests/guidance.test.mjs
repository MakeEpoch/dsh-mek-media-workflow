import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { modelJson } from '../packages/media-workflow-skill/lib/generation.mjs';
import { stageGuidance, rendererCapabilities } from '../packages/media-workflow-skill/lib/guidance.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
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
  const payload = { brief: fixtureBrief({ render: { backend: 'ffmpeg' } }), materials: [{ id: 'real-source', text: '原文' }], feedback: [{ text: '用户实际反馈' }], guidance: { arbitraryLayout: true } };
  await modelJson(llm, { provider: 'fixture', model: 'fixture' }, 'storyboard', payload);
  const sent = JSON.parse(captured.messages[0].content[0].text);
  assert.deepEqual(sent.guidance, stageGuidance('storyboard', payload));
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
