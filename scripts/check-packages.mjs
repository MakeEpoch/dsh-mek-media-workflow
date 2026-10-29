import { readFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { command } from '../packages/media-workflow-skill/lib/process.mjs';
import { fileDigest, atomic } from '../packages/media-workflow-skill/lib/common.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), directory = join(root, 'artifacts', 'packages'); await mkdir(directory, { recursive: true });
const requirements = {
  'dsh-mek-media-workflow-skill': ['SKILL.md', 'workflow.json', 'scripts/workflow.mjs', 'scripts/tts-adapter.py', 'scripts/mimo-tts.py', 'lib/runner.mjs', 'lib/workspace.mjs', 'references/workspace-AGENTS.md', 'lib/guidance.mjs', 'lib/content.mjs', 'lib/profiles.mjs', 'lib/publications.mjs', 'lib/imports.mjs', 'lib/understanding.mjs', 'lib/canvas.mjs', 'lib/transfers.mjs', 'lib/document-assets.mjs', 'scripts/understand.py', 'scripts/setup-runtime.mjs', 'scripts/runtime-requirements.txt', 'references/understanding.md', 'references/canvas.md', 'references/imports.md', 'references/formats.md', 'references/styles.md', 'references/trends-2026-10.md', 'references/creation.md', 'references/execution.md', 'references/news.md', 'references/product.md'],
  'dsh-mek-media-workflow': ['dsh/index.js', 'host/service.js', 'host/core.js', 'host/runtime.js', 'lib/client.js', 'embedded-skill/SKILL.md', 'embedded-skill/lib/runner.mjs', 'embedded-skill/lib/workspace.mjs', 'embedded-skill/references/workspace-AGENTS.md', 'embedded-skill/lib/guidance.mjs', 'embedded-skill/lib/content.mjs', 'embedded-skill/lib/profiles.mjs', 'embedded-skill/lib/publications.mjs', 'embedded-skill/lib/imports.mjs', 'embedded-skill/lib/understanding.mjs', 'embedded-skill/lib/canvas.mjs', 'embedded-skill/lib/transfers.mjs', 'embedded-skill/lib/document-assets.mjs', 'embedded-skill/scripts/mimo-tts.py', 'embedded-media/voices/mimo-1.mp3', 'embedded-media/voices/mimo-8.mp3', 'embedded-skill/scripts/understand.py', 'embedded-skill/scripts/setup-runtime.mjs', 'embedded-skill/scripts/runtime-requirements.txt', 'embedded-skill/references/understanding.md', 'embedded-skill/references/canvas.md', 'embedded-skill/references/imports.md', 'embedded-skill/references/formats.md', 'embedded-skill/references/styles.md', 'embedded-skill/references/trends-2026-10.md', 'embedded-skill/references/creation.md', 'embedded-skill/references/execution.md', 'cordis.patch.yml'],
};
const result = [];
for (const [name, required] of Object.entries(requirements)) {
  const output = await command('npm', ['pack', '--json', '--ignore-scripts', '--workspace', name, '--pack-destination', directory, '--cache', join(root, 'artifacts', 'npm-cache')], { cwd: root, env: { npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' } });
  if (!output.stdout.trim()) throw new Error('npm 子进程未返回 JSON；请检查当前运行环境对子进程的限制，不能把空输出当成打包成功');
  const packed = JSON.parse(output.stdout)[0];
  const files = packed.files.map(f => f.path);
  for (const path of required) if (!files.includes(path)) throw new Error(`${name} 缺少 ${path}；请先构建`);
  if (files.some(p => /(^|\/)(node_modules|\.data|artifacts|\.env|__pycache__)(\/|$)/.test(p))) throw new Error(`${name} 安装包包含运行数据或缓存`);
  const manifestPath = name.endsWith('-skill') ? 'packages/media-workflow-skill/package.json' : 'packages/dsh-media-workflow/package.json', manifest = JSON.parse(await readFile(join(root, manifestPath), 'utf8'));
  if (name === 'dsh-mek-media-workflow' && (!manifest.engines.dsh || !manifest.dsh.bundle.patch)) throw new Error('DSH 版本范围或 bundle 声明缺失');
  result.push({ name, version: manifest.version, path: join(directory, packed.filename), sha256: await fileDigest(join(directory, packed.filename)), files: files.length, size: packed.size });
}
if (result[0].version !== result[1].version) throw new Error('两个包版本不一致');
if (await fileDigest(join(root, 'packages/media-workflow-skill/lib/runner.mjs')) !== await fileDigest(join(root, 'packages/dsh-media-workflow/embedded-skill/lib/runner.mjs'))) throw new Error('内嵌技能落后于共享源码；请重新构建');
const extracted = join(directory, 'frozen-plugin'); await rm(extracted, { recursive: true, force: true }); await mkdir(extracted);
await command('tar', ['-xzf', result[1].path, '--strip-components=1', '-C', extracted]);
const frozen = await import(pathToFileURL(join(extracted, 'dsh/index.js')).href), provider = frozen.skillProvider(), entry = (await provider.list())[0], skill = await provider.get(entry);
if (!skill.resourceBase.path.startsWith(extracted) || !skill.content.includes('十步')) throw new Error('冻结安装包未独立加载其内嵌技能');
const frozenCore = await import(pathToFileURL(join(extracted, 'host/core.js')).href);
if (frozenCore.core.contentCapabilities().types.some(t => !t.nativeWorkflow) || frozenCore.core.stepsFor('article').length !== 9 || frozenCore.core.stepsFor('video').length !== 10) throw new Error('冻结安装包中的多类型能力不完整');
await atomic(join(root, 'artifacts', 'packages.json'), result); console.log(JSON.stringify(result, null, 2));
