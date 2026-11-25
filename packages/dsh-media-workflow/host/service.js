import { readFile, readdir, mkdir, mkdtemp, rename, rm, realpath, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { extname, join, isAbsolute } from 'node:path';
import { core, common } from './core.js';

export const TASK_EXPORT_SCHEMA = 1;
export class MediaService {
  constructor({ ctx, root, adapters = {}, locationFile, onRootChange } = {}) {
    this.ctx = ctx; this.store = new core.TaskStore(root); this.native = new Map(); this.disposed = false; this.lifecycle = new AbortController();
    this.locationFile = locationFile; this.onRootChange = onRootChange; this.adapters = adapters; this.changingRoot = false;
    this.runner = this.makeRunner();
    this.operations = new Map();
  }
  get ideas() { return new core.IdeaStore(this.store.root); }
  get styles() { return new core.StyleStore(this.store.root); }
  get rules() { return new core.RuleStore(this.store.root); }
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
  async settings() { const stored = await this.store.settings(); const doctor = common.redactJson(await common.json(join(this.store.root, 'doctor.json'), null), stored.value.mimoApiKey); return { ...this.present(stored), storage: { root: this.store.root, tasks: join(this.store.root, 'tasks') }, workflow: core.workflow, doctor }; }
  async models() {
    const llm = this.ctx?.get?.('llm');
    return { providers: await Promise.all((llm?.listProviders?.() ?? []).map(async p => { try { return { id: p.id, name: p.name || p.id, models: (await llm.listModels(p.id)).map(m => ({ id: m.id ?? String(m), name: m.name ?? m.id ?? String(m) })) }; } catch { return { id: p.id, name: p.name || p.id, models: [], unavailable: true }; } })) };
  }
  async create(p, options = {}) {
    return this.runner.create(p.brief, { draft: p.draft === true, sessionId: p.sessionId || null, useWorkspaceStyle: p.applyStyle !== false, ...options });
  }
  async startIdeaWork(ideaId, type, { request = '', visualStyle = 'auto', writingStyleId } = {}) {
    if (this.disposed) common.fail('disposed', '插件已停止');
    const articleId = typeof ideaId === 'string' && /^idea_([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/.exec(ideaId)?.[1];
    if (!articleId) common.fail('invalid-id', '灵感标识无效');
    const labels = { article: '文章', 'image-post': '图文', video: '视频' };
    if (typeof type !== 'string' || !Object.hasOwn(labels, type)) common.fail('invalid-input', '请选择文章、图文或视频');
    if (!core.contentCapabilities().visualStyles.some(row => row.id === visualStyle)) common.fail('invalid-input', '视觉风格无效');
    request = common.text(request, '制作说明', { max: 30000 });
    if (writingStyleId !== undefined) writingStyleId = common.text(writingStyleId, '创作风格', { max: 128 });
    const id = type === 'article' ? articleId : common.digest([ideaId, type]).replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, '$1-$2-$3-$4-$5');
    const operation = `idea-work:${id}`, pending = this.operations.get(operation);
    if (pending) return pending;
    const promise = common.lock(join(this.store.root, 'idea-articles', `${id}.lock`), async () => {
      let task = await this.store.read(id).catch(error => { if (error.code !== 'not-found') throw error; return null; });
      if (task && (task.state.ideaId !== ideaId || core.workType(task) !== type)) common.fail('conflict', '此任务标识已被占用');
      if (!task) {
        const ideas = this.ideas;
        const idea = (await ideas.read()).items.find(row => row.id === ideaId);
        if (!idea) common.fail('not-found', '灵感不存在或已删除');
        const title = idea.title.trim().slice(0, 200) || idea.body.trim().slice(0, 80) || `灵感${labels[type]}`;
        const attribution = idea.source.slice(0, 2000) || '用户记录的灵感';
        const repeatsTitle = idea.body.split(/\r?\n/, 1)[0] === idea.title || idea.title.endsWith('…') && idea.body.startsWith(idea.title.slice(0, -1));
        const titleAsSource = idea.title !== idea.url && !repeatsTitle ? idea.title : '';
        const body = [titleAsSource, idea.body].filter(Boolean).join('\n\n').trim();
        const sources = [];
        if (body) sources.push({ id: 'idea-text', name: '灵感原文', text: body, attribution });
        const links = [...new Set([...(idea.url ? [common.webUrl(idea.url)] : []), ...core.linksInText(`${body}\n${request}`)])];
        for (const [index, url] of links.entries()) sources.push({ id: index ? `idea-link-${index}` : 'idea-link', name: '灵感附带链接', url, attribution });
        let attachment;
        if (idea.media?.src) {
          const media = await ideas.media(idea.media.src);
          const path = common.inside(await realpath(this.store.root), common.inside(await realpath(ideas.mediaDir), await realpath(media.file)));
          await common.regular(path, 40 * 1024 * 1024);
          attachment = { path, name: `idea-attachment${extname(media.file)}`, role: media.mime.startsWith('image/') ? 'image' : 'video', attribution };
        }
        if (!sources.length && !attachment) common.fail('invalid-idea', '请先为灵感补充文字、链接或附件');
        let brief = { title, description: request || `围绕「${title}」制作${labels[type]}，依据提供的灵感与资料展开。`, work: { type }, style: 'original', creative: { visualStyle }, writingStyleId, review: { mode: 'gates' }, sources, publish: { enabled: false } };
        if (type === 'video') {
          brief.voice = { voice: (await this.store.settings()).value.defaultVoice };
          brief.output = { width: 1080, height: 1920 };
        }
        if (request) brief = await this.parseBrief({ text: request, current: brief, quick: true, autoOutput: type === 'video' });
        task = await this.create({ brief }, { id, ideaId, attachment });
      }
      if (task.state.archivedAt) return { id };
      if (task.state.status === 'draft') task = await this.runner.start(id, { approveBrief: true, writingStyleId });
      if (task.state.status === 'ready') this.background(id, () => this.runner.run(id, { onlyIfReady: true }));
      return { id };
    }, { signal: this.lifecycle.signal }).finally(() => this.operations.delete(operation));
    this.operations.set(operation, promise);
    return promise;
  }
  async parseBrief(p) {
    const settings = (await this.store.settings()).value;
    const current = core.normalizeBrief(p.current, { draft: true });
    const { writing, ...currentBrief } = current;
    const llm = this.ctx?.get?.('llm');
    if (p.quick === true) {
      const request = common.text(p.text, '制作说明', { max: 30000 });
      if (!request || !settings.provider || !settings.model || !llm?.prepareCall) return current;
      const result = await core.modelJson(llm, settings, 'brief', {
        request, current: currentBrief,
        instruction: `只整理本次说明中明确的重点、受众、语气、表达方式和简短标题。${p.autoOutput === true ? '仅当说明明确指定视频横竖方向或时长时，填写 output 中相应字段；横竖版分别用 1920×1080、1080×1920。' : ''}作品类型、视觉风格、资料、评审方式、发布范围和授权由现有设置决定。`,
      }, this.lifecycle.signal).catch(error => {
        this.lifecycle.signal.throwIfAborted();
        this.ctx?.logger?.warn?.(`[media-workflow] 整理需求：${common.safeError(error)}`);
        return null;
      });
      if (!result) return current;
      const take = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
      const output = { ...current.output };
      if (p.autoOutput === true && core.workType(current) === 'video') {
        const { width, height, durationSeconds } = result.output ?? {};
        if (width === 1080 && height === 1920 || width === 1920 && height === 1080) Object.assign(output, { width, height });
        if (Number.isFinite(durationSeconds) && durationSeconds >= 1 && durationSeconds <= 3600) output.durationSeconds = durationSeconds;
      }
      return core.normalizeBrief({
        ...current,
        output,
        title: (p.autoTitle === true && take(result.title, 200)) || current.title,
        audience: current.audience || take(result.audience, 2000),
        requirements: current.requirements || take(result.requirements, 10000),
        creative: {
          ...current.creative,
          expression: current.creative?.expression === 'auto' ? take(result.creative?.expression, 200) || 'auto' : current.creative?.expression,
          tone: current.creative?.tone || take(result.creative?.tone, 2000),
          reference: current.creative?.reference || take(result.creative?.reference, 4000),
        },
      }, { draft: true });
    }
    const result = await core.modelJson(llm, settings, 'brief', { request: p.text, current: currentBrief, instruction: '仅整理当前用户需求。沿用已有真实素材；不要生成来源链接或平台账号。未明确指定时推荐标准评审。发布授权原文必须准确引用用户输入，不能推断。' });
    const merged = { ...current, ...result }; for (const group of ['review', 'voice', 'render', 'output', 'brand', 'publish']) merged[group] = { ...current[group], ...result[group] };
    merged.writing = writing;
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
  async checks(p = {}) { const task = p.id ? await this.store.read(p.id) : null; const settings = task ? await this.store.mimoSettings(task.state.execution) : (await this.store.settings()).value; const report = await core.doctor(settings, { brief: task?.brief, signal: this.lifecycle.signal }); await common.atomic(join(this.store.root, 'doctor.json'), report); await common.atomic(join(this.store.root, 'dsh.patch'), { kind: 'media-workflow-diagnostics', schemaVersion: 1, ...report }); return report; }
  async textArtifact(p) { const a = await this.store.artifact(p.id, p.path); if (!/^(text\/|application\/json)/.test(a.mime)) common.fail('not-text', '该产物需要媒体预览'); if (a.size > 2 * 1024 * 1024) common.fail('preview-too-large', '正文过大，请导出文件查看'); return { ...a, path: p.path, text: await readFile(a.path, 'utf8') }; }
  async request(p) { const task = await this.store.read(p.id); const key = p.step || task.state.error?.details?.step || task.state.activeStep; core.stepsFor(task).find(s => s.key === key) || common.fail('invalid-step', '阶段不存在'); return common.json(join(this.store.taskDir(p.id), 'requests', `${key}.json`), null); }
  async exportTask(id) {
    if (this.runner.active.has(id)) common.fail('task-running', '请等待当前阶段结束或暂停后再导出完整快照');
    return this.store.withExportSnapshot(id, async (task, taskDir, include) => {
      const exportId = common.uuid(), directory = join(this.store.root, 'exports');
      await mkdir(directory, { recursive: true });
      const staging = await mkdtemp(join(directory, '.export-')), archive = join(staging, 'task.tar.gz');
      try {
        await common.atomic(join(staging, 'state.json'), task.state);
        const entries = (await readdir(taskDir)).filter(name => include(join(taskDir, name))).map(name => `./${name}`);
        await core.command('tar', ['-czf', archive, '--exclude=working', '--exclude=*.lock', '-C', staging, './state.json', ...(entries.length ? ['-C', taskDir, ...entries] : [])]);
        const file = await common.regular(archive, 5 * 1024 * 1024 * 1024), sha256 = await common.fileDigest(archive);
        const record = { schemaVersion: TASK_EXPORT_SCHEMA, id: exportId, taskId: id, name: `${task.state.title}.tar.gz`, size: file.size, sha256, createdAt: common.now() };
        await rename(archive, join(directory, `${exportId}.tar.gz`));
        await common.atomic(join(directory, `${exportId}.json`), record); return record;
      } finally { await rm(staging, { recursive: true, force: true }); }
    });
  }
  async discover(p) { return new core.PostFaroPublisher((await this.store.settings()).value).discover(p.query, p); }
  async dispatch(method, p = {}) {
    if (this.changingRoot) common.fail('busy', '正在切换工作目录，请稍后再试');
    if (p.storageRoot && p.storageRoot !== this.store.root && !['settings.get', 'tasks.list', 'models.list', 'storage.set'].includes(method)) common.fail('workspace-changed', '工作目录已在其他窗口切换，请在新目录重新选择任务');
    const methods = {
      'settings.get': () => this.settings(), 'settings.save': async () => this.present(await this.store.saveSettings(p.value, p.revision)), 'models.list': () => this.models(), 'doctor': () => this.checks(p),
      'content.capabilities': () => core.contentCapabilities(),
      'ideas.list': () => this.ideas.list(), 'ideas.save': () => this.ideas.apply(p.ops ?? []), 'ideas.media': () => this.ideas.media(p.src), 'ideas.unused-media': () => this.ideas.unusedMedia(),
      'styles.list': () => this.styles.list(), 'styles.save': () => this.styles.apply(p.ops ?? []), 'styles.extract': () => this.styles.extract(p.text, { name: p.name }),
      'insights.import': () => this.rules.saveMetrics(p.rows ?? p.metrics), 'insights.metrics': () => this.rules.metrics(), 'insights.analyze': async () => core.analyzeMetrics(p.rows ?? await this.rules.metrics()),
      'rules.list': () => this.rules.list(), 'rules.save': () => this.rules.apply(p.ops ?? []),
      'skills.export': async () => core.exportSkill({ root: this.store.root, rules: p.rules ?? (await this.rules.read()).rules, style: p.style ?? await this.styles.active(), name: p.name, skillsRoot: p.skillsRoot }),
      'ideas.start-article': () => this.startIdeaWork(p.id, 'article'),
      'ideas.start-work': () => this.startIdeaWork(p.id, p.type, p),

      'storage.set': () => this.changeRoot(p),
      'brief.parse': () => this.parseBrief(p),
      'tasks.export': () => this.exportTask(p.id),
      'tasks.list': async () => ({ ...await this.store.list(p), root: this.store.root }), 'tasks.get': () => this.snapshot(p.id), 'tasks.create': () => this.create(p), 'tasks.draft': () => this.store.saveDraft(p.id, p.brief),
      'tasks.bind': () => this.store.mutate(p.id, state => { state.sessionId = common.text(p.sessionId, '制作会话', { required: true, max: 200 }); }),
      'tasks.start': () => this.control(p.id, () => this.runner.start(p.id, { approveBrief: p.approveBrief === true })),
      'tasks.resume': () => this.control(p.id, () => this.runner.resume(p.id)), 'tasks.pause': () => this.runner.pause(p.id),
      'tasks.redo': () => this.control(p.id, () => this.runner.redo(p.id, p.step, p.feedback)), 'tasks.revise': () => this.control(p.id, () => this.runner.revise(p.id, p.brief, { newRequirement: p.newRequirement === true, refreshWriting: p.refreshWriting === true })),
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
