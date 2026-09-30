import { chromium } from 'playwright-core';
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
const T = 'transit';
const CASES = {
  'table+B':   { ref: 'step=4&view=table&showB=1', clicks: ['Day 4', 'Table', /^District B/] },
  'charts':    { ref: 'step=4&view=charts', clicks: ['Day 4', 'Charts'] },
  'tiles+B':   { ref: 'step=4&showB=1', clicks: ['Day 4', /^District B/] },
  'waybill':   { ref: 'step=4&tab=waybill', clicks: ['Day 4', 'Waybill'] },
  'waybill-approved': { ref: 'step=4&phase=transit&qty=16&tab=waybill', clicks: ['Approved', 'Waybill'] },
  'log':       { ref: 'step=4&phase=transit&qty=16&tab=log', clicks: ['Approved', 'Log'] },
  'impact':    { ref: 'step=4&tab=impact', clicks: ['Day 4', 'Impact'] },
  'details':   { ref: 'step=4&why=1', clicks: ['Day 4', /^Details/] },
  'details-transit': { ref: 'step=4&phase=transit&qty=16&why=1', clicks: ['Approved', /^Details/] },
};
const themes = process.argv[2] ? [process.argv[2]] : ['light', 'dark'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1330 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
for (const theme of themes) for (const [name, s] of Object.entries(CASES)) {
  await page.goto(`file://${SP}/ref.html?theme=${theme}&${s.ref}`);
  await page.waitForFunction(() => document.title === 'ref-ready'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  await page.screenshot({ path: `${SP}/shots/x-ref-${theme}-${name}.png`, clip: { x: 0, y: 0, width: 1440, height: 1330 } });
  await page.addInitScript(() => localStorage.setItem('sanket-setup', JSON.stringify({ district: 'A', role: 'dmo', lang: 'mr' }))); await page.goto('http://localhost:5199/');
  await page.evaluate((t) => { try { localStorage.setItem('sanket-theme', t); } catch {} }, theme); await page.reload();
  await page.getByRole('button', { name: 'Dismiss tip' }).click();
  for (const c of s.clicks) await page.getByRole('button', { name: c instanceof RegExp ? c : new RegExp('^' + c) }).first().click();
  await page.locator('.panel-body').evaluate((e) => { e.scrollTop = 0; });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
  await page.screenshot({ path: `${SP}/shots/x-app-${theme}-${name}.png`, clip: { x: 0, y: 0, width: 1440, height: 1330 } });
  const a = PNG.sync.read(fs.readFileSync(`${SP}/shots/x-ref-${theme}-${name}.png`)), b = PNG.sync.read(fs.readFileSync(`${SP}/shots/x-app-${theme}-${name}.png`));
  const d = new PNG({ width: a.width, height: a.height });
  pixelmatch(a.data, b.data, d.data, a.width, a.height, { threshold: 0.12, includeAA: false });
  fs.writeFileSync(`${SP}/shots/x-diff-${theme}-${name}.png`, PNG.sync.write(d));
  // count diff pixels outside header (y<60) and footer band (y>1190)
  let n = 0, tot = 0; for (let y = 60; y < 1190; y++) for (let x = 0; x < 1440; x++) { tot++; const i = (y * 1440 + x) * 4; if (d.data[i] > 200 && d.data[i + 1] < 100) n++; }
  console.log(`${theme.padEnd(5)} ${name.padEnd(17)} ${(n / tot * 100).toFixed(2)}% differ (excluding header and footer bands)`);
}
await browser.close();
console.log('page errors:', errors.length ? errors : 'none');
