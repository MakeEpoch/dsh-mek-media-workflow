import { readFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { command } from '../embedded-skill/lib/process.mjs';
import { fileDigest, atomic } from '../embedded-skill/lib/common.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), directory = join(root, 'artifacts', 'packages'); await mkdir(directory, { recursive: true });
const requirements = {
  'dsh-mek-media-workflow-skill': ['SKILL.md', 'workflow.json', 'scripts/workflow.mjs', 'scripts/tts-adapter.py', 'scripts/mimo-tts.py', 'lib/runner.mjs', 'lib/writing.mjs', 'lib/workspace.mjs', 'references/workspace-AGENTS.md', 'lib/guidance.mjs', 'lib/content.mjs', 'lib/profiles.mjs', 'lib/publications.mjs', 'lib/imports.mjs', 'lib/understanding.mjs', 'lib/canvas.mjs', 'lib/transfers.mjs', 'lib/document-assets.mjs', 'scripts/understand.py', 'scripts/setup-runtime.mjs', 'scripts/runtime-requirements.txt', 'references/understanding.md', 'references/canvas.md', 'references/imports.md', 'references/formats.md', 'references/styles.md', 'references/trends-2026-10.md', 'references/creation.md', 'references/execution.md', 'references/news.md', 'references/product.md'],
  'dsh-mek-media-workflow': ['dsh/index.js', 'host/service.js', 'host/core.js', 'lib/runtime.js', 'lib/client.js', 'embedded-skill/SKILL.md', 'embedded-skill/lib/runner.mjs', 'embedded-skill/lib/writing.mjs', 'embedded-skill/lib/workspace.mjs', 'embedded-skill/references/workspace-AGENTS.md', 'embedded-skill/lib/guidance.mjs', 'embedded-skill/lib/content.mjs', 'embedded-skill/lib/profiles.mjs', 'embedded-skill/lib/publications.mjs', 'embedded-skill/lib/imports.mjs', 'embedded-skill/lib/understanding.mjs', 'embedded-skill/lib/canvas.mjs', 'embedded-skill/lib/transfers.mjs', 'embedded-skill/lib/document-assets.mjs', 'embedded-skill/scripts/mimo-tts.py', 'embedded-media/voices/mimo-1.mp3', 'embedded-media/voices/mimo-8.mp3', 'embedded-skill/scripts/understand.py', 'embedded-skill/scripts/setup-runtime.mjs', 'embedded-skill/scripts/runtime-requirements.txt', 'embedded-skill/references/understanding.md', 'embedded-skill/references/canvas.md', 'embedded-skill/references/imports.md', 'embedded-skill/references/formats.md', 'embedded-skill/references/styles.md', 'embedded-skill/references/trends-2026-10.md', 'embedded-skill/references/creation.md', 'embedded-skill/references/execution.md', 'cordis.patch.yml'],
};
const result = [], packedFiles = [];
for (const [name, required] of Object.entries(requirements)) {
  const cwd = name.endsWith('-skill') ? join(root, 'embedded-skill') : root;
  const output = await command('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory, '--cache', join(root, 'artifacts', 'npm-cache')], { cwd, env: { npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' } });
  if (!output.stdout.trim()) throw new Error('npm 子进程未返回 JSON；请检查当前运行环境对子进程的限制，不能把空输出当成打包成功');
  const packed = JSON.parse(output.stdout)[0];
  const files = packed.files.map(f => f.path);
  for (const path of ['LICENSE', ...required]) if (!files.includes(path)) throw new Error(`${name} 缺少 ${path}；请先构建`);
  if (files.some(p => /(^|\/)(node_modules|\.data|artifacts|\.env|__pycache__)(\/|$)/.test(p))) throw new Error(`${name} 安装包包含运行数据或缓存`);
  const manifest = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'));
  if (packed.name !== name || packed.version !== manifest.version) throw new Error(`打包结果与 ${name} 的清单不一致`);
  if (cwd === root && (manifest.private || !manifest.engines.dsh || !manifest.dsh?.bundle?.patch || !files.includes(manifest.dsh.bundle.patch.replace(/^\.\//, '')))) throw new Error('仓库根组合包必须公开，并随包提供 DSH 版本范围和补丁');
  packedFiles.push(files);
  result.push({ name, version: manifest.version, path: join(directory, packed.filename), sha256: await fileDigest(join(directory, packed.filename)), files: files.length, size: packed.size });
}
if (result[0].version !== result[1].version) throw new Error('两个包版本不一致');
const [standalone, extracted] = await Promise.all(['frozen-skill', 'frozen-plugin'].map(async (name, index) => {
  const target = join(directory, name); await rm(target, { recursive: true, force: true }); await mkdir(target);
  await command('tar', ['-xzf', result[index].path, '--strip-components=1', '-C', target]);
  return target;
}));
for (const path of packedFiles[0]) {
  if (!packedFiles[1].includes(`embedded-skill/${path}`) || await fileDigest(join(standalone, path)) !== await fileDigest(join(extracted, 'embedded-skill', path))) throw new Error(`独立技能与插件内嵌技能不一致：${path}`);
}
const frozen = await import(pathToFileURL(join(extracted, 'dsh/index.js')).href), provider = frozen.skillProvider(), entry = (await provider.list())[0], skill = await provider.get(entry);
if (!skill.resourceBase.path.startsWith(extracted) || !skill.content.includes('十步')) throw new Error('冻结安装包未独立加载其内嵌技能');
const frozenCore = await import(pathToFileURL(join(extracted, 'host/core.js')).href);
if (frozenCore.core.contentCapabilities().types.some(t => !t.nativeWorkflow) || frozenCore.core.stepsFor('article').length !== 9 || frozenCore.core.stepsFor('video').length !== 10) throw new Error('冻结安装包中的多类型能力不完整');
await atomic(join(root, 'artifacts', 'packages.json'), result); console.log(JSON.stringify(result, null, 2));
