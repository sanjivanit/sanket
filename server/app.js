// HTTP API for Cloud Run. Zero dependencies. Routes are same-origin behind Firebase Hosting (/api/**).
import http from 'node:http';
import { readFileSync } from 'node:fs';
import * as E from './engine.js';
import { callGemini as realCall } from './gemini.js';
import { serveStatic } from './static.js';
import { buildInstructions, fallbackReasoning, fallbackBrief, LANGS } from './templates.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const PROMPTS = {
  dispatch: read('prompts/dispatch.system.md'),
  backtranslate: read('prompts/backtranslate.system.md'),
  warning_brief: read('prompts/warning_brief.system.md'),
  checkin: read('prompts/checkin.system.md'),
};
const SCHEMAS = {
  dispatch: JSON.parse(read('schemas/dispatch.schema.json')),
  backtranslate: JSON.parse(read('schemas/backtranslate.schema.json')),
  warning_brief: JSON.parse(read('schemas/warning_brief.schema.json')),
  checkin: JSON.parse(read('schemas/checkin.schema.json')),
};

const log = (severity, event, extra = {}) => console.log(JSON.stringify({ severity, event, ...extra }));
const MAX_BODY = 200_000;

export function createApp({ callGemini = realCall, env = process.env, now = () => new Date() } = {}) {
  const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const fallbackModel = env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
  const models = model === fallbackModel ? [model] : [model, fallbackModel];
  const apiKey = env.GEMINI_API_KEY;
  // Tries each model in order, 8 seconds each. Any failure (timeout, 429, 503, bad JSON) moves to the next model.
  async function askWithModel(mode, user) {
    let lastError;
    for (const m of models) {
      try {
        const value = await callGemini({ apiKey, model: m, system: PROMPTS[mode], user, schema: SCHEMAS[mode], timeoutMs: 8000 });
        return { value, model: m };
      } catch (e) {
        lastError = e;
        log('WARNING', 'gemini_model_failed', { mode, model: m, reason: e.message });
      }
    }
    throw lastError;
  }
  const ask = async (mode, user) => (await askWithModel(mode, user)).value;

  const hits = new Map();
  const limited = (ip) => {
    const t = Date.now(), h = hits.get(ip);
    if (!h || t > h.reset) { hits.set(ip, { count: 1, reset: t + 60_000 }); return false; }
    return ++h.count > 30;
  };

  async function dispatch(body) {
    const { clinics, recipientId } = body;
    const lang = LANGS[body.language] ? body.language : 'en';
    const counter = Number.isInteger(body.counter) ? body.counter : 1;
    if (!Array.isArray(clinics) || clinics.length === 0 || clinics.length > 200) throw Object.assign(new Error('clinics must be a list of 1 to 200'), { status: 400 });
    const today = now();
    const t = E.findTransfer(clinics, recipientId, today);
    if (t.need === 0) return { status: 'no_transfer_needed', need: 0 };
    if (t.eligible.length === 0) return { status: 'no_donor', need: t.need, tier: t.tier, rejected: t.rejected };

    const recipient = clinics.find((c) => c.id === recipientId);
    const top = t.eligible[0];
    let pick = top, source = 'gemini', guardrail = null, answeredBy = null;
    let reasoning = { english: '', local: '' };
    try {
      const { value: out, model: m } = await askWithModel('dispatch', {
        recipient: { name: recipient.name, daysOfSupply: Math.round(E.daysOfSupply(recipient, today) * 10) / 10 },
        need: t.need, tier: t.tier, language: LANGS[lang].name,
        eligible: t.eligible,
      });
      const chosen = t.eligible.find((d) => d.id === out.selectedDonorId);
      if (chosen) pick = chosen; else guardrail = 'Gemini picked a donor that is not eligible. Used the nearest eligible donor.';
      reasoning = { english: out.reasoningEnglish, local: out.reasoningLocal };
      answeredBy = m;
    } catch (e) {
      source = 'fallback';
      reasoning = fallbackReasoning({ donor: pick.name, vials: t.need, keepsDays: pick.keepsDaysAfter });
      log('WARNING', 'gemini_fallback', { mode: 'dispatch', reason: e.message });
    }

    const tempRange = '2-8';
    const instructions = buildInstructions({ lang, donor: pick.name, recipient: recipient.name, vials: t.need, tempRange });
    const backTranslation = { instruction: null, reasoning: null };
    if (source === 'gemini' && lang !== 'en') {
      const [a, b] = await Promise.allSettled([
        ask('backtranslate', instructions.local),
        reasoning.local ? ask('backtranslate', reasoning.local) : Promise.resolve(null),
      ]);
      if (a.status === 'fulfilled') backTranslation.instruction = a.value;
      if (b.status === 'fulfilled') backTranslation.reasoning = b.value;
    }

    const core = {
      dispatchId: E.makeDispatchId(body.stateCode || recipient.stateCode, counter, today.getUTCFullYear()),
      tier: t.tier,
      approvalsRequired: t.tier === 1 ? ['DMO of the recipient district'] : ['DMO of the recipient district', 'DMO of the donor district'],
      recipient: { id: recipient.id, name: recipient.name },
      donor: { id: pick.id, name: pick.name, distanceKm: pick.distanceKm, etaMinutes: pick.etaMinutes, keepsDaysAfter: pick.keepsDaysAfter },
      vials: t.need,
      batchNumber: pick.batchNumber,
      expiryDate: pick.expiryDate,
      coldChain: { required: true, tempRangeCelsius: tempRange, carrier: 'insulated box' },
    };
    log('INFO', 'dispatch', { source, model: answeredBy, tier: t.tier, vials: t.need, donor: pick.id, guardrail: !!guardrail });
    return {
      status: 'recommended', ...core,
      waybill: { ...instructions, backTranslation },
      reasoning, restockToken: E.restockToken(core), source, model: answeredBy, guardrail, rejected: t.rejected,
    };
  }

  async function warningBrief(body) {
    const { clinic, history } = body;
    const threshold = typeof body.threshold === 'number' ? body.threshold : 0.129;
    if (!clinic || !Array.isArray(history) || history.length < 6) throw Object.assign(new Error('clinic and at least 6 days of history are required'), { status: 400 });
    const today = now();
    const w = E.earlyWarning({ history, clinic, threshold, today });
    if (!w.fires) return { fires: false, ...w };
    const facts = {
      clinic: clinic.name, stockVials: E.usableStock(clinic, today),
      daysOfSupply: Math.round(E.daysOfSupply(clinic, today) * 10) / 10,
      projectedStockoutHours: Math.round(w.projectedStockoutHours),
      footfallToday: history[history.length - 1], footfallNormal: clinic.baselineFootfall,
      growthPerDay: Math.round(w.growthPerDay * 100) / 100, threshold,
    };
    let brief, source = 'gemini';
    try { brief = await ask('warning_brief', facts); }
    catch (e) { source = 'fallback'; brief = fallbackBrief({ clinic: clinic.name, hours: w.projectedStockoutHours }); log('WARNING', 'gemini_fallback', { mode: 'warning_brief', reason: e.message }); }
    return { fires: true, ...w, brief, source };
  }

  async function checkin(body) {
    const message = String(body.message || '').slice(0, 1000);
    if (!message.trim()) throw Object.assign(new Error('message is required'), { status: 400 });
    try {
      const out = await ask('checkin', { message, knownClinics: Array.isArray(body.knownClinics) ? body.knownClinics.slice(0, 50) : [] });
      return { ok: true, ...out, needsConfirmation: out.confidence < 0.7 };
    } catch (e) {
      log('WARNING', 'gemini_fallback', { mode: 'checkin', reason: e.message });
      return { ok: false, error: 'Could not read the message. Please retype it.' };
    }
  }

  function federated(body) {
    const nodes = body.nodes;
    if (!Array.isArray(nodes) || nodes.length < 2 || !nodes.every((n) => typeof n.state === 'string' && typeof n.threshold === 'number' && Number.isInteger(n.sampleCount) && n.sampleCount > 0))
      throw Object.assign(new Error('nodes must be a list of { state, threshold, sampleCount }'), { status: 400 });
    // Only these numbers cross state lines. Clinic records are never accepted here.
    return E.federatedRound(nodes.map(({ state, threshold, sampleCount }) => ({ state, threshold, sampleCount })));
  }

  const routes = { '/api/dispatch': dispatch, '/api/warning-brief': warningBrief, '/api/checkin': checkin, '/api/federated': federated };

  return http.createServer(async (req, res) => {
    const send = (code, obj) => {
      const headers = { 'content-type': 'application/json', 'cache-control': 'no-store' };
      if (env.ALLOWED_ORIGIN) { headers['access-control-allow-origin'] = env.ALLOWED_ORIGIN; headers['access-control-allow-headers'] = 'content-type'; }
      res.writeHead(code, headers); res.end(JSON.stringify(obj));
    };
    try {
      const path = new URL(req.url, 'http://x').pathname;
      if (req.method === 'OPTIONS') return send(204, {});
      if (path === '/api/health') return send(200, { ok: true, model, fallbackModel, geminiKeyConfigured: !!apiKey });
      if (!path.startsWith('/api/') && (await serveStatic(req, res, path))) return;
      const handler = routes[path];
      if (!handler || req.method !== 'POST') return send(404, { error: 'not found' });
      if (limited(req.socket.remoteAddress || 'x')) return send(429, { error: 'too many requests' });
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > MAX_BODY) return send(413, { error: 'body too large' }); }
      let body; try { body = JSON.parse(raw || '{}'); } catch { return send(400, { error: 'invalid JSON' }); }
      return send(200, await handler(body));
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) log('ERROR', 'unhandled', { message: e.message });
      return send(status, { error: status === 500 ? 'internal error' : e.message });
    }
  });
}
