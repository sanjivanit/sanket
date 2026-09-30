import { chromium } from 'playwright-core';
const NODES = { calm: [], early: ['Day 2'], critical: ['Day 4'], transit: ['Approved'], delivered: ['Delivered'] };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1330 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const scan = () => page.evaluate(() => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let bg = parse(getComputedStyle(document.body).backgroundColor); if (bg.a < 1) bg = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) bg = over(c, bg); return bg; };
  const fails = [], seen = new Set(); let count = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; if (!el) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    let color = parse(el instanceof SVGElement ? cs.fill : cs.color); if (!color) continue;
    let op = 1; for (let e = el; e && e !== document.body; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity);
    if (op === 0) continue;
    if (el.closest('button:disabled')) continue;
    if (op < 1) color = { ...color, a: color.a * op };
    const bg = bgOf(el); const fg = over(color, bg);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700;
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5; count++;
    if (ratio < need) { const k = t + '|' + ratio.toFixed(2); if (!seen.has(k)) { seen.add(k); fails.push(`${ratio.toFixed(2)} (<${need}) "${t.slice(0, 40)}" ${size}px`); } }
  }
  // touch targets
  const small = [];
  document.querySelectorAll('button, select, a, [role=button]').forEach((b) => { const r = b.getBoundingClientRect(); if (r.width && (r.height < 43.5 || r.width < 43.5)) small.push(`${(b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`); });
  return { count, fails, small, overflowX: document.documentElement.scrollWidth > 1440 };
});
let total = 0; const allFails = new Set();
for (const theme of ['light', 'dark']) for (const [name, nodes] of Object.entries(NODES)) {
  await page.addInitScript(() => localStorage.setItem('sanket-setup', JSON.stringify({ district: 'A', role: 'dmo', lang: 'mr' }))); await page.goto('http://localhost:5199/'); await page.evaluate((t) => localStorage.setItem('sanket-theme', t), theme); await page.reload();
  await page.getByRole('button', { name: 'Dismiss tip' }).click();
  for (const n of nodes) await page.getByRole('button', { name: new RegExp('^' + n) }).click();
  for (const view of ['Tiles', 'Table', 'Charts']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    for (const tab of ['Forecast', 'Waybill', 'Log', 'Impact']) {
      await page.getByRole('button', { name: tab, exact: true }).click(); await page.waitForTimeout(60);
      const r = await scan(); total += r.count;
      r.fails.forEach((f) => allFails.add(`${theme}/${name}: ${f}`)); if (r.overflowX) allFails.add(`${theme}/${name}: OVERFLOW-X`);
      r.small.filter((x) => !/sample name/.test(x)).forEach((x) => allFails.add(`${theme}/${name}: small target ${x}`));
    }
  }
}
console.log([...allFails].join('\n') || 'no contrast failures, no small targets, no horizontal overflow');
console.log('text nodes scanned:', total);
await browser.close();
