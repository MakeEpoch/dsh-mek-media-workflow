import { posix } from 'node:path';
// Keep imported dependency paths inside the same registered revision. Route access still checks the manifest.
export function rewriteDocumentAssets(content, assetPath, urlFor, { css = false } = {}) {
  const parts = assetPath.split('/'), revisionRoot = parts.slice(0, 3).join('/');
  const rewrite = source => {
    if (!source || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(source)) return source;
    const clean = source.split(/[?#]/)[0]; let decoded; try { decoded = decodeURIComponent(clean); } catch { return source; }
    const path = posix.normalize(posix.join(posix.dirname(assetPath), decoded));
    if (!(path === revisionRoot || path.startsWith(`${revisionRoot}/`))) return '';
    return urlFor(path);
  };
  let output = content.replace(/url\(\s*(["']?)([^"')\s]+)\1\s*\)/gi, (_m, _q, src) => `url("${rewrite(src).replaceAll('"', '&quot;')}")`);
  if (!css) output = output.replace(/\b(src|href|poster)\s*=\s*(["'])([^"']+)\2/gi, (_m, attr, _q, src) => `${attr}="${rewrite(src).replaceAll('"', '&quot;')}"`);
  return output;
}
