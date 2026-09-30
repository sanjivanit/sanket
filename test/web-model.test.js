// Tests for the web app's scripted model and its merge of live API answers. Run with: npm run test:web
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildView, INITIAL, actions } from '../web/src/model.js';
import { applyLive } from '../web/src/live.js';

// Run the design prototype's own state logic (design/Main.dc.html) with a stub base class, so the port is
// checked against the source of truth rather than against numbers copied by hand.
const html = readFileSync(new URL('../design/Main.dc.html', import.meta.url), 'utf8');
const src = html.slice(html.indexOf('class Component extends DCLogic'), html.lastIndexOf('</script>'));
class DCLogic { constructor(props) { this.props = props || {}; } setState(s) { Object.assign(this.state, s); } }
const Component = new Function('DCLogic', src + '\nreturn Component;')(DCLogic);
const design = (st) => { const c = new Component({ startAt: 'dashboard' }); Object.assign(c.state, st, { ob: 0, lang: 'mr' }); return c.renderVals(); };

// The port swaps the design's em dash for "-" and its arrow for "to" (Taste rules). Nothing else may differ.
const swap = (t) => String(t).replace(/—/g, '-').replace(/ → /g, ' to ');

const STATES = {
  calm: { step: 0, phase: 'watch', qty: 0, rejected: false },
  'early warning day 1': { step: 1, phase: 'watch', qty: 0, rejected: false },
  'early warning day 3': { step: 3, phase: 'watch', qty: 0, rejected: false },
  critical: { step: 4, phase: 'watch', qty: 0, rejected: false },
  'in transit': { step: 4, phase: 'transit', qty: 16, rejected: false },
  delivered: { step: 4, phase: 'delivered', qty: 16, rejected: false },
  rejected: { step: 4, phase: 'watch', qty: 0, rejected: true },
};

for (const [name, st] of Object.entries(STATES)) {
  test(`model matches the design: ${name}`, () => {
    const o = design(st), v = buildView(st, 'mr');
    const pick = (obj, keys) => keys.map((k) => swap(obj[k])).join('|');
    assert.equal(pick(v.alert, ['big', 'unit', 'head', 'sub', 'fg', 'bg', 'ecg']), pick(o.alert, ['big', 'unit', 'head', 'sub', 'fg', 'bg', 'ecg']));
    assert.equal(v.topBar, o.topBar);
    assert.equal(v.dayLabel, o.dayLabel);
    assert.equal([v.stat.main, v.stat.sub, v.stat.reserveText].join('|'), [o.statMain, o.statSub, o.reserveText].join('|'));
    for (const k of ['need', 'needLabel', 'donors', 'dist', 'eta']) assert.equal(v.callout[k], swap(o.callout[k]), 'callout.' + k);
    assert.equal(v.map.sub, o.mapSub);
    assert.equal(v.map.arc.dash, o.arc.dash);
    assert.equal(v.map.line.d, o.line.d);
    assert.equal([v.planTitle, v.routeVials, v.actionNote, v.vialLegend, v.vialIcons.length].join('|'), [o.planTitle, o.routeVials, o.actionNote, o.vialLegend, o.vialIcons.length].join('|'));
    assert.equal(v.approveOff, o.approveOff);
    o.tiles.forEach((t, i) => {
      const p = v.rowsA[i];
      for (const k of ['name', 'meta', 'daysText', 'unit', 'statusLabel', 'chipText', 'chipColor', 'fill', 'supplyText', 'bedText', 'docTip', 'ringDash', 'tileBorder', 'rowBg', 'tileMeta']) assert.equal(p[k], t[k], `${t.name}.${k}`);
      assert.equal(p.fillPct.toFixed(3), t.fillPct.toFixed(3));
    });
    o.tilesB.forEach((t, i) => { for (const k of ['name', 'tileMeta', 'daysText', 'bedText', 'fill']) assert.equal(v.rowsB[i][k], t[k], `${t.name}.${k}`); });
    o.beforeAfter.forEach((r, i) => assert.equal(v.beforeAfter[i].text, swap(r.text)));
    assert.equal(v.logLines.map((l) => l.text).join('|'), o.logLines.map((l) => l.text).join('|'));
    for (const k of ['status', 'vials', 'number', 'english', 'local', 'back', 'qr']) assert.equal(v.wb[k], o.wb[k], 'wb.' + k);
    assert.equal(v.impact.map((m) => m.value).join('|'), o.impact.map((m) => swap(m.value)).join('|'));
    for (const k of ['hist', 'proj', 'warnX', 'todayX', 'endX', 'todayValue']) assert.equal(String(v.chart[k]), String(o.chart[k]), 'chart.' + k);
    assert.equal(v.surge.solid, o.cr.solid);
    assert.equal(v.surge.future, o.cr.future);
  });
}

test('the scripted timeline and the API engine agree on vials: 0, 0, 1, 5, 16', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((step) => buildView({ ...INITIAL, step }).need), [0, 0, 1, 5, 16]);
});

