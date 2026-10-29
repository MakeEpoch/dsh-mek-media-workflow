import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { temporary, fixtureBrief, generationFixture } from './helpers.mjs';

test('真实 FFmpeg 完成原文到成片，媒体与帧文件可独立回读', { timeout: 120000 }, async t => {
  const root = await temporary(t), runner = new WorkflowRunner({ root, generate: generationFixture });
  const task = await runner.create(fixtureBrief({ review: { mode: 'none' } })); const result = await runner.start(task.state.id);
  assert.equal(result.state.status, 'complete', JSON.stringify(result.state.error));
  const render = result.state.steps.find(s => s.key === 'render'); assert.ok(render.artifacts.some(a => a.name === 'final.mp4' && a.size > 1000)); assert.ok(render.artifacts.some(a => a.name === 'cover.png'));
  const info = await runner.data(result.state.id, result, 'render', 'media-info.json'); assert.ok(info.info.streams.some(s => s.codec_type === 'video')); assert.ok(Number(info.info.format.duration) > 1);
  assert.ok(info.checks.some(c => c.status === 'unknown')); assert.equal(result.state.steps.find(s => s.key === 'publish').status, 'skipped');
});
