// Serves the built web app (dist/) from the same Cloud Run service. Zero dependencies.
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, normalize, extname, sep } from 'node:path';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json',
};

// Returns true if it answered the request. Unknown paths fall back to index.html (single-page app).
export async function serveStatic(req, res, pathname, dist = DIST) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return false;
  let rel;
  try { rel = decodeURIComponent(pathname); } catch { return false; }
  const target = normalize(join(dist, rel));
  if (target !== dist.slice(0, -1) && !target.startsWith(dist)) return false; // no path traversal
  let file = target;
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); }
  catch { file = join(dist, 'index.html'); }
  try {
    const body = await readFile(file);
    const ext = extname(file);
    const hashed = file.includes(`${sep}assets${sep}`);
    res.writeHead(200, {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'cache-control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
    return true;
  } catch { return false; }
}
