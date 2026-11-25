import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TaskStore } from '../packages/media-workflow-skill/lib/store.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { registerRpc } from '../packages/dsh-media-workflow/dsh/index.js';
import { voiceOf, validateSettings } from '../packages/media-workflow-skill/lib/schema.mjs';
import { command, doctor } from '../packages/media-workflow-skill/lib/process.mjs';
import { atomic, json, uuid } from '../packages/media-workflow-skill/lib/common.mjs';
import { main as workflow } from '../packages/media-workflow-skill/scripts/workflow.mjs';
import { temporary, fixtureBrief, generationFixture } from './helpers.mjs';

const token = ['fixture', 'token', '0123456789'].join('-');

test('MiMo 令牌只留在宿主，界面只看到是否已配置和尾号', async t => {
  const root = await temporary(t), host = new MediaService({ root }); t.after(() => host.dispose());
  const saved = await host.dispatch('settings.save', { value: { mimoApiKey: token, ttsProvider: 'mimo', mimoVoice: '茉莉' }, revision: 0 });
  assert.equal(saved.value.mimoApiKey, '');
  assert.equal(saved.value.mimoApiKeySet, true);
  assert.ok(saved.value.mimoApiKeyHint.endsWith(token.slice(-4)));
  assert.ok(!JSON.stringify(saved).includes(token), '设置应答不能包含明文令牌');
  await atomic(join(root, 'doctor.json'), { capabilities: [{ id: 'mimo-tts', details: { message: `旧诊断回显 ${token}` } }] });
  const settings = await host.settings();
  assert.ok(!JSON.stringify(settings).includes(token), 'settings.get 包括历史诊断也不能回显当前令牌');
  const kept = await host.dispatch('settings.save', { value: { ...saved.value, mimoApiKey: '', ttsProvider: 'mimo' }, revision: saved.revision });
  assert.equal(kept.value.mimoApiKeySet, true, '留空保存应保留已存令牌');
  assert.equal((await host.store.settings()).value.mimoApiKey, token);
  const cleared = await host.dispatch('settings.save', { value: { ...saved.value, mimoApiKey: '', clearMimoApiKey: true, ttsProvider: 'edge' }, revision: kept.revision });
  assert.equal(cleared.value.mimoApiKeySet, false);
  assert.equal((await host.store.settings()).value.mimoApiKey, '');
});

test('MiMo 任务在需求里就固定为句级对齐，不伪造词级时间码', async t => {
  const root = await temporary(t), store = new TaskStore(root);
  await store.saveSettings({ ttsProvider: 'mimo', mimoVoice: '茉莉' }, 0);
  const mimo = await store.create(fixtureBrief({ voice: { mode: 'tts', requiredAlignment: 'word' } }));
  assert.equal(mimo.brief.voice.provider, 'mimo');
  assert.equal(mimo.brief.voice.voice, '茉莉');
  assert.equal(mimo.brief.voice.requiredAlignment, 'sentence');
  assert.deepEqual(voiceOf(mimo.brief, {}), { provider: 'mimo', voice: '茉莉' });
  const edge = await store.create(fixtureBrief({ voice: { mode: 'tts', provider: 'edge' } }));
  assert.equal(edge.brief.voice.provider, 'edge');
  assert.equal(edge.brief.voice.requiredAlignment, 'word');
  const explicit = await store.create(fixtureBrief({ voice: { mode: 'tts', provider: 'mimo', voice: '苏打' } }));
  assert.equal(explicit.brief.voice.voice, '苏打');
});

test('环境检查按任务实际使用的配音服务切换，缺令牌时明确不可用', async () => {
  const settings = validateSettings({ ttsProvider: 'mimo', mimoApiKey: '', mimoBaseUrl: 'http://127.0.0.1:9/v1', browser: 'google-chrome', ffmpeg: 'ffmpeg', ffprobe: 'ffprobe', postfaro: 'postfaro' });
  const brief = { work: { type: 'video' }, voice: { mode: 'tts', provider: 'mimo', requiredAlignment: 'sentence' }, sources: [], publish: { enabled: false }, render: { backend: 'ffmpeg' } };
  const report = await doctor(settings, { brief });
  const mimo = report.capabilities.find(c => c.id === 'mimo-tts');
  assert.ok(mimo, '应出现 MiMo 检查项');
  assert.ok(!report.capabilities.some(c => c.id === 'edge-tts'), 'MiMo 任务不应检查 edge-tts');
  assert.equal(mimo.required, true);
  assert.equal(mimo.status, 'unavailable');
  assert.match(String(mimo.details?.details ?? mimo.details), /Token/);
  assert.equal(report.ready, false);
});

const noToken = value => {
  const data = JSON.stringify(value);
  assert.ok(!data.includes(token), '回包或任务文件不应含虚构令牌');
  assert.ok(!data.includes('"mimoApiKey"'), '任务执行快照不应保留凭据字段');
};

