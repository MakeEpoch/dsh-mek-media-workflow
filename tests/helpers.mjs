import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkflowRunner } from '../packages/media-workflow-skill/lib/runner.mjs';
import { atomic, digest } from '../packages/media-workflow-skill/lib/common.mjs';

export const fixtureBrief = (overrides = {}) => ({ title: '本地回归夹具（虚构资料）', description: '根据用户提供的虚构原文制作测试视频，不对外发布。', style: 'news', review: { mode: 'gates' }, sources: [{ id: 'source-1', name: '虚构回归原文', role: 'source', text: '以下内容仅为软件回归夹具：示例项目于二零二六年十月二十三日新增三个测试项目。所有数字均为虚构。' }], output: { width: 320, height: 180, fps: 24, durationSeconds: 1.2 }, voice: { mode: 'none' }, publish: { enabled: false }, ...overrides });
export const generationFixture = async (kind, payload) => {
  if (kind === 'facts') return { facts: [{ id: 'fact-1', claim: '夹具包含三个虚构测试项目', sourceId: 'source-1', quote: '新增三个测试项目', eventTime: '2026-10-23', unit: '项' }], unknowns: [] };
  if (kind === 'script') return { title: '虚构回归夹具', sections: [{ id: 'section-1', text: '这是软件回归夹具，包含三个虚构测试项目。', factIds: ['fact-1'], sourceIds: ['source-1'] }], notes: '仅测试，不作为真实资讯' };
  if (kind === 'storyboard') return { treatment: '明确展示夹具性质，以原文中的内容作为画面，使用轻微推近。', scenes: [{ id: 'scene-1', sectionId: 'section-1', title: '回归夹具 · 虚构资料', visual: '突出虚构测试项目的表述及来源说明', materialIds: ['source-1'], durationSeconds: 1.2, motion: 'push' }] };
  if (kind === 'package') return { title: '本地测试产物', description: '虚构资料，供本地软件验证。', tags: [], targets: payload.brief.publish.targets.map(t => ({ targetId: t.id, title: '回归夹具', content: '本地软件验证', tags: [], extra: {} })) };
  throw new Error(`Unexpected generation ${kind}`);
};
export async function temporary(t) { const root = await mkdtemp(join(tmpdir(), 'media-workflow-')); t.after(() => rm(root, { recursive: true, force: true })); return root; }
export async function protocolFixture(t, brief = fixtureBrief(), options = {}) {
  const root = await temporary(t), counts = {}, executions = [];
  const adapters = {};
  for (const key of ['materials', 'script', 'storyboard', 'voice', 'composition', 'qa', 'render', 'package']) adapters[key] = async ({ dir, task }) => {
    counts[key] = (counts[key] || 0) + 1;
    const filename = ({ materials: 'materials.json', script: 'script.json', storyboard: 'storyboard.json', voice: 'timeline.json', composition: 'composition.json', qa: 'qa.json', render: 'media-info.json', package: 'package.json' })[key];
    await atomic(join(dir, filename), { fixture: true, step: key, attempt: counts[key] }); const files = [filename];
    if (key === 'render') { await atomic(join(dir, 'final.mp4'), 'protocol fixture, not a video'); await atomic(join(dir, 'cover.png'), 'protocol fixture, not an image'); files.push('final.mp4', 'cover.png'); }
    return { files, checks: [] };
  };
  const publisher = {
    async preflight() { return { fixture: true }; },
    async prepare({ brief, dir, taskId, runRevision }) { const prepared = []; for (const target of brief.publish.targets) { const input = { requestId: `fixture-${taskId}-${runRevision}-${target.id}`, bridgeId: `bridge-${'0'.repeat(32)}`, browserContext: 'regular' }, file = join(dir, `${target.id}.task.json`); await atomic(file, input); prepared.push({ target, input, file }); } return { prepared, preflight: { fixture: true } }; },
    async execute(item) { executions.push(item.input.requestId); return { status: 'verified', detail: 'fixture response', url: 'https://example.invalid/fixture', raw: { fixture: true } }; },
    async verify() { return { status: 'verified', raw: { fixture: true }, url: 'https://example.invalid/fixture' }; },
  };
  const runner = new WorkflowRunner({ root, adapters: { ...adapters, publisher, ...options.adapters }, ...options });
  const task = await runner.create(brief);
  t.after(() => runner.dispose());
  return { root, runner, task, counts, publisher, executions };
}
export const publishingBrief = (mode = 'gates') => fixtureBrief({ review: { mode }, publish: { enabled: true, confirm: true, bridgeId: `bridge-${'0'.repeat(32)}`, targets: [{ id: 'target-a', platform: 'fixture', account: '虚构测试账号' }] } });

export const publicationFixture = async (kind, payload) => kind === 'publication' ? {
  title: '虚构回归夹具', treatment: payload.feedback?.length ? '根据意见更改为自然主题并调整标题。' : '用知识卡片解释夹具，不作为真实资讯。', theme: payload.feedback?.length ? 'natural' : 'knowledge-cards',
  pages: [{ id: 'page-1', title: payload.feedback?.length ? '调整后的测试说明' : '仅供软件回归', sectionIds: payload.script.sections.map(s => s.id), materialIds: [], layout: 'text' }],
} : generationFixture(kind, payload);

