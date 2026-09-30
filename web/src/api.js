// Calls to the Sanket API (see docs/API_CONTRACT.md). Same-origin /api/... in production; Vite proxies it in development.
// Every failure is caught by the caller and shown as the offline template, never as a raw error.
import { MULT, histAt } from './model.js';
import { DEFAULT } from './datasets.js';

// Gemini gets 8 s per model and the server tries two, so allow for the slowest honest answer.
const TIMEOUT_MS = 45000;

async function post(path, body) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally { clearTimeout(timer); }
}

// Only the fields in the data contract go to the API, with today's footfall at the target set for this day of the surge.
const FIELDS = ['id', 'name', 'stateCode', 'districtId', 'lat', 'lng', 'stock', 'baselineBurn', 'bedsTotal', 'bedsOcc', 'doctorOnDuty', 'baselineFootfall', 'footfallToday', 'batchNumber', 'expiryDate'];
export const clinicsAtStep = (step, ds = DEFAULT) => ds.json.clinics.map((c) => {
  const out = Object.fromEntries(FIELDS.filter((k) => k in c).map((k) => [k, c[k]]));
  return c.id === ds.targetId ? { ...out, footfallToday: Math.round(ds.target.baseFoot * MULT[step]) } : out;
});

// One request per day and language. A failed request is forgotten so it can be tried again later.
const dispatchCache = new Map();
export const fetchDispatch = (step, lang, ds = DEFAULT) => {
  const key = ds.uid + '|' + step + '|' + lang;
  if (!dispatchCache.has(key)) {
    dispatchCache.set(key, post('/api/dispatch', { stateCode: ds.stateCode, clinics: clinicsAtStep(step, ds), recipientId: ds.targetId, language: lang, counter: 1 })
      .catch((e) => { dispatchCache.delete(key); throw e; }));
  }
  return dispatchCache.get(key);
};

export const fetchBrief = (step, ds = DEFAULT) =>
  post('/api/warning-brief', { clinic: clinicsAtStep(step, ds).find((c) => c.id === ds.targetId), history: histAt(step, ds.target.baseFoot), threshold: 0.129 });
