import { existsSync } from 'node:fs';
import { core, common } from './runtime.js';
// The release embeds this exact skill package; the source checkout uses its sibling.
const sourceCheckout = existsSync(new URL('../src/index.jsx', import.meta.url)) && existsSync(new URL('../../media-workflow-skill/lib/index.mjs', import.meta.url));
const base = sourceCheckout ? '../../media-workflow-skill/' : '../embedded-skill/';
export const coreBase = new URL(base, import.meta.url);
// Static compiled dependency lets DSH HMR replace the entire running engine.
// CLI resources remain the exact embedded skill source.
export { core, common };
