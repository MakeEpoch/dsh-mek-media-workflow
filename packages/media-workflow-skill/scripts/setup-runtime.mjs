#!/usr/bin/env node
import { mkdir, access, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { command, parseOutput } from '../lib/process.mjs';
import { atomic, fileDigest, now, fail } from '../lib/common.mjs';
import { args, cli } from './args.mjs';

// Explicit setup only: processing a task never installs packages or downloads models.
await cli(async () => {
  const a = args(); if (!a.directory) fail('directory-required', '请指定独立运行目录 --directory');
  const root = resolve(a.directory), runtime = join(root, 'python'), python = join(runtime, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'), model = join(root, 'asr-model');
  await mkdir(root, { recursive: true });
  const requirement = fileURLToPath(new URL('./runtime-requirements.txt', import.meta.url));
  try { await access(python); } catch { await command(a.uv || 'uv', ['venv', runtime, '--python', a.python || '3.12', ...(a.offline ? ['--offline'] : [])], { timeoutMs: 10 * 60 * 1000 }); }
  await command(a.uv || 'uv', ['pip', 'install', '--python', python, '--link-mode', 'copy', '-r', requirement, ...(a.offline ? ['--offline'] : [])], { timeoutMs: 20 * 60 * 1000 });
  const hashes = {};
  if (a['reuse-model']) {
    await mkdir(model, { recursive: true });
    for (const name of ['config.json','model.bin','tokenizer.json','vocabulary.txt']) { const source = join(resolve(a['reuse-model']), name), destination = join(model, name); await copyFile(source, destination); hashes[name] = await fileDigest(source); if (await fileDigest(destination) !== hashes[name]) fail('runtime-readback', '模型复制回读不一致'); }
  } else {
    if (a.offline) { await access(join(model, 'model.bin')); }
    else await command(python, [fileURLToPath(new URL('./understand.py', import.meta.url)), '--download', '--model', a.model || 'base', '--cache', model], { timeoutMs: 30 * 60 * 1000 });
    for (const name of ['config.json','model.bin','tokenizer.json','vocabulary.txt']) hashes[name] = await fileDigest(join(model, name));
  }
  const versions = parseOutput(await command(python, [fileURLToPath(new URL('./understand.py', import.meta.url)), '--check']));
  if (!versions.ok) fail('runtime-incomplete', '素材运行环境检查未通过');
  const record = { installedAt: now(), mediaPython: python, asrModel: model, requirementsHash: await fileDigest(requirement), modelFiles: hashes, versions: versions.versions, settings: { mediaPython: python, asrModel: model, analysisMode: 'auto', analysisLanguage: 'auto' } };
  await atomic(join(root, 'runtime.json'), record); return record;
});
