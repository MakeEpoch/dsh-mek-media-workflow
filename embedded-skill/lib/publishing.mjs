import { readFile } from 'node:fs/promises';
import { workType } from './profiles.mjs';
import { join, dirname, basename } from 'node:path';
import { atomic, json, now, digest, fail, safeError, webUrl, inside, fileDigest } from './common.mjs';
import { command, parseOutput } from './process.mjs';

export const publishType = brief => ({ video: 'shortVideo', article: 'article', 'image-post': 'imageText' })[workType(brief)];
const verifiedKinds = new Set(['success_toast', 'completion_page', 'work_status', 'api_receipt', 'public_url']);
export function receiptResult(response, platform) {
  let root = response?.result ?? response;
  if (root?.result && !Array.isArray(root.platforms) && !root.results && !root.platformResults) root = root.result;
  const candidates = Array.isArray(root?.results) ? root.results : Array.isArray(root?.platforms) ? root.platforms : root?.platformResults ? Object.entries(root.platformResults).map(([p, v]) => ({ platform: p, ...v })) : root?.results && typeof root.results === 'object' ? Object.entries(root.results).map(([p, v]) => ({ platform: p, ...v })) : [];
  const result = candidates.find(x => x.platform === platform || x.platformId === platform) ?? (root?.platform === platform ? root : null);
  if (!result) return { status: root?.status === 'failed' ? 'failed' : 'needs_check', detail: '回执未包含可确认的目标平台结果', evidence: null, url: null };
  const outcome = result.outcome ?? result;
  const publish = outcome.fields?.publish, evidence = publish?.evidence ?? outcome.evidence, kinds = (Array.isArray(evidence) ? evidence : [evidence]).filter(Boolean).map(e => typeof e === 'string' ? e : e.kind);
  if (outcome.publishEvidence) kinds.push(outcome.publishEvidence);
  const urlValue = outcome.publicUrl ?? outcome.url ?? publish?.url ?? (Array.isArray(evidence) ? evidence : [evidence]).find(e => e?.url)?.url;
  let url = null; if (urlValue) { try { url = webUrl(urlValue); } catch {} }
  const lifecycle = outcome.lifecycle?.status ?? outcome.lifecycle ?? publish?.lifecycle?.status ?? publish?.lifecycle;
  if (publish?.status === 'applied' && lifecycle === 'published' && kinds.some(k => verifiedKinds.has(k)) && url) return { status: 'verified', detail: '平台返回发布证据及公共链接', evidence, url };
  if (['failed', 'rejected'].includes(outcome.status) || publish?.status === 'failed') return { status: 'failed', detail: outcome.message ?? publish?.message ?? '平台明确返回失败', evidence, url };
  if (lifecycle === 'filled' || outcome.status === 'filled') return { status: 'filled', detail: '编辑器已填入，尚不能确认发布', evidence, url };
  return { status: 'needs_check', detail: '提交或回执存在不确定性，需要核查，不能自动重发', evidence, url };
}
export class PostFaroPublisher {
  constructor(settings) { this.settings = settings; }
  async call(args, options = {}) { return parseOutput(await command(this.settings.postfaro, args, { timeoutMs: 40000, allowFailure: true, ...options })); }
  flags(brief) {
    const bridge = brief.publish.bridgeId || this.settings.bridgeId;
    if (!/^bridge-[a-f0-9]{32}$/.test(bridge)) fail('bridge-required', '请在设置或任务需求中选择实际 PostFaro 浏览器桥接');
    return ['--bridge-id', bridge, '--browser-context', brief.publish.browserContext];
  }
  async preflight(brief, signal) {
    const flags = this.flags(brief), capabilities = await this.call(['capabilities', ...flags], { signal });
    if (!capabilities.ok) fail('bridge-unavailable', capabilities.error?.message || '浏览器扩展能力不可用');
    const result = capabilities.result;
    const version = result?.extensionVersion ?? result?.bridgeTarget?.extensionVersion ?? result?.version;
    if (!version || !/^\d+\.\d+\.\d+/.test(version) || version.split('.').slice(0, 3).map(Number).reduce((a, n) => a * 1000 + n, 0) < 1000006) fail('extension-required', '需要确认 PostFaro 扩展为 1.0.6 或更新的兼容版本');
    const type = publishType(brief), platforms = result.platforms?.[type] ?? result.supportedPlatforms?.[type];
    if (!Array.isArray(platforms)) fail('capabilities-unknown', `扩展没有返回可识别的 ${type} 平台能力`);
    const accounts = [];
    for (const target of brief.publish.targets) {
      if (!platforms.some(p => (typeof p === 'string' ? p : p.id) === target.platform)) fail('unsupported-platform', `当前扩展未确认支持 ${target.platform} 的 ${type} 内容`);
      const accountReply = await this.call(['accounts', '--platform', target.platform, '--refresh', ...flags], { signal });
      const a = accountReply.result?.accounts?.find(a => a.platform === target.platform);
      const checkedAt = Number(a?.checkedAt), age = Date.now() - checkedAt;
      if (!accountReply.ok || a?.loggedIn !== true || a.stale || !['detector', 'page'].includes(a.source) || !Number.isFinite(checkedAt) || checkedAt <= 0 || age < -60000 || age > 15 * 60 * 1000) fail('account-unknown', `${target.platform} 的当前登录账号尚未确认；请在选定浏览器中检查后重试`);
      if (a.displayName !== target.account) fail('account-mismatch', `${target.platform} 当前账号与需求指定账号不一致`);
      accounts.push({ targetId: target.id, ...a });
    }
    return { checkedAt: now(), capabilities: result, accounts };
  }
  async prepare({ brief, packaging, video, cover, document, images = [], dir, taskId, runRevision, signal }) {
    const flags = this.flags(brief), preflight = await this.preflight(brief, signal), prepared = [];
    const type = publishType(brief), assets = type === 'shortVideo' ? [{ path: video.absolutePath, role: 'media' }, { path: cover.absolutePath, role: 'cover' }] : images.map(a => ({ path: a.absolutePath, role: 'media' }));
    if (type === 'imageText' && !images.length) fail('artifact-missing', '图组发布需要实际图片');
    let articleHtml = type === 'article' ? await readFile(document.absolutePath, 'utf8') : null;
    if (articleHtml) {
      const replacements = new Map();
      for (const match of articleHtml.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
        const src = match[1]; if (replacements.has(src)) continue;
        let path, name; const encoded = /^data:(image\/(png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(src);
        if (encoded) { const bytes = Buffer.from(encoded[3], 'base64'); name = `article-image-${digest(bytes).slice(0, 20)}.${encoded[2] === 'jpeg' ? 'jpg' : encoded[2]}`; path = join(dir, name); await atomic(path, bytes); }
        else { if (/^(?:[a-z]+:|\/|\\)/i.test(src)) fail('publish-prepare-failed', '文章图片需要实际本地素材，不能引用远程或临时编辑器地址'); path = inside(dirname(document.absolutePath), decodeURIComponent(src.split(/[?#]/)[0])); name = `article-image-${(await fileDigest(path)).slice(0, 20)}-${basename(path)}`; const bytes = await readFile(path); path = join(dir, name); await atomic(path, bytes); }
        replacements.set(src, name); if (!assets.some(a => a.path === path)) assets.push({ path, role: 'media' });
      }
      articleHtml = articleHtml.replace(/(<img\b[^>]*\bsrc=)["']([^"']+)["']/gi, (match, prefix, src) => replacements.has(src) ? `${prefix}"${replacements.get(src)}"` : match);
    }
    const assetHashes = []; for (const asset of assets) assetHashes.push([asset.role, await fileDigest(asset.path)]);
    for (const target of brief.publish.targets) {
      const item = packaging.targets.find(p => p.targetId === target.id), content = { ...item, extra: { ...item.extra, ...target.extra } };
      if (target.platform === 'jike' && !target.expectedTarget) fail('target-required', '即刻发布需要明确目标圈子');
      const input = { requestId: `mw-${taskId}-${runRevision}-${digest([target.id, item, type, video?.sha256, document?.sha256, images.map(a => a.sha256), assetHashes]).slice(0, 18)}`, bridgeId: flags[1], browserContext: brief.publish.browserContext, type, platforms: [target.platform], groupName: brief.title.slice(0, 80),
        data: { title: content.title, content: articleHtml ?? content.content, ...(articleHtml ? { rawContent: articleHtml } : {}), description: content.content, tags: content.tags, extra: { [target.platform]: content.extra }, publishGuard: { version: 1, requirePublicUrl: true, expectedTargets: target.expectedTarget ? { [target.platform]: target.expectedTarget } : {} } },
        assets };
      const file = join(dir, `${target.id.replace(/[^\w-]/g, '_')}.task.json`); await atomic(file, input);
      const validation = await this.call(['prepare', '--input', file], { signal });
      if (!validation.ok) fail('publish-prepare-failed', validation.error?.message || `${target.platform} 发布参数校验失败`);
      prepared.push({ target, input, file, validation });
    }
    return { prepared, preflight };
  }
  async execute(item, brief, { onEvent, onProcess } = {}) {
    // No automatic retry, timeout or abort: the CLI owns the asset server and login wait.
    try { const raw = await this.call(['publish', '--yes', '--input', item.file], { timeoutMs: 0, onEvent, onProcess }); return { raw, ...receiptResult(raw, item.target.platform), checkedAt: now() }; }
    catch (error) { return { raw: null, status: 'needs_check', detail: safeError(error), evidence: null, url: null, checkedAt: now() }; }
  }
  async verify(receipt, brief, signal) {
    const raw = await this.call(['status', receipt.requestId, '--wait', '30', ...this.flags(brief)], { signal });
    return { raw, ...receiptResult(raw, receipt.platform), checkedAt: now() };
  }
  async cancel(receipt, brief) { return this.call(['cancel', receipt.requestId, ...this.flags(brief)], { timeoutMs: 15000 }); }
  async discover(method, payload = {}, signal) {
    if (method === 'bridges') return this.call(['bridges', 'list'], { signal });
    const brief = { publish: { bridgeId: payload.bridgeId || this.settings.bridgeId, browserContext: payload.browserContext || this.settings.browserContext } };
    if (!['accounts', 'capabilities', 'platforms', 'combos'].includes(method)) fail('invalid-operation', '未知的发布查询');
    return this.call([method, ...(method === 'accounts' && payload.refresh ? ['--refresh'] : []), ...this.flags(brief)], { signal });
  }
}
