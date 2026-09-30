import { chromium } from 'playwright-core';
const scanSrc = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const root = document.querySelector('.ob'); const scope = root || document.body;
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; } } let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const c of stack.reverse()) bg = over(c, bg); return bg; };
  const fails = new Set(); let count = 0;
  const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const t = n.textContent.trim(); if (!t) continue; const el = n.parentElement; const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (el.closest('button:disabled, [aria-disabled="true"]')) continue;
    let color = parse(el instanceof SVGElement ? cs.fill : cs.color); if (!color) continue;
    let op = 1; for (let e = el; e && e !== document.body; e = e.parentElement) op *= parseFloat(getComputedStyle(e).opacity); if (op === 0) continue;
    if (op < 1) color = { ...color, a: color.a * op };
    const bg = bgOf(el), fg = over(color, bg); const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5; count++;
    if (ratio < need) fails.add(`${ratio.toFixed(2)}<${need} "${t.slice(0, 36)}" ${size}px`);
  }
  const small = []; scope.querySelectorAll('button, [role=radio], [role=checkbox]').forEach((b) => { const r = b.getBoundingClientRect(); if (r.width && (r.height < 43.5 || r.width < 43.5)) small.push(`${(b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 28)} ${Math.round(r.width)}x${Math.round(r.height)}`); });
  return { count, fails: [...fails], small, overflowX: document.documentElement.scrollWidth > innerWidth, cardFits: (() => { const c = document.querySelector('.ob-card'); return c ? c.scrollHeight <= c.clientHeight + 1 : true; })() };
};
const browser = await chromium.launch(); const problems = []; let total = 0;
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); await page.clock.install();
  await page.goto('http://localhost:5199/'); await page.evaluate((t) => localStorage.setItem('sanket-theme', t), theme);
  await page.goto('http://localhost:5199/#onboarding'); await page.reload();
  const scan = async (label) => { await page.waitForTimeout(350); const r = await page.evaluate(scanSrc); total += r.count; r.fails.forEach((f) => problems.push(`${theme}/${label}: contrast ${f}`)); r.small.forEach((s) => problems.push(`${theme}/${label}: small target ${s}`)); if (r.overflowX) problems.push(`${theme}/${label}: horizontal overflow`); if (!r.cardFits) problems.push(`${theme}/${label}: card needs internal scroll at 1440x900`); };
  await page.getByRole('heading', { name: /Tap your district/ }).waitFor(); await scan('1-empty');
  // dashboard behind must be inert; Tab must never leave the dialog
  const inert = await page.evaluate(() => document.querySelector('.board').hasAttribute('inert')); if (!inert) problems.push(`${theme}: board is not inert`);
  let escaped = 0; for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => !!document.activeElement.closest('.board'))) escaped++; } if (escaped) problems.push(`${theme}: focus reached the dashboard behind the dialog ${escaped}x in 40 Tabs`);
  // keyboard-only path through screen 1
  await page.getByRole('radio', { name: /^District A/ }).focus(); await page.keyboard.press('Space');
  await page.getByRole('radio', { name: /District Medical Officer/ }).focus(); await page.keyboard.press('Space'); await scan('1-chosen');
  const focusRing = await page.evaluate(() => { const b = document.querySelector('.ob-btn.primary'); b.focus(); const cs = getComputedStyle(b); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2; }); if (!focusRing) problems.push(`${theme}: primary button has no visible focus ring`);
  await page.keyboard.press('Enter'); await page.getByRole('heading', { name: /Choose the waybill language/ }).waitFor();
  const titleFocused = await page.evaluate(() => document.activeElement && document.activeElement.id === 'ob-title'); if (!titleFocused) problems.push(`${theme}: title not focused on step change`);
  for (const l of [/^English/, /^मराठी/, /^हिन्दी/, /^தமிழ்/]) { await page.getByRole('radio', { name: l }).click(); await scan('2-' + l.source); }
  await page.getByRole('button', { name: 'Continue' }).click(); await page.getByRole('heading', { name: /One safety rule/ }).waitFor(); await scan('3-safety');
  const disabledStart = await page.getByRole('button', { name: 'Start the guided run' }).isDisabled(); if (!disabledStart) problems.push(`${theme}: Start enabled before acknowledgement`);
  await page.getByRole('checkbox').focus(); await page.keyboard.press('Space'); await scan('3-ack');
  await page.getByRole('button', { name: 'Start the guided run' }).click();
  for (const ms of [500, 16000, 6000, 20000]) { await page.clock.runFor(ms); await scan('run+' + ms); }
  const skipVisible = await page.getByRole('button', { name: /Skip|Open dashboard/ }).first().isVisible(); if (!skipVisible) problems.push(`${theme}: no skip/open control during run`);
  await ctx.close();
  // reduced motion: no running animations on onboarding
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); const p2 = await c2.newPage();
  await p2.goto('http://localhost:5199/#onboarding'); await p2.getByRole('heading', { name: /Tap your district/ }).waitFor(); await p2.locator('svg.dmap circle.district').click();
  const anims = await p2.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length); if (anims) problems.push(`${theme}: ${anims} animations running with reduced motion`);
  await c2.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'no problems found'); console.log('text nodes scanned:', total);
