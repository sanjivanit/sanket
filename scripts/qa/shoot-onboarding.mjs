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
await page.goto('http://localhost:5199/'); await page.reload();   // no hash, fresh profile: onboarding must be the default
const shot = async (n) => { await page.evaluate(() => document.fonts.ready); await page.clock.runFor(700); await page.screenshot({ path: `${SP}/ob/v2-${theme}-${n}.png` }); };
await page.getByRole('heading', { name: /Tap your district/ }).waitFor(); console.log('default entry is onboarding: yes');
await shot('1a-empty');
await page.locator('svg.dmap circle.district').click(); await page.clock.runFor(150); await page.screenshot({ path: `${SP}/ob/v2-${theme}-1b-pulse.png` });
await shot('1c-clinics');
await page.getByRole('radio', { name: /District Medical Officer/ }).click(); await shot('1d-role');
await page.getByRole('button', { name: 'Continue as demo DMO' }).click(); await page.getByRole('heading', { name: /Choose the waybill language/ }).waitFor();
await page.waitForTimeout(6000); await shot('2a-live-marathi');
const note = await page.locator('.wb-live .src').first().textContent().catch(() => null); console.log('screen 2 source note:', note);
await page.getByRole('radio', { name: /^தமிழ்/ }).click(); await page.waitForTimeout(6000); await shot('2b-live-tamil');
await page.getByRole('radio', { name: /^मराठी/ }).click(); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('heading', { name: /One safety rule/ }).waitFor();
await page.getByRole('checkbox').click(); await shot('3b-ack');
await page.getByRole('button', { name: 'Start the guided run' }).click();
for (const [ms, n] of [[800, '3c-map'], [6000, '3d-day2'], [10000, '3e-day4'], [4000, '3f-stepper'], [5000, '3g-delivered']]) { await page.clock.runFor(ms); await page.waitForTimeout(700); await shot(n); }
await ctx.close(); await browser.close(); console.log('errors:', errors.length ? errors : 'none');
