// Calls to the Sanket API (see docs/API_CONTRACT.md). Same-origin /api/... in production; Vite proxies it in development.
// Every failure is caught by the caller and shown as the offline template, never as a raw error.
import MH from '../../data/maharashtra.json';
import { MULT, histAt } from './model.js';

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

// The sample clinics with today's footfall at Rampur set for this day of the surge.
export const clinicsAtStep = (step) => MH.clinics.map((c) => (c.id === 'MH-01' ? { ...c, footfallToday: Math.round(20 * MULT[step]) } : c));

// One request per day and language. A failed request is forgotten so it can be tried again later.
const dispatchCache = new Map();
export const fetchDispatch = (step, lang) => {
  const key = step + '|' + lang;
  if (!dispatchCache.has(key)) {
    dispatchCache.set(key, post('/api/dispatch', { stateCode: 'MH', clinics: clinicsAtStep(step), recipientId: 'MH-01', language: lang, counter: 1 })
      .catch((e) => { dispatchCache.delete(key); throw e; }));
  }
  return dispatchCache.get(key);
};

export const fetchBrief = (step) =>
  post('/api/warning-brief', { clinic: clinicsAtStep(step)[0], history: histAt(step), threshold: 0.129 });
