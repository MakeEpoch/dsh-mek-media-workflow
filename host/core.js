import { core, common } from '../lib/runtime.js';
export const coreBase = new URL('../embedded-skill/', import.meta.url);
// Static compiled dependency lets DSH HMR replace the entire running engine.
// CLI resources remain the exact embedded skill source.
export { core, common };
