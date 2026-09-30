import fs from 'node:fs';
import { PNG } from 'pngjs';
const [,, out, x, y, w, h, ...files] = process.argv;
const imgs = files.map((f) => PNG.sync.read(fs.readFileSync(f)));
const W = +w, H = +h, gap = 8;
const o = new PNG({ width: W, height: H * imgs.length + gap * (imgs.length - 1) });
o.data.fill(255);
imgs.forEach((im, i) => PNG.bitblt(im, o, +x, +y, W, H, 0, i * (H + gap)));
fs.writeFileSync(out, PNG.sync.write(o));
