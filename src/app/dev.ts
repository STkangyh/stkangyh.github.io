// Dev server: serve dist/, rebuild when a source file changes, reload the page.
// This is the one thing a bundler would have given us that our own build could
// not — everything else it offers (hashing, minification) is already here or
// not worth a dependency tree.
import { createServer } from 'node:http';
import type { ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { build } from './build.ts';
import { paths } from '../shared/config/index.ts';

const ROOT = paths.root;
const DIST = paths.dist;
const PORT = Number(process.env.PORT || 5173);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2',
};

const RELOAD: string = `<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`;

let clients: ServerResponse[] = [];

const server = createServer(async (req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');

  if (path === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.push(res);
    req.on('close', () => { clients = clients.filter(c => c !== res); });
    return;
  }

  let file = join(DIST, path.endsWith('/') ? path + 'index.html' : path);
  // Keep a crafted path from escaping dist/.
  if (!resolve(file).startsWith(DIST + sep) && resolve(file) !== DIST) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const ext = extname(file) || '.html';
    if (!extname(file)) file = join(file, 'index.html');
    const raw = await readFile(file);
    const body: Buffer | string = ext === '.html'
      ? String(raw).replace('</body>', RELOAD + '</body>')
      : raw;
    res.writeHead(200, { 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<pre style="font:14px ui-monospace;padding:2rem">404 ${path}</pre>${RELOAD}`);
  }
});

let timer: NodeJS.Timeout | undefined;
let running = false;

async function rebuild(reason: string): Promise<void> {
  if (running) return;
  running = true;
  const t0 = Date.now();
  try {
    await build();
    console.log(`· rebuilt in ${Date.now() - t0}ms (${reason}) — reloading ${clients.length} client(s)`);
    for (const c of clients) c.write('data: reload\n\n');
  } catch (err) {
    console.error(`! build failed (${reason}): ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

for (const dir of ['src', 'content', 'public']) {
  watch(join(ROOT, dir), { recursive: true }, (_event, name) => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(`${dir}/${name}`), 120);
  });
}

await rebuild('startup');
server.listen(PORT, () => {
  console.log(`\n  dev server  http://localhost:${PORT}`);
  console.log(`  watching    src/ content/ public/`);
  console.log(`  note        edits to src/app/dev.ts itself need a restart\n`);
});
