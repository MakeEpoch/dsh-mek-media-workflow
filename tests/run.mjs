// Run under one node:test harness so individual assertions remain visible.
await import('./contracts.test.mjs');
await import('./workflow.test.mjs');
await import('./media.test.mjs');
await import('./mimo.test.mjs');
await import('./advanced.test.mjs');
await import('./lifecycle.test.mjs');
await import('./workspace.test.mjs');
await import('./guidance.test.mjs');
await import('./content.test.mjs');

await import('./publications.test.mjs');

await import('./extensions.test.mjs');
