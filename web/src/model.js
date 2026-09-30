// Scripted demo model for the dashboard. A direct port of the maths and copy in design/Main.dc.html.
// Pure functions only: state in, view data out. The clinics come from a data set (see datasets.js).
import { DEFAULT, hav } from './datasets.js';

const OK = 'var(--ok)', CRIT = 'var(--crit)', WARN = 'var(--warn)', NEU = 'var(--faint)';
const NOISE = [0, -1, 1, 0, 2, -1, 0, 1, 0, 0];
export const MULT = [1, 1.2, 1.7, 2.6, 5.5];
const THR = 0.129;

export const vials = (n) => n + (n === 1 ? ' vial' : ' vials');

export const histAt = (s, base = 20) => NOISE.map((n) => base + n).concat(MULT.slice(1, s + 1).map((m) => base * m));

const fit = (h) => {
  const l5 = h.slice(-5);
  const my = l5.reduce((a, b) => a + b, 0) / 5;
  let sxy = 0, sxx = 0;
  [0, 1, 2, 3, 4].forEach((x, i) => { sxy += (x - 2) * (l5[i] - my); sxx += (x - 2) * (x - 2); });
  const slope = sxy / sxx;
  return { slope, icpt: my - slope * 2 };
};

const forecast = (h, baseFoot, baseBurn, stock) => {
  const f = fit(h);
  let left = stock, t = 0;
  for (let d = 1; d <= 10; d++) {
    const foot = Math.max(baseFoot, f.icpt + f.slope * (4 + d));
    const burn = baseBurn * foot / baseFoot;
    if (left <= burn) return (t + left / burn) * 24;
    left -= burn; t += 1;
  }
  return null;
};

const R = 6371.0088, KM_DEG = R * Math.PI / 180;

const ECG = {
  ok: 'M0 18 H44 L49 18 L52 12 L56 24 L59 18 H120',
  warn: 'M0 18 H30 L34 18 L37 8 L42 28 L45 18 H72 L75 12 L79 24 L82 18 H120',
  crit: 'M0 18 H14 L18 4 L24 32 L28 8 L32 28 L36 18 H60 L64 2 L70 34 L74 10 L78 26 L82 18 H120',
};

export const WAYBILL_LANGS = {
  en: { name: 'English', tpl: 'x', vial: ['vial', 'vials'], to: 'to' },
  mr: { name: 'Marathi', tpl: '{d} येथून {r} येथे {v} अँटी-स्नेक व्हेनम (ASV) पोहोचवा. {t} °C तापमान राखा.', vial: ['कुपी', 'कुपी'], to: 'ते' },
  hi: { name: 'Hindi', tpl: '{d} से {r} तक {v} एंटी-स्नेक वेनम (ASV) पहुँचाएँ। तापमान {t} °C रखें।', vial: ['शीशी', 'शीशी'], to: 'से' },
  or: { name: 'Odia', tpl: '{d} ରୁ {r} କୁ {v} ଆଣ୍ଟି-ସ୍ନେକ ଭେନମ୍ (ASV) ପହଞ୍ଚାନ୍ତୁ। {t} °C ତାପମାତ୍ରା ରଖନ୍ତୁ।', vial: ['ଶିଶି', 'ଶିଶି'], to: 'ରୁ' },
  ta: { name: 'Tamil', tpl: '{d} இலிருந்து {r} க்கு {v} பாம்புக்கடி எதிர்ப்பு மருந்து (ASV) கொண்டு செல்லவும். {t} °C வெப்பநிலையில் வைக்கவும்.', vial: ['குப்பி', 'குப்பிகள்'], to: 'முதல்' },
};
const fillTpl = (tpl, v) => tpl.replace(/\{(\w)\}/g, (_, k) => v[k]);

