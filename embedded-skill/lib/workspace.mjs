import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Never replace user guidance, including the lowercase spelling on Linux.
export async function ensureWorkspaceGuidance(root) {
  await mkdir(root, { recursive: true });
  const existing = (await readdir(root)).find(name => name.toLowerCase() === 'agents.md');
  if (existing) return { path: join(root, existing), created: false };
  const path = join(root, 'AGENTS.md');
  const content = await readFile(new URL('../references/workspace-AGENTS.md', import.meta.url), 'utf8');
  try { await writeFile(path, content, { flag: 'wx', mode: 0o600 }); return { path, created: true }; }
  catch (error) { if (error.code === 'EEXIST') return { path, created: false }; throw error; }
}
