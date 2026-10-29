import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { apply } from '../packages/dsh-media-workflow/dsh/index.js';
import { atomic, json } from '../packages/media-workflow-skill/lib/common.mjs';
import { command } from '../packages/media-workflow-skill/lib/process.mjs';

const dshBin = (await command('which', ['dsh'])).stdout.trim();
const { realpath } = await import('node:fs/promises');
const base = resolve(dirname(await realpath(dshBin)), '../node_modules/@deepseek-ai'), modules = path => join(base, path, 'lib/index.js');
const { Context } = await import(modules('cordis')), { default: SkillRegistry } = await import(modules('dsh-skill'));
const { parseMarketIndex } = await import(modules('dsh-plugin-market-index'));
const root = resolve(`artifacts/host-smoke-${Date.now()}`); await mkdir(root, { recursive: true });
const ctx = new Context(), routes = new Map();
ctx.provide('connection', { fetch: { register(route) { assert.equal(routes.has(route.path), false); routes.set(route.path, route); return () => routes.delete(route.path); } } });
ctx.plugin(SkillRegistry);
const configuration = { root, locationFile: join(root, 'host-location.json') };
const definition = { name: 'media-workflow-host-smoke', inject: ['connection', 'skills'], apply };
const plugin = ctx.plugin(definition, configuration);
try {
  for (let n = 0; n < 100 && routes.size !== 7; n++) await new Promise(r => setTimeout(r, 20));
  assert.equal(routes.size, 7); const skills = await ctx.skills.list(); assert.ok(skills.some(s => s.name === 'media-workflow'));
  const skill = await ctx.skills.get('media-workflow'); assert.ok(skill.content.includes('十步')); assert.ok(skill.resourceBase.path.endsWith('/media-workflow-skill/'));
  const market = parseMarketIndex(await json(resolve('market-index.json')), 'https://example.invalid/media-workflow/market-index.json'); assert.equal(market.plugins.length, 0);
  const route = routes.get('/api/dsh-media-workflow'); const response = await route.fetch(new Request('http://localhost/api/dsh-media-workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'smoke', method: 'dsh-media-workflow', payload: { method: 'tasks.list', payload: {} } }) }));
  assert.equal((await response.json()).result.value.total, 0);
  for (let n = 0; n < 200 && !await json(join(root, 'dsh.patch'), null); n++) await new Promise(r => setTimeout(r, 50));
  assert.equal((await json(join(root, 'dsh.patch'))).kind, 'media-workflow-diagnostics');
  const nextRoot = join(root, '内容创作');
  for (let n = 0; n < 30; n++) {
    const changed = await route.fetch(new Request('http://localhost/api/dsh-media-workflow', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: 'storage-smoke', method: 'dsh-media-workflow', payload: { method: 'storage.set', payload: { root: nextRoot, expectedRoot: root } } }) }));
    const body = await changed.json(); if (body.result.ok) break;
    if (body.result.error.code !== 'busy' || n === 29) throw new Error(body.result.error.message);
    await new Promise(r => setTimeout(r, 20));
  }
  assert.equal((await json(configuration.locationFile)).root, nextRoot);
  assert.ok((await ctx.skills.get('media-workflow')).content.includes(nextRoot));
  await plugin.dispose(); assert.equal(routes.size, 0); assert.equal((await ctx.skills.list()).some(s => s.name === 'media-workflow'), false);
  const reloaded = ctx.plugin(definition, configuration);
  for (let n = 0; n < 100 && routes.size !== 7; n++) await new Promise(r => setTimeout(r, 20));
  assert.equal(routes.size, 7); assert.ok((await ctx.skills.get('media-workflow')).content.includes(nextRoot));
  await reloaded.dispose(); assert.equal(routes.size, 0);
  const record = { passed: true, checks: ['installed Cordis lifecycle', 'installed DSH skill registry provider list/get', 'real market-index parser', 'host RPC', 'startup doctor diagnostic snapshots', 'runtime directory switch and live skill root', 'directory retained across plugin recreation', 'provider and route disposal', 'voice sample route'], boundary: '真实 Cordis 与 skills 服务；connection 为隔离路由夹具，未启动或重启日常 DSH，未访问发布平台' }; await atomic(join(root, 'result.json'), record); console.log(JSON.stringify(record, null, 2));
} finally { await ctx.fiber.dispose(); }
