export const ENDPOINT = 'dsh-media-workflow';
export function requireStorageRoot(settings) {
  const root = settings?.storage?.root;
  if (typeof root !== 'string' || !root.trim()) { const error = new Error('工作目录服务尚未就绪，请重新连接后再设置目录。'); error.code = 'host-not-ready'; throw error; }
  return root;
}
export function createClient(connection, { base = new URL('./', document.baseURI).href } = {}) {
  const listeners = new Set(); let disposed = false, storageRoot = null;
  const selected = new Map();
  let requestedPage = null;
  const selectionKey = scope => `media-workflow-selection:${base}:${scope || 'global'}`;
  const clearSelection = () => { selected.clear(); requestedPage = null; try { for (const key of Object.keys(localStorage)) if (key.startsWith(`media-workflow-selection:${base}:`)) localStorage.removeItem(key); } catch {} };
  return {
    async call(method, payload = {}, signal) {
      if (disposed) throw new Error('连接已关闭');
      const wire = await connection.rpc.call('/api', ENDPOINT, { method, payload: { ...payload, ...(storageRoot ? { storageRoot } : {}) } }, signal);
      const response = wire?.result ?? wire;
      if (!response?.ok) { const e = new Error(response?.error?.message || '媒体工作流请求失败'); e.code = response?.error?.code; e.details = response?.error?.details; if (e.code === 'workspace-changed') { storageRoot = null; clearSelection(); for (const fn of listeners) { try { fn({ type: 'storage' }); } catch {} } } throw e; }
      if (method === 'settings.get') storageRoot = response.value.storage?.root || null;
      return response.value;
    },
    artifactUrl(id, path) { const url = new URL(`api/${ENDPOINT}/artifact`, base); url.searchParams.set('task', id); url.searchParams.set('path', path); return url.href; },
    canvasImageUrl(id, path, image) { const url = new URL(`api/${ENDPOINT}/canvas-image`, base); url.searchParams.set('task', id); url.searchParams.set('path', path); url.searchParams.set('image', image); return url.href; },
    uploads(id, signal) { return this.call('uploads.list', { id }, signal).then(r => r.uploads ?? []); },
    sampleUrl(voice) { const url = new URL(`api/${ENDPOINT}/sample`, base); url.searchParams.set('name', voice); return url.href; },
    exportUrl(id) { const url = new URL(`api/${ENDPOINT}/export`, base); url.searchParams.set('id', id); return url.href; },
    getPage() { return requestedPage; },
    navigate(page) { if (!['tasks', 'settings', 'create', 'workbench'].includes(page)) return; requestedPage = page; for (const fn of listeners) { try { fn({ type: 'navigation', page }); } catch {} } },
    getSelected(scope) { if (selected.has(scope || 'global')) return selected.get(scope || 'global'); try { return localStorage.getItem(selectionKey(scope)); } catch { return null; } },
    select(id, scope) { selected.set(scope || 'global', id); try { localStorage.setItem(selectionKey(scope), id); } catch {} for (const fn of listeners) { try { fn({ type: 'selection', id, scope: scope || null }); } catch {} } },
    // Forget a persisted selection without broadcasting one: archiving must not reopen that task after a refresh.
    deselect(scope) { const key = scope || 'global'; selected.delete(key); try { localStorage.removeItem(selectionKey(key)); } catch {} },
    storageChanged() { clearSelection(); storageRoot = null; for (const fn of listeners) { try { fn({ type: 'storage' }); } catch {} } },
    async upload(id, entry, signal, staged = false) {
      if (entry.file.size > 8 * 1024 * 1024) {
        const key = `media-workflow-transfer:${base}:${storageRoot}:${id}:${entry.file.name}:${entry.file.size}:${entry.file.lastModified}:${staged}`;
        let record; try { const previous = localStorage.getItem(key); if (previous) record = await this.call('uploads.status', { id, transferId: previous }, signal); } catch (e) { if (signal?.aborted) throw e; }
        if (record?.chunks?.length) { for (const c of record.chunks) { const bytes = await entry.file.slice(c.offset, c.offset + c.size).arrayBuffer(), hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join(''); if (hash !== c.sha256) { record = null; break; } } }
        if (!record) { record = await this.call('uploads.begin', { id, name: entry.file.name, size: entry.file.size, role: entry.role || 'source', attribution: entry.attribution, usage: entry.usage, staged }, signal); try { localStorage.setItem(key, record.id); } catch {} }
        if (record.result) return record.result;
        for (let offset = record.offset; offset < entry.file.size;) { const url = new URL(`api/${ENDPOINT}/upload-chunk`, base); url.searchParams.set('task', id); url.searchParams.set('transfer', record.id); url.searchParams.set('offset', offset); const response = await fetch(url, { method: 'POST', body: entry.file.slice(offset, offset + record.chunkSize), credentials: 'same-origin', signal }), body = await response.json(); if (!body.ok) { const e = new Error(body.error?.message || '分片上传失败'); e.code = body.error?.code; throw e; } offset = body.value.offset; entry.onProgress?.({ uploaded: offset, total: entry.file.size }); }
        const result = await this.call('uploads.complete', { id, transferId: record.id }, signal); try { localStorage.removeItem(key); } catch {} return result;
      }
      const url = new URL(`api/${ENDPOINT}/upload`, base); url.searchParams.set('task', id); url.searchParams.set('name', entry.file.name); url.searchParams.set('role', entry.role); url.searchParams.set('attribution', entry.attribution || ''); url.searchParams.set('usage', entry.usage || '');
      if (staged) url.searchParams.set('staged', 'true');
      const result = await fetch(url, { method: 'POST', body: entry.file, credentials: 'same-origin', signal });
      const body = await result.json(); if (!body.ok) throw new Error(body.error?.message || '上传失败'); return body.value;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() { for (const fn of listeners) { try { fn(); } catch {} } },
    dispose() { disposed = true; listeners.clear(); },
  };
}

export function lineDiff(before, after) {
  const a = before.split('\n'), b = after.split('\n');
  if (a.length > 700 || b.length > 700) return { truncated: true, lines: [] };
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
  const lines = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) { if (i < a.length && j < b.length && a[i] === b[j]) { lines.push({ kind: 'same', text: a[i++] }); j++; } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) lines.push({ kind: 'add', text: b[j++] }); else lines.push({ kind: 'remove', text: a[i++] }); }
  return { truncated: false, lines };
}
export async function draftDatabase() {
  if (!globalThis.indexedDB) return null;
  return new Promise((resolve, reject) => { const request = indexedDB.open('dsh-media-workflow-ui', 1); request.onupgradeneeded = () => request.result.createObjectStore('drafts'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}
export async function draftStore(key, value) {
  const db = await draftDatabase(); if (!db) return null;
  try { return await new Promise((resolve, reject) => { const transaction = db.transaction('drafts', value === undefined ? 'readonly' : 'readwrite'), store = transaction.objectStore('drafts'); const request = value === undefined ? store.get(key) : value === null ? store.delete(key) : store.put(value, key); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); } finally { db.close(); }
}
