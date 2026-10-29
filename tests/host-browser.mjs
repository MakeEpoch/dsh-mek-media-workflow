import { createRequire } from 'node:module';
import { writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fixtureBrief, generationFixture } from './helpers.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.DSH_PLAYWRIGHT_MODULE || 'playwright-core');
const entryUrl = process.env.DSH_TEST_URL_FILE ? (await readFile(process.env.DSH_TEST_URL_FILE, 'utf8')).trim() : process.env.DSH_TEST_URL;
if (!entryUrl) throw new Error('Set an isolated DSH entry URL or local URL file');
const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1512, height: 1040 } });
const errors = []; page.on('pageerror', e => errors.push(e.message));
const rpc = async (method, payload = {}) => page.evaluate(async ({ method, payload }) => {
  const r = await fetch('/api/dsh-media-workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', method: 'dsh-media-workflow', rpcId: crypto.randomUUID(), payload: { method, payload } }) });
  const result = (await r.json()).result; if (!result?.ok) throw new Error(result?.error?.message || `RPC ${r.status}`); return result.value;
}, { method, payload });
async function until(id, predicate) { let task; for (let i = 0; i < 180; i++) { task = await rpc('tasks.get', { id }); if (predicate(task)) return task; await page.waitForTimeout(200); } throw new Error(`Timed out: ${JSON.stringify(task?.state.error)}`); }
try {
  await page.goto(entryUrl); await page.getByRole('button', { name: '媒体工作台', exact: true }).waitFor();
  const preview = page.getByRole('button', { name: '继续', exact: true }); await preview.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}); if (await preview.isVisible()) { await preview.click(); await preview.waitFor({ state: 'hidden' }); }
  const setup = page.getByText('开始使用', { exact: true }); await setup.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}); if (await setup.isVisible()) { await page.keyboard.press('Escape'); await setup.waitFor({ state: 'hidden' }); }
  const title = `DSH 宿主回归（虚构资料） ${Date.now()}`;
  const created = await rpc('tasks.create', { brief: fixtureBrief({ title, output: { width: 640, height: 360, fps: 24, durationSeconds: 2 } }) }), id = created.state.id;
  await page.getByRole('button', { name: '媒体工作台', exact: true }).click();
  await page.getByRole('heading', { name: '制作任务', exact: true }).waitFor();
  await page.locator('.mw-task').filter({ hasText: title }).getByRole('button', { name: /编辑需求|查看评审|查看进度|查看成片|继续制作|处理问题/ }).click();
  await page.getByRole('button', { name: '确认需求并开始', exact: true }).click();
  for (const key of ['materials', 'script', 'storyboard']) {
    const task = await until(id, t => t.state.status === 'blocked' && t.state.activeStep === key); assert.ok(['generation-required', 'model-required'].includes(task.state.error.code));
    const request = await rpc('stage.request', { id, step: key }), response = await generationFixture(request.kind, request.payload);
    await rpc('stage.complete', { id, step: key, inputDigest: request.inputDigest, response });
  }
  await page.getByRole('heading', { name: '分镜 v1 需要评审', exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: '通过并继续', exact: true }).click();
  await page.getByRole('heading', { name: '正式渲染 v1 需要评审', exact: true }).waitFor({ timeout: 30000 });
  await page.getByRole('button', { name: '要求修改', exact: true }).click(); await page.getByLabel('修改意见', { exact: true }).fill('字幕放大到24'); await page.getByRole('button', { name: '提交修改意见', exact: true }).click();
  await until(id, t => t.state.status === 'blocked' && t.state.activeStep === 'render');
  const editRequest = await rpc('stage.request', { id, step: 'render' }); assert.equal(editRequest.kind, 'stage-edit');
  await rpc('stage.complete', { id, step: 'render', inputDigest: editRequest.inputDigest, response: { step: 'render', note: '按意见放大字幕到24', scenes: [], presentation: { captionFontSize: 24 } } });
  await page.getByRole('heading', { name: '正式渲染 v2 需要评审', exact: true }).waitFor({ timeout: 30000 });
  const revised = await rpc('tasks.get', { id }); assert.equal(revised.state.steps.find(s => s.key === 'composition').revision, 1); assert.equal(revised.state.steps.find(s => s.key === 'voice').revision, 1);
  await page.getByRole('button', { name: /stage-edit.json/ }).click(); await page.getByRole('heading', { name: '本版修改', exact: true }).waitFor();
  await page.getByRole('button', { name: /final.mp4/ }).click(); await page.waitForFunction(() => document.querySelector('.mw video')?.readyState >= 1);
  await page.screenshot({ path: new URL('../artifacts/dsh-host-workbench.png', import.meta.url).pathname, fullPage: true });
  await page.getByRole('button', { name: '通过并继续', exact: true }).click();
  assert.equal((await until(id, t => t.state.status === 'complete')).state.receipts.length, 0);
  await page.getByRole('button', { name: '设置', exact: true }).click(); const nextVoice = (await rpc('settings.get')).value.defaultVoice === 'zh-CN-YunxiNeural' ? 'zh-CN-XiaoxiaoNeural' : 'zh-CN-YunxiNeural'; await page.getByRole('button', { name: '制作偏好', exact: false }).click();
  await page.getByLabel('默认音色', { exact: true }).fill(nextVoice);
  await page.getByRole('button', { name: '保存设置', exact: true }).click(); await page.getByText('设置已保存', { exact: true }).waitFor(); assert.equal((await rpc('settings.get')).value.defaultVoice, nextVoice);
  await page.getByRole('button', { name: '任务', exact: true }).click();
  await page.locator('.mw-task').filter({ hasText: title }).getByRole('button', { name: /查看成片/ }).click();
  await page.getByRole('button', { name: '随聊面板', exact: true }).click();
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  await page.screenshot({ path: new URL('../artifacts/dsh-host-companion.png', import.meta.url).pathname, fullPage: true });
  assert.equal(await page.locator('.mw[data-mode="companion"]').count(), 1);
  assert.equal(await page.locator('.mw-error').count(), 0);
  await page.getByRole('button', { name: '展开 ↗', exact: true }).click(); await page.locator('.mw[data-mode="workspace"]').waitFor();
  assert.deepEqual(errors, []);
  const result = { passed: ['冻结 tarball 在独立 DSH profile 激活', '真实左栏与工作台槽位', '鉴权 RPC 与阶段结果导入', '标准评审和真实 FFmpeg 成片', '成片意见实际应用且保留上游', '鉴权媒体预览', '配置保存回读', '真实会话右栏槽位与展开返回'], taskId: id, pageErrors: errors, boundary: '真实本机 DSH 0.2.1-rc.2 Web；虚构资料与人工阶段导入；未调用真实模型、绑定有消息的会话或发布平台' };
  await writeFile(new URL('../artifacts/dsh-host-browser-result.json', import.meta.url), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
} catch (error) { await page.screenshot({ path: new URL('../artifacts/dsh-host-failure.png', import.meta.url).pathname, fullPage: true }); console.error((await page.locator('body').innerText()).slice(0, 2500)); throw error; } finally { await browser.close(); }
