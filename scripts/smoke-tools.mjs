import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { atomic } from '../packages/media-workflow-skill/lib/common.mjs';
import { fixtureBrief, generationFixture } from '../tests/helpers.mjs';

const backend = process.argv.includes('--motion') ? 'huashu' : 'ffmpeg';
const root = resolve(`artifacts/smoke-${backend}-${Date.now()}`); await mkdir(root, { recursive: true });
const editTarget = process.argv.includes('--voice-edit') ? 'voice' : process.argv.includes('--review-edit') ? 'render' : null;
const brief = fixtureBrief({ review: { mode: editTarget === 'voice' ? 'steps' : editTarget ? 'gates' : 'none' }, output: { width: 640, height: 360, fps: 24, durationSeconds: 4 }, voice: process.argv.includes('--tts') ? { mode: 'tts', requiredAlignment: 'word' } : { mode: 'none' }, render: { backend, codec: 'libx264' } });
const generate = async (kind, payload) => { if (kind === 'stage-edit') return payload.step === 'voice' ? { step: 'voice', note: '按本关意见将实际语速放慢10%', voice: { rate: '-10%' } } : { step: payload.step, note: '按本关意见放大字幕至24', scenes: [], presentation: { captionFontSize: 24 } }; const data = await generationFixture(kind, payload); if (kind === 'storyboard') data.scenes[0].durationSeconds = 4; return data; };
const runner = new WorkflowRunner({ root, generate });
try {
  const task = await runner.create(brief); let result = await runner.start(task.state.id, { approveBrief: true }), edited = false;
  while (result.state.pendingReview) { const review = result.state.pendingReview, change = review.step === editTarget && !edited; result = await runner.review(task.state.id, { reviewId: review.id, decision: change ? 'changes' : 'approve', ...(change ? { feedback: editTarget === 'voice' ? '放慢语速10%' : '字幕放大到24' } : {}) }); if (change) edited = true; }
  const record = { root, taskId: task.state.id, status: result.state.status, error: result.state.error, checks: result.state.steps.find(s => s.key === 'render').checks, backend, editedStep: editTarget, tts: brief.voice.mode === 'tts', render: result.state.steps.find(s => s.key === 'render').artifacts };
  await atomic(join(root, 'result.json'), record); console.log(JSON.stringify(record, null, 2)); if (result.state.status !== 'complete') process.exitCode = 1;
} finally { await runner.dispose(); }
