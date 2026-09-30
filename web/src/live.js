// Merges API answers into the scripted view. The scripted model computes the on-screen numbers; the API is the
// source of truth for the donor, vial count, waybill text, dispatch ID and the written reasons.
import { vials } from './model.js';
import { shortName as short } from './datasets.js';

export function noteFor(status, source, model) {
  if (status === 'loading') return { text: 'Asking Gemini', tone: 'muted' };
  if (status === 'ready' && source === 'gemini') return { text: 'Written by Gemini, ' + model, tone: 'ok' };
  if (status === 'ready' || status === 'offline') return { text: 'Offline fallback used', tone: 'warn' };
  return null;
}

export function applyLive(v, live, approved) {
  const d = live.dispatch;
  const out = { ...v, live: { note: null, brief: null } };
  const r = d && d.status === 'ready' && d.data && d.data.status === 'recommended' ? d.data : null;
  if (d && (d.status === 'loading' || d.status === 'offline' || r)) out.live.note = noteFor(d.status, r && r.source, r && r.model);

  if (r) {
    const wbApi = r.waybill || {};
    const back = wbApi.backTranslation && wbApi.backTranslation.instruction;
    const local = wbApi.languageCode && wbApi.languageCode !== 'en';
    const chips = [];
    if (local && wbApi.languageVerified === false) chips.push({ text: 'Not yet reviewed by a native speaker', color: 'var(--warn-t)' });
    if (back) chips.push(back.unclear ? { text: 'Back-translation unclear, check with a reader', color: 'var(--warn-t)' } : { text: 'English back-translation matches', color: 'var(--ok-t)' });
    chips.push({ text: 'Drug, vials, temperature set by code', color: 'var(--text2)' });
    out.wb = {
      ...v.wb,
      vials: vials(r.vials),
      number: approved ? r.dispatchId : v.wb.number,
      batch: r.batchNumber || v.wb.batch,
      english: wbApi.english || v.wb.english,
      showLocal: !!(local && wbApi.local),
      langCode: wbApi.languageCode || v.wb.langCode,
      local: wbApi.local || '',
      back: back ? 'Back-translation: ' + back.english : v.wb.back,
      chips,
    };
    const donor = short(r.donor && r.donor.name);
    out.route = { donor, vials: vials(r.vials), sub: `${v.approx ? 'approx. ' : ''}${r.donor.distanceKm} km, about ${r.donor.etaMinutes} min`, donorDiffers: donor !== v.names.donor };
    out.reasoning = { english: (r.reasoning && r.reasoning.english) || '', guardrail: r.guardrail || null };
    out.rejectedTags = (r.rejected || []).map((x) => ({ text: `${short(x.name)}: ${x.reason === 'doctor absent' ? 'no medical officer' : x.reason}`, color: /doctor/.test(x.reason) ? 'var(--doc-t)' : 'var(--crit-t)' }));
    out.logLines = v.logLines.map((l) => (/Gemini picked/.test(l.text)
      ? { ...l, text: l.text.replace(/Gemini picked.*/, r.source === 'gemini' ? `Gemini (${r.model}) picked ${donor}, code check passed` : 'Gemini unavailable. Offline fallback used') }
      : l));
  } else if (d && d.status === 'offline') {
    out.logLines = v.logLines.map((l) => (/Gemini picked/.test(l.text) ? { ...l, text: l.text.replace(/Gemini picked.*/, 'API not reachable. Offline fallback used') } : l));
  }

  const b = live.brief;
  if (b && b.status === 'ready' && b.data && b.data.fires && b.data.brief) out.live.brief = { ...b.data.brief, source: b.data.source };
  else if (b && b.status === 'loading') out.live.brief = { loading: true };
  return out;
}
