#!/usr/bin/env node
import { inspectMedia } from '../lib/media.mjs';
import { normalizeBrief, validateSettings } from '../lib/schema.mjs';
import { json, atomic } from '../lib/common.mjs';
import { args, cli } from './args.mjs';
const a = args();
cli(async () => { const result = await inspectMedia(a.input, normalizeBrief(await json(a.brief)), validateSettings(a.settings ? await json(a.settings) : {})); if (a.output) await atomic(a.output, result); return result; });
