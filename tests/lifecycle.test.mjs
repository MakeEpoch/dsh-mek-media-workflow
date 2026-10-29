import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { temporary } from './helpers.mjs';
import { createClient, requireStorageRoot } from '../packages/dsh-media-workflow/src/client.js';

async function clientModule(t) {
  const root = await temporary(t), output = join(root, 'client.mjs');
  const result = await build({ entryPoints: [resolve('packages/dsh-media-workflow/src/index.jsx')], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node22' });
  await writeFile(output, result.outputFiles[0].text); return import(pathToFileURL(output).href);
}
test('界面分段初始化故障逐项清理，单项卸载异常不妨碍其他资源释放', async t => {
  const original = globalThis.document; globalThis.document = { baseURI: 'http://localhost/' }; t.after(() => { if (original === undefined) delete globalThis.document; else globalThis.document = original; });
  const { apply } = await clientModule(t);
  for (let failure = 0; failure <= 6; failure++) {
    const active = new Set(); let serial = 0, cleanup, failures = 0, hostClicks = 0;
    const register = () => { const id = ++serial; if (id === failure) throw new Error('injected registration failure'); active.add(id); return () => { active.delete(id); if (id === 2) throw new Error('injected cleanup failure'); }; };
    const ctx = { connection: {}, effect(fn) { cleanup = fn(); }, slots: { inject(name, fn) { return fn(); }, register }, sidebarRightTabs: { register }, on: register, logger: { error() { failures++; } } };
    assert.doesNotThrow(() => apply(ctx)); hostClicks++; assert.equal(hostClicks, 1);
    if (failure) { assert.equal(active.size, 0); assert.equal(failures, 1); } else assert.equal(active.size, 6);
    cleanup(); cleanup(); assert.equal(active.size, 0); hostClicks++; assert.equal(hostClicks, 2);
  }
});
test('客户端订阅抛错不阻断其他界面，卸载后不再派发', () => {
  const client = createClient({}, { base: 'http://localhost/' }); let calls = 0;
  client.subscribe(() => { throw new Error('fixture subscriber failure'); }); client.subscribe(() => { calls++; });
  assert.doesNotThrow(() => client.select('fixture')); assert.doesNotThrow(() => client.reset()); assert.equal(calls, 2);
  client.dispose(); client.reset(); assert.equal(calls, 2);
});
test('其他窗口切换目录后清除旧任务选择，后续写入使用新目录', async () => {
  let root = '/fixture/old', rejectOld = false, lastPayload;
  const connection = { rpc: { async call(_channel, _endpoint, request) {
    lastPayload = request.payload;
    if (request.method === 'settings.get') return { ok: true, value: { storage: { root } } };
    if (rejectOld && request.payload.storageRoot !== root) return { ok: false, error: { code: 'workspace-changed', message: '目录已切换' } };
    return { ok: true, value: {} };
  } } };
  const client = createClient(connection, { base: 'http://localhost/' });
  await client.call('settings.get'); client.select('old-task'); client.navigate('workbench');
  root = '/fixture/new'; rejectOld = true;
  await assert.rejects(client.call('settings.save', { revision: 0, value: {} }), { code: 'workspace-changed' });
  assert.equal(client.getSelected(), null); assert.equal(client.getPage(), null);
  await client.call('settings.get'); await client.call('tasks.create', { brief: {} });
  assert.equal(lastPayload.storageRoot, root); client.dispose();
});
test('目录服务缺少 root 时报告未就绪，不产生原始属性访问错误或猜测目录', () => {
  for (const value of [undefined, {}, { storage: {} }, { storage: { root: '' } }]) assert.throws(() => requireStorageRoot(value), { code: 'host-not-ready' });
  assert.equal(requireStorageRoot({ storage: { root: '/fixture/内容创作' } }), '/fixture/内容创作');
});
