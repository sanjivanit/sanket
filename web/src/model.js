// Scripted demo model for the dashboard. A direct port of the maths and copy in design/Main.dc.html.
// Pure functions only: state in, view data out. No API calls yet (phase 2 replaces the scripted parts).

const OK = 'var(--ok)', CRIT = 'var(--crit)', WARN = 'var(--warn)', NEU = 'var(--faint)';
const NOISE = [0, -1, 1, 0, 2, -1, 0, 1, 0, 0];
export const MULT = [1, 1.2, 1.7, 2.6, 5.5];
const THR = 0.129;

export const vials = (n) => n + (n === 1 ? ' vial' : ' vials');

export const histAt = (s) => NOISE.map((n) => 20 + n).concat(MULT.slice(1, s + 1).map((m) => 20 * m));

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

const R = 6371.0088, LAT0 = 20.0, LNG0 = 77.0, KM_DEG = R * Math.PI / 180;
const hav = (la1, lo1, la2, lo2) => {
  const r = Math.PI / 180, dp = (la2 - la1) * r, dl = (lo2 - lo1) * r;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const km = (c) => hav(LAT0, LNG0, c.lat, c.lng);

// Sample clinics. Names, doctors and coordinates are invented.
const CLINICS_A = [
  { name: 'PHC Rampur', short: 'Rampur', doctor: 'Dr. A. Verma', lat: 20.0, lng: 77.0, burn: 2, bedsTotal: 8, bedsOcc: 7, doc: true, rampur: true },
  { name: 'PHC Shivpuri', short: 'Shivpuri', doctor: 'Dr. S. Kulkarni', lat: 20.09485, lng: 77.14434, burn: 3, bedsTotal: 10, bedsOcc: 4, doc: true },
  { name: 'PHC Bhor', short: 'Bhor', doctor: 'Dr. R. Deshmukh', lat: 20.06909, lng: 76.79756, stock: 12, burn: 4, bedsTotal: 8, bedsOcc: 6, doc: false },
  { name: 'PHC Khed', short: 'Khed', doctor: 'Dr. N. Patil', lat: 19.76544, lng: 77.06678, stock: 28, burn: 2, bedsTotal: 6, bedsOcc: 3, doc: true, chip: 'Expires in 77 days', chipColor: 'var(--warn-t)' },
  { name: 'PHC Daund', short: 'Daund', doctor: 'Dr. V. Rao', lat: 19.8896, lng: 76.74864, stock: 18, burn: 3, bedsTotal: 10, bedsOcc: 6, doc: false },
  { name: 'PHC Alibag Rural', short: 'Alibag', doctor: 'Dr. K. Joshi', lat: 20.21346, lng: 76.80904, stock: 8, burn: 2, bedsTotal: 10, bedsOcc: 9, doc: true },
  { name: 'PHC Saswad', short: 'Saswad', doctor: 'Dr. P. Mane', lat: 19.84915, lng: 77.27739, stock: 30, burn: 2, bedsTotal: 8, bedsOcc: 4, doc: true },
  { name: 'PHC Junnar', short: 'Junnar', doctor: 'Dr. M. Shinde', lat: 19.66575, lng: 76.83452, stock: 36, burn: 3, bedsTotal: 10, bedsOcc: 3, doc: true },
];
const CLINICS_B = [
  { name: 'PHC Pargaon', short: 'Pargaon', doctor: 'Dr. A. Pawar', lat: 20.27136, lng: 77.34517, stock: 9, burn: 3, bedsTotal: 10, bedsOcc: 8, doc: true },
  { name: 'PHC Lonand', short: 'Lonand', doctor: 'Dr. T. More', lat: 19.64148, lng: 77.31917, stock: 40, burn: 3, bedsTotal: 10, bedsOcc: 3, doc: true },
  { name: 'PHC Nimgaon', short: 'Nimgaon', doctor: 'Dr. S. Jadhav', lat: 19.89266, lng: 76.35954, stock: 26, burn: 2, bedsTotal: 8, bedsOcc: 4, doc: true },
];

const DONORS = [
  { n: 'Shivpuri', burn: 3, doc: true, occ: 0.4, dist: 18.4 },
  { n: 'Khed', stock: 28, burn: 2, doc: true, occ: 0.5, dist: 27.0 },
  { n: 'Saswad', stock: 30, burn: 2, doc: true, occ: 0.5, dist: 33.5 },
  { n: 'Bhor', stock: 12, burn: 4, doc: false, occ: 0.75, dist: 22.5 },
  { n: 'Daund', stock: 18, burn: 3, doc: false, occ: 0.6, dist: 29.0 },
  { n: 'Alibag', stock: 8, burn: 2, doc: true, occ: 0.9, dist: 31.0 },
  { n: 'Junnar', stock: 36, burn: 3, doc: true, occ: 0.3, dist: 41.0 },
];

const OTHERS = [
  { text: '✓ Khed backup', color: 'var(--ok-t)' },
  { text: '✓ Saswad backup', color: 'var(--ok-t)' },
  { text: 'Bhor: no doctor', color: 'var(--doc-t)' },
  { text: 'Daund: no doctor', color: 'var(--doc-t)' },
  { text: '✕ Alibag: low stock', color: 'var(--crit-t)' },
  { text: '✕ Junnar: too far', color: 'var(--crit-t)' },
];

const ECG = {
  ok: 'M0 18 H44 L49 18 L52 12 L56 24 L59 18 H120',
  warn: 'M0 18 H30 L34 18 L37 8 L42 28 L45 18 H72 L75 12 L79 24 L82 18 H120',
  crit: 'M0 18 H14 L18 4 L24 32 L28 8 L32 28 L36 18 H60 L64 2 L70 34 L74 10 L78 26 L82 18 H120',
};

export const WAYBILL_LANGS = {
  en: { name: 'English', tpl: 'x', vial: ['vial', 'vials'], to: 'to' },
  mr: { name: 'Marathi', tpl: '{d} येथून {r} येथे {v} अँटी-स्नेक व्हेनम (ASV) पोहोचवा. {t} °C तापमान राखा.', vial: ['कुपी', 'कुपी'], to: 'ते' },
  hi: { name: 'Hindi', tpl: '{d} से {r} तक {v} एंटी-स्नेक वेनम (ASV) पहुँचाएँ। तापमान {t} °C रखें।', vial: ['शीशी', 'शीशी'], to: 'से' },
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

export function buildView({ step, phase, qty, rejected }, lang = 'mr') {
  const delivered = phase === 'delivered';
  const hist = histAt(step);
  const rampMult = MULT[step];
  const rampBurn = 2 * rampMult;
  const rampStock = 6 + (delivered ? qty : 0);
  const shivStock = 44 - (delivered ? qty : 0);
  const dsr = rampStock / rampBurn;
  const projH = forecast(hist, 20, 2, rampStock);
  const growth = hist[hist.length - 1] / hist[hist.length - 2] - 1;
  const warnRule = projH !== null && projH <= 72 && growth >= THR;
  const status = dsr < 1 ? 'crit' : (dsr < 3 || warnRule) ? 'warn' : 'ok';
  const need = Math.max(0, Math.ceil(2.0 * rampBurn - rampStock));
  const leadH = Math.round(forecast(histAt(1), 20, 2, 6));
  const qtyShown = phase === 'watch' ? need : qty;
  const footNow = Math.round(20 * rampMult);
  const hoursLeft = Math.round(dsr * 24);

  const sc = status === 'crit' ? CRIT : status === 'warn' ? WARN : OK;
  const scText = status === 'crit' ? 'var(--crit-t)' : status === 'warn' ? 'var(--warn-t)' : 'var(--ok-t)';
  const scBg = status === 'crit' ? 'var(--crit-bg)' : status === 'warn' ? 'var(--warn-bg)' : 'transparent';

  const build = (c, idx) => {
    const mult = c.rampur ? rampMult : 1;
    const stock = c.rampur ? rampStock : c.name === 'PHC Shivpuri' ? shivStock : c.stock;
    const curBurn = c.burn * mult;
    const d = stock / curBurn;
    const s = d < 1 ? 'crit' : ((c.rampur && status === 'warn') || d < 3) ? 'warn' : 'ok';
    const color = s === 'crit' ? CRIT : s === 'warn' ? WARN : OK;
    const full = c.bedsOcc / c.bedsTotal >= 0.85;
    const bedSquares = [];
    for (let i = 0; i < c.bedsTotal; i++) {
      const on = i < c.bedsOcc;
      bedSquares.push({ bg: on ? (full ? WARN : NEU) : 'transparent', bd: on ? (full ? WARN : NEU) : 'var(--rule3)' });
    }
    const shivChip = step === 0 ? '' : phase === 'transit' ? 'Sending ' + vials(qty) : delivered ? 'Gave ' + vials(qty) : need > 0 ? 'Proposed donor' : 'Standby donor';
    const isShiv = c.name === 'PHC Shivpuri';
    const chip = isShiv ? shivChip : (c.chip || '');
    const chipColor = isShiv ? 'var(--acc-t)' : (c.chipColor || 'var(--muted)');
    const rowBg = c.rampur ? scBg : (isShiv && shivChip ? 'var(--acc-bg)' : 'transparent');
    const meta = c.rampur ? footNow + ' visits today' : c.groupB ? Math.round(km(c)) + ' km' : km(c).toFixed(1) + ' km';
    return {
      name: c.name, short: c.name.replace('PHC ', ''), meta,
      tileMeta: c.groupB ? 'Next district, ' + meta : meta,
      rowBg, hasChip: !!chip, chipText: chip, chipColor,
      daysText: s === 'crit' ? String(Math.round(d * 24)) : d.toFixed(1),
      unit: s === 'crit' ? 'hours' : 'days',
      statusLabel: s === 'crit' ? '■ Critical' : (c.rampur && s === 'warn') ? '▲ Early warning' : '',
      textColor: s === 'crit' ? 'var(--crit-t)' : 'var(--warn-t)',
      fill: color,
      fillPct: Math.min(d, 14) / 14 * 100,
      supplyText: stock + ' vials',
      bedSquares,
      bedText: c.bedsOcc + ' of ' + c.bedsTotal + (full ? ', ' + Math.round(c.bedsOcc / c.bedsTotal * 100) + '%' : ''),
      bedColor: full ? 'var(--warn-t)' : 'var(--muted)',
      doc: c.doc,
      docTip: c.doc ? c.doctor + ' (sample name), on duty' : c.doctor + ' (sample name), not on duty today',
      ringAria: c.name + ': ' + (s === 'crit' ? Math.round(d * 24) + ' hours' : d.toFixed(1) + ' days') + ' of supply',
      ringDash: (Math.min(d, 14) / 14 * 175.93).toFixed(1) + ' 175.9',
      tileBorder: c.rampur ? (s === 'crit' ? 'var(--crit-bd)' : s === 'warn' ? 'var(--warn-bd)' : 'var(--rule)') : (chip && chipColor === 'var(--acc-t)') ? 'var(--acc-bd)' : 'var(--rule)',
      tipAbove: idx >= 4,
      occ: c.bedsOcc / c.bedsTotal,
      dsr: d,
    };
  };

  const rowsA = CLINICS_A.map(build);
  const rowsB = CLINICS_B.map((c, i) => build({ ...c, groupB: true }, i));

  const reserve = rowsA.reduce((a, r) => a + Math.min(r.dsr, 14) / 14, 0) / rowsA.length;

  // donors that pass every rule for this need
  const need0 = Math.max(need, 1);
  const eligibleCount = DONORS
    .map((d) => (d.n === 'Shivpuri' ? { ...d, stock: shivStock } : d))
    .filter((d) => d.doc && d.occ < 0.85 && d.dist <= 35 && Math.floor(d.stock - 3 * d.burn) >= need0).length;

  const beforeAfter = [
    { name: 'Rampur', nowPct: Math.min(6 / rampBurn, 14) / 14 * 100, afterPct: Math.min((6 + qtyShown) / rampBurn, 14) / 14 * 100, nowColor: 6 / rampBurn < 1 ? CRIT : 6 / rampBurn < 3 ? WARN : OK, afterColor: (6 + qtyShown) / rampBurn < 3 ? WARN : OK, text: (6 / rampBurn).toFixed(1) + ' to ' + ((6 + qtyShown) / rampBurn).toFixed(1) + ' days' },
    { name: 'Shivpuri', nowPct: Math.min(44 / 3, 14) / 14 * 100, afterPct: Math.min((44 - qtyShown) / 3, 14) / 14 * 100, nowColor: OK, afterColor: OK, text: (44 / 3).toFixed(1) + ' to ' + ((44 - qtyShown) / 3).toFixed(1) + ' days' },
  ];

  // map
  const cx = 413, cy = 178, k = 1.95;
  let donorPt = { x: 0, y: 0 };
  const mapNodes = CLINICS_A.slice(1).concat(CLINICS_B).map((p) => {
    const east = (p.lng - LNG0) * KM_DEG * Math.cos(LAT0 * Math.PI / 180) * k;
    const north = (p.lat - LAT0) * KM_DEG * k;
    const x = cx + east, y = cy - north;
    const isDonor = p.short === 'Shivpuri', nodoc = !p.doc;
    if (isDonor) donorPt = { x, y };
    const rad = 4 + Math.sqrt(p.name === 'PHC Shivpuri' ? shivStock : p.stock) * 1.15;
    const hot = isDonor && step > 0;
    return { label: p.short, x, y, rad, right: east >= 0, nodoc, hot };
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
  const mapSub = delivered ? 'Rampur restocked from Shivpuri. Keep watching: supply is ' + dsr.toFixed(1) + ' days.'
    : phase === 'transit' ? qty + ' vials are moving from Shivpuri to Rampur.'
    : step === 0 ? 'All clinics stable. Press Advance day to start the surge.'
    : need === 0 ? 'Standby donor ready. Nothing to send yet.'
    : eligibleCount + ' clinics in range can cover ' + vials(need) + '. The next district is not needed.';
  const mapAria = 'Reach map. PHC Rampur is at the centre with a ring at 35 kilometres for same-district donors and a ring at 80 kilometres for the next district. Shivpuri, 18.4 kilometres away, is the nearest donor.';

  // forecast chart
  const f = fit(hist);
  const proj = [1, 2, 3].map((d) => Math.max(20, f.icpt + f.slope * (4 + d)));
  const X = (i) => 36 + i * 27.5;
  const Y = (v) => 160 - Math.min(v, 160) * (130 / 160);
  const last = hist.length - 1;
  const chart = {
    hist: hist.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '),
    proj: [X(last).toFixed(1) + ',' + Y(hist[last]).toFixed(1)].concat(proj.map((v, i) => X(last + 1 + i).toFixed(1) + ',' + Y(v).toFixed(1))).join(' '),
    projOp: step > 0 ? 1 : 0,
    baseY: Y(20).toFixed(1),
    baseLabelY: (Y(20) - 6).toFixed(1),
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
    aria: 'Visits per day at PHC Rampur. Today is ' + footNow + ' against a normal 20.',
  };

  // alert card
  let alert;
  if (delivered) {
    alert = { big: dsr.toFixed(1), unit: 'days now', head: 'Rampur has supply again', sub: vials(qty) + ' arrived. Still under 3 days, so keep watching.', fg: 'var(--warn-t)', bg: 'var(--warn-bg)', bd: 'var(--warn-bd)', ecg: ECG.ok };
  } else if (phase === 'transit') {
    alert = { big: '28', unit: 'min away', head: 'Transfer is on the way', sub: vials(qty) + ' from Shivpuri. Rampur has about ' + hoursLeft + ' hours left.', fg: 'var(--acc-t)', bg: 'var(--acc-bg)', bd: 'var(--acc-bd)', ecg: ECG.warn };
  } else if (status === 'crit') {
    alert = { big: String(hoursLeft), unit: 'hours left', head: 'Rampur is almost out of venom', sub: 'Warned ' + leadH + ' hours earlier. ' + footNow + ' visits today, normal is 20.', fg: 'var(--crit-t)', bg: 'var(--crit-bg)', bd: 'var(--crit-bd)', ecg: ECG.crit };
  } else if (status === 'warn') {
    alert = { big: String(Math.round(projH !== null ? projH : hoursLeft)), unit: 'hours to empty', head: 'Early warning: Rampur is heading for empty', sub: 'Visits are ' + footNow + ' a day, normal is 20. Act before it runs out.', fg: 'var(--warn-t)', bg: 'var(--warn-bg)', bd: 'var(--warn-bd)', ecg: ECG.warn };
  } else {
    alert = { big: dsr.toFixed(1), unit: 'days, lowest', head: 'All clinics have 3 days or more', sub: 'Nothing needs attention right now.', fg: 'var(--ok-t)', bg: 'var(--ok-bg)', bd: 'var(--ok-bd)', ecg: ECG.ok };
  }

  // plan
  const showPlan = step >= 1;
  const routeVials = phase === 'watch' ? (need > 0 ? vials(need) : 'Standby') : vials(qty);
  const planTitle = phase === 'watch' ? (status === 'crit' ? 'Recommended transfer' : 'Standby plan') : phase === 'transit' ? 'Approved transfer' : 'Completed transfer';
  const actionNote = rejected && phase === 'watch' ? 'Rejected. Advance the day for a new recommendation.'
    : delivered ? 'Delivered. Rampur is restocked.'
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
  const solidCount = delivered ? 6 + qty : 6;
  const ghostCount = delivered ? 0 : qtyShown;
  const vialIcons = [];
  for (let i = 0; i < Math.min(solidCount, 30); i++) vialIcons.push('solid');
  const ghostMax = Math.min(ghostCount, 30 - vialIcons.length);
  for (let i = 0; i < ghostMax; i++) vialIcons.push(phase === 'transit' ? 'transit' : 'needed');
  const vialLegend = delivered ? solidCount + ' vials on hand' : ghostCount > 0 ? '6 on hand, ' + ghostCount + (phase === 'transit' ? ' on the way' : ' more needed') : '6 on hand';

  // log
  const log = [];
  for (let s = 1; s <= step; s++) log.push('Day ' + s + ': Rampur ' + Math.round(20 * MULT[s]) + ' visits, normal 20');
  if (step >= 1) log.push('Early warning: ' + leadH + ' hours to stock-out at day 1');
  if (status === 'crit' && step >= 4) log.push('Rampur critical: ' + Math.round(6 / rampBurn * 24) + ' hours left');
  if (step >= 1) log.push('Search: same district, 35 km or less');
  if (step >= 1) log.push('Shivpuri can give ' + Math.floor(44 - 9) + ', need ' + need);
  if (step >= 1 && need > 0) log.push('Gemini picked Shivpuri, code check passed');
  if (phase !== 'watch') log.push('DMO approved. Dispatch SK-2026-MH-0001, ' + qty + ' vials');
  if (delivered) log.push('Delivered. Rampur now ' + days(dsr));
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
    number: approved ? 'SK-2026-MH-0001' : 'Number on approval',
    english: qtyShown > 0 ? 'Take ' + vials(qtyShown) + ' of anti-snake venom from Shivpuri to Rampur.' : 'No transfer is needed yet.',
    showLocal: L !== 'en' && qtyShown > 0,
    langCode: L,
    local: qtyShown > 0 ? fillTpl(WAYBILL_LANGS[L].tpl, { v: qtyShown + ' ' + WAYBILL_LANGS[L].vial[qtyShown === 1 ? 0 : 1], d: 'Shivpuri', r: 'Rampur', t: '2 ' + WAYBILL_LANGS[L].to + ' 8' }) : '',
    back: 'Back-translation (sample): Take ' + vials(qtyShown) + ' of anti-snake venom from Shivpuri to Rampur.',
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
  const vals6 = MULT.map((m) => 6 / (2 * m));
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
    aria: 'Rampur days of supply by day: ' + vals6.slice(0, 5).map((v) => v.toFixed(1)).join(', ') + '. After a transfer: ' + vals6[5].toFixed(1) + '.',
    dots: vals6.map((v, i) => ({
      x: CX(i), y: CY(v).toFixed(1), color: stat6(v),
      opacity: i <= 4 ? (i <= step ? 1 : 0.28) : (qtyShown > 0 ? (phase === 'watch' ? 0.45 : 1) : 0),
    })),
    labels: ['Normal', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'After transfer'],
  };

  const impact = [
    { label: 'Warning lead time', value: step >= 1 ? leadH + ' h' : '-', sub: 'Today: about 0 h*', color: 'var(--acc-t)' },
    { label: 'Transfer time', value: (need > 0 || phase !== 'watch') ? '28 min' : '-', sub: 'Central: 14 to 21 days*', color: 'var(--acc-t)' },
    { label: 'Donor keeps', value: ((44 - qtyShown) / 3).toFixed(1) + ' days', sub: 'Rule: at least 3 days', color: 'var(--ok-t)' },
  ];

  const nonOk = status === 'ok' ? 0 : 1;
  return {
    status, need, qtyShown, hoursLeft, dsr, eligibleCount, delivered,
    topBar: phase === 'transit' ? 'var(--acc)' : sc,
    dayLabel: step === 0 ? 'Before the surge' : 'Surge day ' + step + ' of 4',
    tlNodes,
    stat: { main: (11 - nonOk) + ' stable', sub: status === 'crit' ? '1 critical' : status === 'warn' ? '1 early warning' : '', subColor: scText, reserveText: Math.round(reserve * 100) + '%', reservePct: Math.round(reserve * 100) },
    rowsA, rowsB, beforeAfter, others: OTHERS,
    map: { nodes: mapNodes, line, arc, sub: mapSub, aria: mapAria },
    callout: {
      need: step === 0 ? '-' : String(qtyShown),
      needLabel: step === 0 ? 'no vials needed' : delivered ? 'vials delivered' : phase === 'transit' ? 'vials in transit' : (qtyShown === 1 ? 'vial needed' : 'vials needed'),
      donors: step === 0 ? '-' : String(eligibleCount),
      dist: step === 0 ? '-' : '18.4 km',
      eta: step === 0 ? '-' : '28 min',
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
  goto: (i) => (i <= 4 ? { step: i, phase: 'watch', qty: 0, rejected: false }
    : i === 5 ? { step: 4, phase: 'transit', qty: 16, rejected: false }
    : { step: 4, phase: 'delivered', qty: 16, rejected: false }),
};
