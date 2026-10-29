import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { atomic, json } from '../packages/media-workflow-skill/lib/common.mjs';
import { command } from '../packages/media-workflow-skill/lib/process.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), evidence = join(root, 'artifacts/understanding-smoke'); await mkdir(evidence, { recursive: true });
const runner = new WorkflowRunner({ root: join(evidence, 'tasks-store') });
try {
  if (process.argv.includes('--continue')) {
    const receipt = await json(join(evidence, 'task.json')); const task = await runner.store.read(receipt.taskId);
    console.log(JSON.stringify(task, null, 2));
  } else {
    const settings = await runner.store.settings(); await runner.store.saveSettings({ ...settings.value, analysisMode: 'required', mediaPython: process.env.DSH_MEDIA_PYTHON || join(root, 'artifacts/media-runtime/bin/python'), asrModel: process.env.DSH_ASR_MODEL || join(root, 'artifacts/asr-base'), analysisLanguage: 'zh', videoFrames: 2 }, settings.revision);
    await command('ffmpeg', ['-y', '-loop', '1', '-i', join(evidence, 'ocr.png'), '-i', join(evidence, 'speech.mp3'), '-vf', 'scale=1200:450', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', join(evidence, 'source.mp4')]);
    let task = await runner.create({ title: '真实 OCR 与转录回归（虚构资料）', description: '仅验证本地素材处理，不生成真实新闻，不对外发布。', work: { type: 'article' }, style: 'original', review: { mode: 'none' }, sources: [{ id: 'picture', name: '本地生成 OCR 夹具', role: 'image', path: join(evidence, 'ocr.png'), usage: '软件测试' }, { id: 'recording', name: '合成测试录音', role: 'audio', path: join(evidence, 'speech.mp3'), usage: '软件测试' }, { id: 'clip', name: '本地合成测试视频', role: 'video', path: join(evidence, 'source.mp4'), usage: '软件测试' }], publish: { enabled: false } });
    task = await runner.start(task.state.id);
    const request = await json(join(runner.store.taskDir(task.state.id), 'requests/materials.json'));
    if (task.state.error?.code !== 'generation-required' || request.kind !== 'visual-analysis') throw new Error(JSON.stringify(task.state.error || task.state));
    await atomic(join(evidence, 'task.json'), { taskId: task.state.id, root: runner.store.root, request: join(runner.store.taskDir(task.state.id), 'requests/materials.json'), note: '本地 OCR、ASR 和视频帧已真实提取；下一步由当前对话实际查看图片后导入观察。' });
    console.log(JSON.stringify({ taskId: task.state.id, status: task.state.status, requestKind: request.kind, images: request.payload.images, extraction: request.payload.materials.map(m => ({ id: m.id, text: m.text, evidence: m.textEvidence, transcript: m.analysis?.transcript ? { tool: m.analysis.transcript.tool, duration: m.analysis.transcript.duration, segments: m.analysis.transcript.segments.length } : null, frames: m.analysis?.frames, unknowns: m.analysis?.unknowns })) }, null, 2));
  }
} finally { await runner.dispose(); }
