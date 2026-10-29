import { transferMethods } from './transfers.mjs';
import { ensureWorkspaceGuidance } from './workspace.mjs';
import { mkdir, readdir, readFile, realpath } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { stepsFor, workType, workflowFor } from './profiles.mjs';
import { normalizeBrief, resolveVoice, validateSettings, briefHash } from './schema.mjs';
import { atomic, json, uuid, safeId, inside, lock, now, clone, fail, defaultRoot, digest, regular, mime, fileDigest } from './common.mjs';

export class TaskStore {
  constructor(root = defaultRoot()) { this.root = root; this.transfers = transferMethods(this); }
  taskDir(id) { return join(this.root, 'tasks', safeId(id)); }
  async prepareWorkspace() { return ensureWorkspaceGuidance(this.root); }
  async settings() { const s = await json(join(this.root, 'settings.json'), { revision: 0, value: validateSettings() }); return { revision: s.revision, value: validateSettings(s.value) }; }
  async saveSettings(value, revision) {
    return lock(join(this.root, 'settings.lock'), async () => {
      const current = await this.settings(); if (revision !== current.revision) fail('conflict', '设置已被其他窗口修改，请载入最新设置；你的草稿已保留');
      // The GUI never receives the stored token, so an empty field means "keep the saved one";
      // clearing it is an explicit request and has to be asked for separately.
      const incoming = typeof value?.mimoApiKey === 'string' ? value.mimoApiKey.trim() : '';
      const mimoApiKey = incoming || (value?.clearMimoApiKey ? '' : current.value.mimoApiKey);
      const next = { ...value, mimoApiKey }; delete next.clearMimoApiKey;
      const result = { revision: current.revision + 1, value: validateSettings(next) }; await atomic(join(this.root, 'settings.json'), result); return this.settings();
    });
  }
  async create(input, { draft = false, sessionId = null, execution = {} } = {}) {
    const config = Object.keys(execution).length ? execution : (await this.settings()).value;
    const brief = resolveVoice(normalizeBrief(input, { draft }), config), id = uuid(), dir = this.taskDir(id);
    await this.prepareWorkspace();
    await mkdir(dir, { recursive: true });
    const state = { schemaVersion: 1, id, revision: 1, runRevision: 1, title: brief.title || '未命名草稿', style: brief.style, workflowProfile: clone(workflowFor(brief)), workType: workType(brief), status: 'draft',
      createdAt: now(), updatedAt: now(), sessionId, briefHash: briefHash(brief), activeStep: 'brief', review: clone(brief.review), execution: clone(execution),
      pendingReview: null, pauseRequested: false, error: null, feedback: [], archivedAt: null,
      steps: stepsFor(brief).map(s => ({ key: s.key, status: 'pending', revision: 0, inputDigest: null, artifactDigest: null, artifacts: [], checks: [], history: [] })), receipts: [] };
    await atomic(join(dir, 'brief.json'), brief); await atomic(join(dir, 'requirements', '1.json'), brief); await atomic(join(dir, 'state.json'), state);
    return { state, brief };
  }
  async read(id) {
    const dir = this.taskDir(id); let state;
    try { state = await json(join(dir, 'state.json')); } catch (e) { if (e.code === 'ENOENT') fail('not-found', '任务不存在'); throw e; }
    const brief = await json(join(dir, 'brief.json')), expected = stepsFor(brief);
    if (state.schemaVersion !== 1 || !Array.isArray(state.steps) || state.steps.length !== expected.length || state.steps.some((s, i) => s.key !== expected[i]?.key) || (state.workType && state.workType !== workType(brief)) || (state.workflowProfile && digest(state.workflowProfile) !== digest(workflowFor(brief)))) fail('corrupt-data', '任务状态损坏，原始文件已保留');
    return { state, brief };
  }
  async mutate(id, fn, expectedRevision) {
    return lock(join(this.taskDir(id), 'state.lock'), async () => {
      const task = await this.read(id);
      if (expectedRevision !== undefined && expectedRevision !== task.state.revision) fail('conflict', '任务已在其他入口更新，请刷新后重试');
      const result = await fn(task.state, task.brief);
      task.state.revision++; task.state.updatedAt = now();
      await atomic(join(this.taskDir(id), 'state.json'), task.state);
      return result === undefined ? task : result;
    });
  }
  async list({ sessionId, includeUnbound = false, status, group, query = '', offset = 0, limit = 40 } = {}) {
    const dirs = await readdir(join(this.root, 'tasks'), { withFileTypes: true }).catch(e => { if (e.code === 'ENOENT') return []; throw e; });
    const found = [], summary = { all: 0, attention: 0, active: 0, done: 0, draft: 0, archived: 0 };
    const category = state => ['needs_review', 'blocked', 'failed', 'needs_check', 'corrupt'].includes(state.status) ? 'attention' : ['ready', 'running', 'publishing', 'pausing'].includes(state.status) ? 'active' : state.status === 'complete' ? 'done' : state.status === 'draft' ? 'draft' : 'paused';
    // Archiving is a reversible flag on the task, not a move: archived tasks stay out of the working groups and their own group keeps them reachable.
    const include = state => {
      if (sessionId && state.sessionId !== sessionId && !(includeUnbound && !state.sessionId)) return;
      const archived = !!state.archivedAt, kind = category(state);
      if (archived) summary.archived++; else { summary.all++; if (Object.hasOwn(summary, kind)) summary[kind]++; }
      if ((archived ? group === 'archived' : !group || group === kind) && (!status || state.status === status) && state.title.toLowerCase().includes(query.toLowerCase())) found.push(state);
    };
    for (const d of dirs) {
      if (!d.isDirectory() || !/^[\w.-]+$/.test(d.name)) continue;
      try { const { state } = await this.read(d.name); include(state); }
      catch { if (!sessionId) include({ id: d.name, title: d.name, status: 'corrupt', updatedAt: '', error: { message: '无法读取任务，文件已保留' } }); }
    }
    const priority = s => s.archivedAt ? 3 : ['needs_review', 'blocked', 'needs_check', 'failed'].includes(s.status) ? 0 : s.status === 'running' ? 1 : 2;
    found.sort((a, b) => priority(a) - priority(b) || b.updatedAt.localeCompare(a.updatedAt));
    return { total: found.length, summary, tasks: found.slice(offset, offset + Math.min(limit, 100)) };
  }
  async archive(id, { archived = true } = {}) {
    return this.mutate(id, state => {
      if (!archived) { state.archivedAt = null; return; }
      if (['running', 'publishing', 'pausing'].includes(state.status)) fail('task-running', '任务正在执行，请先暂停并等待实际进程结束后再归档');
      if (state.pendingReview) fail('review-pending', '请先处理当前评审再归档，归档不会替你保留待决事项');
      if (state.receipts.some(r => r.runRevision === state.runRevision && ['submitted', 'waiting_for_login', 'needs_check', 'filled'].includes(r.status))) fail('publish-check-required', '发布结果尚未核验，核验完成后再归档');
      state.archivedAt = now();
    });
  }
  async artifact(id, relativePath) {
    const dir = await realpath(this.taskDir(id)); const path = await realpath(inside(dir, relativePath)); inside(dir, path);
    const task = await this.read(id);
    const all = task.state.steps.flatMap(s => [...s.artifacts, ...s.history.flatMap(h => h.artifacts ?? [])]);
    if (!all.some(a => a.path === relative(dir, path)) && !relative(dir, path).startsWith('uploads/')) fail('not-found', '产物未登记或无权预览');
    const info = await regular(path); return { path, size: info.size, mime: mime(path) };
  }
  async saveDraft(id, input) {
    const brief = normalizeBrief(input, { draft: true });
    await this.mutate(id, async state => { if (state.archivedAt) fail('task-archived', '任务已归档；恢复后才能编辑需求'); if (state.status !== 'draft') fail('task-started', '任务已启动，请重新提交需求'); if (workType(state) !== workType(brief)) state.steps = stepsFor(brief).map(s => ({ key: s.key, status: 'pending', revision: 0, inputDigest: null, artifactDigest: null, artifacts: [], checks: [], history: [] })); state.workflowProfile = clone(workflowFor(brief)); state.workType = workType(brief); state.title = brief.title || '未命名草稿'; state.style = brief.style; state.review = clone(brief.review); state.briefHash = briefHash(brief); await atomic(join(this.taskDir(id), 'brief.json'), brief); });
    return this.read(id);
  }
  async upload(id, { name, base64, role = 'source', attribution = '', usage = '', staged = false }) {
    const clean = name?.replace(/[^\p{L}\p{N}_. -]/gu, '_').slice(-120); if (!clean) fail('invalid-file', '文件名无效');
    if (typeof base64 !== 'string' || base64.length > 28 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) fail('invalid-file', '单个上传文件最多 20MB');
    const data = Buffer.from(base64, 'base64'); const key = `upload-${uuid()}`, path = join('uploads', key, clean);
    let descriptor;
    await this.mutate(id, async (state, brief) => {
      if (state.archivedAt) fail('task-archived', '任务已归档；恢复后才能补充素材');
      if (state.status !== 'draft' && (!staged || ['running', 'publishing', 'pausing'].includes(state.status))) fail('task-started', '请先暂停任务，再为新需求补充素材');
      await atomic(inside(this.taskDir(id), path), data);
      descriptor = { id: key, name: clean, path: inside(this.taskDir(id), path), role, attribution, usage };
      const next = normalizeBrief({ ...brief, sources: [...brief.sources, descriptor] }, { draft: true });
      if (!staged) { await atomic(join(this.taskDir(id), 'brief.json'), next); state.briefHash = briefHash(next); }
    });
    return { id: key, path, name: clean, mime: mime(clean), size: data.length, sha256: digest(data), descriptor };
  }
  // 上传素材 id → 任务内文件；分镜评审用它把 materialIds 渲染成缩略图。
  async uploadsManifest(id) {
    const dir = this.taskDir(id);
    let entries; try { entries = await readdir(join(dir, 'uploads')); } catch { return []; }
    const result = [];
    for (const key of entries.filter(e => e.startsWith('upload-'))) {
      let files; try { files = await readdir(join(dir, 'uploads', key)); } catch { continue; }
      for (const name of files) { const rel = join('uploads', key, name); try { const info = await regular(join(dir, rel)); result.push({ id: key, path: rel, name, mime: mime(name), size: info.size }); } catch {} }
    }
    return result;
  }
  async manifest(id, dir, files) {
    const taskDir = this.taskDir(id), result = [];
    for (const file of files) { const path = inside(dir, file.path ?? file); const info = await regular(path); result.push({ id: digest(relative(taskDir, path)).slice(0, 20), path: relative(taskDir, path), name: file.name ?? relative(dir, path), mime: mime(path), size: info.size, sha256: await fileDigest(path), ...(file.role ? { role: file.role } : {}) }); }
    return result;
  }
}
