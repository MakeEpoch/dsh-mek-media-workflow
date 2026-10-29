import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { args } from '../packages/media-workflow-skill/scripts/args.mjs';
import { atomic, fail, webUrl } from '../packages/media-workflow-skill/lib/common.mjs';

const a = args(), manifest = JSON.parse(await readFile(new URL('../packages/dsh-media-workflow/package.json', import.meta.url), 'utf8'));
if (!['npm', 'git'].includes(a.source) || !/^\d+$/.test(String(a['published-at'] || ''))) fail('release-required', '实际发行后请提供 --source npm|git 和 --published-at UNIX秒；不伪造发布时间');
let source;
if (a.source === 'npm') source = { type: 'npm', ...(a.registry ? { registry: webUrl(a.registry) } : {}) };
else { if (!/^[a-f0-9]{40}$/.test(a.commit || '')) fail('commit-required', 'Git 发行源需要实际 40 位提交 SHA'); source = { type: 'git', url: webUrl(a.url), commit: a.commit, path: a.path || 'media-workflow/packages/dsh-media-workflow' }; }
const index = { format: 1, title: '媒体工作流', description: '通用技能与 DSH 媒体工作台', metadata: { categories: { media: { title: '媒体制作' } }, labels: {}, sortKeys: {} }, plugins: [{ name: manifest.name, title: '媒体工作流', description: manifest.description, metadata: { category: 'media', keywords: ['media', 'video', 'review', 'skills'], labels: [], sortKeys: {} }, versions: [{ version: manifest.version, publishTimestamp: Number(a['published-at']), source, engines: { dsh: manifest.engines.dsh } }] }] };
await atomic(a.output || fileURLToPath(new URL('../market-index.json', import.meta.url)), index);
console.log('已生成市场索引；此命令不发布 npm 包或上传索引。');
