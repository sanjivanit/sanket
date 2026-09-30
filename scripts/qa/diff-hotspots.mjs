import fs from 'node:fs';
import { PNG } from 'pngjs';
import * as _os from 'node:os';
import * as _path from 'node:path';
import * as _fs from 'node:fs';
const REPO = _path.resolve(import.meta.dirname, '../..');
// Output folder for screenshots and diffs. Override with QA_OUT=/some/dir
const OUT = process.env.QA_OUT || _path.join(_os.tmpdir(), 'sanket-qa');
for (const d of ['shots', 'ob']) _fs.mkdirSync(_path.join(OUT, d), { recursive: true });

const SP = OUT;
const name = process.argv[2] || 'light-critical';
const d = PNG.sync.read(fs.readFileSync(`${SP}/shots/diff-${name}.png`));
const CELL = 60, cols = Math.ceil(d.width / CELL), rows = Math.ceil(d.height / CELL);
const cnt = Array.from({ length: rows }, () => Array(cols).fill(0));
for (let y = 0; y < d.height; y++) for (let x = 0; x < d.width; x++) { const i = (y * d.width + x) * 4; if (d.data[i] > 200 && d.data[i + 1] < 100) cnt[Math.floor(y / CELL)][Math.floor(x / CELL)]++; }
const list = []; cnt.forEach((r, ry) => r.forEach((c, rx) => c > 30 && list.push({ x: rx * CELL, y: ry * CELL, c })));
list.sort((a, b) => b.c - a.c);
console.log(list.slice(0, 18).map((o) => `x${o.x}-${o.x + CELL} y${o.y}-${o.y + CELL}: ${o.c}px`).join('\n'));
