#!/usr/bin/env node
import { normalizeBrief } from '../lib/schema.mjs';
import { atomic, json } from '../lib/common.mjs';
import { args, cli } from './args.mjs';
const a = args();
cli(async () => { const value = normalizeBrief(await json(a.input), { draft: a.draft === true }); if (a.output) await atomic(a.output, value); return value; });
