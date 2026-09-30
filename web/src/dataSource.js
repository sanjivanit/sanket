// The data-source layer. Two modes:
//   simulated (default): the Mayurbhanj file in data/odisha-mayurbhanj.json.
//   csv: a facilities file the person picks. It is read in the browser and never uploaded.
// Both modes give the same shape (a data set, see datasets.js), so the model, the map and the API calls do not care.
// A CSV replaces the simulated numbers, and the label on screen changes from "Simulated data" to "Imported data".
import { DEFAULT, datasetFrom } from './datasets.js';

export const COLUMNS = ['facility_name', 'block', 'latitude', 'longitude', 'asv_stock', 'baseline_burn_per_day', 'beds_total', 'beds_occupied', 'doctor_on_duty'];
const OPTIONAL = ['batch_number', 'expiry_date'];
const MAX_ROWS = 50;
// Not in the file, so the surge demo uses a fixed normal of 20 visits a day at every facility.
const BASELINE_FOOTFALL = 20;
const NO_EXPIRY = '9999-12-31';

// Small CSV reader: commas, double quotes and quoted line breaks. No dependency needed for a file this simple.
export function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  const s = String(text).replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') quoted = false; else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); cell = ''; rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

const bool = (v) => {
  const t = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(t)) return true;
  if (['false', 'no', 'n', '0'].includes(t)) return false;
  return null;
};

// Returns { ok: true, json, notes } or { ok: false, errors }. Errors name the row and the column.
export function facilitiesFromCsv(text) {
  const table = parseCsv(text);
  if (table.length === 0) return { ok: false, errors: ['The file is empty.'] };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const missing = COLUMNS.filter((c) => !head.includes(c));
  if (missing.length) return { ok: false, errors: [`Missing columns: ${missing.join(', ')}. Use the template.`] };
  const at = (r, name) => { const i = head.indexOf(name); return i < 0 ? '' : String(r[i] ?? '').trim(); };
  const body = table.slice(1);
  if (body.length < 2) return { ok: false, errors: ['Add at least two facilities: the first row is the surge target, the others can donate.'] };
  if (body.length > MAX_ROWS) return { ok: false, errors: [`At most ${MAX_ROWS} facilities. This file has ${body.length}.`] };

  const errors = [];
  const clinics = body.map((r, i) => {
    const line = i + 2;
    const bad = (col, why) => errors.push(`Row ${line}, ${col}: ${why}`);
    const name = at(r, 'facility_name');
    if (!name) bad('facility_name', 'is empty');
    const num = (col, { int = false, min = -Infinity, max = Infinity } = {}) => {
      const raw = at(r, col), n = Number(raw);
      if (raw === '' || !Number.isFinite(n)) { bad(col, `"${raw}" is not a number`); return 0; }
      if (int && !Number.isInteger(n)) bad(col, `${n} must be a whole number`);
      if (n < min || n > max) bad(col, Number.isFinite(max) ? `${n} is outside ${min} to ${max}` : `${n} must be ${min} or more`);
      return n;
    };
    const lat = num('latitude', { min: -90, max: 90 }), lng = num('longitude', { min: -180, max: 180 });
    const stock = num('asv_stock', { int: true, min: 0 }), burn = num('baseline_burn_per_day', { min: 0.1 });
    const bedsTotal = num('beds_total', { int: true, min: 1 }), bedsOcc = num('beds_occupied', { int: true, min: 0 });
    if (bedsOcc > bedsTotal) bad('beds_occupied', `${bedsOcc} is more than beds_total ${bedsTotal}`);
    const doc = bool(at(r, 'doctor_on_duty'));
    if (doc === null) bad('doctor_on_duty', `"${at(r, 'doctor_on_duty')}" is not yes/no or true/false`);
    const expiry = at(r, 'expiry_date');
    if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) bad('expiry_date', `"${expiry}" is not a date like 2027-05-31`);
    return {
      id: 'IMP-' + String(i + 1).padStart(2, '0'), name, stateCode: 'IMP', districtId: 'IMP', block: at(r, 'block'),
      lat, lng, stock, baselineBurn: burn, bedsTotal, bedsOcc, doctorOnDuty: !!doc,
      baselineFootfall: BASELINE_FOOTFALL, footfallToday: BASELINE_FOOTFALL,
      batchNumber: at(r, 'batch_number') || 'Not in file', expiryDate: expiry || NO_EXPIRY,
    };
  });
  if (errors.length) return { ok: false, errors: errors.slice(0, 6).concat(errors.length > 6 ? [`And ${errors.length - 6} more.`] : []) };

  const notes = [];
  if (!head.includes('expiry_date')) notes.push('Batch expiry is not in this file, so it is not checked.');
  const t = clinics[0];
  const far = clinics.slice(1).filter((c) => Math.hypot((c.lat - t.lat) * 111, (c.lng - t.lng) * 111 * Math.cos(t.lat * Math.PI / 180)) > 80).length;
  if (far) notes.push(`${far} facilities are more than about 80 km from the first row, outside the search range.`);
  notes.push(`The first row (${t.name}) is the surge target. Normal visits are set to ${BASELINE_FOOTFALL} a day everywhere.`);
  return { ok: true, notes, json: { note: 'Imported from a CSV file.', stateCode: 'IMP', state: 'Imported file', district: 'Imported file', targetId: t.id, clinics } };
}

// The one way the app gets its data. { mode: 'simulated' } or { mode: 'csv', text, fileName }.
export function loadDataset(source = { mode: 'simulated' }) {
  if (source.mode !== 'csv') return { ok: true, dataset: DEFAULT, notes: [] };
  const r = facilitiesFromCsv(source.text);
  if (!r.ok) return r;
  try {
    return { ok: true, notes: r.notes, dataset: datasetFrom(r.json, { source: { mode: 'csv', fileName: source.fileName } }) };
  } catch (e) { return { ok: false, errors: [e.message] }; }
}
