import { workType } from './profiles.mjs';
import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { atomic, digest, regular, now, mime, fail, expand, fileDigest } from './common.mjs';
import { command } from './process.mjs';

export function plainHtml(html) {
  return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
}
export async function collectSources(brief, directory, { signal, fetcher = fetch } = {}) {
  await mkdir(directory, { recursive: true }); const materials = [];
  for (const source of brief.sources) {
    signal?.throwIfAborted();
    let bytes, localPath, localInfo, contentType, originalName = source.name, extracted = source.text;
    if (source.path) { localPath = expand(source.path); localInfo = await regular(localPath, 2 * 1024 * 1024 * 1024); originalName = basename(localPath); contentType = mime(localPath); }
    else if (source.text) { bytes = Buffer.from(source.text); contentType = 'text/plain'; originalName += '.txt'; }
    else {
      let response; try { response = await fetcher(source.url, { signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(30000)]), redirect: 'follow', headers: { 'user-agent': 'media-workflow/0.1 (user-requested source retrieval)' } }); }
      catch (e) { if (signal?.aborted) throw e; fail('source-unavailable', `无法读取来源 ${source.name}；可以上传原始资料后继续`); }
      if (!response.ok) fail('source-unavailable', `来源 ${source.name} 返回 HTTP ${response.status}`);
      const chunks = []; let size = 0;
      for await (const chunk of response.body) { size += chunk.length; if (size > 20 * 1024 * 1024) { await response.body.cancel?.().catch(() => {}); fail('source-too-large', '联网读取资料最多 20MB；较大素材请使用本地文件'); } chunks.push(chunk); }
      bytes = Buffer.concat(chunks); contentType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
      originalName = basename(new URL(response.url || source.url).pathname) || source.id;
    }
    const extension = extname(originalName) || ({ 'text/html': '.html', 'text/plain': '.txt', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' })[contentType] || '.bin';
    const name = `${source.id.replace(/[^\w-]/g, '_')}${extension}`, path = join(directory, name);
    if (localPath) await copyFile(localPath, path); else await atomic(path, bytes);
    if (!extracted && contentType?.startsWith('text/')) { if ((localInfo?.size ?? bytes.length) > 2 * 1024 * 1024) fail('source-too-long', `文字资料 ${source.name} 过长，请拆分后导入`); const body = bytes ?? await readFile(path); extracted = contentType.includes('html') ? plainHtml(body.toString('utf8')) : body.toString('utf8'); }
    if (!extracted && contentType === 'application/pdf') {
      try { extracted = (await command('pdftotext', ['-layout', path, '-'], { signal, timeoutMs: 30000 })).stdout; }
      catch { extracted = ''; }
    }
    if ((extracted?.length ?? 0) > 200000) fail('source-too-long', `资料 ${source.name} 超过正文上限；请拆分后导入，原始文件已保留`);
    materials.push({ ...source, originalPath: source.path || null, file: name, mime: contentType, size: localInfo?.size ?? bytes.length, sha256: await fileDigest(path), text: extracted || '', capturedAt: now() });
  }
  if (!materials.length) fail('materials-required', '请补充来源链接、原始资料或真实素材后继续');
  if (brief.style === 'product' && workType(brief) === 'video') {
    if (!materials.some(s => ['screenshot', 'video'].includes(s.role) && /^(image|video)\//.test(s.mime))) fail('real-ui-required', '产品介绍缺少真实界面截图或录屏，请补充后继续');
    if (!materials.some(s => s.role === 'logo' && s.mime.startsWith('image/'))) fail('real-logo-required', '产品介绍缺少真实 Logo，请补充原始文件');
    if (!brief.brand.attribution) fail('brand-source-required', '请补充品牌配色出处');
  }
  if (brief.style === 'product' && workType(brief) !== 'video' && !materials.some(s => /^(image|video)\//.test(s.mime))) fail('real-ui-required', '产品图文需要真实产品图片、截图或视频，请补充素材');
  return materials;
}
export function materialsMarkdown(materials) {
  return '# 素材与来源\n\n' + materials.map(m => `## ${m.name}\n\n- 标识：${m.id}\n- 用途：${m.role}\n- 文件：${m.file}\n- 来源：${m.url || m.attribution || m.originalPath || '用户提供的正文'}\n- 可用范围：${m.usage || '未声明'}\n- 采集时间：${m.capturedAt}\n- SHA256：${m.sha256}\n\n${m.text ? m.text.slice(0, 1800) : '二进制素材，文字语义未自动读取。'}\n`).join('\n');
}
