import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskStore } from '../packages/media-workflow-skill/lib/store.mjs';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { voiceOf, validateSettings } from '../packages/media-workflow-skill/lib/schema.mjs';
import { doctor } from '../packages/media-workflow-skill/lib/process.mjs';
import { temporary, fixtureBrief } from './helpers.mjs';

const token = ['fixture', 'token', '0123456789'].join('-');

test('MiMo 令牌只留在宿主，界面只看到是否已配置和尾号', async t => {
  const root = await temporary(t), host = new MediaService({ root }); t.after(() => host.dispose());
  const saved = await host.dispatch('settings.save', { value: { mimoApiKey: token, ttsProvider: 'mimo', mimoVoice: '茉莉' }, revision: 0 });
  assert.equal(saved.value.mimoApiKey, '');
  assert.equal(saved.value.mimoApiKeySet, true);
  assert.ok(saved.value.mimoApiKeyHint.endsWith(token.slice(-4)));
  assert.ok(!JSON.stringify(saved).includes(token), '设置应答不能包含明文令牌');
  assert.ok(!(await host.settings()).value.mimoApiKey, 'settings.get 不能包含明文令牌');
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