test('actions: the demo timeline nodes map to the right state', () => {
  assert.deepEqual(actions.goto(5), { step: 4, phase: 'transit', qty: 16, rejected: false });
  assert.deepEqual(actions.goto(6), { step: 4, phase: 'delivered', qty: 16, rejected: false });
  assert.equal(actions.advance({ ...INITIAL, step: 4 }).step, 4, 'advance stops at day 4');
});

// A recommendation shaped like the /api/dispatch reply in docs/API_CONTRACT.md
const reply = (over = {}) => ({
  status: 'recommended', dispatchId: 'SK-2026-MH-0001', vials: 16, source: 'gemini', model: 'gemini-3.5-flash-lite', guardrail: null,
  donor: { name: 'PHC Shivpuri', distanceKm: 18.4, etaMinutes: 28 },
  waybill: { english: 'Take 16 vials of anti-snake venom (ASV) from PHC Shivpuri to PHC Rampur. Keep at 2 to 8 °C.', local: 'स्थानिक मजकूर', languageCode: 'mr', languageVerified: false, backTranslation: { instruction: { english: 'Take 16 vials.', unclear: false }, reasoning: null } },
  reasoning: { english: 'PHC Shivpuri is the nearest clinic.' },
  rejected: [{ name: 'PHC Bhor', reason: 'doctor absent' }, { name: 'PHC Junnar', reason: 'too far' }],
  ...over,
});
const base = buildView(STATES.critical, 'mr');

test('live: a Gemini answer replaces the template and keeps the safety chips', () => {
  const v = applyLive(base, { dispatch: { status: 'ready', data: reply() } }, false);
  assert.equal(v.live.note.text, 'Written by Gemini, gemini-3.5-flash-lite');
  assert.equal(v.wb.local, 'स्थानिक मजकूर');
  assert.equal(v.wb.number, 'Number on approval', 'the dispatch number is shown only after approval');
  const chips = v.wb.chips.map((c) => c.text);
  assert.ok(chips.includes('Not yet reviewed by a native speaker'));
  assert.ok(chips.includes('English back-translation matches'));
  assert.ok(chips.includes('Drug, vials, temperature set by code'));
  assert.deepEqual(v.rejectedTags.map((t) => t.text), ['Bhor: doctor absent', 'Junnar: too far']);
  assert.equal(v.route.sub, '18.4 km, about 28 min');
  assert.ok(v.logLines.some((l) => /Gemini \(gemini-3.5-flash-lite\) picked Shivpuri/.test(l.text)));
});

test('live: after approval the dispatch number comes from the API', () => {
  assert.equal(applyLive(base, { dispatch: { status: 'ready', data: reply() } }, true).wb.number, 'SK-2026-MH-0001');
});

test('live: no back-translation means no "matches" chip', () => {
  const r = reply(); r.waybill.backTranslation = { instruction: null, reasoning: null };
  const chips = applyLive(base, { dispatch: { status: 'ready', data: r } }, false).wb.chips.map((c) => c.text);
  assert.ok(!chips.includes('English back-translation matches'));
});

test('live: an unverified language is never shown as reviewed', () => {
  const chips = applyLive(base, { dispatch: { status: 'ready', data: reply() } }, false).wb.chips.map((c) => c.text);
  assert.ok(chips.includes('Not yet reviewed by a native speaker'));
});

test('live: the server template is labelled as an offline fallback', () => {
  const v = applyLive(base, { dispatch: { status: 'ready', data: reply({ source: 'fallback', model: null }) } }, false);
  assert.equal(v.live.note.text, 'Offline fallback used');
  assert.ok(v.logLines.some((l) => /Offline fallback used/.test(l.text)));
});

test('live: an unreachable API keeps the scripted template and says so', () => {
  const v = applyLive(base, { dispatch: { status: 'offline' } }, false);
  assert.equal(v.live.note.text, 'Offline fallback used');
  assert.equal(v.wb.local, base.wb.local, 'the scripted waybill is untouched');
  assert.ok(v.logLines.some((l) => /API not reachable/.test(l.text)));
});

test('live: a different donor is flagged so the map is not silently wrong', () => {
  const v = applyLive(base, { dispatch: { status: 'ready', data: reply({ donor: { name: 'PHC Khed', distanceKm: 27, etaMinutes: 41 } }) } }, false);
  assert.equal(v.route.donor, 'Khed');
  assert.equal(v.route.donorDiffers, true);
});

test('live: a brief that does not fire shows nothing, one that fires shows its source', () => {
  assert.equal(applyLive(base, { brief: { status: 'ready', data: { fires: false } } }, false).live.brief, null);
  const b = applyLive(base, { brief: { status: 'ready', data: { fires: true, source: 'gemini', brief: { headline: 'Early warning', explanation: 'x', suggestedAction: 'Watch' } } } }, false).live.brief;
  assert.equal(b.source, 'gemini');
  assert.equal(b.headline, 'Early warning');
});
