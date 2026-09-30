// stack several screenshots (full width) vertically into one image, scaled down
import fs from 'node:fs';
import { PNG } from 'pngjs';
const [,, out, scale, ...files] = process.argv;
const sc = +scale;
const imgs = files.map((f) => PNG.sync.read(fs.readFileSync(f)));
const W = Math.round(imgs[0].width * sc), H = Math.round(imgs[0].height * sc), gap = 6;
const o = new PNG({ width: W, height: H * imgs.length + gap * (imgs.length - 1) });
o.data.fill(200);
imgs.forEach((im, k) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = Math.min(im.width - 1, Math.floor(x / sc)), sy = Math.min(im.height - 1, Math.floor(y / sc)); const si = (sy * im.width + sx) * 4, di = ((y + k * (H + gap)) * W + x) * 4; o.data[di] = im.data[si]; o.data[di + 1] = im.data[si + 1]; o.data[di + 2] = im.data[si + 2]; o.data[di + 3] = 255; } });
fs.writeFileSync(out, PNG.sync.write(o));
