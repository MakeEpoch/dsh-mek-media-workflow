#!/usr/bin/env node
import { renderComposition, resolveComposition } from '../lib/media.mjs';
import { dirname, resolve } from 'node:path';
import { json } from '../lib/common.mjs';
import { validateSettings } from '../lib/schema.mjs';
import { args, cli } from './args.mjs';
const a = args();
cli(async () => { const project = resolveComposition(await json(a.input), dirname(resolve(a.input))), settings = validateSettings(a.settings ? await json(a.settings) : {}); await renderComposition(project, a.output, settings); return { output: a.output }; });
