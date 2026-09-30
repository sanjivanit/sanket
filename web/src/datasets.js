// Turns a data file (data/*.json) into what the scripted model needs: the surge target, its same-district
// donors, other districts, and the primary donor. No numbers are invented here; everything comes from the file.
import MH_JSON from '../../data/maharashtra.json' with { type: 'json' };
import MBJ_JSON from '../../data/odisha-mayurbhanj.json' with { type: 'json' };
import RULES from '../../config/rules.json' with { type: 'json' };

const R = 6371.0088;
export const hav = (a, b) => {
  const r = Math.PI / 180, dp = (b.lat - a.lat) * r, dl = (b.lng - a.lng) * r;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
export const shortName = (n) => String(n || '').replace(/^(PHC|CHC|SDH) /, '');

// The surge multiplier on the last demo day. Kept in step with MULT in model.js by a test.
const DAY4 = 5.5;

const view = (c, extra) => ({
  id: c.id, name: c.name, short: shortName(c.name),
  doctor: c.doctorName ? c.doctorName.replace(/ \(sample\)$/, '') : null,
  lat: c.lat, lng: c.lng, stock: c.stock, burn: c.baselineBurn,
  bedsTotal: c.bedsTotal, bedsOcc: c.bedsOcc, doc: c.doctorOnDuty,
  baseFoot: c.baselineFootfall, batch: c.batchNumber, ...extra,
});

// json: a data file. order: optional donor tile order (ids), used by the design-parity fixture. chips: optional { clinicId: { chip, chipColor } } for legacy sample sets.
// source: { mode: 'simulated' } or { mode: 'csv', fileName }.
let uid = 0;
export function datasetFrom(json, { chips = {}, order = null, source = { mode: 'simulated' } } = {}) {
  const t = json.clinics.find((c) => c.id === json.targetId);
  const target = view(t, { isTarget: true });
  const sameDistrict = json.clinics.filter((c) => c.districtId === t.districtId && c.id !== t.id);
  const otherDistrict = json.clinics.filter((c) => c.districtId !== t.districtId);
  const withDist = (c) => ({ ...view(c, chips[c.id] || {}), dist: Math.round(hav(t, c) * 10) / 10 });
  const donors = sameDistrict.map(withDist);
  if (order) donors.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const groupB = otherDistrict.map((c) => ({ ...withDist(c), groupB: true }));
  if (order) groupB.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const need4 = Math.max(0, Math.ceil(RULES.targetDays * t.baselineBurn * DAY4 - t.stock));
  const cover = (d) => Math.floor(d.stock - RULES.donorKeepDays * d.burn);
  const rule = (d, need) => (d.dist > RULES.tier1Km ? 'too far'
    : !d.doc ? 'no medical officer'
    : d.bedsOcc / d.bedsTotal >= RULES.bedOccupancyLimit ? 'beds full'
    : cover(d) < need ? 'low stock' : null);
  const eligible = donors.filter((d) => !rule(d, need4)).sort((a, b) => a.dist - b.dist);
  if (donors.length === 0) throw new Error('At least two facilities are needed: the first row is the surge target, the rest can donate.');
  // With no eligible donor the nearest one is shown, and the engine will answer no_donor.
  const primary = eligible[0] || donors.slice().sort((a, b) => a.dist - b.dist)[0];
  primary.isDonor = true;

  const tags = donors.filter((d) => d !== primary).map((d) => {
    const why = rule(d, need4);
    if (!why) return { text: `✓ ${d.short} backup`, color: 'var(--ok-t)' };
    return { text: why === 'no medical officer' ? `${d.short}: no medical officer` : `✕ ${d.short}: ${why}`, color: why === 'no medical officer' ? 'var(--doc-t)' : 'var(--crit-t)' };
  }).sort((a, b) => (a.text[0] === '✓' ? 0 : 1) - (b.text[0] === '✓' ? 0 : 1));

  const all = [target, ...donors, ...groupB];
  return {
    uid: ++uid, approx: json.clinics.some((c) => /approx/.test(c.coordinates || '')), json, source, stateCode: json.stateCode, state: json.state || json.stateCode,
    district: json.district || 'District A', targetId: t.id,
    target, donors, groupB, donor: primary, others: tags, need4, all,
    etaMin: Math.round(primary.dist / RULES.avgSpeedKmh * 60),
  };
}

// Legacy sample set (Maharashtra). Kept only so the port can be checked against the design prototype.
export const MH = datasetFrom({ ...MH_JSON, state: 'Maharashtra', district: 'District A' }, {
  chips: { 'MH-03': { chip: 'Expires in 77 days', chipColor: 'var(--warn-t)' } },
  order: ['MH-02', 'MH-04', 'MH-03', 'MH-07', 'MH-05', 'MH-08', 'MH-06', 'MH-11', 'MH-09', 'MH-10'],
});
export const MBJ = datasetFrom(MBJ_JSON);
export const DEFAULT = MBJ;
