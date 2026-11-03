// Lokal testserver: kjører appen uten ekte database (alt lagres i minnet).
//   node dev/server.mjs   →  http://localhost:3000
// For å teste mot ekte Upstash i stedet: bruk `vercel dev` (se README).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Minimal Redis-etterligning med kommandoene appen bruker
const kv = new Map();
globalThis.__TGD_REDIS__ = {
  async incr(k) { const v = (Number(kv.get(k)) || 0) + 1; kv.set(k, v); return v; },
  async expire() { return 1; },
  async hincrby(k, f, n) { const h = kv.get(k) || {}; h[f] = (h[f] || 0) + n; kv.set(k, h); return h[f]; },
  async hgetall(k) { return kv.get(k) ? { ...kv.get(k) } : null; },
  async get(k) { return kv.has(k) ? kv.get(k) : null; },
  async set(k, v) { kv.set(k, v); return 'OK'; },
};

const vote = await import('../api/vote.js');
const stats = await import('../api/stats.js');

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const mod = url.pathname === '/api/vote' ? vote : url.pathname === '/api/stats' ? stats : null;
    const handler = mod && mod[req.method];
    if (!handler) { res.writeHead(405).end(); return; }
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: { ...req.headers, 'x-forwarded-for': req.socket.remoteAddress },
      body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
    });
    const r = await handler(request);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  try {
    const html = await readFile(path.join(root, 'public', 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
  } catch { res.writeHead(404).end(); }
}).listen(3000, () => console.log('http://localhost:3000'));
