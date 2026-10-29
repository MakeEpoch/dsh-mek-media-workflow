import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { PostFaroPublisher } from '../packages/media-workflow-skill/lib/publishing.mjs';
import { atomic, digest } from '../packages/media-workflow-skill/lib/common.mjs';

const root = resolve('artifacts/publish-contract-smoke'); await mkdir(root, { recursive: true });
const bytes = await readFile('artifacts/understanding-smoke/ocr.png');
for (const name of ['page-01.png','page-02.png']) await atomic(join(root, name), bytes);
const html = `<!doctype html><meta charset="utf-8"><h1>软件参数校验，不发布</h1><p>这是本地测试正文。</p><img src="data:image/png;base64,${bytes.toString('base64')}">`; await atomic(join(root, 'article.html'), html);
const publisher = new PostFaroPublisher({ postfaro: 'postfaro', bridgeId: `bridge-${'a'.repeat(32)}` });
publisher.preflight = async () => ({ fixture: true, accountVerification: 'Not performed: local prepare-only contract check' });
const results = [];
for (const [type, platform] of [['article','weixin'], ['image-post','xiaohongshu']]) {
  const dir = join(root, type); await mkdir(dir, { recursive: true });
  const brief = { title: '软件参数校验', work: { type }, publish: { bridgeId: `bridge-${'a'.repeat(32)}`, browserContext: 'regular', targets: [{ id: platform, platform, account: '夹具账号，不作身份验收', extra: {} }] } };
  const prepared = await publisher.prepare({ brief, packaging: { targets: [{ targetId: platform, title: '本地测试', content: '只检查参数，不执行填充或发布。', tags: [], extra: {} }] }, document: { absolutePath: join(root, 'article.html'), sha256: digest(html) }, images: type === 'image-post' ? ['page-01.png','page-02.png'].map(name => ({ absolutePath: join(root, name), sha256: digest(bytes) })) : [], dir, taskId: 'local-contract-smoke', runRevision: 1 });
  const item = prepared.prepared[0]; if (!item.validation.ok) throw Error(JSON.stringify(item.validation));
  results.push({ type: item.input.type, platform, assets: item.input.assets.length, validation: item.validation, execution: 'not requested' });
}
await atomic(join(root, 'result.json'), { passed: true, results, boundary: 'Real installed PostFaro CLI prepare only. Account preflight is an explicit fixture, live bridge capabilities were checked separately. No fill/publish call.' });
console.log(JSON.stringify({ passed: true, results: results.map(r => ({ type: r.type, platform: r.platform, assets: r.assets, ok: r.validation.ok })), execution: 'none' }));
