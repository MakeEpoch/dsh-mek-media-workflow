import { open, mkdir, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { atomic, json, uuid, safeId, inside, lock, now, digest, fileDigest, fail, mime, clone } from './common.mjs';
import { normalizeBrief } from './schema.mjs';

export const CHUNK_SIZE = 8 * 1024 * 1024;
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
export function transferMethods(store) {
  const folder = (id, key) => join(store.taskDir(id), 'transfers', safeId(key));
  const assertWritable = (state, staged) => {
    if (state.archivedAt) fail('task-archived', '请先恢复归档任务');
    if (state.status !== 'draft' && (!staged || ['running','publishing','pausing'].includes(state.status))) fail('task-started', '请先暂停任务，再补充素材或导入交付');
  };
  return {
    async begin(id, { name, size, role = 'source', staged = false, attribution = '', usage = '', sha256 = '' }) {
      const task = await store.read(id); assertWritable(task.state, staged);
      const clean = name?.replace(/[^\p{L}\p{N}_. -]/gu, '_').slice(-120); if (!clean || ['.', '..'].includes(clean) || !Number.isSafeInteger(size) || size < 1 || size > MAX_FILE_SIZE) fail('invalid-file', '需要文件名及不超过 2GB 的实际文件大小');
      if (sha256 && !/^[a-f0-9]{64}$/.test(sha256)) fail('invalid-file', '内容摘要无效');
      if (!['source','screenshot','logo','image','video','audio','music'].includes(role)) fail('invalid-file', '素材用途无效');
      const key = uuid(), record = { schemaVersion: 1, id: key, taskId: id, name: clean, size, role, staged: staged === true, attribution: String(attribution).slice(0, 2000), usage: String(usage).slice(0, 2000), sha256, offset: 0, chunks: [], status: 'uploading', createdAt: now() };
      await mkdir(folder(id, key), { recursive: true }); await atomic(join(folder(id, key), 'record.json'), record); return { id: key, offset: 0, size, chunkSize: CHUNK_SIZE };
    },
    async status(id, key) { const r = await json(join(folder(id, key), 'record.json')); return { id: r.id, status: r.status, offset: r.offset, size: r.size, chunkSize: CHUNK_SIZE, chunks: r.chunks, result: r.result }; },
    async chunk(id, key, offset, bytes) {
      return lock(join(folder(id, key), 'transfer.lock'), async () => {
        const r = await json(join(folder(id, key), 'record.json')); assertWritable((await store.read(id)).state, r.staged);
        if (r.status !== 'uploading') fail('upload-complete', '上传已完成');
        if (!Number.isSafeInteger(offset) || offset < 0 || !Buffer.isBuffer(bytes) || !bytes.length || bytes.length > CHUNK_SIZE || offset + bytes.length > r.size) fail('invalid-chunk', '上传分片大小或偏移无效');
        const sha256 = digest(bytes), previous = r.chunks.find(c => c.offset === offset);
        if (previous) { if (previous.size !== bytes.length || previous.sha256 !== sha256) fail('chunk-conflict', '同一偏移的文件内容不同，请重新开始上传'); return { id: key, offset: r.offset, retried: true }; }
        if (offset !== r.offset) fail('chunk-offset', `请从已保存的 ${r.offset} 字节继续`, { offset: r.offset });
        const file = join(folder(id, key), 'data'), handle = await open(file, r.offset ? 'r+' : 'w');
        try { let written = 0; while (written < bytes.length) { const result = await handle.write(bytes, written, bytes.length - written, offset + written); if (!result.bytesWritten) fail('upload-write', '上传文件写入中断'); written += result.bytesWritten; } await handle.sync(); } finally { await handle.close(); }
        r.chunks.push({ offset, size: bytes.length, sha256 }); r.offset += bytes.length; await atomic(join(folder(id, key), 'record.json'), r); return { id: key, offset: r.offset };
      });
    },
    async complete(id, key) {
      return lock(join(folder(id, key), 'transfer.lock'), async () => {
        const dir = folder(id, key), r = await json(join(dir, 'record.json')); if (r.result) return r.result;
        if (r.offset !== r.size) fail('upload-incomplete', '文件尚未上传完整');
        const source = join(dir, 'data'), targetPath = join('uploads', `upload-${key}`, r.name), destination = inside(store.taskDir(id), targetPath), stored = await stat(source).then(() => source, e => { if (e.code === 'ENOENT') return destination; throw e; }), sha256 = await fileDigest(stored); if (r.sha256 && sha256 !== r.sha256) fail('upload-hash', '上传内容与原文件摘要不一致');
        // Re-read every stored chunk as well as the complete stream, including after process recovery.
        const handle = await open(stored, 'r');
        try { for (const c of r.chunks) { const bytes = Buffer.alloc(c.size); const read = await handle.read(bytes, 0, bytes.length, c.offset); if (read.bytesRead !== c.size || digest(bytes) !== c.sha256) fail('upload-hash', '已保存的上传分片损坏，请重新上传'); } } finally { await handle.close(); }
        const path = targetPath, descriptor = { id: `upload-${key}`, name: r.name, path: destination, role: r.role, attribution: r.attribution, usage: r.usage };
        await store.mutate(id, async (state, brief) => {
          assertWritable(state, r.staged); await mkdir(join(destination, '..'), { recursive: true });
          // A crash after rename is recovered below using the immutable receipt path.
          try { await rename(source, destination); } catch (e) { if (e.code !== 'ENOENT' || await fileDigest(destination) !== sha256) throw e; }
          if (!r.staged && !brief.sources.some(s => s.id === descriptor.id)) { const next = normalizeBrief({ ...brief, sources: [...brief.sources, descriptor] }, { draft: true }); await atomic(join(store.taskDir(id), 'brief.json'), next); const { briefHash } = await import('./schema.mjs'); state.briefHash = briefHash(next); }
        });
        r.result = { id: descriptor.id, path, name: r.name, mime: mime(r.name), size: r.size, sha256, descriptor }; r.status = 'complete'; r.completedAt = now(); await atomic(join(dir, 'record.json'), r); return r.result;
      });
    },
  };
}
