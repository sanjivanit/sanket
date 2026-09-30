// Sanket engine. Plain code, no AI. Every safety rule lives here.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
export const RULES = JSON.parse(readFileSync(new URL('config/rules.json', root), 'utf8'));

const R = 6371.0088;
export function distanceKm(a, b) {
  const r = Math.PI / 180;
  const dp = (b.lat - a.lat) * r, dl = (b.lng - a.lng) * r;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const isExpired = (c, today = new Date()) => new Date(c.expiryDate + 'T23:59:59Z') < today;
export const usableStock = (c, today) => (isExpired(c, today) ? 0 : c.stock);
export const currentBurn = (c) => c.baselineBurn * Math.max(1, c.footfallToday / c.baselineFootfall);
export const daysOfSupply = (c, today) => usableStock(c, today) / currentBurn(c);
export function status(c, today) {
  const d = daysOfSupply(c, today);
  return d < 1 ? 'critical' : d < 3 ? 'warning' : 'stable';
}
export const bedOccupancy = (c) => c.bedsOcc / c.bedsTotal;

// How many vials the recipient needs so it holds targetDays of supply at today's pace.
export const vialsNeeded = (c, today) =>
  Math.max(0, Math.ceil(RULES.targetDays * currentBurn(c) - usableStock(c, today)));
// How many vials a donor can give and still keep donorKeepDays of its own supply.
export const donorMax = (c, today) =>
  Math.floor(usableStock(c, today) - RULES.donorKeepDays * currentBurn(c));

// Straight-line trend on the last N days of footfall. Returns hours until stock runs out.
export function forecastHours(history, baselineFootfall, baselineBurn, stock) {
  const n = RULES.forecastWindowDays;
  const last = history.slice(-n);
  if (last.length < n) return null;
  const mean = last.reduce((a, b) => a + b, 0) / n;
  const mid = (n - 1) / 2;
  let sxy = 0, sxx = 0;
  last.forEach((v, i) => { sxy += (i - mid) * (v - mean); sxx += (i - mid) ** 2; });
  const slope = sxy / sxx;
  const icpt = mean - slope * mid;
  let left = stock, t = 0;
  for (let d = 1; d <= RULES.forecastHorizonDays; d++) {
    const foot = Math.max(baselineFootfall, icpt + slope * (n - 1 + d));
    const burn = baselineBurn * foot / baselineFootfall;
    if (left <= burn) return (t + left / burn) * 24;
    left -= burn; t += 1;
  }
  return null;
}

export function earlyWarning({ history, clinic, threshold, today }) {
  const hours = forecastHours(history, clinic.baselineFootfall, clinic.baselineBurn, usableStock(clinic, today));
  const growth = history[history.length - 1] / history[history.length - 2] - 1;
  const st = status(clinic, today);
  const fires = st !== 'critical' && hours !== null && hours <= RULES.warnHours && growth >= threshold;
  return { fires, projectedStockoutHours: hours, growthPerDay: growth };
}

// Find donors for a recipient. Tier 1: same district within tier1Km. Tier 2: another district
// in the same state within tier2Km. One donor must cover the whole need.
export function findTransfer(clinics, recipientId, today = new Date()) {
  const recipient = clinics.find((c) => c.id === recipientId);
  if (!recipient) throw new Error('unknown recipient');
  const need = vialsNeeded(recipient, today);
  const result = { need, tier: 1, eligible: [], rejected: [], recipientId };
  if (need === 0) return result;

  const judge = (tier) => {
    const eligible = [], rejected = [];
    for (const d of clinics) {
      if (d.id === recipientId) continue;
      const dist = distanceKm(recipient, d);
      const sameDistrict = d.districtId === recipient.districtId;
      const limit = tier === 1 ? RULES.tier1Km : RULES.tier2Km;
      let reason = null;
      if (tier === 1 && !sameDistrict) reason = 'other district';
      else if (tier === 2 && sameDistrict) reason = 'same district (already searched)';
      else if (dist > limit) reason = 'too far';
      else if (!d.doctorOnDuty) reason = 'doctor absent';
      else if (bedOccupancy(d) >= RULES.bedOccupancyLimit) reason = 'beds at or above 85%';
      else if (isExpired(d, today)) reason = 'batch expired';
      else if (donorMax(d, today) < need) reason = 'not enough surplus';
      if (reason) rejected.push({ id: d.id, name: d.name, reason });
      else eligible.push({
        id: d.id, name: d.name, batchNumber: d.batchNumber, expiryDate: d.expiryDate,
        distanceKm: Math.round(dist * 10) / 10,
        etaMinutes: Math.round(dist / RULES.avgSpeedKmh * 60),
        canGive: donorMax(d, today),
        keepsDaysAfter: Math.round(((usableStock(d, today) - need) / currentBurn(d)) * 10) / 10,
        bedOccupancy: Math.round(bedOccupancy(d) * 100) / 100,
      });
    }
    eligible.sort((a, b) => a.distanceKm - b.distanceKm);
    return { eligible, rejected };
  };

  let j = judge(1);
  if (j.eligible.length === 0) { result.tier = 2; j = judge(2); }
  result.eligible = j.eligible;
  result.rejected = j.rejected;
  return result;
}

export function applyScenario(clinics, scenario, targetId) {
  const t = clinics.find((c) => c.id === targetId);
  return clinics.map((c) => {
    let mult = 1;
    if (c.id === targetId) mult = scenario.targetMultiplier;
    else if (scenario.othersMultiplier !== 1 && (!scenario.othersInTargetDistrictOnly || c.districtId === t.districtId)) mult = scenario.othersMultiplier;
    return { ...c, footfallToday: c.baselineFootfall * mult };
  });
}

// Federated averaging of the warning threshold. Only { threshold, sampleCount } leave a state.
export function federatedRound(nodes) {
  const total = nodes.reduce((a, n) => a + n.sampleCount, 0);
  const global = nodes.reduce((a, n) => a + n.threshold * n.sampleCount, 0) / total;
  const w = RULES.blendLocalWeight;
  return {
    global,
    perNode: Object.fromEntries(nodes.map((n) => [n.state, w * n.threshold + (1 - w) * global])),
  };
}

export const localThreshold = (episodes) => episodes.reduce((a, b) => a + b, 0) / episodes.length;

export function makeDispatchId(stateCode, counter, year = new Date().getUTCFullYear()) {
  return `SK-${year}-${stateCode}-${String(counter).padStart(4, '0')}`;
}
export function restockToken(payload) {
  return 'RGT-' + createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 10).toUpperCase();
}
