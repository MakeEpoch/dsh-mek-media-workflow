import { fail } from '../lib/common.mjs';
export function args(argv = process.argv.slice(2)) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) { const arg = argv[i]; if (arg.startsWith('--')) { const key = arg.slice(2); if (!key || Object.hasOwn(result, key)) fail('invalid-arguments', '参数为空或重复'); result[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; } else result._.push(arg); }
  return result;
}
export const output = value => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
export async function cli(fn) { try { output({ ok: true, value: await fn() }); } catch (e) { output({ ok: false, error: { code: e.code ?? 'error', message: e.message } }); process.exitCode = 1; } }
