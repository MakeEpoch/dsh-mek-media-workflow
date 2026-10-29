import { readFile, readdir, mkdir, realpath, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { core, common } from './core.js';

export class MediaService {
  constructor({ ctx, root, adapters = {}, locationFile, onRootChange } = {}) {
    this.ctx = ctx; this.store = new core.TaskStore(root); this.native = new Map(); this.disposed = false; this.lifecycle = new AbortController();
    this.locationFile = locationFile; this.onRootChange = onRootChange; this.adapters = adapters; this.changingRoot = false;
    this.runner = this.makeRunner();
    this.operations = new Map();
  }
  makeRunner() { return new core.WorkflowRunner({ store: this.store, adapters: this.adapters, autoRun: false, generate: this.ctx?.get?.('llm') ? (kind, payload, settings, signal) => {
    if (!settings.provider && !settings.model && !(kind === 'visual-analysis' && settings.visionModel)) common.fail('generation-required', '本任务由当前对话制作；请让对话助手读取本阶段请求并导入结果。全局模型设置只影响新任务。');
    return core.modelJson(this.ctx.get('llm'), settings, kind, payload, signal, { attachments: this.ctx.get('attachments') });
  } : undefined, onUpdate: id => this.syncReview(id) }); }
  async changeRoot(p) {
    if (p.expectedRoot !== this.store.root) common.fail('conflict', '其他窗口已切换工作目录，请刷新后重试');
    const requested = common.text(p.root, '工作目录', { required: true, max: 4096 });
    if (!isAbsolute(requested) && !requested.startsWith('~/')) common.fail('invalid-path', '请选择完整的绝对目录，例如 /home/user/内容创作');
    if (this.changingRoot || this.operations.size || this.runner.active.size) common.fail('busy', '任务或检查正在执行，完成或暂停后再切换工作目录');
    this.changingRoot = true;
    try {
      for (let offset = 0;; offset += 100) {
        const page = await this.store.list({ offset, limit: 100 });
        if (page.tasks.some(t => ['running', 'publishing', 'pausing'].includes(t.status))) common.fail('busy', '此目录仍有运行中的任务，请先暂停再切换');
        if (offset + 100 >= page.total) break;
      }
      await mkdir(common.expand(requested), { recursive: true }); const root = await realpath(common.expand(requested)); await access(root, constants.R_OK | constants.W_OK);
      if (root === this.store.root) return { root, changed: false };
      const store = new core.TaskStore(root); await store.settings();
      if ((await store.list({ limit: 100 })).tasks.some(t => t.status === 'corrupt')) common.fail('corrupt-data', '目标目录中有无法读取的任务，请先检查文件');
      await store.prepareWorkspace();
      if (this.locationFile) await common.atomic(this.locationFile, { root });
      await this.runner.dispose(); for (const c of this.native.values()) c.abort(); this.native.clear();
      this.store = store; this.runner = this.makeRunner(); this.onRootChange?.(root);
      return { root, changed: true };
    } finally { this.changingRoot = false; }
  }
  async snapshot(id) { const task = await this.store.read(id); return { ...task, process: this.runner.active.get(id)?.process ?? null }; }
  async recover() {
    await this.store.prepareWorkspace();
    for (let offset = 0;; offset += 100) {
      const page = await this.store.list({ offset, limit: 100 });
      for (const item of page.tasks) {
        const task = await this.store.read(item.id), owner = await common.json(join(this.store.taskDir(item.id), 'run.lock'), null);
        if (owner?.pid && common.isAlive(owner.pid)) continue;
        if (['running', 'publishing', 'pausing'].includes(task.state.status)) await this.store.mutate(item.id, state => {
          const unresolved = state.receipts.some(r => r.runRevision === state.runRevision && ['submitted', 'waiting_for_login', 'needs_check', 'filled'].includes(r.status));
          state.status = unresolved ? 'needs_check' : 'paused'; state.pauseRequested = !unresolved;
          state.error = { code: 'host-interrupted', message: unresolved ? '宿主中断，原发布请求需要核验，不能重新提交' : '宿主中断，已登记产物保留；未完成阶段可恢复', at: common.now() };
          for (const step of state.steps) if (step.status === 'running') step.status = 'pending';
        });
        if (task.state.pendingReview && !task.state.archivedAt) await this.syncReview(item.id);
      }
      if (offset + 100 >= page.total) break;
    }
  }
  // The MiMo token stays on the host: the GUI only learns whether one is stored and its tail.
  present({ revision, value }) {
    const key = String(value.mimoApiKey || '');
    return { revision, value: { ...value, mimoApiKey: '', mimoApiKeySet: !!key, mimoApiKeyHint: key ? `••••${key.slice(-4)}` : '' } };
  }
  async settings() { const stored = await this.store.settings(); return { ...this.present(stored), storage: { root: this.store.root, tasks: join(this.store.root, 'tasks') }, workflow: core.workflow, doctor: await common.json(join(this.store.root, 'doctor.json'), null) }; }
  async models() {
    const llm = this.ctx?.get?.('llm');
    return { providers: await Promise.all((llm?.listProviders?.() ?? []).map(async p => { try { return { id: p.id, name: p.name || p.id, models: (await llm.listModels(p.id)).map(m => ({ id: m.id ?? String(m), name: m.name ?? m.id ?? String(m) })) }; } catch { return { id: p.id, name: p.name || p.id, models: [], unavailable: true }; } })) };
  }
  async create(p) { const task = await this.runner.create(p.brief, { draft: p.draft === true, sessionId: p.sessionId || null }); return task; }
  async parseBrief(p) {
    const settings = (await this.store.settings()).value;
    const current = core.normalizeBrief(p.current, { draft: true });
    const result = await core.modelJson(this.ctx?.get?.('llm'), settings, 'brief', { request: p.text, current, instruction: '仅整理当前用户需求。沿用已有真实素材；不要生成来源链接或平台账号。未明确指定时推荐标准评审。发布授权原文必须准确引用用户输入，不能推断。' });
    const merged = { ...current, ...result }; for (const group of ['review', 'voice', 'render', 'output', 'brand', 'publish']) merged[group] = { ...current[group], ...result[group] };
    if (current.creative || result.creative) merged.creative = { ...current.creative, ...result.creative };
    const next = core.normalizeBrief(merged, { draft: true });
    if (next.review.mode === 'none' && current.review.mode !== 'none' && (!result.review?.statement?.trim() || !p.text.includes(result.review.statement))) common.fail('unsupported-review', '免阶段评审必须来自本次需求的明确原话，或由你在表单中选择');
    if (next.sources.some(s => s.path && !current.sources.some(c => c.path === s.path) || s.text && !p.text.includes(s.text) && !current.sources.some(c => c.text === s.text))) common.fail('unsupported-source', '识别结果中的文件或正文必须来自当前已有资料或本次用户输入');
    if (next.publish.targets.some(t => !current.publish.targets.some(c => c.platform === t.platform && c.account === t.account) && (!p.text.includes(t.platform) || !p.text.includes(t.account)))) common.fail('unsupported-target', '发布平台和账号必须来自本次需求原话或已有选择');
    if (next.sources.some(s => s.url && !p.text.includes(s.url) && !current.sources.some(c => c.url === s.url))) common.fail('unsupported-source', '识别结果包含需求中没有给出的链接，请手动核对');
    if (next.publish.authorization?.statement && !p.text.includes(next.publish.authorization.statement)) common.fail('unsupported-authorization', '发布授权必须来自本次用户原话');
    return next;
  }
  async setArchived(id, archived) {
    if (this.runner.active.has(id)) common.fail('task-running', '任务正在执行，请先暂停并等待实际进程结束后再归档');
    const task = await this.store.archive(id, { archived });
    // Archiving withdraws this task's native review card; unarchiving re-raises it if still pending.
    if (archived) { for (const [key, control] of this.native) if (control.taskId === id) { control.abort(); this.native.delete(key); } }
    else if (task.state.pendingReview) await this.syncReview(id);
    return task;
  }
  background(id, operation) {
    if (this.disposed) common.fail('disposed', '插件已停止');
    if (this.operations.has(id)) return { started: false, taskId: id };
    const promise = Promise.resolve().then(operation).catch(e => { this.ctx?.logger?.error?.(`[media-workflow] ${common.safeError(e)}`); }).finally(() => { this.operations.delete(id); });
    this.operations.set(id, promise); return { started: true, taskId: id };
  }
  async control(id, operation) { await operation(); return this.background(id, () => this.runner.run(id)); }
  async decide(p) { if (this.changingRoot) common.fail('busy', '正在切换目录，请在原任务中重新处理评审'); const result = await this.runner.review(p.id, { ...p, actor: 'user' }); this.native.get(p.reviewId)?.abort(); return this.background(p.id, () => this.runner.run(p.id)); }
  async syncReview(id) {
    if (this.disposed) return;
    try {
      const { state, brief } = await this.store.read(id), review = state.pendingReview, wanted = state.archivedAt ? undefined : review;
      for (const [key, control] of this.native) if (control.taskId === id && key !== wanted?.id) { control.abort(); this.native.delete(key); }
      if (!wanted || this.native.has(wanted.id)) return;
      const questions = this.ctx?.get?.('userQuestions'); if (!questions?.ask) return;
      const controller = new AbortController(); controller.taskId = id; this.native.set(review.id, controller);
      const agents = this.ctx?.get?.('agents'), owner = state.sessionId ? agents?.get?.(state.sessionId) : undefined;
      const agent = owner && agents.roots().includes(owner) ? owner : undefined;
      const step = core.stepsFor(brief).find(s => s.key === review.step), detail = `## ${state.title} · ${step.label}\n\n版本 ${state.steps.find(s => s.key === review.step).revision}\n\n${review.artifacts.map(a => `- ${a.name} (${a.mime}，${a.size} 字节)`).join('\n')}\n\n${review.checks.map(c => `- ${c.label}：${c.status}${c.detail ? `，${c.detail}` : ''}`).join('\n')}\n\n可在媒体工作台或随聊面板预览全文、视频和版本差异。`;
      questions.ask({ ...(agent ? { agent } : {}), signal: controller.signal, questions: [{ id: review.id, question: `评审：${step.label}`, detail, options: [{ label: '通过' }, { label: '要求修改' }], intent: { kind: 'plan-review', approve: '通过' } }] }).then(answer => {
        if (controller.signal.aborted || this.disposed) return;
        const item = answer.answers?.find(a => a.id === review.id); if (!item) return;
        const approve = item.selected?.includes('通过');
        if (!approve && !item.custom?.trim()) return; // Workbench feedback remains available; no fabricated feedback.
        return this.decide({ id, reviewId: review.id, decision: approve ? 'approve' : 'changes', feedback: item.custom || '' });
      }).catch(() => { /* Native answerer may be absent; the same pending review stays in the workbench. */ }).finally(() => { this.native.delete(review.id); });
    } catch (e) { this.ctx?.logger?.warn?.(`[media-workflow] 评审同步：${common.safeError(e)}`); }
  }
  async checks(p = {}) { const task = p.id ? await this.store.read(p.id) : null; const report = await core.doctor(task?.state.execution ?? (await this.store.settings()).value, { brief: task?.brief, signal: this.lifecycle.signal }); await common.atomic(join(this.store.root, 'doctor.json'), report); await common.atomic(join(this.store.root, 'dsh.patch'), { kind: 'media-workflow-diagnostics', schemaVersion: 1, ...report }); return report; }
  async textArtifact(p) { const a = await this.store.artifact(p.id, p.path); if (!/^(text\/|application\/json)/.test(a.mime)) common.fail('not-text', '该产物需要媒体预览'); if (a.size > 2 * 1024 * 1024) common.fail('preview-too-large', '正文过大，请导出文件查看'); return { ...a, path: p.path, text: await readFile(a.path, 'utf8') }; }
  async request(p) { const task = await this.store.read(p.id); const key = p.step || task.state.error?.details?.step || task.state.activeStep; core.stepsFor(task).find(s => s.key === key) || common.fail('invalid-step', '阶段不存在'); return common.json(join(this.store.taskDir(p.id), 'requests', `${key}.json`), null); }
  async exportTask(id) {
    const task = await this.store.read(id);
    if (this.runner.active.has(id) || ['running', 'publishing', 'pausing'].includes(task.state.status)) common.fail('task-running', '请等待当前阶段结束或暂停后再导出完整快照');
    const exportId = common.uuid(), directory = join(this.store.root, 'exports'), path = join(directory, `${exportId}.tar.gz`);
    await (await import('node:fs/promises')).mkdir(directory, { recursive: true });
    await core.command('tar', ['-czf', path, '--exclude=working', '--exclude=*.lock', '-C', this.store.taskDir(id), '.']);
    const file = await common.regular(path, 5 * 1024 * 1024 * 1024), record = { id: exportId, taskId: id, name: `${task.state.title}.tar.gz`, size: file.size, sha256: await common.fileDigest(path), createdAt: common.now() };
    await common.atomic(join(directory, `${exportId}.json`), record); return record;
  }
  async discover(p) { return new core.PostFaroPublisher((await this.store.settings()).value).discover(p.query, p); }
  async dispatch(method, p = {}) {
    if (this.changingRoot) common.fail('busy', '正在切换工作目录，请稍后再试');
    if (p.storageRoot && p.storageRoot !== this.store.root && !['settings.get', 'tasks.list', 'models.list', 'storage.set'].includes(method)) common.fail('workspace-changed', '工作目录已在其他窗口切换，请在新目录重新选择任务');
    const methods = {
      'settings.get': () => this.settings(), 'settings.save': async () => this.present(await this.store.saveSettings(p.value, p.revision)), 'models.list': () => this.models(), 'doctor': () => this.checks(p),
      'content.capabilities': () => core.contentCapabilities(),
      'storage.set': () => this.changeRoot(p),
      'brief.parse': () => this.parseBrief(p),
      'tasks.export': () => this.exportTask(p.id),
      'tasks.list': async () => ({ ...await this.store.list(p), root: this.store.root }), 'tasks.get': () => this.snapshot(p.id), 'tasks.create': () => this.create(p), 'tasks.draft': () => this.store.saveDraft(p.id, p.brief),
      'tasks.bind': () => this.store.mutate(p.id, state => { state.sessionId = common.text(p.sessionId, '制作会话', { required: true, max: 200 }); }),
      'tasks.start': () => this.control(p.id, () => this.runner.start(p.id, { approveBrief: p.approveBrief === true })),
      'tasks.resume': () => this.control(p.id, () => this.runner.resume(p.id)), 'tasks.pause': () => this.runner.pause(p.id),
      'tasks.redo': () => this.control(p.id, () => this.runner.redo(p.id, p.step, p.feedback)), 'tasks.revise': () => this.control(p.id, () => this.runner.revise(p.id, p.brief, { newRequirement: p.newRequirement === true })),
      'tasks.archive': () => this.setArchived(p.id, p.archived !== false),
      'review.decide': () => this.decide(p), 'artifacts.text': () => this.textArtifact(p), 'artifacts.upload': () => this.store.upload(p.id, p), 'uploads.list': async () => ({ uploads: await this.store.uploadsManifest(p.id) }), 'stage.request': () => this.request(p),
      'uploads.begin': () => this.store.transfers.begin(p.id, p), 'uploads.status': () => this.store.transfers.status(p.id, p.transferId), 'uploads.complete': () => this.store.transfers.complete(p.id, p.transferId),
      'canvas.get': async () => { const r = await this.runner.canvasProject(p.id); return { project: { ...r.project, images: Object.fromEntries(Object.entries(r.project.images).map(([key, { data, ...image }]) => [key, image])) }, canvas: r.canvas, sourcePath: r.source.path, inputDigest: r.inputDigest }; },
      'canvas.save': () => this.control(p.id, () => this.runner.editCanvas(p.id, p.canvas, p.inputDigest, p.note)),
      'artifacts.import': () => this.control(p.id, () => this.runner.importArtifacts(p.id, p.bundle, p.inputDigest)),
      'artifacts.import-request': async () => { const task = await this.store.read(p.id); return { inputDigest: this.runner.importDigest(task), type: core.workType(task) }; },
      'stage.complete': () => this.control(p.id, () => this.runner.fulfill(p.id, p.step, p.response, p.inputDigest)),
      'publish.discover': () => this.discover(p), 'publish.verify': () => this.background(p.id, () => this.runner.verify(p.id, p.receiptId)),
      'publish.record': () => this.runner.recordVerification(p.id, p.receiptId, p), 'publish.retry': () => this.control(p.id, () => this.runner.retryTarget(p.id, p.receiptId)),
      'requirements.history': async () => { const files = await readdir(join(this.store.taskDir(p.id), 'requirements')); return Promise.all(files.filter(f => /^\d+\.json$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b)).map(async f => ({ revision: parseInt(f), brief: await common.json(join(this.store.taskDir(p.id), 'requirements', f)) }))); },
    };
    if (!Object.hasOwn(methods, method)) common.fail('bad-request', '未知的媒体工作流操作'); return methods[method]();
  }
  async dispose() { this.disposed = true; this.lifecycle.abort(); for (const c of this.native.values()) c.abort(); this.native.clear(); await this.runner.dispose(); await Promise.allSettled(this.operations.values()); }
}
