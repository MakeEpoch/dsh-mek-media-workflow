import { createRequire } from 'node:module';
import { mkdir, cp, rm, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url), root = fileURLToPath(new URL('../', import.meta.url));
const { build } = require(process.env.DSH_ESBUILD_MODULE || 'esbuild');
const skill = new URL('../../media-workflow-skill/', import.meta.url), own = JSON.parse(await readFile(new URL('../package.json', import.meta.url))), shared = JSON.parse(await readFile(new URL('package.json', skill)));
if (own.version !== shared.version) throw new Error('插件与技能包版本必须同步');
await rm(new URL('../embedded-skill/', import.meta.url), { recursive: true, force: true });
await cp(skill, new URL('../embedded-skill/', import.meta.url), { recursive: true, filter: path => !path.includes('/node_modules') });
await build({
  absWorkingDir: root,
  stdin: { contents: "export * as core from '../media-workflow-skill/lib/index.mjs'; export * as common from '../media-workflow-skill/lib/common.mjs';", resolveDir: root, sourcefile: 'host-runtime-entry.mjs' },
  bundle: true, platform: 'node', format: 'esm', target: ['node22'],
  outfile: fileURLToPath(new URL('../host/runtime.js', import.meta.url)),
  // process.mjs resolves the Python adapter relative to its source skill path.
  define: { 'import.meta.url': '__mediaSkillSourceUrl' },
  banner: { js: "// Generated from the shared skill; do not edit.\nconst __mediaSkillSourceUrl = new URL('../embedded-skill/lib/process.mjs', import.meta.url).href;" },
});
const result = await build({ absWorkingDir: root, entryPoints: ['src/index.jsx'], bundle: true, write: false, platform: 'browser', format: 'cjs', target: ['chrome110'], external: ['react'], legalComments: 'none', jsx: 'transform' });
await mkdir(new URL('../lib/', import.meta.url), { recursive: true });
await writeFile(new URL('../lib/client.js', import.meta.url), `// Generated DSH ModuleLoader bundle.\nwindow.__ModuleLoader__.load({id:"dsh-mek-media-workflow",factory:(require)=>{var module={exports:{}};var exports=module.exports;\n${result.outputFiles[0].text}\nreturn module.exports;}});\n`);
if (process.argv.includes('--demo')) {
  await mkdir(new URL('../../../artifacts/demo/', import.meta.url), { recursive: true });
  await build({ absWorkingDir: root, entryPoints: ['src/demo.jsx'], bundle: true, outfile: fileURLToPath(new URL('../../../artifacts/demo/app.js', import.meta.url)), platform: 'browser', format: 'esm', target: ['chrome110'], nodePaths: process.env.DSH_NODE_MODULES ? [resolve(process.env.DSH_NODE_MODULES)] : [] });
}
console.log(`Built DSH client (${result.outputFiles[0].text.length} bytes) and embedded skill ${shared.version}`);
