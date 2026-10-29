#!/usr/bin/env node
import { synthesizeVoice } from '../lib/media.mjs';
import { json } from '../lib/common.mjs';
import { validateSettings, normalizeBrief } from '../lib/schema.mjs';
import { args, cli } from './args.mjs';
const a = args();
cli(async () => { const input = await json(a.input); return { files: await synthesizeVoice(normalizeBrief(input.brief), input.script, input.storyboard, input.materials ?? [], a.output, validateSettings(input.settings), undefined, undefined, input.alignment) }; });