test('新任务不保存 Token；历史任务详情、CLI 和两种导出均安全，旧归档不能下载', async t => {
  const root = await temporary(t), host = new MediaService({ root }); t.after(() => host.dispose());
  await host.store.saveSettings({ mimoApiKey: token }, 0);
  const created = await host.dispatch('tasks.create', { brief: fixtureBrief(), draft: true });
  const id = created.state.id, dir = host.store.taskDir(id), statePath = join(dir, 'state.json');
  noToken(created); noToken(await json(statePath));
  const old = { ...created.state, execution: { ...created.state.execution, mimoApiKey: token }, error: { code: 'tool-failed', message: `旧服务错误回显 ${token}`, details: { provider: [`旧诊断回显 ${token}`] } } };
  const tempName = `state.json.${uuid()}.tmp`;
  await atomic(statePath, old); await atomic(join(dir, tempName), old);
  await mkdir(join(dir, 'working'));
  await atomic(join(dir, 'working', 'unregistered.txt'), 'excluded');
  const original = await readFile(statePath), routes = new Map();
  const stop = registerRpc({ connection: { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } }, host); t.after(stop);
  const endpoint = 'http://localhost/api/dsh-media-workflow';
  const details = await routes.get('/api/dsh-media-workflow').fetch(new Request(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', method: 'dsh-media-workflow', rpcId: 'test', payload: { method: 'tasks.get', payload: { id } } }) }));
  const payload = await details.json(); assert.ok(payload.result.ok); noToken(payload.result.value);
  noToken(await workflow({ _: ['status', id], root }));
  const out = join(root, 'cli-snapshot');
  await workflow({ _: ['export', id], root, out });
  noToken(await json(join(out, 'state.json')));
  assert.deepEqual(await json(join(out, 'brief.json')), created.brief);
  await assert.rejects(readFile(join(out, tempName)), { code: 'ENOENT' });
  await assert.rejects(readFile(join(out, 'working', 'unregistered.txt')), { code: 'ENOENT' });
  const record = await host.dispatch('tasks.export', { id });
  const getExport = exportId => routes.get('/api/dsh-media-workflow/export').fetch(new Request(`${endpoint}/export?id=${exportId}`));
  const download = await getExport(record.id); assert.equal(download.status, 200);
  const file = join(root, 'download.tar.gz'); await atomic(file, Buffer.from(await download.arrayBuffer()));
  const entries = (await command('tar', ['-tzf', file])).stdout;
  assert.ok(entries.includes('./brief.json') && entries.includes('./requirements/1.json'));
  assert.ok(!entries.includes(tempName) && !entries.includes('working') && !entries.includes('.lock'));
  noToken(JSON.parse((await command('tar', ['-xOzf', file, './state.json'])).stdout));
  const legacyId = uuid(); await atomic(join(root, 'exports', `${legacyId}.json`), { id: legacyId, name: '旧归档.tar.gz', size: 123 });
  assert.equal((await getExport(legacyId)).status, 410);
  assert.ok(original.equals(await readFile(statePath)), '只读和两种导出不改写旧任务');
  noToken(await host.dispatch('tasks.bind', { id, sessionId: 'fixture' }));
  noToken(await json(statePath));
});

test('MiMo 新旧任务即时使用完整连接配置，实际音频和诊断不回显凭据', { timeout: 30000 }, async t => {
  const root = await temporary(t), host = new MediaService({ root }); t.after(() => host.dispose());
  host.runner.generate = generationFixture;
  const current = `${token}-rotated`, headers = [];
  const wav = Buffer.alloc(44 + 24000 * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  let failSpeech = false;
  const api = createServer((req, res) => {
    headers.push({ current: req.headers.authorization === `Bearer ${current}`, method: req.method, url: req.url });
    req.resume();
    res.setHeader('content-type', 'application/json');
    if (req.url === '/v1/models') res.end(JSON.stringify({ data: [{ id: current }] }));
    else if (failSpeech) { res.statusCode = 401; res.end(JSON.stringify({ error: `upstream echoes ${current}` })); }
    else res.end(JSON.stringify({ choices: [{ message: { audio: { data: wav.toString('base64') } } }] }));
  });
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => api.close(resolve)));
  const settings = { mimoApiKey: token, ttsProvider: 'mimo', mimoBaseUrl: 'http://127.0.0.1:9/v1' };
  await host.store.saveSettings(settings, 0);
  const brief = fixtureBrief({ review: { mode: 'none' }, voice: { mode: 'tts', provider: 'mimo', requiredAlignment: 'sentence' } });
  const tasks = [await host.runner.create(brief), await host.runner.create(brief)];
  const legacyStatePath = join(host.store.taskDir(tasks[0].state.id), 'state.json');
  await atomic(legacyStatePath, { ...tasks[0].state, execution: { ...tasks[0].state.execution, mimoApiKey: token } });
  await host.store.saveSettings({ ...settings, mimoApiKey: current, mimoBaseUrl: `http://127.0.0.1:${api.address().port}/v1` }, 1);
  for (const { state: { id } } of tasks) {
    const hostCheck = await host.checks({ id });
    const cliCheck = await workflow({ _: ['doctor', id], root });
    for (const report of [hostCheck, cliCheck, await json(join(root, 'doctor.json')), await json(join(root, 'dsh.patch'))]) {
      assert.equal(report.capabilities.find(value => value.id === 'mimo-tts').status, 'available');
      assert.ok(!JSON.stringify(report).includes(current), '诊断不得回显供应商返回的凭据');
    }
    await host.runner.start(id);
    const result = await host.runner.run(id), step = result.state.steps.find(value => value.key === 'voice');
    assert.equal(step.status, 'complete');
    const timeline = await json(join(host.store.taskDir(id), step.artifacts.find(a => a.name === 'timeline.json').path));
    assert.equal(timeline.alignmentMethod, 'sentence-boundary'); assert.equal(timeline.duration, 1);
    noToken(await json(join(host.store.taskDir(id), 'state.json')));
  }
  failSpeech = true;
  const { state: { id } } = await host.runner.create(brief);
  await host.runner.start(id);
  const rejected = await host.runner.run(id);
  assert.match(rejected.state.error.message, /401/); assert.ok(!rejected.state.error.message.includes(current));
  noToken(await json(join(host.store.taskDir(id), 'state.json')));
  assert.ok(headers.every(row => row.current));
  assert.equal(headers.filter(row => row.method === 'POST' && row.url === '/v1/chat/completions').length, 3);
});