// A small sample QR-like pattern (not a real code). Seeded so it never changes between renders.
function sampleQrPath() {
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let qr = '';
  const finder = (x0, y0) => (x, y) => x >= x0 && x < x0 + 7 && y >= y0 && y < y0 + 7;
  const fs = [finder(0, 0), finder(14, 0), finder(0, 14)];
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    let on;
    const fi = fs.findIndex((fn) => fn(x, y));
    if (fi >= 0) {
      const ox = [0, 14, 0][fi], oy = [0, 0, 14][fi];
      const dx = x - ox, dy = y - oy;
      on = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
    } else if ((x === 7 || y === 7 || x === 13 || y === 13) && ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12))) {
      on = false;
    } else on = rnd() > 0.5;
    if (on) qr += 'M' + x + ' ' + y + 'h1v1h-1z';
  }
  return qr;
}
const QR_PATH = sampleQrPath();

export const INITIAL = { step: 0, phase: 'watch', qty: 0, rejected: false };

export function buildView({ step, phase, qty, rejected }, lang = 'or', ds = DEFAULT) {
  const T = ds.target, DN = ds.donor, TN = T.short, DNAME = DN.short;
  const BASE = T.baseFoot, T0 = T.stock, TBURN = T.burn;
  const delivered = phase === 'delivered';
  const hist = histAt(step, BASE);
  const rampMult = MULT[step];
  const rampBurn = TBURN * rampMult;
  const rampStock = T0 + (delivered ? qty : 0);
  const shivStock = DN.stock - (delivered ? qty : 0);
  const dsr = rampStock / rampBurn;
  const projH = forecast(hist, BASE, TBURN, rampStock);
  const growth = hist[hist.length - 1] / hist[hist.length - 2] - 1;
  const warnRule = projH !== null && projH <= 72 && growth >= THR;
  const status = dsr < 1 ? 'crit' : (dsr < 3 || warnRule) ? 'warn' : 'ok';
  const need = Math.max(0, Math.ceil(2.0 * rampBurn - rampStock));
  const leadH = Math.round(forecast(histAt(1, BASE), BASE, TBURN, T0));
  const qtyShown = phase === 'watch' ? need : qty;
  const footNow = Math.round(BASE * rampMult);
  const hoursLeft = Math.round(dsr * 24);

  const sc = status === 'crit' ? CRIT : status === 'warn' ? WARN : OK;
  const scText = status === 'crit' ? 'var(--crit-t)' : status === 'warn' ? 'var(--warn-t)' : 'var(--ok-t)';
  const scBg = status === 'crit' ? 'var(--crit-bg)' : status === 'warn' ? 'var(--warn-bg)' : 'transparent';

  const build = (c, idx) => {
    const mult = c.isTarget ? rampMult : 1;
    const stock = c.isTarget ? rampStock : c.isDonor ? shivStock : c.stock;
    const curBurn = c.burn * mult;
    const d = stock / curBurn;
    const s = d < 1 ? 'crit' : ((c.isTarget && status === 'warn') || d < 3) ? 'warn' : 'ok';
    const color = s === 'crit' ? CRIT : s === 'warn' ? WARN : OK;
    const full = c.bedsOcc / c.bedsTotal >= 0.85;
    const bedSquares = [];
    for (let i = 0; i < c.bedsTotal; i++) {
      const on = i < c.bedsOcc;
      bedSquares.push({ bg: on ? (full ? WARN : NEU) : 'transparent', bd: on ? (full ? WARN : NEU) : 'var(--rule3)' });
    }
    const shivChip = step === 0 ? '' : phase === 'transit' ? 'Sending ' + vials(qty) : delivered ? 'Gave ' + vials(qty) : need > 0 ? 'Proposed donor' : 'Standby donor';
    const isShiv = !!c.isDonor;
    const chip = isShiv ? shivChip : (c.chip || '');
    const chipColor = isShiv ? 'var(--acc-t)' : (c.chipColor || 'var(--muted)');
    const rowBg = c.isTarget ? scBg : (isShiv && shivChip ? 'var(--acc-bg)' : 'transparent');
    const ap = ds.approx ? 'approx. ' : '';
    const meta = c.isTarget ? footNow + ' visits today' : c.groupB ? ap + Math.round(c.dist) + ' km' : ap + c.dist.toFixed(1) + ' km';
    return {
      name: c.name, short: c.short, meta,
      tileMeta: c.groupB ? 'Next district, ' + meta : meta,
      rowBg, hasChip: !!chip, chipText: chip, chipColor,
      daysText: s === 'crit' ? String(Math.round(d * 24)) : d.toFixed(1),
      unit: s === 'crit' ? 'hours' : 'days',
      statusLabel: s === 'crit' ? '■ Critical' : (c.isTarget && s === 'warn') ? '▲ Early warning' : '',
      textColor: s === 'crit' ? 'var(--crit-t)' : 'var(--warn-t)',
      fill: color,
      fillPct: Math.min(d, 14) / 14 * 100,
      supplyText: stock + ' vials',
      bedSquares,
      bedText: c.bedsOcc + ' of ' + c.bedsTotal + (full ? ', ' + Math.round(c.bedsOcc / c.bedsTotal * 100) + '%' : ''),
      bedColor: full ? 'var(--warn-t)' : 'var(--muted)',
      doc: c.doc,
      docTip: c.doctor ? (c.doc ? c.doctor + ' (sample name), on duty' : c.doctor + ' (sample name), not on duty today') : (c.doc ? 'Medical officer on duty' : 'Medical officer absent today'),
      ringAria: c.name + ': ' + (s === 'crit' ? Math.round(d * 24) + ' hours' : d.toFixed(1) + ' days') + ' of supply',
      ringDash: (Math.min(d, 14) / 14 * 175.93).toFixed(1) + ' 175.9',
      tileBorder: c.isTarget ? (s === 'crit' ? 'var(--crit-bd)' : s === 'warn' ? 'var(--warn-bd)' : 'var(--rule)') : (chip && chipColor === 'var(--acc-t)') ? 'var(--acc-bd)' : 'var(--rule)',
      tipAbove: idx >= 4,
      occ: c.bedsOcc / c.bedsTotal,
      dsr: d,
    };
  };

  const rowsA = [T, ...ds.donors].map(build);
  const rowsB = ds.groupB.map((c, i) => build(c, i));

  const reserve = rowsA.reduce((a, r) => a + Math.min(r.dsr, 14) / 14, 0) / rowsA.length;

  // donors that pass every rule for this need
  const need0 = Math.max(need, 1);
  const eligibleCount = ds.donors
    .map((d) => (d.isDonor ? { ...d, stock: shivStock } : d))
    .filter((d) => d.doc && d.bedsOcc / d.bedsTotal < 0.85 && d.dist <= 35 && Math.floor(d.stock - 3 * d.burn) >= need0).length;

  const beforeAfter = [
    { name: TN, nowPct: Math.min(T0 / rampBurn, 14) / 14 * 100, afterPct: Math.min((T0 + qtyShown) / rampBurn, 14) / 14 * 100, nowColor: T0 / rampBurn < 1 ? CRIT : T0 / rampBurn < 3 ? WARN : OK, afterColor: (T0 + qtyShown) / rampBurn < 3 ? WARN : OK, text: (T0 / rampBurn).toFixed(1) + ' to ' + ((T0 + qtyShown) / rampBurn).toFixed(1) + ' days' },
    { name: DNAME, nowPct: Math.min(DN.stock / DN.burn, 14) / 14 * 100, afterPct: Math.min((DN.stock - qtyShown) / DN.burn, 14) / 14 * 100, nowColor: OK, afterColor: OK, text: (DN.stock / DN.burn).toFixed(1) + ' to ' + ((DN.stock - qtyShown) / DN.burn).toFixed(1) + ' days' },
  ];

  // map
  const cx = 413, cy = 178, k = 1.95;
  let donorPt = { x: 0, y: 0 };
  const mapNodes = ds.donors.concat(ds.groupB).map((p) => {
    const east = (p.lng - T.lng) * KM_DEG * Math.cos(T.lat * Math.PI / 180) * k;
    const north = (p.lat - T.lat) * KM_DEG * k;
    const x = cx + east, y = cy - north;
    const isDonor = !!p.isDonor, nodoc = !p.doc;
    if (isDonor) donorPt = { x, y };
    const rad = 4 + Math.sqrt(p.isDonor ? shivStock : p.stock) * 1.15;
    const hot = isDonor && step > 0;
    return { label: p.short, x, y, rad, right: east >= 0, nodoc, hot };
  });
  // Nudge labels up or down so they do not sit on each other, on a facility dot, or on the centre label.
  const boxes = [{ x0: 373, x1: 453, y0: 112, y1: 148 }, { x0: 340, x1: 486, y0: 88, y1: 108 }, { x0: 340, x1: 486, y0: 2, y1: 22 }].concat(mapNodes.map((n) => ({ x0: n.x - n.rad - 2, x1: n.x + n.rad + 2, y0: n.y - n.rad - 2, y1: n.y + n.rad + 2 })));
  const hit = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  mapNodes.forEach((n) => {
    const w = n.label.length * 7 + 4, x0 = n.right ? n.x + n.rad + 10 : n.x - n.rad - 10 - w;
    const own = boxes[mapNodes.indexOf(n) + 3];
    for (const d of [0, 16, -16, 32, -32, 48, -48]) {
      const box = { x0, x1: x0 + w, y0: n.y - 9 + d, y1: n.y + 9 + d };
      if (box.y0 < 2 || box.y1 > 346) continue;
      if (boxes.some((b) => b !== own && hit(box, b))) continue;
      n.dy = d; boxes.push(box); return;
    }
    n.dy = 0;
  });
  const dx = cx - donorPt.x, dy = cy - donorPt.y, len = Math.hypot(dx, dy) || 1;
  const qx = (donorPt.x + cx) / 2 - dy / len * 14, qy = (donorPt.y + cy) / 2 + dx / len * 14;
  const arcPath = 'M' + donorPt.x.toFixed(1) + ',' + donorPt.y.toFixed(1) + ' Q' + qx.toFixed(1) + ',' + qy.toFixed(1) + ' 413,178';
  const line = {
    d: arcPath,
    standbyOp: (step > 0 && phase === 'watch') ? 1 : 0,
    transitOp: phase === 'transit' ? 1 : 0,
    doneOp: delivered ? 0.5 : 0,
  };

  const C = 2 * Math.PI * 23;
  const frac = Math.min(hoursLeft, 72) / 72;
  const days = (x) => x.toFixed(1) + ' days';
  const arc = {
    color: sc,
    halo: status === 'crit' ? 'var(--crit-halo)' : status === 'warn' ? 'var(--warn-halo)' : 'var(--ok-halo)',
    text: scText,
    dash: (frac * C).toFixed(1) + ' ' + C.toFixed(1),
    pulse: status !== 'ok' && !delivered,
    sub: status === 'crit' ? hoursLeft + ' h left' : status === 'warn' ? (dsr < 3 ? days(dsr) + ' left' : 'Watch') : 'Stable',
  };
  const mapSub = delivered ? TN + ' restocked from ' + DNAME + '. Keep watching: supply is ' + dsr.toFixed(1) + ' days.'
    : phase === 'transit' ? qty + ' vials are moving from ' + DNAME + ' to ' + TN + '.'
    : step === 0 ? 'All clinics stable. Press Advance day to start the surge.'
    : need === 0 ? 'Standby donor ready. Nothing to send yet.'
    : eligibleCount + ' clinics in range can cover ' + vials(need) + '. The next district is not needed.';
  const mapAria = 'Reach map. ' + T.name + ' is at the centre with a ring at 35 kilometres for same-district donors and a ring at 80 kilometres for the next district. ' + DNAME + ', ' + DN.dist.toFixed(1) + ' kilometres away' + (ds.approx ? ', approximately' : '') + ', is the nearest donor.';

  // forecast chart
  const f = fit(hist);
  const proj = [1, 2, 3].map((d) => Math.max(BASE, f.icpt + f.slope * (4 + d)));
  const X = (i) => 36 + i * 27.5;
  const Y = (v) => 160 - Math.min(v, 160) * (130 / 160);
  const last = hist.length - 1;
  const chart = {
    hist: hist.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '),
    proj: [X(last).toFixed(1) + ',' + Y(hist[last]).toFixed(1)].concat(proj.map((v, i) => X(last + 1 + i).toFixed(1) + ',' + Y(v).toFixed(1))).join(' '),
    projOp: step > 0 ? 1 : 0,
    baseY: Y(BASE).toFixed(1),
    baseLabelY: (Y(BASE) - 6).toFixed(1),
    warnX: X(10).toFixed(1),
    warnY: Y(hist[Math.min(10, last)]).toFixed(1),
    warnLabelX: (X(10) - 6).toFixed(1),
    warnOp: step >= 1 ? 1 : 0,
    todayX: X(last).toFixed(1),
    todayY: Y(hist[last]).toFixed(1),
    todayLabelX: (X(last) - 10).toFixed(1),
    todayLabelY: (Y(hist[last]) + 4).toFixed(1),
    todayLabelOp: step >= 2 ? 1 : 0,
    todayValue: footNow,
    endX: Math.min(X(last + 3), 470).toFixed(1),
    aria: 'Visits per day at ' + T.name + '. Today is ' + footNow + ' against a normal ' + BASE + '.',
  };

  // alert card
  let alert;
  if (delivered) {
    alert = { big: dsr.toFixed(1), unit: 'days now', head: TN + ' has supply again', sub: vials(qty) + ' arrived. Still under 3 days, so keep watching.', fg: 'var(--warn-t)', bg: 'var(--warn-bg)', bd: 'var(--warn-bd)', ecg: ECG.ok };
  } else if (phase === 'transit') {
    alert = { big: String(ds.etaMin), unit: 'min away', head: 'Transfer is on the way', sub: vials(qty) + ' from ' + DNAME + '. ' + TN + ' has about ' + hoursLeft + ' hours left.', fg: 'var(--acc-t)', bg: 'var(--acc-bg)', bd: 'var(--acc-bd)', ecg: ECG.warn };
  } else if (status === 'crit') {
    alert = { big: String(hoursLeft), unit: 'hours left', head: TN + ' is almost out of venom', sub: 'Warned ' + leadH + ' hours earlier. ' + footNow + ' visits today, normal is ' + BASE + '.', fg: 'var(--crit-t)', bg: 'var(--crit-bg)', bd: 'var(--crit-bd)', ecg: ECG.crit };
  } else if (status === 'warn') {
    alert = { big: String(Math.round(projH !== null ? projH : hoursLeft)), unit: 'hours to empty', head: 'Early warning: ' + TN + ' is heading for empty', sub: 'Visits are ' + footNow + ' a day, normal is ' + BASE + '. Act before it runs out.', fg: 'var(--warn-t)', bg: 'var(--warn-bg)', bd: 'var(--warn-bd)', ecg: ECG.warn };
  } else {
    alert = { big: dsr.toFixed(1), unit: 'days, lowest', head: 'All clinics have 3 days or more', sub: 'Nothing needs attention right now.', fg: 'var(--ok-t)', bg: 'var(--ok-bg)', bd: 'var(--ok-bd)', ecg: ECG.ok };
  }

  // plan
  const showPlan = step >= 1;
  const routeVials = phase === 'watch' ? (need > 0 ? vials(need) : 'Standby') : vials(qty);
  const planTitle = phase === 'watch' ? (status === 'crit' ? 'Recommended transfer' : 'Standby plan') : phase === 'transit' ? 'Approved transfer' : 'Completed transfer';
  const actionNote = rejected && phase === 'watch' ? 'Rejected. Advance the day for a new recommendation.'
    : delivered ? 'Delivered. ' + TN + ' is restocked.'
    : phase === 'watch' && need === 0 ? 'Nothing to send yet at today’s pace.'
    : phase === 'watch' && status !== 'crit' ? 'Sized to today’s pace. It grows if visits keep rising.' : '';
  const stepDefs = [
    { label: 'Recommended', done: need > 0 || phase !== 'watch', cur: false },
    { label: 'Approval', done: phase !== 'watch', cur: phase === 'watch' && need > 0 },
    { label: 'In transit', done: delivered, cur: phase === 'transit' },
    { label: 'Delivered', done: delivered, cur: false },
  ];
  const stepper = stepDefs.map((s, i) => ({
    label: s.label, done: s.done, cur: s.cur,
    line: stepDefs[i + 1] && stepDefs[i + 1].done ? 'var(--acc)' : 'var(--rule2)',
    showLine: i < 3,
  }));

  // vial icons
  const solidCount = delivered ? T0 + qty : T0;
  const ghostCount = delivered ? 0 : qtyShown;
  const vialIcons = [];
  for (let i = 0; i < Math.min(solidCount, 30); i++) vialIcons.push('solid');
  const ghostMax = Math.min(ghostCount, 30 - vialIcons.length);
  for (let i = 0; i < ghostMax; i++) vialIcons.push(phase === 'transit' ? 'transit' : 'needed');
  const vialLegend = delivered ? solidCount + ' vials on hand' : ghostCount > 0 ? T0 + ' on hand, ' + ghostCount + (phase === 'transit' ? ' on the way' : ' more needed') : T0 + ' on hand';

  // log
  const log = [];
  for (let s = 1; s <= step; s++) log.push('Day ' + s + ': ' + TN + ' ' + Math.round(BASE * MULT[s]) + ' visits, normal ' + BASE);
  if (step >= 1) log.push('Early warning: ' + leadH + ' hours to stock-out at day 1');
  if (status === 'crit' && step >= 4) log.push(TN + ' critical: ' + Math.round(T0 / rampBurn * 24) + ' hours left');
  if (step >= 1) log.push('Search: same district, 35 km or less');
  if (step >= 1) log.push(DNAME + ' can give ' + Math.floor(DN.stock - 3 * DN.burn) + ', need ' + need);
  if (step >= 1 && need > 0) log.push('Gemini picked ' + DNAME + ', code check passed');
  if (phase !== 'watch') log.push('DMO approved. Dispatch SK-2026-' + ds.stateCode + '-0001, ' + qty + ' vials');
  if (delivered) log.push('Delivered. ' + TN + ' now ' + days(dsr));
  if (rejected) log.push('DMO rejected the recommendation');
  if (step === 0) log.push('All clinics stable. Waiting for the surge.');
  const logLines = log.map((t, i) => ({ text: '+' + (i * 0.1).toFixed(1) + 's ' + t, latest: i === log.length - 1 }));

  // waybill
  const approved = phase !== 'watch';
  const L = WAYBILL_LANGS[lang] ? lang : 'mr';
  const wb = {
    status: delivered ? 'Delivered' : phase === 'transit' ? 'Approved, in transit' : 'Awaiting approval',
    statusColor: delivered ? 'var(--ok-t)' : phase === 'transit' ? 'var(--acc-t)' : 'var(--warn-t)',
    vials: qtyShown > 0 ? vials(qtyShown) : 'No vials yet',
    batch: DN.batch,
    number: approved ? 'SK-2026-' + ds.stateCode + '-0001' : 'Number on approval',
    english: qtyShown > 0 ? 'Take ' + vials(qtyShown) + ' of anti-snake venom from ' + DNAME + ' to ' + TN + '.' : 'No transfer is needed yet.',
    showLocal: L !== 'en' && qtyShown > 0,
    langCode: L,
    local: qtyShown > 0 ? fillTpl(WAYBILL_LANGS[L].tpl, { v: qtyShown + ' ' + WAYBILL_LANGS[L].vial[qtyShown === 1 ? 0 : 1], d: DNAME, r: TN, t: '2 ' + WAYBILL_LANGS[L].to + ' 8' }) : '',
    back: 'Back-translation (sample): Take ' + vials(qtyShown) + ' of anti-snake venom from ' + DNAME + ' to ' + TN + '.',
    chips: (L !== 'en' && qtyShown > 0 ? [{ text: 'Not yet reviewed by a native speaker', color: 'var(--warn-t)' }] : []).concat([{ text: 'Drug, vials, temperature set by code', color: 'var(--text2)' }]),
    approved,
    qr: QR_PATH,
  };

  // timeline
  const curNode = delivered ? 6 : phase === 'transit' ? 5 : step;
  const MS = [
    { label: 'Normal', c: 'var(--ok)' }, { label: 'Day 1', c: 'var(--warn)' }, { label: 'Day 2', c: 'var(--warn)' },
    { label: 'Day 3', c: 'var(--warn)' }, { label: 'Day 4', c: 'var(--crit)' }, { label: 'Approved', c: 'var(--acc)' }, { label: 'Delivered', c: 'var(--ok)' },
  ];
  const tlNodes = MS.map((m, i) => ({ label: m.label, color: m.c, on: i <= curNode, current: i === curNode, lineOn: i < curNode, showLine: i < 6 }));

  // charts view
  const chartSup = rowsA.slice().sort((a, b) => a.dsr - b.dsr).map((r) => ({ name: r.short, pct: Math.min(r.dsr, 14) / 14 * 100, color: r.fill, text: r.dsr < 1 ? Math.round(r.dsr * 24) + ' h' : r.dsr.toFixed(1) + ' d' }));
  const chartBeds = rowsA.slice().sort((a, b) => b.occ - a.occ).map((r) => ({ name: r.short, pct: Math.round(r.occ * 100), color: r.occ >= 0.85 ? WARN : NEU, text: Math.round(r.occ * 100) + '%' }));
  const vals6 = MULT.map((m) => T0 / (TBURN * m));
  vals6.push((6 + qtyShown) / rampBurn);
  const CX = (i) => 70 + i * 132;
  const CY = (v) => 112 - Math.min(v, 3.5) / 3.5 * 100;
  const stat6 = (v) => (v < 1 ? 'var(--crit)' : v < 3 ? 'var(--warn)' : 'var(--ok)');
  const upto = phase === 'watch' ? step : 5;
  const solidIdx = []; for (let i = 0; i <= Math.min(upto, 5); i++) solidIdx.push(i);
  if (phase !== 'watch') { solidIdx.length = 0; for (let i = 0; i <= 4; i++) solidIdx.push(i); solidIdx.push(5); }
  const futureIdx = []; if (phase === 'watch') { for (let i = step; i <= 4; i++) futureIdx.push(i); if (qtyShown > 0) futureIdx.push(5); }
  const pts = (idx) => idx.map((i) => CX(i) + ',' + CY(vals6[i]).toFixed(1)).join(' ');
  const surge = {
    solid: pts(solidIdx), future: futureIdx.length > 1 ? pts(futureIdx) : '',
    y3: CY(3).toFixed(1), y1: CY(1).toFixed(1), y3l: (CY(3) - 5).toFixed(1), y1l: (CY(1) - 5).toFixed(1),
    aria: TN + ' days of supply by day: ' + vals6.slice(0, 5).map((v) => v.toFixed(1)).join(', ') + '. After a transfer: ' + vals6[5].toFixed(1) + '.',
    dots: vals6.map((v, i) => ({
      x: CX(i), y: CY(v).toFixed(1), color: stat6(v),
      opacity: i <= 4 ? (i <= step ? 1 : 0.28) : (qtyShown > 0 ? (phase === 'watch' ? 0.45 : 1) : 0),
    })),
    labels: ['Normal', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'After transfer'],
  };

  const impact = [
    { label: 'Warning lead time', value: step >= 1 ? leadH + ' h' : '-', sub: 'Today: about 0 h*', color: 'var(--acc-t)' },
    { label: 'Transfer time', value: (need > 0 || phase !== 'watch') ? ds.etaMin + ' min' : '-', sub: 'Central: 14 to 21 days*', color: 'var(--acc-t)' },
    { label: 'Donor keeps', value: ((DN.stock - qtyShown) / DN.burn).toFixed(1) + ' days', sub: 'Rule: at least 3 days', color: 'var(--ok-t)' },
  ];

  const nonOk = status === 'ok' ? 0 : 1;
  const bedsOcc = ds.all.reduce((a, c) => a + c.bedsOcc, 0), bedsTotal = ds.all.reduce((a, c) => a + c.bedsTotal, 0);
  const beds = { occ: bedsOcc, total: bedsTotal, pct: Math.round(bedsOcc / bedsTotal * 100) };
  const doctors = { on: ds.all.filter((c) => c.doc).length, total: ds.all.length };
  return {
    status, need, qtyShown, hoursLeft, dsr, eligibleCount, delivered,
    names: { target: TN, targetFull: T.name, donor: DNAME, donorFull: DN.name },
    place: { district: ds.district, state: ds.state, facilities: ds.all.length, sameDistrict: ds.donors.length + 1 },
    source: ds.source, approx: ds.approx, day4Need: ds.need4, targetBedsPct: Math.round(T.bedsOcc / T.bedsTotal * 100),
    footNow, baseFoot: BASE, history: hist, growth,
    topBar: phase === 'transit' ? 'var(--acc)' : sc,
    dayLabel: step === 0 ? 'Before the surge' : 'Surge day ' + step + ' of 4',
    tlNodes,
    stat: { main: (ds.all.length - nonOk) + ' stable', total: ds.all.length, beds, doctors, sub: status === 'crit' ? '1 critical' : status === 'warn' ? '1 early warning' : '', subColor: scText, reserveText: Math.round(reserve * 100) + '%', reservePct: Math.round(reserve * 100) },
    rowsA, rowsB, beforeAfter, others: ds.others,
    map: { nodes: mapNodes, line, arc, sub: mapSub, aria: mapAria },
    callout: {
      need: step === 0 ? '-' : String(qtyShown),
      needLabel: step === 0 ? 'no vials needed' : delivered ? 'vials delivered' : phase === 'transit' ? 'vials in transit' : (qtyShown === 1 ? 'vial needed' : 'vials needed'),
      donors: step === 0 ? '-' : String(eligibleCount),
      dist: step === 0 ? '-' : DN.dist.toFixed(1) + ' km',
      eta: step === 0 ? '-' : ds.etaMin + ' min',
    },
    chart, alert, showPlan, planTitle, routeVials, actionNote, stepper, vialIcons, vialLegend,
    showApprove: phase === 'watch', approveOff: !(need > 0 && phase === 'watch'), showDeliver: phase === 'transit',
    showBA: qtyShown > 0, showBedNote: qtyShown > 0,
    logLines, wb, chartSup, chartBeds, surge, impact,
    advanceOff: step >= 4,
  };
}

// Actions on the scripted state. Same transitions as the prototype.
export const actions = {
  advance: (s) => (s.step < 4 ? { step: s.step + 1, phase: 'watch', qty: 0, rejected: false } : s),
  inject: () => ({ step: 4, phase: 'watch', qty: 0, rejected: false }),
  reset: () => ({ ...INITIAL }),
  approve: (s, need) => ({ ...s, phase: 'transit', qty: need, rejected: false }),
  reject: (s) => ({ ...s, rejected: true }),
  deliver: (s) => ({ ...s, phase: 'delivered' }),
  // qty is the vials needed on day 4 for the current data set (16 for the Maharashtra fixture).
  goto: (i, qty = 16) => (i <= 4 ? { step: i, phase: 'watch', qty: 0, rejected: false }
    : i === 5 ? { step: 4, phase: 'transit', qty, rejected: false }
    : { step: 4, phase: 'delivered', qty, rejected: false }),
};
