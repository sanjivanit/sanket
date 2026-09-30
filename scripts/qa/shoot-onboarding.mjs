import { chromium } from 'playwright-core';
import * as _os from 'node:os';
import * as _path from 'node:path';
import * as _fs from 'node:fs';
const REPO = _path.resolve(import.meta.dirname, '../..');
// Output folder for screenshots and diffs. Override with QA_OUT=/some/dir
const OUT = process.env.QA_OUT || _path.join(_os.tmpdir(), 'sanket-qa');
for (const d of ['shots', 'ob']) _fs.mkdirSync(_path.join(OUT, d), { recursive: true });

const SP = OUT;
const theme = process.argv[2] || 'light';
const browser = await chromium.launch(); const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.clock.install();
await page.goto('http://localhost:5199/'); await page.evaluate((t) => { localStorage.clear(); localStorage.setItem('sanket-theme', t); }, theme);
await page.goto('http://localhost:5199/#dashboard'); await page.reload();   // fresh profile: the splash is the only way in
const shot = async (n) => { await page.evaluate(() => document.fonts.ready); await page.clock.runFor(700); await page.screenshot({ path: `${SP}/ob/v3-${theme}-${n}.png` }); };
await page.getByRole('button', { name: 'Get started' }).waitFor(); console.log('default entry is the splash: yes');
await shot('1-splash');
await page.getByRole('button', { name: 'Get started' }).click(); await page.getByRole('heading', { name: 'Your district and role' }).waitFor(); await shot('2a-step1');
await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('heading', { name: 'Waybill language' }).waitFor();
await page.waitForTimeout(6000); await shot('2b-step2-marathi');
const note = await page.locator('.wb-live .src').first().textContent().catch(() => null); console.log('setup source note:', note);
await page.getByRole('radio', { name: /^தமிழ்/ }).click(); await page.waitForTimeout(6000); await shot('2c-step2-tamil');
await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('heading', { name: 'One safety rule' }).waitFor(); await shot('3a-step3');
await page.getByRole('checkbox').click(); await shot('3b-ack');
await page.getByRole('button', { name: 'Open dashboard' }).click(); await page.locator('.role-chip').waitFor(); await shot('4-dashboard');
await page.getByRole('button', { name: 'Take a 30-second tour' }).click();
for (const [ms, n] of [[800, '5a-tour-map'], [16000, '5b-tour-day4'], [14000, '5c-tour-end']]) { await page.clock.runFor(ms); await page.waitForTimeout(700); await shot(n); }
await ctx.close(); await browser.close(); console.log('errors:', errors.length ? errors : 'none');
