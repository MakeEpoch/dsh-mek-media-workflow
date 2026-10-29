#!/usr/bin/env node
import { createReadStream } from 'node:fs';
import { readFile, cp, mkdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { WorkflowRunner, doctor, contentCapabilities } from '../lib/index.mjs';
import { json, atomic, fail, defaultRoot, lock } from '../lib/common.mjs';
import { args, cli } from './args.mjs';

export async function main(a = args()) {
  const operation = a._[0] || 'help', id = a.task || a._[1], runner = new WorkflowRunner({ root: a.root ? resolve(a.root) : defaultRoot() });
  if (operation === 'capabilities') return contentCapabilities();
  const read = path => path === '-' ? new Promise((resolve, reject) => { let text = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', chunk => { text += chunk; if (text.length > 2000000) reject(new Error('输入过大')); }); process.stdin.on('end', () => { try { resolve(JSON.parse(text)); } catch (e) { reject(e); } }); }) : json(resolve(path));
  if (operation === 'help') return { commands: ['capabilities', 'create --brief file [--start --approve-brief]', 'list [--group archived] [--query TEXT] [--status STATUS]', 'status TASK', 'run TASK', 'pause TASK', 'review TASK --review ID --decision approve|changes|redo [--feedback TEXT]', 'redo TASK --step KEY', 'canvas-get TASK', 'canvas-save TASK --input CANVAS_JSON --digest INPUT_DIGEST [--note TEXT]', 'import-request TASK', 'import-artifacts TASK --input BUNDLE_JSON --digest INPUT_DIGEST', 'complete TASK --step KEY --input FILE --digest INPUT_DIGEST', 'requirements TASK --brief FILE --new-requirement', 'verify TASK --receipt ID', 'record-verification TASK --receipt ID --input JSON_FILE', 'retry-target TASK --receipt ID', 'archive TASK', 'unarchive TASK', 'upload TASK --file FILE --role ROLE [--staged]', 'doctor', 'export TASK --out DIRECTORY'], root: runner.store.root };
  if (operation === 'create') { const task = await runner.create(await read(a.brief), { draft: a.draft === true }); return a.start ? runner.start(task.state.id, { approveBrief: a['approve-brief'] === true }) : task; }
  if (operation === 'list') return runner.store.list({ query: a.query || '', status: a.status, group: a.group, sessionId: a.session });
  if (operation === 'doctor') { const task = id ? await runner.store.read(id) : null; const result = await doctor(task?.state.execution ?? (await runner.store.settings()).value, { brief: task?.brief }); await atomic(join(runner.store.root, 'doctor.json'), result); return result; }
  if (!id) fail('task-required', '请提供任务标识');
  if (operation === 'status') return runner.store.read(id);
  if (operation === 'run' || operation === 'resume') return runner.resume(id);
  if (operation === 'start') return runner.start(id, { approveBrief: a['approve-brief'] === true });
  if (operation === 'pause') return runner.pause(id);
  if (operation === 'archive' || operation === 'unarchive') return runner.store.archive(id, { archived: operation === 'archive' });
  if (operation === 'review') return runner.review(id, { reviewId: a.review, decision: a.decision, feedback: a.feedback || '', actor: 'user' });
  if (operation === 'redo') return runner.redo(id, a.step, a.feedback || '');
  if (operation === 'canvas-get') { const r = await runner.canvasProject(id); return { canvas: r.canvas, inputDigest: r.inputDigest, project: r.project }; }
  if (operation === 'canvas-save') return runner.editCanvas(id, await read(a.input), a.digest, a.note);
  if (operation === 'import-artifacts') return runner.importArtifacts(id, await read(a.input), a.digest);
  if (operation === 'import-request') { const task = await runner.store.read(id); return { inputDigest: runner.importDigest(task), type: task.brief.work?.type || 'video' }; }
  if (operation === 'complete') return runner.fulfill(id, a.step, await read(a.input), a.digest);
  if (operation === 'requirements') return runner.revise(id, await read(a.brief), { newRequirement: a['new-requirement'] === true });
  if (operation === 'verify') return runner.verify(id, a.receipt);
  if (operation === 'record-verification') return runner.recordVerification(id, a.receipt, await read(a.input));
  if (operation === 'retry-target') return runner.retryTarget(id, a.receipt);
  if (operation === 'upload' && (await stat(resolve(a.file))).size > 8 * 1024 * 1024) { const info = await stat(resolve(a.file)), record = await runner.store.transfers.begin(id, { name: a.name || a.file.split('/').pop(), size: info.size, role: a.role || 'source', staged: a.staged === true, attribution: a.attribution, usage: a.usage }); let offset = 0; for await (const bytes of createReadStream(resolve(a.file), { highWaterMark: 8 * 1024 * 1024 })) { await runner.store.transfers.chunk(id, record.id, offset, bytes); offset += bytes.length; } return runner.store.transfers.complete(id, record.id); }
  if (operation === 'upload') return runner.store.upload(id, { name: a.name || a.file.split('/').pop(), base64: (await readFile(resolve(a.file))).toString('base64'), role: a.role || 'source', staged: a.staged === true, attribution: a.attribution || '', usage: a.usage || '' });
  if (operation === 'export') return lock(join(runner.store.taskDir(id), 'run.lock'), async () => { if (!a.out) fail('output-required', '请指定新的导出目录'); const task = await runner.store.read(id); if (['running', 'publishing', 'pausing'].includes(task.state.status)) fail('task-running', '请先暂停或恢复当前阶段，再导出完整快照'); const out = resolve(a.out); await mkdir(out, { recursive: false }); await cp(runner.store.taskDir(id), out, { recursive: true, filter: path => !path.endsWith('.lock') && path !== join(runner.store.taskDir(id), 'working') }); return { directory: out }; }, { waitMs: 100 });
  fail('invalid-operation', '未知命令，请运行 media-workflow help');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) cli(() => main());
