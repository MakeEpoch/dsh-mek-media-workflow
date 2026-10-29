import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { MediaService } from '../host/service.js';
import { registerRpc } from '../dsh/index.js';

export async function serve({ root, port = 0, service = new MediaService({ root }) } = {}) {
  const routes = new Map(); registerRpc({ connection: { fetch: { register(route) { routes.set(route.path, route); return () => routes.delete(route.path); } } } }, service);
  const bundle = fileURLToPath(new URL('../../../artifacts/demo/app.js', import.meta.url));
  const server = createServer(async (req, res) => {
    try {
      if (![`127.0.0.1:${server.address().port}`, `localhost:${server.address().port}`].includes(req.headers.host)) { res.writeHead(403).end(); return; }
      const url = new URL(req.url, 'http://127.0.0.1'), route = routes.get(url.pathname);
      if (route) {
        if (!route.methods.includes(req.method)) { res.writeHead(405).end(); return; }
        const host = req.headers.host;
        if (req.headers.origin && req.headers.origin !== `http://${host}`) { res.writeHead(403).end(); return; }
        const request = new Request(`http://${host}${req.url}`, { method: req.method, headers: req.headers, ...(req.method === 'POST' ? { body: Readable.toWeb(req), duplex: 'half' } : {}) });
        const response = await route.fetch(request); res.writeHead(response.status, Object.fromEntries(response.headers));
        if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end(); return;
      }
      if (url.pathname === '/app.js') { res.writeHead(200, { 'content-type': 'application/javascript' }); res.end(await readFile(bundle)); return; }
      if (url.pathname !== '/') { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'" });
      res.end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>媒体工作台 · 本地开发</title><style>html,body,#app{margin:0;height:100%;color-scheme:light dark}body{font-family:system-ui}#app{display:flex;flex-direction:column}</style><div id="app"></div><script type="module" src="/app.js"></script></html>');
    } catch (error) { if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' }); res.end(error.message); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  return { server, service, url: `http://127.0.0.1:${server.address().port}`, async close() { await service.dispose(); await new Promise(resolve => server.close(resolve)); } };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(process.env.MEDIA_WORKFLOW_HOME || fileURLToPath(new URL('../../../.data/', import.meta.url)));
  const app = await serve({ root, port: Number(process.env.PORT || 3188) });
  console.log(`${app.url}\n本地开发服务使用 ${root}；未连接 DSH 模型时可通过阶段结果导入继续。`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
}
