import { chromium } from 'playwright-core';
import fs from 'node:fs';
import * as _os from 'node:os';
import * as _path from 'node:path';
import * as _fs from 'node:fs';
const REPO = _path.resolve(import.meta.dirname, '../..');
// Output folder for screenshots and diffs. Override with QA_OUT=/some/dir
const OUT = process.env.QA_OUT || _path.join(_os.tmpdir(), 'sanket-qa');
for (const d of ['shots', 'ob']) _fs.mkdirSync(_path.join(OUT, d), { recursive: true });

const SP = OUT;
const STATES = {
  calm:      { ref: 'step=0', nodes: [] },
  early:     { ref: 'step=2', nodes: ['Day 2'] },
  critical:  { ref: 'step=4', nodes: ['Day 4'] },
  transit:   { ref: 'step=4&phase=transit&qty=16', nodes: ['Approved'] },
  delivered: { ref: 'step=4&phase=delivered&qty=16', nodes: ['Delivered'] },
};
const extra = process.argv[2] || '';   // e.g. "tab=waybill&view=table" applied to reference; app extras handled below
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1330 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
for (const theme of ['light', 'dark']) {
  for (const [name, s] of Object.entries(STATES)) {
    // reference (the design)
    await page.goto(`file://${SP}/ref.html?theme=${theme}&${s.ref}${extra ? '&' + extra : ''}`);
    await page.waitForFunction(() => document.title === 'ref-ready');
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    await page.screenshot({ path: `${SP}/shots/ref-${theme}-${name}.png`, clip: { x: 0, y: 0, width: 1440, height: 1330 } });
    // the app
    await page.goto('http://localhost:5199/#dashboard');
    await page.evaluate((t) => { try { localStorage.setItem('sanket-theme', t); } catch {} }, theme);
    await page.reload();
    await page.getByRole('button', { name: 'Dismiss tip' }).click();
    for (const n of s.nodes) await page.getByRole('button', { name: new RegExp('^' + n) }).click();
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(900);
    await page.screenshot({ path: `${SP}/shots/app-${theme}-${name}.png`, clip: { x: 0, y: 0, width: 1440, height: 1330 } });
  }
}
await browser.close();
console.log('console errors:', errors.length ? errors : 'none');
