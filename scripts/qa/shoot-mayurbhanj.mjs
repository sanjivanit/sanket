// Screenshots of the Mayurbhanj build: onboarding in Odia, the dashboard on the calm and critical days, the waybill,
// the table view, the telemetry slide-over and a CSV import. Usage: node scripts/qa/shoot-mayurbhanj.mjs [light|dark]
// Needs the web app on http://localhost:5199. With the API stopped the app shows "Offline fallback used", which is expected.
import { chromium } from 'playwright-core';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

const OUT = process.env.QA_OUT || path.join(os.tmpdir(), 'sanket-qa');
const dir = path.join(OUT, 'mbj'); fs.mkdirSync(dir, { recursive: true });
const theme = process.argv[2] || 'light';
const csv = path.join(dir, 'qa-import.csv');
fs.writeFileSync(csv, 'facility_name,block,latitude,longitude,asv_stock,baseline_burn_per_day,beds_total,beds_occupied,doctor_on_duty\nPHC Example One,Block A,21.90,86.70,5,2,10,5,yes\nCHC Example Two,Block A,21.95,86.75,40,3,12,4,yes\nCHC Example Three,Block A,21.85,86.65,30,2,8,2,no\n');
const bad = path.join(dir, 'qa-bad.csv');
fs.writeFileSync(bad, 'facility_name,block,latitude,longitude,asv_stock,baseline_burn_per_day,beds_total,beds_occupied,doctor_on_duty\nPHC Bad,Block A,21.90,86.70,5,2,10,11,maybe\nCHC Bad Two,Block A,95,86.75,-4,3,12,4,yes\n');

const browser = await chromium.launch();
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !/502|Bad Gateway|Failed to load resource/.test(m.text()) && errors.push(m.text()));
const shot = async (name, full = false) => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500); await page.screenshot({ path: `${dir}/${theme}-${name}.png`, fullPage: full }); };

// Onboarding, from a fresh profile
await page.goto('http://localhost:5199/');
await page.evaluate((t) => { localStorage.clear(); localStorage.setItem('sanket-theme', t); }, theme);
await page.reload();
await page.getByRole('button', { name: 'Get started' }).click();
await page.getByRole('heading', { name: 'Your district and role' }).waitFor(); await shot('1-setup-district');
await page.getByRole('button', { name: 'Continue' }).click();
await page.getByRole('heading', { name: 'Waybill language' }).waitFor();
await page.getByRole('radio', { name: /^ଓଡ଼ିଆ/ }).waitFor();
await page.waitForTimeout(2500); await shot('2-setup-odia');

// Dashboard, setup skipped
await page.evaluate(() => localStorage.setItem('sanket-setup', JSON.stringify({ district: 'mayurbhanj', role: 'dmo', lang: 'or' })));
await page.reload(); await page.locator('.role-chip').waitFor();
await shot('3-dashboard-calm');
await page.getByRole('button', { name: 'Inject crisis surge' }).click(); await page.waitForTimeout(2500);
await shot('4-dashboard-day4');
await page.getByRole('button', { name: 'Waybill' }).click(); await page.waitForTimeout(600); await shot('5-waybill-odia');
await page.getByRole('button', { name: 'Table' }).click(); await page.waitForTimeout(400); await shot('6-table');
await page.getByRole('button', { name: 'Charts' }).click(); await page.waitForTimeout(400); await shot('6b-charts');
await page.getByRole('button', { name: 'Tiles' }).click();
await page.getByRole('button', { name: /^Approve as DMO/ }).click(); await page.waitForTimeout(600); await shot('7-approved');
await page.getByRole('button', { name: 'Impact' }).click(); await page.getByRole('button', { name: 'Export anonymised telemetry' }).click(); await page.getByRole('dialog').waitFor(); await shot('8-telemetry');
console.log('telemetry json:\n' + await page.locator('.drawer-json').textContent());
await page.keyboard.press('Escape');

// CSV import: a bad file first, then a good one
await page.locator('input[type=file]').setInputFiles(bad); await page.waitForTimeout(400); await shot('9-import-error');
console.log('import error:', await page.locator('.ds-msg').textContent());
await page.locator('input[type=file]').setInputFiles(csv); await page.waitForTimeout(800); await shot('10-imported');
console.log('import ok:', await page.locator('.ds-msg').textContent());
console.log('labels after import:', await page.locator('.data-label').allTextContents());
await page.getByRole('button', { name: 'Use simulated data' }).click(); await page.waitForTimeout(500);
console.log('labels after reset:', [...new Set(await page.locator('.data-label').allTextContents())]);

await ctx.close(); await browser.close();
console.log('errors:', errors.length ? errors : 'none');
