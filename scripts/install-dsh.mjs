/** Install a verified frozen plugin in an existing DSH Web profile. */
import { readFile, writeFile, mkdir, copyFile, chmod, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, relative, isAbsolute } from 'node:path';
import { TaskStore } from '../packages/media-workflow-skill/lib/store.mjs';
import { json } from '../packages/media-workflow-skill/lib/common.mjs';
import assert from 'node:assert/strict';

const project = fileURLToPath(new URL('../', import.meta.url));
const profileName = process.env.DSH_PROFILE || 'web';
const home = process.env.DSH_HOME || join(process.env.HOME, '.dsh');
const profile = await realpath(join(home, 'profiles', profileName));
const record = JSON.parse(await readFile(join(project, 'artifacts/packages.json'), 'utf8')).find(p => p.name === 'dsh-mek-media-workflow');
const hash = data => createHash('sha256').update(data).digest('hex');
assert.equal(hash(await readFile(record.path)), record.sha256, 'Frozen archive checksum mismatch');
const taskBase = join(home, 'media-workflow'), savedLocation = await json(join(taskBase, 'location.json'), null), preflightStore = new TaskStore(savedLocation?.root || taskBase);
for (let offset = 0;; offset += 100) { const page = await preflightStore.list({ offset, limit: 100 }); assert.ok(!page.tasks.some(t => ['running','publishing','pausing'].includes(t.status)), '媒体任务仍在执行，请等待其完成或明确暂停后更新'); if (offset + 100 >= page.total) break; }
const manifestPath = join(profile, 'package.json');
const before = JSON.parse(await readFile(manifestPath, 'utf8'));
assert.ok(before.dsh?.profile?.bundles?.includes('@deepseek-ai/dsh-web-app'), 'Target must be an existing Web profile');
const cache = join(profile, '.plugin-manager/packages');
const archive = join(cache, `media-workflow-${record.version}-${record.sha256}.tgz`);
const spec = `file:${archive}`;
const alreadyInstalled = before.dependencies?.[record.name] === spec;
let backup = null;
const saved = [];
if (!alreadyInstalled) {
  backup = join(profile, '.plugin-manager', `media-workflow-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  await mkdir(backup, { recursive: true, mode: 0o700 });
  for (const name of ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'cordis.patch.yml', 'cordis.yml']) {
    try {
      const data = await readFile(join(profile, name));
      await writeFile(join(backup, name), data, { mode: 0o600 });
      saved.push({ name, sha256: hash(data) });
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await writeFile(join(backup, 'backup.json'), JSON.stringify({ profile, files: saved }, null, 2), { mode: 0o600 });
}
await mkdir(cache, { recursive: true, mode: 0o700 });
await copyFile(record.path, archive);
await chmod(archive, 0o600);
assert.equal(hash(await readFile(archive)), record.sha256);
if (!alreadyInstalled) {
  console.log(`Backup: ${backup}`);
  const run = spawnSync(process.env.DSH_BIN || 'dsh', ['plugin', '--profile', profileName, 'add', '-w', spec, '--ignore-scripts', ...(process.argv.includes('--offline') ? ['--offline'] : [])], { cwd: project, env: { ...process.env, DSH_HOME: home }, stdio: 'inherit' });
  if (run.error) throw run.error;
  assert.equal(run.status, 0, 'DSH plugin manager failed; backup retained');
}
const after = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!after.dsh.profile.bundles.includes(record.name)) { after.dsh.profile.bundles.push(record.name); await writeFile(manifestPath, JSON.stringify(after, null, 2) + '\n'); }
assert.equal(after.dependencies[record.name], spec);
assert.ok(after.dsh.profile.bundles.includes(record.name));
for (const [name, value] of Object.entries(before.dependencies || {})) {
  if (name !== record.name) assert.equal(after.dependencies[name], value, `Unrelated dependency changed: ${name}`);
}
assert.deepEqual(after.dsh.profile.bundles.filter(name => name !== record.name), before.dsh.profile.bundles.filter(name => name !== record.name));
for (const name of ['cordis.patch.yml', 'cordis.yml']) {
  const original = saved.find(f => f.name === name);
  if (original) assert.equal(hash(await readFile(join(profile, name))), original.sha256, `${name} changed`);
}
const resolved = await realpath(join(profile, 'node_modules/dsh-mek-media-workflow'));
const rel = relative(profile, resolved);
assert.ok(rel && rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel), 'Installed plugin must resolve inside profile');
assert.equal(JSON.parse(await readFile(join(resolved, 'package.json'), 'utf8')).version, record.version);
let mediaRuntime = null;
if (process.argv.includes('--media-runtime')) {
  const runtimeDirectory = join(profile, '.plugin-manager', 'media-workflow-runtime');
  const setup = join(resolved, 'embedded-skill/scripts/setup-runtime.mjs'), reuseIndex = process.argv.indexOf('--reuse-model'), setupArgs = [setup, '--directory', runtimeDirectory, ...(reuseIndex >= 0 ? ['--reuse-model', process.argv[reuseIndex + 1]] : []), ...(process.argv.includes('--offline') ? ['--offline'] : [])];
  const installed = spawnSync(process.execPath, setupArgs, { cwd: project, stdio: 'inherit', env: process.env }); if (installed.error) throw installed.error; assert.equal(installed.status, 0, '媒体运行环境安装失败；插件和原设置已保留');
  mediaRuntime = await json(join(runtimeDirectory, 'runtime.json'));
  const base = join(home, 'media-workflow'), location = await json(join(base, 'location.json'), null), store = new TaskStore(location?.root || base), current = await store.settings();
  const settingsBackup = join(profile, '.plugin-manager', `media-workflow-settings-${Date.now()}.json`);
  await writeFile(settingsBackup, JSON.stringify({ taskRoot: store.root, ...current }, null, 2), { mode: 0o600 });
  const bridgeIndex = process.argv.indexOf('--bridge-id'), bridgeId = bridgeIndex >= 0 ? process.argv[bridgeIndex + 1] : current.value.bridgeId;
  const saved = await store.saveSettings({ ...current.value, ...mediaRuntime.settings, analysisMode: current.value.analysisMode, bridgeId: current.value.bridgeId || bridgeId }, current.revision);
  assert.equal(saved.value.mediaPython, mediaRuntime.mediaPython); assert.equal(saved.value.asrModel, mediaRuntime.asrModel);
  mediaRuntime = { directory: runtimeDirectory, taskRoot: store.root, settingsRevision: saved.revision, settingsBackup, versions: mediaRuntime.versions, modelFiles: mediaRuntime.modelFiles };
}
const files = {};
for (const name of ['lib/client.js', 'host/core.js', 'host/runtime.js', 'host/service.js', 'embedded-skill/SKILL.md', 'embedded-skill/lib/runner.mjs', 'embedded-skill/lib/edits.mjs']) {
  files[name] = hash(await readFile(join(resolved, name)));
}
const receipt = { installedAt: new Date().toISOString(), profile, version: record.version, sha256: record.sha256, archive, backup, alreadyInstalled, mediaRuntime, verified: { manifest: true, bundleSelected: true, otherDependenciesPreserved: true, cordisPreserved: true, resolver: resolved, files }, activation: 'pending official plugin hot reload and browser verification; installer does not restart DSH' };
await writeFile(join(project, 'artifacts/dsh-install.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
