import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBrief, briefHash } from '../packages/media-workflow-skill/lib/schema.mjs';
import { contentCapabilities } from '../packages/media-workflow-skill/lib/content.mjs';
import { stageGuidance } from '../packages/media-workflow-skill/lib/guidance.mjs';
import { main } from '../packages/media-workflow-skill/scripts/workflow.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { temporary, fixtureBrief, protocolFixture } from './helpers.mjs';

test('旧需求不添加默认风格字段，自定义表达与视觉方向能规范化并进入阶段指导', () => {
  const old = normalizeBrief(fixtureBrief());
  assert.equal(Object.hasOwn(old, 'creative'), false);
  assert.equal(briefHash(old), briefHash(normalizeBrief({ ...old, creative: undefined })));
  const creative = { expression: '用户的自定义叙事', visualStyle: '用户的自定义画风', tone: '平实', reference: '用户给的参考方向' };
  const next = normalizeBrief({ ...old, creative });
  assert.deepEqual(next.creative, creative);
  assert.equal(stageGuidance('script', { brief: next }).creative.tone, '平实');
  assert.equal(stageGuidance('storyboard', { brief: next }).creative.visualStyle, creative.visualStyle);
  assert.notEqual(briefHash(next), briefHash(old));
  assert.throws(() => normalizeBrief({ ...old, creative: '错误结构' }), { code: 'invalid-brief' });
});

test('修改创作方向更新脚本及后续，保留素材和旧产物历史', async t => {
  const f = await protocolFixture(t, fixtureBrief({ review: { mode: 'none' } }));
  let task = await f.runner.start(f.task.state.id);
  assert.equal(task.state.status, 'complete');
  const materialRevision = task.state.steps.find(s => s.key === 'materials').revision;
  const scriptRevision = task.state.steps.find(s => s.key === 'script').revision;
  task = await f.runner.revise(task.state.id, { ...task.brief, creative: { expression: 'documentary', visualStyle: 'natural', tone: '温暖' } }, { newRequirement: true });
  assert.equal(task.state.status, 'complete');
  assert.equal(task.state.steps.find(s => s.key === 'materials').revision, materialRevision);
  const script = task.state.steps.find(s => s.key === 'script');
  assert.equal(script.revision, scriptRevision + 1); assert.equal(script.history.length, 1);
});

test('CLI 与 Host 返回一致能力目录，明确区分 skill 与原生流程且不会被调用方修改', async t => {
  const host = new MediaService({ root: await temporary(t) }); t.after(() => host.dispose());
  const cli = await main({ _: ['capabilities'], root: host.store.root });
  assert.deepEqual(await host.dispatch('content.capabilities'), cli);
  assert.equal(cli.types.find(x => x.id === 'video').nativeWorkflow, true);
  for (const id of ['article', 'image-post']) {
    const type = cli.types.find(x => x.id === id);
    assert.equal(type.skillWorkflow, true); assert.equal(type.nativeWorkflow, true);
  }
  cli.types[0].nativeWorkflow = false;
  assert.equal(contentCapabilities().types[0].nativeWorkflow, true);
  assert.equal((await host.store.list()).total, 0);
});
