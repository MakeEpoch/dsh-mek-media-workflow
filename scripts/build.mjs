import { createRequire } from 'node:module';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url), root = fileURLToPath(new URL('../', import.meta.url));
const { build } = require(process.env.DSH_ESBUILD_MODULE || 'esbuild');
const check = process.argv.includes('--check');
const skill = new URL('../embedded-skill/', import.meta.url);
const own = JSON.parse(await readFile(new URL('../package.json', import.meta.url))), shared = JSON.parse(await readFile(new URL('package.json', skill)));
if (own.version !== shared.version) throw new Error('插件与技能包版本必须同步');

const result = await build({
  absWorkingDir: root,
  stdin: { contents: "export * as core from './embedded-skill/lib/index.mjs'; export * as common from './embedded-skill/lib/common.mjs';", resolveDir: root, sourcefile: 'host-runtime-entry.mjs' },
  bundle: true, write: false, platform: 'node', format: 'esm', target: ['node22'],
  outfile: 'lib/runtime.js',
  // process.mjs resolves the Python adapter relative to its source skill path.
  define: { 'import.meta.url': '__mediaSkillSourceUrl' },
  banner: { js: "// Generated from the shared skill; do not edit.\nconst __mediaSkillSourceUrl = new URL('../embedded-skill/lib/process.mjs', import.meta.url).href;" },
});
const client = await build({ absWorkingDir: root, entryPoints: ['src/index.jsx'], bundle: true, write: false, platform: 'browser', format: 'cjs', target: ['chrome110'], external: ['react'], legalComments: 'none', jsx: 'transform' });
const outputs = {
  'lib/runtime.js': result.outputFiles[0].text,
  'lib/client.js': `// Generated DSH ModuleLoader bundle.\nwindow.__ModuleLoader__.load({id:${JSON.stringify(own.name)},factory:(require)=>{var module={exports:{}};var exports=module.exports;\n${client.outputFiles[0].text}\nreturn module.exports;}});\n`,
};
const license = new URL('../LICENSE', import.meta.url);
if (check) outputs['embedded-skill/LICENSE'] = await readFile(license, 'utf8');
else await Promise.all([mkdir(new URL('../lib/', import.meta.url), { recursive: true }), copyFile(license, new URL('LICENSE', skill))]);
for (const [path, text] of Object.entries(outputs)) {
  const url = new URL(`../${path}`, import.meta.url);
  if (check) {
    const actual = await readFile(url, 'utf8').catch(error => { if (error.code !== 'ENOENT') throw error; });
    if (actual !== text) throw new Error(`${path} 缺失或过期；请运行 npm run build，并将更新后的产物随源码提交`);
  } else await writeFile(url, text);
}
if (!check && process.argv.includes('--demo')) {
  await mkdir(new URL('../artifacts/demo/', import.meta.url), { recursive: true });
  await build({ absWorkingDir: root, entryPoints: ['src/demo.jsx'], bundle: true, outfile: fileURLToPath(new URL('../artifacts/demo/app.js', import.meta.url)), platform: 'browser', format: 'esm', target: ['chrome110'], nodePaths: process.env.DSH_NODE_MODULES ? [resolve(process.env.DSH_NODE_MODULES)] : [] });
}
console.log(`${check ? 'Verified' : 'Built'} DSH client (${client.outputFiles[0].text.length} bytes) and embedded skill ${shared.version}`);
