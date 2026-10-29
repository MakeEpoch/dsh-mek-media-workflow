import { mkdir, rename, rm, readFile, readdir, cp, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { TaskStore } from './store.mjs';
import { stepsFor, workType } from './profiles.mjs';
import { captureBundle, useBundle } from './imports.mjs';
import { executePublication } from './publications.mjs';
import { stepOf, normalizeBrief, resolveVoice, briefHash, needsReview } from './schema.mjs';
import { atomic, json, uuid, now, digest, clone, inside, lock, fail, safeError, isAlive, webUrl, fileDigest, expand } from './common.mjs';
import { makeCanvas, validateCanvas } from './canvas.mjs';
import { understandMaterials } from './understanding.mjs';
import { collectSources, materialsMarkdown } from './sources.mjs';
import { validateGeneration, SHAPES } from './generation.mjs';
import { stageGuidance } from './guidance.mjs';
import { synthesizeVoice, createComposition, finalRender, inspectMedia, resolveComposition, portableComposition } from './media.mjs';
import { editProject, editStoryboard } from './edits.mjs';
import { motionProject, recursiveFiles } from './motion.mjs';
import { PostFaroPublisher } from './publishing.mjs';

const completed = s => ['complete', 'skipped'].includes(s.status);
const preserved = s => ({ revision: s.revision, inputDigest: s.inputDigest, artifactDigest: s.artifactDigest, artifacts: clone(s.artifacts), checks: clone(s.checks), reviewId: s.reviewId ?? null, status: s.status });
export function affectedSteps(key, profile) { const keys = new Set([key]); for (const step of stepsFor(profile)) if (step.dependencies.some(d => keys.has(d))) keys.add(step.key); return [...keys]; }
function invalidate(state, keys) {
  for (const step of state.steps.filter(s => keys.includes(s.key))) { if (step.artifacts.length) step.history.push(preserved(step)); step.status = 'pending'; step.artifacts = []; step.artifactDigest = null; step.inputDigest = null; step.checks = []; step.reviewId = null; }
  state.pendingReview = null; state.error = null;
}
const latestReceipts = state => [...new Map(state.receipts.filter(r => r.runRevision === state.runRevision).map(r => [r.targetId, r])).values()];
const published = receipt => ['verified', 'verified_manual'].includes(receipt?.status);
function publishState(state, brief) {
  const latest = latestReceipts(state);
  if (brief.publish.targets.every(t => published(latest.find(r => r.targetId === t.id)))) { state.steps.find(s => s.key === 'publish').status = 'complete'; state.status = 'complete'; }
  else state.status = latest.some(r => !published(r)) ? 'needs_check' : state.pauseRequested ? 'paused' : 'ready';
}
export class WorkflowRunner {
  constructor({ root, store = new TaskStore(root), generate, adapters = {}, onUpdate, autoRun = true } = {}) { this.autoRun = autoRun; this.store = store; this.generate = generate; this.adapters = adapters; this.onUpdate = onUpdate; this.active = new Map(); }
  continue(id) { return this.autoRun ? this.run(id) : this.store.read(id); }
  async update(id, fn, revision) { const result = await this.store.mutate(id, fn, revision); try { this.onUpdate?.(id); } catch {} return result; }
  // Archiving is reversible but never implicit: every execution path must restore the task first.
  assertActive(state) { if (state.archivedAt) fail('task-archived', '任务已归档；恢复后才能继续执行、评审或改需求'); }
  async create(brief, options = {}) { const settings = await this.store.settings(); return this.store.create(brief, { ...options, execution: settings.value }); }
  inputDigest(task, key, includeFeedback = true) {
    const b = task.brief, dependencies = stepOf(key, task).dependencies.filter(d => d !== 'brief').map(k => [k, task.state.steps.find(s => s.key === k).artifactDigest]);
    const part = {
      brief: b,
      materials: [b.style, b.sources, b.brand.attribution, ...(b.work ? [b.work] : [])],
      script: [b.title, b.description, b.audience, b.requirements, b.timezone, b.asOf, b.style, ...(b.creative ? [b.creative] : [])],
      storyboard: [b.output, b.brand, b.style, b.requirements, ...(b.creative ? [b.creative] : [])],
      voice: b.voice, composition: [b.render, b.output, b.brand], qa: [b.style, b.voice.requiredAlignment], render: [b.render, b.output],
      package: [b.title, b.publish.enabled, b.publish.targets, b.asOf, b.timezone, b.style], publish: b.publish,
    }[key];
    return digest([key, part, dependencies, ...(key === 'materials' && task.state.execution.analysisMode ? [[task.state.execution.analysisMode, task.state.execution.mediaPython, task.state.execution.asrModel, task.state.execution.analysisLanguage, task.state.execution.videoFrames, task.state.execution.visionModel]] : []), includeFeedback ? task.state.feedback.filter(f => f.step === key && f.decision === 'changes') : []]);
  }
  async start(id, { approveBrief = false } = {}) {
    await this.update(id, async (state, brief) => {
      this.assertActive(state);
      if (state.status !== 'draft') fail('already-started', '任务已经启动，请恢复当前进度');
      const valid = normalizeBrief(brief); state.briefHash = briefHash(valid); state.review = clone(valid.review); state.status = 'ready'; state.initialBriefApproved = approveBrief && needsReview(valid, 'brief');
      await atomic(join(this.store.taskDir(id), 'brief.json'), valid); await atomic(join(this.store.taskDir(id), 'requirements', `${state.runRevision}.json`), valid);
    });
    return this.continue(id);
  }
  async resume(id) {
    await this.update(id, state => { this.assertActive(state); if (state.pendingReview) fail('review-pending', '请先处理当前评审'); if (state.status === 'needs_check') fail('publish-check-required', '请先核查已提交的发布结果'); state.pauseRequested = false; state.error = null; state.status = 'ready'; });
    return this.continue(id);
  }
  async pause(id) {
    const active = this.active.get(id), owner = active ? null : await json(join(this.store.taskDir(id), 'run.lock'), null), external = !!owner?.pid && isAlive(owner.pid);
    await this.update(id, state => { this.assertActive(state); state.pauseRequested = true; state.status = active || external ? 'pausing' : 'paused'; });
    if (active && !active.publishing) { active.controller.abort(new DOMException('用户暂停', 'AbortError')); await active.promise.catch(() => {}); }
    if (external) {
      // The owning runner watches pauseRequested and waits for its actual child to close.
      for (let count = 0; count < 100; count++) { const task = await this.store.read(id); if (['paused', 'needs_check'].includes(task.state.status)) return task; if (!isAlive(owner.pid)) break; await new Promise(r => setTimeout(r, 100)); }
    }
    return this.store.read(id);
  }
  async review(id, { reviewId, decision, feedback = '', actor = 'user' }) {
    if (!['approve', 'changes', 'redo'].includes(decision)) fail('invalid-review', '评审决定无效');
    if (decision === 'changes' && !feedback.trim()) fail('feedback-required', '请填写修改意见');
    let shouldRun = false;
    await this.update(id, async (state, brief) => {
      this.assertActive(state);
      const pending = state.pendingReview;
      if (!pending || pending.id !== reviewId) {
        const old = await json(join(this.store.taskDir(id), 'review', `${reviewId}.json`), null);
        if (old?.decision === decision && old.actor === actor) return;
        fail('stale-review', '这张评审卡已处理或版本已更新，请读取当前任务');
      }
      const step = state.steps.find(s => s.key === pending.step);
      if (step.artifactDigest !== pending.artifactDigest || step.inputDigest !== pending.inputDigest || briefHash(normalizeBrief(brief)) !== state.briefHash) fail('stale-review', '需求或产物版本已变化，旧卡无法批准新内容');
      await this.checkIntegrity(id, state, pending.step);
      const record = { ...pending, decision, feedback: feedback.trim(), actor, decidedAt: now() };
      await atomic(join(this.store.taskDir(id), 'review', `${pending.id}.json`), record);
      state.pendingReview = null; state.error = null;
      if (decision === 'approve') { step.reviewId = pending.id; step.reviewRunRevision = state.runRevision; step.status = pending.step === 'publish' ? 'prepared' : 'complete'; state.status = state.pauseRequested ? 'paused' : 'ready'; }
      else { state.feedback.push({ step: pending.step, text: feedback.trim(), decision, createdAt: now() }); invalidate(state, affectedSteps(pending.step, brief)); state.activeStep = pending.step; state.status = state.pauseRequested ? 'paused' : 'ready'; await rm(join(this.store.taskDir(id), 'inputs', `${pending.step}.json`), { force: true }); if (pending.step === 'render') for (const name of ['render.bundle.json', 'render.canvas.json']) await rm(join(this.store.taskDir(id), 'inputs', name), { force: true }); }
      shouldRun = !state.pauseRequested;
    });
    return shouldRun ? this.continue(id) : this.store.read(id);
  }
  async redo(id, key, feedback = '') {
    if (this.active.has(id)) fail('busy', '请先暂停当前任务再重做阶段');
    await this.update(id, async state => { this.assertActive(state); stepOf(key, state); if (key === 'publish' && state.receipts.some(r => ['submitted', 'verified', 'needs_check', 'filled', 'waiting_for_login'].includes(r.status))) fail('publish-check-required', '已有发布尝试，请核查原请求；不能通过重做发布关直接重发'); if (key !== 'publish' && state.receipts.some(r => r.runRevision === state.runRevision)) fail('new-requirement-required', '本版本已有发布尝试；请重新提交需求后制作新版，保留原回执'); state.feedback.push({ step: key, text: feedback, decision: 'redo', createdAt: now() }); invalidate(state, affectedSteps(key, state)); state.status = 'ready'; state.activeStep = key; await rm(join(this.store.taskDir(id), 'inputs', `${key}.json`), { force: true }); if (key === 'render') for (const name of ['render.bundle.json', 'render.canvas.json']) await rm(join(this.store.taskDir(id), 'inputs', name), { force: true }); });
    return this.continue(id);
  }
  async fulfill(id, key, response, requestDigest) {
    if (this.active.has(id)) fail('busy', '阶段执行中，请等待当前操作结束');
    const task = await this.store.read(id); stepOf(key, task); this.assertActive(task.state); if (task.state.receipts.some(r => r.runRevision === task.state.runRevision)) fail('new-requirement-required', '本版本已有发布尝试；请先重新提交需求，不能把旧回执用于新产物'); const request = await json(join(this.store.taskDir(id), 'requests', `${key}.json`));
    if (request.inputDigest !== requestDigest || requestDigest !== this.inputDigest(task, key)) fail('stale-input', '阶段输入已变化，请基于最新请求生成结果');
    await this.update(id, state => { if (state.steps.find(s => s.key === key).artifacts.length) invalidate(state, affectedSteps(key, state)); state.status = 'ready'; state.activeStep = key; state.error = null; });
    await atomic(join(this.store.taskDir(id), 'inputs', `${key}.json`), { inputDigest: requestDigest, kind: request.kind, response });
    return this.resume(id);
  }
  async canvasProject(id) {
    const task = await this.store.read(id); if (workType(task) === 'video') fail('invalid-step', '视频使用原视频工程编辑');
    const step = ['render', 'composition'].map(key => task.state.steps.find(s => s.key === key)).find(s => s.artifacts.some(a => a.name === 'publication.json'));
    if (!step) fail('upstream-required', '请先生成排版预览');
    const source = this.artifact(id, task, step.key, 'publication.json'); await this.checkIntegrity(id, task.state, step.key);
    const project = await json(source.absolutePath); if (!project.plan?.pages || !project.images || !project.script?.sections) fail('canvas-project-required', '此导入工程不是原生画布格式，请使用原生 publication.json 作为编辑基础');
    for (const m of await this.materials(id, task)) if (['image/png','image/jpeg','image/webp'].includes(m.mime) && m.size <= 20 * 1024 * 1024) { const path = relative(this.store.taskDir(id), m.absolutePath); project.images[m.id] = { ...project.images[m.id], name: m.name, attribution: m.attribution || m.url || '用户提供', usage: m.usage || '未声明', sourcePath: path, sourceHash: m.sha256, mime: m.mime }; }
    return { task, source, project, canvas: makeCanvas(project), inputDigest: this.importDigest(task) };
  }
  async editCanvas(id, canvas, requestDigest, note = '') {
    if (this.active.has(id)) fail('busy', '请先暂停任务再编辑画布');
    await lock(join(this.store.taskDir(id), 'run.lock'), async () => {
      const { task, source, project } = await this.canvasProject(id); this.assertActive(task.state);
      if (['draft', 'running', 'publishing', 'pausing', 'needs_check'].includes(task.state.status)) fail('busy', '当前任务不能编辑交付');
      if (task.state.receipts.some(r => r.runRevision === task.state.runRevision)) fail('new-requirement-required', '本版本已有发布尝试，请重新提交需求');
      if (stepOf('render', task).dependencies.some(k => !completed(task.state.steps.find(s => s.key === k)))) fail('upstream-required', '请先完成预览与质检');
      if (requestDigest !== this.importDigest(task)) fail('stale-input', '画布所依据的版本已更新，请刷新后编辑');
      const record = { inputDigest: this.inputDigest(task, 'render'), runRevision: task.state.runRevision, canvas: validateCanvas(canvas, project), imageSources: [...new Set(canvas.pages.flatMap(p => p.elements.filter(e => e.kind === 'image').map(e => e.imageId)))].map(id => ({ id, ...project.images[id], data: undefined })).filter(i => i.sourcePath), source: { path: source.path, sha256: source.sha256 }, note: String(note || '在画布中编辑排版与文字').slice(0, 4000) };
      await this.update(id, async state => {
        if (state.revision !== task.state.revision) fail('stale-input', '画布保存期间任务已更新');
        invalidate(state, affectedSteps('render', task)); state.status = 'ready'; state.pauseRequested = false; state.activeStep = 'render';
        state.feedback.push({ step: 'render', decision: 'edit', text: record.note, createdAt: now() });
        await atomic(join(this.store.taskDir(id), 'inputs', 'render.canvas.json'), record); await rm(join(this.store.taskDir(id), 'inputs', 'render.bundle.json'), { force: true });
      });
    }, { waitMs: 100 });
    return this.continue(id);
  }
  importDigest(task) { const step = task.state.steps.find(s => s.key === 'render'); return digest([this.inputDigest(task, 'render'), task.state.runRevision, step.revision, step.artifactDigest]); }
  async importArtifacts(id, bundle, requestDigest) {
    if (this.active.has(id)) fail('busy', '请先暂停任务再导入交付');
    await lock(join(this.store.taskDir(id), 'run.lock'), async () => {
      const task = await this.store.read(id); this.assertActive(task.state);
      if (['draft', 'running', 'publishing', 'pausing', 'needs_check'].includes(task.state.status)) fail('busy', '任务当前不能导入交付，请先完成需求或暂停执行');
      if (task.state.receipts.some(r => r.runRevision === task.state.runRevision)) fail('new-requirement-required', '当前版本已有发布尝试，请重新提交需求后再导入');
      if (stepOf('render', task).dependencies.some(k => !completed(task.state.steps.find(s => s.key === k)))) fail('upstream-required', '请先完成排版预览和质检，再导入正式交付');
      if (!requestDigest || requestDigest !== this.importDigest(task)) fail('stale-input', '交付输入版本已经变化，请刷新后重新导入');
      for (const s of task.state.steps.filter(s => !['render', 'package', 'publish'].includes(s.key))) await this.checkIntegrity(id, task.state, s.key);
      const record = await captureBundle(this, id, task, bundle);
      await this.update(id, async state => {
        if (state.revision !== task.state.revision) fail('stale-input', '导入期间任务已更新，请刷新后重试');
        invalidate(state, affectedSteps('render', task)); state.activeStep = 'render'; state.status = 'ready'; state.pauseRequested = false;
        state.feedback.push({ step: 'render', text: record.note, decision: 'import', createdAt: now() });
        await atomic(join(this.store.taskDir(id), 'inputs', 'render.bundle.json'), record); await rm(join(this.store.taskDir(id), 'inputs', 'render.canvas.json'), { force: true });
      });
    }, { waitMs: 100 });
    return this.continue(id);
  }
  async revise(id, input, { newRequirement = false } = {}) {
    if (this.active.has(id)) fail('busy', '请先暂停任务再修改需求');
    const next = resolveVoice(normalizeBrief(input), (await this.store.settings()).value);
    await this.update(id, async (state, previous) => {
      this.assertActive(state);
      if (state.status !== 'draft' && !newRequirement) fail('new-requirement-required', '运行中的需求修改需明确重新提交需求');
      if (state.receipts.some(r => ['submitted', 'needs_check', 'waiting_for_login', 'filled'].includes(r.status))) fail('publish-check-required', '请先核查当前发布尝试再提交新需求');
      if (workType(previous) !== workType(next)) fail('type-change-requires-task', '作品类型改变需要新建任务，以保留原流程和产物版本');
      state.runRevision++; state.title = next.title; state.style = next.style; state.review = clone(next.review); state.briefHash = briefHash(next); state.initialBriefApproved = needsReview(next, 'brief');
      const changed = stepsFor(next).filter(s => { if (s.key === 'brief') return true; const snapshot = { state, brief: next }; return state.steps.find(x => x.key === s.key).inputDigest && this.inputDigest(snapshot, s.key) !== state.steps.find(x => x.key === s.key).inputDigest; }).map(s => s.key);
      // A requirements document changes independently; downstream work is invalidated by relevant inputs.
      const keys = new Set(['brief']); for (const k of changed.filter(k => k !== 'brief')) for (const x of affectedSteps(k, next)) keys.add(x);
      const publish = state.steps.find(s => s.key === 'publish'); if (['prepared', 'needs_review'].includes(publish.status) || previous.publish.enabled !== next.publish.enabled) keys.add('publish');
      invalidate(state, [...keys]); state.status = 'ready'; state.pauseRequested = false;
      for (const step of state.steps.filter(s => !keys.has(s.key))) {
        if (step.status === 'needs_review') { step.status = 'complete'; step.reviewId = null; step.reviewRunRevision = null; }
        else if (completed(step) && step.reviewId) step.reviewRunRevision = state.runRevision;
      }
      await atomic(join(this.store.taskDir(id), 'brief.json'), next); await atomic(join(this.store.taskDir(id), 'requirements', `${state.runRevision}.json`), next);
    });
    return this.continue(id);
  }
  async checkIntegrity(id, state, onlyKey) {
    for (const step of state.steps.filter(s => (!onlyKey || s.key === onlyKey) && s.artifacts.length)) for (const a of step.artifacts) {
      let hash; try { hash = await fileDigest(inside(this.store.taskDir(id), a.path)); } catch { fail('artifact-missing', `产物丢失：${a.name}；请恢复文件或重做对应阶段`); }
      if (hash !== a.sha256) fail('external-edit', `检测到外部修改：${a.name}；请通过阶段结果导入为新版本或明确重做`, { step: step.key, artifact: a.path });
    }
  }
  async generated(id, task, key, kind, payload, signal) {
    const inputDigest = this.inputDigest(task, key), manual = await json(join(this.store.taskDir(id), 'inputs', `${key}.json`), null);
    const guidance = stageGuidance(kind, payload);
    await atomic(join(this.store.taskDir(id), 'requests', `${key}.json`), { schemaVersion: 1, taskId: id, step: key, kind, inputDigest, schema: SHAPES[kind], guidance, payload, createdAt: now() });
    if (manual?.inputDigest === inputDigest && (!manual.kind || manual.kind === kind)) return validateGeneration(kind, manual.response, payload);
    if (!this.generate) fail('generation-required', '当前阶段需要内容生成。请由当前 harness 读取 requests 中的请求并导入结果，或配置 DSH 模型');
    const modelPayload = { ...payload, guidance, ...(kind !== 'facts' ? { materials: payload.materials.map(({ text, ...m }) => m) } : {}) };
    if (modelPayload.materials) modelPayload.materials = modelPayload.materials.map(m => { if (!m.analysis) return m; const a = m.analysis; return { ...m, analysis: { sourceId: a.sourceId, sourceHash: a.sourceHash, verification: a.verification, frames: a.frames, media: a.media, unknowns: a.unknowns, ocr: a.ocr ? { tool: a.ocr.tool, version: a.ocr.version, verification: a.ocr.verification } : undefined, transcript: a.transcript ? { tool: a.transcript.tool, version: a.transcript.version, language: a.transcript.language, duration: a.transcript.duration, alignmentMethod: a.transcript.alignmentMethod, verification: a.transcript.verification } : undefined } }; });
    if (JSON.stringify(modelPayload).length > 180000) fail('source-budget', '本阶段来源超过单次生成预算；请由当前 harness 分批核查并导入结果，原文已保留');
    for (let attempt = 0; attempt < 2; attempt++) {
      try { return validateGeneration(kind, await this.generate(kind, modelPayload, task.state.execution, signal), payload); }
      catch (error) { if (signal?.aborted || attempt || !['invalid-generation', 'invalid-reference', 'unsupported-quote', 'invalid-storyboard', 'invalid-package', 'real-ui-required', 'model-invalid-json'].includes(error.code)) throw error; modelPayload.correction = `上一结果未通过结构或来源校验：${safeError(error)}。请依据同一批原始资料修正，不能编造。`; }
    }
  }
  async data(id, task, key, filename) { const step = task.state.steps.find(s => s.key === key), item = step.artifacts.find(a => a.name === filename); if (!item) fail('artifact-missing', `缺少 ${filename}`); return json(inside(this.store.taskDir(id), item.path)); }
  async priorData(id, task, key, filename) {
    const item = [...task.state.steps.find(s => s.key === key).history].reverse().flatMap(h => h.artifacts).find(a => a.name === filename); if (!item) return null;
    const path = inside(this.store.taskDir(id), item.path); if (await fileDigest(path) !== item.sha256) fail('external-edit', `历史输入被外部修改：${filename}`);
    return { value: await json(path), directory: join(path, '..') };
  }
  feedback(task, key) { return task.state.feedback.filter(f => f.step === key && f.decision === 'changes'); }
  async edit(id, task, key, payload, dir, signal) {
    if (!this.feedback(task, key).length) return null;
    const inputDigest = this.inputDigest(task, key), prior = await this.priorData(id, task, key, 'stage-edit.json');
    const edit = prior?.value.inputDigest === inputDigest ? prior.value : { ...await this.generated(id, task, key, 'stage-edit', { ...payload, step: key, feedback: this.feedback(task, key) }, signal), inputDigest, baseInputDigest: this.inputDigest(task, key, false) };
    await atomic(join(dir, 'stage-edit.json'), edit); return edit;
  }
  artifact(id, task, key, filename) { const a = task.state.steps.find(s => s.key === key).artifacts.find(a => a.name === filename); if (!a) fail('artifact-missing', `缺少 ${filename}`); return { ...a, absolutePath: inside(this.store.taskDir(id), a.path) }; }
  async materials(id, task) { const entries = await this.data(id, task, 'materials', 'materials.json'), file = this.artifact(id, task, 'materials', 'materials.json'); return entries.map(m => ({ ...m, absolutePath: join(file.absolutePath, '..', m.file) })); }
  async execute(id, task, key, dir, signal, finalDirectory) {
    const b = task.brief, settings = task.state.execution, onProcess = process => { const active = this.active.get(id); if (active) active.process = process; };
    if (key === 'render') { const imported = await useBundle(await json(join(this.store.taskDir(id), 'inputs', 'render.bundle.json'), null), dir, task, this.inputDigest(task, key)); if (imported) return imported; }
    if (this.adapters[key]) return this.adapters[key]({ id, task, dir, signal, runner: this });
    if (['brief', 'qa'].includes(key) && this.feedback(task, key).length) fail('revision-input-required', key === 'brief' ? '需求关修改需编辑并重新提交需求；原产物与意见已保留，不能只重写同一份需求' : '质检意见已保存；请按实际问题修改需求/素材，或在对应制作阶段提供调整，不能把重复检查冒充修复');
    if (key === 'brief') { await atomic(join(dir, 'brief.json'), b); await atomic(join(dir, 'brief.md'), `# ${b.title}\n\n${b.description}\n\n- 风格：${b.style}\n- 受众：${b.audience || '按需求判断'}\n- 评审：${b.review.mode}\n- 发布：${b.publish.enabled ? '按需求指定平台与账号' : '仅制作'}\n\n${b.requirements}`); return { files: ['brief.json', 'brief.md'], checks: [] }; }
    if (key === 'materials') {
      let materials = await collectSources(b, dir, { signal, fetcher: this.adapters.fetcher });
      const analysis = await understandMaterials({ runner: this, id, task, materials, dir, signal, onProcess }); materials = analysis.materials;
      if (materials.some(m => m.text.length > 200000)) fail('source-too-long', '识别文本超过单份来源上限，请分段后导入');
      if (b.style === 'news' && !materials.some(m => m.text.trim())) fail('sources-unreadable', '事实型内容需要可读原文、OCR 或实际转录；请检查素材识别依赖');
      const context = { brief: b, materials, feedback: this.feedback(task, key) }, facts = materials.some(m => m.text) ? await this.generated(id, task, key, 'facts', context, signal) : { facts: [], unknowns: ['视觉素材的语义未自动提取'] };
      await atomic(join(dir, 'materials.json'), materials); await atomic(join(dir, 'materials.md'), materialsMarkdown(materials)); await atomic(join(dir, 'facts.json'), facts);
      return { files: ['materials.json', 'materials.md', 'facts.json', ...materials.map(m => m.file), ...analysis.files], checks: [...analysis.checks,{ id: 'source-quotes', label: '引述可在来源提取文本定位', status: facts.facts.length ? 'pass' : 'unknown', severity: 'info' }] };
    }
    const materials = await this.materials(id, task);
    if (workType(b) !== 'video') return executePublication({ runner: this, id, task, key, dir, signal, materials, onProcess });
    if (key === 'script') { const facts = await this.data(id, task, 'materials', 'facts.json'), result = await this.generated(id, task, key, 'script', { brief: b, materials, facts, feedback: task.state.feedback.filter(f => f.step === key) }, signal); await atomic(join(dir, 'script.json'), result); await atomic(join(dir, 'script.md'), `# ${result.title}\n\n${result.sections.map(s => `${s.text}\n\n来源：${s.sourceIds.join('、') || '产品素材'}；事实：${s.factIds.join('、')}`).join('\n\n')}\n`); return { files: ['script.json', 'script.md'], checks: [] }; }
    const script = await this.data(id, task, 'script', 'script.json');
    if (key === 'storyboard') { const result = await this.generated(id, task, key, 'storyboard', { brief: b, materials, script, feedback: task.state.feedback.filter(f => f.step === key) }, signal); await atomic(join(dir, 'storyboard.json'), result); await atomic(join(dir, 'storyboard.md'), `# 分镜\n\n${result.treatment}\n\n${result.scenes.map((s, i) => `## ${i + 1}. ${s.title}\n\n${s.visual}\n\n素材：${s.materialIds.join('、')}\n旁白：${script.sections.find(x => x.id === s.sectionId).text}`).join('\n\n')}`); return { files: ['storyboard.json', 'storyboard.md'], checks: [] }; }
    const storyboard = await this.data(id, task, 'storyboard', 'storyboard.json');
    if (key === 'voice') {
      let alignment, edit, effective = b;
      if (this.feedback(task, key).length && b.voice.mode === 'none') fail('revision-input-required', '无旁白阶段的时长或文案修改需要调整分镜/需求；已保存本关意见，未伪造配音修改');
      if (b.voice.mode === 'tts' && this.feedback(task, key).length) {
        const prior = await this.priorData(id, task, key, 'stage-edit.json'); effective = { ...b, voice: { ...b.voice, ...(prior?.value.baseInputDigest === this.inputDigest(task, key, false) ? prior.value.voice : {}) } };
        edit = await this.edit(id, task, key, { brief: effective, materials, script, storyboard }, dir, signal); effective = { ...effective, voice: { ...effective.voice, ...edit.voice } };
      }
      if (b.voice.mode === 'provided' && (script.sections.length > 1 || b.voice.requiredAlignment === 'word' || this.feedback(task, key).length)) {
        const inputDigest = this.inputDigest(task, key);
        await atomic(join(this.store.taskDir(id), 'requests', 'voice.json'), { schemaVersion: 1, taskId: id, step: key, kind: 'recording-alignment', inputDigest, schema: { evidence: { tool: '实际对齐工具及版本', source: '实际对齐结果来源' }, timeline: { alignmentMethod: 'forced-alignment', duration: '实际音频秒数', segments: '[{sectionId,text,start,end}]，逐段覆盖文稿', words: '[{sectionId,text,start,end}]，词级需求时必须有实际边界' } }, payload: { script, audio: materials.filter(m => m.role === 'audio'), feedback: this.feedback(task, key) }, createdAt: now() });
        const manual = await json(join(this.store.taskDir(id), 'inputs', 'voice.json'), null);
        if (manual?.inputDigest === inputDigest) alignment = manual.response;
        else fail('alignment-required', '请用实际对齐工具处理原录音，并按 voice 阶段请求导入时间轴；不能按字数伪造');
      }
      return { files: [...new Set([...await synthesizeVoice(effective, script, storyboard, materials, dir, settings, signal, onProcess, alignment), ...(edit ? ['stage-edit.json'] : [])])], checks: edit ? [{ id: 'revision-applied', label: '本版参数修改', status: 'pass', severity: 'info', detail: edit.note }] : [] };
    }
    const voice = { timeline: this.artifact(id, task, 'voice', 'timeline.json').absolutePath, captions: this.artifact(id, task, 'voice', 'captions.srt').absolutePath, audio: task.state.steps.find(s => s.key === 'voice').artifacts.some(a => a.name === 'voiceover.wav') ? this.artifact(id, task, 'voice', 'voiceover.wav').absolutePath : null };
    if (key === 'composition') {
      const priorEdit = this.feedback(task, key).length ? await this.priorData(id, task, key, 'stage-edit.json') : null;
      const prior = priorEdit?.value.baseInputDigest === this.inputDigest(task, key, false) ? await this.priorData(id, task, key, 'composition.json') : null;
      const previous = prior ? resolveComposition(prior.value, prior.directory) : null;
      const effective = previous ? { ...storyboard, scenes: storyboard.scenes.map(s => ({ ...s, ...Object.fromEntries(['title', 'motion', 'materialIds'].map(k => [k, previous.scenes.find(p => p.id === s.id)[k]])) })) } : storyboard;
      const edit = await this.edit(id, task, key, { brief: b, materials, script, storyboard: effective, project: previous }, dir, signal);
      return { files: [...await createComposition(b, script, edit ? editStoryboard(effective, edit) : effective, materials, voice, dir, settings, signal, onProcess, finalDirectory, { ...previous?.presentation, ...edit?.presentation }), ...(edit ? ['stage-edit.json'] : [])], checks: edit ? [{ id: 'revision-applied', label: '本版参数修改', status: 'pass', severity: 'info', detail: edit.note }] : [] };
    }
    let composition = resolveComposition(await this.data(id, task, 'composition', 'composition.json'), join(this.artifact(id, task, 'composition', 'composition.json').absolutePath, '..'));
    if (key === 'qa') { const preview = this.artifact(id, task, 'composition', 'preview.mp4'), result = await inspectMedia(preview.absolutePath, b, settings, signal, { preview: b.render.backend !== 'huashu', expectedDuration: composition.timeline.duration }); const timeline = await json(voice.timeline); result.checks.push({ id: 'alignment', label: '字幕与音频时间依据', status: b.voice.mode === 'none' || timeline.alignmentMethod === 'provider-word-boundary' || timeline.alignmentMethod === 'forced-alignment' || b.voice.requiredAlignment !== 'word' ? 'pass' : 'fail', severity: 'error', detail: timeline.alignmentMethod }); await atomic(join(dir, 'qa.json'), result); if (result.checks.some(c => c.status === 'fail' && c.severity === 'error')) fail('qa-failed', '预览质检未通过，请按检查结果修正'); return { files: ['qa.json'], checks: result.checks }; }
    if (key === 'render') {
      const priorEdit = this.feedback(task, key).length ? await this.priorData(id, task, key, 'stage-edit.json') : null;
      const prior = priorEdit?.value.baseInputDigest === this.inputDigest(task, key, false) ? await this.priorData(id, task, key, 'render-project.json') : null; if (prior) composition = resolveComposition(prior.value, prior.directory);
      const edit = await this.edit(id, task, key, { brief: b, materials, script, storyboard, project: composition }, dir, signal), extra = [];
      if (edit) { composition = editProject(composition, edit, materials); extra.push('stage-edit.json'); if (b.render.backend === 'huashu') { const motion = await motionProject(composition, dir, settings, signal, onProcess); composition.motionProject = motion.root; extra.push('motion-check.txt', ...(await recursiveFiles(motion.root)).map(p => join('project', p))); } }
      const files = await finalRender(composition, dir, settings, b, signal, onProcess), result = await json(join(dir, 'media-info.json'));
      await atomic(join(dir, 'render-project.json'), portableComposition({ ...composition, ...(edit && b.render.backend === 'huashu' ? { motionProject: 'project' } : {}) }, finalDirectory));
      return { files: [...files, 'render-project.json', ...extra], checks: [...result.checks, ...(edit ? [{ id: 'revision-applied', label: '本版参数修改', status: 'pass', severity: 'info', detail: edit.note }] : [])] };
    }
    if (key === 'package') { const result = b.publish.enabled || this.feedback(task, key).length ? await this.generated(id, task, key, 'package', { brief: b, materials, script, feedback: task.state.feedback.filter(f => f.step === key) }, signal) : { title: script.title, description: script.sections.map(s => s.text).join('\n\n'), tags: [], targets: [], purpose: 'local-delivery' }; await atomic(join(dir, 'package.json'), result); await atomic(join(dir, 'package.md'), `# ${result.title}\n\n${result.description}\n\n${result.targets.map(t => `## ${t.targetId}\n\n${t.title}\n\n${t.content}\n\n${t.tags.join(' ')}`).join('\n\n')}`); return { files: ['package.json', 'package.md'], checks: [] }; }
    fail('invalid-step', '发布阶段由独立提交协议处理');
  }
  async makeReview(id, state, brief, step) {
    const review = { id: `mw-review-${id}-${digest([id, state.runRevision, step.key, step.inputDigest, step.artifactDigest]).slice(0, 24)}`, taskId: id, runRevision: state.runRevision, step: step.key, inputDigest: step.inputDigest, artifactDigest: step.artifactDigest, artifacts: clone(step.artifacts), checks: clone(step.checks), createdAt: now() };
    if (step.key === 'brief' && state.initialBriefApproved) { await atomic(join(this.store.taskDir(id), 'review', `${review.id}.json`), { ...review, decision: 'approve', actor: 'user', source: 'initial-requirement-submit', decidedAt: now() }); step.reviewId = review.id; step.reviewRunRevision = state.runRevision; state.initialBriefApproved = false; return; }
    state.pendingReview = review; step.status = 'needs_review'; state.status = 'needs_review';
  }
  async run(id) {
    if (this.active.has(id)) return this.active.get(id).promise;
    const controller = new AbortController(), active = { controller, publishing: false, process: null, promise: null };
    this.active.set(id, active);
    let checkingPause = false;
    const pauseWatch = setInterval(async () => { if (checkingPause || active.publishing || controller.signal.aborted) return; checkingPause = true; try { if ((await this.store.read(id)).state.pauseRequested && !active.publishing) controller.abort(new DOMException('用户暂停', 'AbortError')); } catch {} finally { checkingPause = false; } }, 250); pauseWatch.unref();
    active.promise = lock(join(this.store.taskDir(id), 'run.lock'), async () => {
      try {
        let task = await this.store.read(id);
        this.assertActive(task.state);
        if (task.state.pendingReview || task.state.pauseRequested || task.state.status === 'needs_check') return task;
        if (briefHash(normalizeBrief(task.brief)) !== task.state.briefHash) fail('external-brief-edit', '需求文件被外部修改，请通过重新提交需求登记新版本');
        await this.checkIntegrity(id, task.state);
        for (const definition of stepsFor(task)) {
          task = await this.store.read(id); const step = task.state.steps.find(s => s.key === definition.key);
          if (completed(step)) {
            if (definition.key !== 'publish' && step.status !== 'skipped' && needsReview(task.brief, definition.key) && step.reviewRunRevision !== task.state.runRevision) {
              await this.update(id, async (state, brief) => this.makeReview(id, state, brief, state.steps.find(s => s.key === definition.key)));
              if ((await this.store.read(id)).state.pendingReview) break;
            }
            continue;
          }
          if (task.state.pauseRequested || controller.signal.aborted) break;
          if (definition.key === 'publish') { await this.publish(id, task, controller.signal); break; }
          const key = definition.key, inputDigest = this.inputDigest(task, key), working = join(this.store.taskDir(id), 'working', `${key}-${uuid()}`);
          let rev = step.revision + 1; while (await stat(join(this.store.taskDir(id), 'artifacts', key, String(rev))).then(() => true, e => { if (e.code === 'ENOENT') return false; throw e; })) rev++;
          await mkdir(working, { recursive: true }); await this.update(id, state => { state.status = 'running'; state.activeStep = key; state.error = null; state.steps.find(s => s.key === key).status = 'running'; });
          const destination = join(this.store.taskDir(id), 'artifacts', key, String(rev));
          const result = await this.execute(id, task, key, working, controller.signal, destination);
          controller.signal.throwIfAborted(); await mkdir(join(destination, '..'), { recursive: true }); await rename(working, destination);
          const artifacts = await this.store.manifest(id, destination, result.files);
          await this.update(id, async (state, brief) => { const current = state.steps.find(s => s.key === key); if (current.artifacts.length) current.history.push(preserved(current)); Object.assign(current, { status: 'complete', revision: rev, inputDigest, artifactDigest: digest(artifacts.map(a => [a.path, a.sha256])), artifacts, checks: result.checks ?? [] }); if (needsReview(brief, key)) await this.makeReview(id, state, brief, current); });
          if (key === 'render' && task.state.execution.outputDirectory) {
            const target = join(expand(task.state.execution.outputDirectory), id, `run-${task.state.runRevision}-v${rev}`);
            try { await mkdir(join(target, '..'), { recursive: true }); await mkdir(target); await cp(destination, target, { recursive: true }); for (const file of artifacts) if (await fileDigest(join(target, file.name)) !== file.sha256) fail('delivery-readback', '交付目录回读不一致'); await this.update(id, state => { state.delivery = { status: 'saved', directory: target, at: now() }; }); }
            catch (error) { await this.update(id, state => { state.delivery = { status: 'failed', directory: target, message: safeError(error), at: now() }; }); }
          }
          task = await this.store.read(id); if (task.state.pendingReview) break;
        }
        await this.update(id, state => { if (state.pauseRequested && state.status !== 'needs_check') state.status = 'paused'; else if (state.steps.every(completed)) state.status = 'complete'; });
      } catch (error) {
        await this.update(id, state => { const pause = state.pauseRequested || controller.signal.aborted; state.status = pause ? 'paused' : ['generation-required', 'model-required', 'publish-type-unavailable', 'layout-overflow', 'materials-required', 'real-ui-required', 'real-logo-required', 'brand-source-required', 'source-unavailable', 'sources-unreadable', 'alignment-required', 'audio-required', 'motion-project-required', 'bridge-required', 'bridge-unavailable', 'account-unknown', 'account-mismatch', 'extension-required', 'capabilities-unknown', 'external-edit', 'external-brief-edit', 'artifact-missing', 'tool-missing', 'source-budget', 'cjk-font-required', 'revision-input-required'].includes(error.code) ? 'blocked' : 'failed'; state.error = pause ? null : { code: error.code ?? 'execution-failed', message: safeError(error), details: error.details ?? {}, at: now() }; const s = state.steps.find(s => s.key === state.activeStep); if (s?.status === 'running') s.status = pause ? 'pending' : 'blocked'; });
      }
      return this.store.read(id);
    }, { waitMs: 100 });
    try { return await active.promise; } finally { clearInterval(pauseWatch); this.active.delete(id); }
  }
  publisher(task) { return this.adapters.publisher ?? new PostFaroPublisher(task.state.execution); }
  async publish(id, task, signal) {
    const { brief: b } = task, s = task.state.steps.find(s => s.key === 'publish');
    if (!b.publish.enabled) { await this.update(id, state => { state.steps.find(s => s.key === 'publish').status = 'skipped'; }); return; }
    const publisher = this.publisher(task), revision = s.status === 'prepared' ? s.revision : s.revision + 1, directory = join(this.store.taskDir(id), 'artifacts', 'publish', String(revision));
    if (s.status !== 'prepared') {
      await this.update(id, state => { state.activeStep = 'publish'; state.status = 'running'; state.steps.find(s => s.key === 'publish').status = 'running'; }); await mkdir(directory, { recursive: true });
      let packaging = await this.data(id, task, 'package', 'package.json'); const type = workType(b), video = type === 'video' ? this.artifact(id, task, 'render', 'final.mp4') : null, cover = type === 'video' ? this.artifact(id, task, 'render', 'cover.png') : null, document = type === 'article' ? this.artifact(id, task, 'render', 'article.html') : null, images = type === 'image-post' ? task.state.steps.find(s => s.key === 'render').artifacts.filter(a => a.role === 'gallery-page' || /^page-\d+\.png$/.test(a.name)).sort((a, b) => a.name.localeCompare(b.name)).map(a => this.artifact(id, task, 'render', a.name)) : []; 
      if (this.feedback(task, 'publish').length) {
        const prior = await this.priorData(id, task, 'publish', 'publish-package.json'), inputDigest = this.inputDigest(task, 'publish'), baseInputDigest = this.inputDigest(task, 'publish', false);
        if (prior?.value.inputDigest === inputDigest) packaging = prior.value.package;
        else {
          if (prior?.value.baseInputDigest === baseInputDigest) packaging = prior.value.package;
          const adjusted = await this.generated(id, task, 'publish', 'package', { brief: b, materials: await this.materials(id, task), script: await this.data(id, task, 'script', 'script.json'), existingPackage: packaging, feedback: this.feedback(task, 'publish') }, signal);
          if (digest(adjusted) === digest(packaging)) fail('revision-input-required', '发布包装没有实际变化；若要更换账号、来源或授权，请重新提交需求'); packaging = adjusted;
        }
        await atomic(join(directory, 'publish-package.json'), { inputDigest, baseInputDigest, package: packaging });
      }
      const result = await publisher.prepare({ brief: b, packaging, video, cover, document, images, dir: directory, taskId: id, runRevision: task.state.runRevision, signal });
      await atomic(join(directory, 'publish-preview.json'), result); const files = await readdir(directory), artifacts = await this.store.manifest(id, directory, files);
      await this.update(id, async (state, brief) => { const current = state.steps.find(s => s.key === 'publish'); Object.assign(current, { status: 'prepared', revision, inputDigest: this.inputDigest(task, 'publish'), artifacts, artifactDigest: digest(artifacts.map(a => [a.path, a.sha256])), checks: [] }); if (needsReview(brief, 'publish')) await this.makeReview(id, state, brief, current); });
      task = await this.store.read(id); if (task.state.pendingReview) return;
    }
    await this.checkIntegrity(id, task.state);
    if (briefHash(normalizeBrief(task.brief)) !== task.state.briefHash) fail('stale-review', '发布前需求已变化');
    // Refresh identity immediately before the external action; never switch accounts.
    await publisher.preflight(b, signal);
    const prepared = await this.data(id, task, 'publish', 'publish-preview.json');
    const retries = task.state.retryQueue ?? [];
    for (const item of [...retries, ...prepared.prepared]) {
      task = await this.store.read(id); if (task.state.pauseRequested) break;
      if (published(latestReceipts(task.state).find(r => r.targetId === item.target.id))) continue;
      const old = task.state.receipts.find(r => r.requestId === item.input.requestId);
      if (old) { if (old.status === 'verified') continue; await this.update(id, state => { state.status = 'needs_check'; }); return; }
      if (digest(await json(item.file)) !== digest(item.input)) fail('stale-publish-input', '待发布文件发生变化，请重新准备当前版本');
      const receipt = { id: uuid(), runRevision: task.state.runRevision, targetId: item.target.id, platform: item.target.platform, account: item.target.account, requestId: item.input.requestId, bridgeId: item.input.bridgeId, browserContext: item.input.browserContext, contentDigest: digest(item.input), retryOf: item.retryOf ?? null, status: 'submitted', submittedAt: now(), attempts: [] };
      await atomic(join(this.store.taskDir(id), 'receipts', `${receipt.id}.json`), receipt); await this.update(id, state => { state.receipts.push(receipt); state.status = 'publishing'; state.activeStep = 'publish'; });
      const active = this.active.get(id); active.publishing = true;
      const result = await publisher.execute(item, b, { onEvent: event => { if (event.event === 'action_required') this.update(id, state => { const r = state.receipts.find(r => r.id === receipt.id); r.status = 'waiting_for_login'; r.requiredAction = event.requiredAction; }).catch(() => {}); }, onProcess: p => { active.process = p; } }); active.publishing = false;
      const final = { ...receipt, ...result, attempts: [{ at: now(), status: result.status, raw: result.raw }] }; await atomic(join(this.store.taskDir(id), 'receipts', `${receipt.id}.json`), final);
      await this.update(id, state => { state.receipts[state.receipts.findIndex(r => r.id === receipt.id)] = final; });
      if (result.status !== 'verified') { await this.update(id, state => { state.status = 'needs_check'; }); return; }
    }
    await this.update(id, state => { publishState(state, b); });
  }
  async verify(id, receiptId) {
    const task = await this.store.read(id), receipt = task.state.receipts.find(r => r.id === receiptId); if (!receipt) fail('not-found', '回执不存在'); this.assertActive(task.state);
    if (!latestReceipts(task.state).some(r => r.id === receiptId)) fail('stale-receipt', '请选择当前需求版本的最新发布尝试');
    if (this.active.get(id)?.publishing) fail('publish-running', '原发布进程仍在运行，请保留它并等待回执');
    const result = await this.publisher(task).verify(receipt, task.brief);
    await this.update(id, async state => { const r = state.receipts.find(r => r.id === receiptId); Object.assign(r, result); r.attempts.push({ at: now(), status: result.status, raw: result.raw }); await atomic(join(this.store.taskDir(id), 'receipts', `${r.id}.json`), r); publishState(state, task.brief); });
    return this.store.read(id);
  }
  async recordVerification(id, receiptId, { outcome, note, url }) {
    if (!['published', 'not_published', 'unknown'].includes(outcome) || !note?.trim()) fail('verification-required', '请记录实际核查结论及依据');
    if (this.active.get(id)?.publishing) fail('publish-running', '原发布进程仍在运行，请保留它并等待结果');
    this.assertActive((await this.store.read(id)).state);
    const link = url ? webUrl(url) : null; if (outcome === 'published' && !link) fail('public-url-required', '人工确认已发布时需提供实际发布链接');
    await this.update(id, async (state, brief) => { const r = latestReceipts(state).find(r => r.id === receiptId); if (!r) fail('stale-receipt', '请选择当前需求版本的最新尝试'); const record = { actor: 'user', method: 'manual', outcome, note: note.trim(), url: link, at: now() }; r.attempts.push(record); r.toolStatus = r.toolStatus ?? r.status; r.status = outcome === 'published' ? 'verified_manual' : outcome === 'not_published' ? 'not_published_manual' : 'needs_check'; r.detail = outcome === 'published' ? '用户人工核查已发布；未冒充工具核验' : outcome === 'not_published' ? '用户人工核查未发布，可明确重试' : '人工核查后仍不确定'; if (link) r.url = link; await atomic(join(this.store.taskDir(id), 'receipts', `${r.id}.json`), r); publishState(state, brief); });
    return this.store.read(id);
  }
  async retryTarget(id, receiptId) {
    if (this.active.has(id)) fail('publish-running', '原任务仍在执行，请等待当前操作结束');
    const task = await this.store.read(id), receipt = latestReceipts(task.state).find(r => r.id === receiptId);
    this.assertActive(task.state);
    if (!receipt || !['failed', 'not_published_manual'].includes(receipt.status)) fail('publish-check-required', '只有明确失败或人工确认未发布的最新尝试可以重试');
    await this.checkIntegrity(id, task.state);
    const preview = await this.data(id, task, 'publish', 'publish-preview.json'), original = preview.prepared.find(i => i.target.id === receipt.targetId);
    if (!original) fail('stale-publish-input', '原发布包装已变化，请重新准备');
    const item = clone(original), retryId = uuid(); item.input.requestId = `mw-retry-${retryId}`; item.retryOf = receipt.id; item.file = join(this.store.taskDir(id), 'receipts', `${retryId}.task.json`);
    await atomic(item.file, item.input);
    await this.update(id, state => { state.retryQueue = [...(state.retryQueue ?? []).filter(i => i.target.id !== receipt.targetId), item]; state.status = 'ready'; state.pauseRequested = false; state.error = null; });
    return this.continue(id);
  }
  async dispose() {
    await Promise.all([...this.active.keys()].map(async id => {
      const active = this.active.get(id); if (!active) return;
      await this.pause(id).catch(() => {});
      if (!active.publishing) return;
      const task = await this.store.read(id), receipt = latestReceipts(task.state).find(r => ['submitted', 'waiting_for_login'].includes(r.status));
      if (receipt) await this.publisher(task).cancel?.(receipt, task.brief).catch(() => {});
      const pid = active.process?.pid;
      if (pid && isAlive(pid)) { try { process.platform === 'win32' ? process.kill(pid, 'SIGTERM') : process.kill(-pid, 'SIGTERM'); } catch {} }
      let timer; const done = await Promise.race([active.promise.then(() => true, () => true), new Promise(resolve => { timer = setTimeout(() => resolve(false), 8000); })]); clearTimeout(timer);
      if (!done && pid && isAlive(pid)) { try { process.platform === 'win32' ? process.kill(pid, 'SIGKILL') : process.kill(-pid, 'SIGKILL'); } catch {} await active.promise.catch(() => {}); }
      await this.update(id, state => { if (latestReceipts(state).some(r => ['submitted', 'waiting_for_login', 'needs_check'].includes(r.status))) state.status = 'needs_check'; });
    }));
  }
}
