/** Isolated UX preview. Only fictional sample content is generated locally. */
import { resolve, join } from 'node:path';
import { MediaService } from '../packages/dsh-media-workflow/host/service.js';
import { serve } from '../packages/dsh-media-workflow/scripts/dev.mjs';
import { fixtureBrief, generationFixture } from '../tests/helpers.mjs';
import { fail } from '../packages/media-workflow-skill/lib/common.mjs';

const root = resolve('artifacts/ux-preview'), service = new MediaService({ root, locationFile: join(root, 'preview-location.json') });
service.runner.generate = async (kind, payload) => {
  if (!payload.brief.sources.some(s => s.text?.includes('仅为软件回归夹具'))) fail('preview-only', '这是独立交互预览，未接入真实内容模型。可查看虚构样例或在 DSH 正式任务中制作。');
  return generationFixture(kind, payload);
};
if (!(await service.store.list()).total) {
  await service.create({ brief: fixtureBrief({ title: '产品介绍 · 等待补充真实素材（虚构样例）', style: 'product' }), draft: true });
  const review = await service.create({ brief: fixtureBrief({ title: '一条资讯，如何讲清楚（虚构样例）' }) });
  await service.runner.start(review.state.id, { approveBrief: true }); await service.runner.run(review.state.id);
  const done = await service.create({ brief: fixtureBrief({ title: '成片与工程交付（虚构样例）', review: { mode: 'none' }, output: { width: 640, height: 360, fps: 24, durationSeconds: 1.2 } }) });
  await service.runner.start(done.state.id); await service.runner.run(done.state.id);
}
const app = await serve({ service, port: Number(process.env.PORT || 3189) });
console.log(`${app.url}\n独立交互预览；虚构样例，不连接日常 DSH 任务。`);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
