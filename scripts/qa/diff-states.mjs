import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import * as _os from 'node:os';
import * as _path from 'node:path';
import * as _fs from 'node:fs';
const REPO = _path.resolve(import.meta.dirname, '../..');
// Output folder for screenshots and diffs. Override with QA_OUT=/some/dir
const OUT = process.env.QA_OUT || _path.join(_os.tmpdir(), 'sanket-qa');
for (const d of ['shots', 'ob']) _fs.mkdirSync(_path.join(OUT, d), { recursive: true });

const SP = OUT;
const pre = process.argv[2] || '';
const rows = [];
for (const theme of ['light', 'dark']) for (const name of ['calm', 'early', 'critical', 'transit', 'delivered']) {
  const a = PNG.sync.read(fs.readFileSync(`${SP}/shots/ref-${pre}${theme}-${name}.png`)), b = PNG.sync.read(fs.readFileSync(`${SP}/shots/app-${pre}${theme}-${name}.png`));
  const d = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.12, includeAA: false });
  fs.writeFileSync(`${SP}/shots/diff-${pre}${theme}-${name}.png`, PNG.sync.write(d));
  rows.push(`${theme.padEnd(5)} ${name.padEnd(9)} ${(n / (a.width * a.height) * 100).toFixed(2)}% of pixels differ`);
}
console.log(rows.join('\n'));
