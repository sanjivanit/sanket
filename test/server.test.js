import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createApp } from '../server/app.js';
import * as E from '../server/engine.js';

const load = (f) => JSON.parse(readFileSync(new URL('../data/' + f, import.meta.url), 'utf8'));
// MH and TN are the older sample sets. They stay as fixtures for engine rules that need a second district or state.
const MH = load('maharashtra.json'), TN = load('tamilnadu.json'), MBJ = load('odisha-mayurbhanj.json'), SC = load('scenarios.json'), FED = load('federated_episodes.json');
const TODAY = new Date('2026-09-30T00:00:00Z');

async function withServer(callGemini, fn, env = {}) {
  const server = createApp({ callGemini, env: { GEMINI_API_KEY: 'test', ...env }, now: () => TODAY });
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = async (path, body) => (await fetch(base + path, { method: 'POST', body: JSON.stringify(body) })).json();
  try { await fn(post, base); } finally { server.close(); }
}
const geminiPicks = (id) => async ({ system }) => {
  if (system.includes('Back-translation')) return { english: 'Take 16 vials of anti-snake venom.', unclear: false };
  return { selectedDonorId: id, reasoningEnglish: 'Nearest donor with a doctor on duty.', reasoningLocal: 'test' };
};

test('engine: one-clinic surge needs 16 vials and picks Shivpuri first', () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  const t = E.findTransfer(clinics, 'MH-01', TODAY);
  assert.equal(t.need, 16);
  assert.equal(t.tier, 1);
  assert.deepEqual(t.eligible.map((d) => d.name), ['PHC Shivpuri', 'PHC Khed', 'PHC Saswad']);
  assert.equal(t.eligible[0].distanceKm, 18.4);
  assert.equal(t.eligible[0].etaMinutes, 28);
  const why = Object.fromEntries(t.rejected.map((r) => [r.name, r.reason]));
  assert.equal(why['PHC Bhor'], 'doctor absent');
  assert.equal(why['PHC Daund'], 'doctor absent');
  assert.equal(why['PHC Junnar'], 'too far');
  assert.equal(why['PHC Alibag Rural'], 'beds at or above 85%');
});

test('engine: district-wide surge escalates to tier 2 and picks Lonand', () => {
  const clinics = E.applyScenario(MH.clinics, SC.districtWide, 'MH-01');
  const t = E.findTransfer(clinics, 'MH-01', TODAY);
  assert.equal(t.need, 16);
  assert.equal(t.tier, 2);
  assert.deepEqual(t.eligible.map((d) => d.name), ['PHC Lonand', 'PHC Nimgaon']);
  assert.equal(Math.round(t.eligible[0].distanceKm), 52);
  assert.equal(t.eligible[0].etaMinutes, 78);
});

test('engine: Tamil Nadu picks Perambalur', () => {
  const clinics = E.applyScenario(TN.clinics, SC.oneClinic, 'TN-01');
  const t = E.findTransfer(clinics, 'TN-01', TODAY);
  assert.equal(t.need, 16);
  assert.deepEqual(t.eligible.map((d) => d.name), ['PHC Perambalur', 'PHC Jayankondam']);
});

test('engine: an expired batch counts as zero stock', () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01').map((c) => (c.id === 'MH-02' ? { ...c, expiryDate: '2026-01-01' } : c));
  const t = E.findTransfer(clinics, 'MH-01', TODAY);
  assert.ok(!t.eligible.some((d) => d.id === 'MH-02'));
});

test('engine: a donor always keeps at least 3 days of its own supply', () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  const t = E.findTransfer(clinics, 'MH-01', TODAY);
  for (const d of t.eligible) assert.ok(d.keepsDaysAfter >= 3, `${d.name} keeps ${d.keepsDaysAfter}`);
});

test('engine: early warning fires about 61 hours ahead on the first surge day', () => {
  const noise = [0, -1, 1, 0, 2, -1, 0, 1, 0, 0].map((n) => 20 + n);
  const rampur = MH.clinics[0];
  const w = E.earlyWarning({ history: noise.concat([24]), clinic: { ...rampur, footfallToday: 24 }, threshold: 0.129, today: TODAY });
  assert.equal(w.fires, true);
  assert.equal(Math.round(w.projectedStockoutHours), 61);
  const calm = E.earlyWarning({ history: noise, clinic: rampur, threshold: 0.129, today: TODAY });
  assert.equal(calm.fires, false);
});

test('engine: federated averaging matches the numbers on screen', () => {
  const mh = E.localThreshold(FED.episodes.MH), tn = E.localThreshold(FED.episodes.TN);
  assert.ok(Math.abs(mh - 0.12) < 1e-9 && Math.abs(tn - 0.18) < 1e-9);
  const r = E.federatedRound([{ state: 'MH', threshold: mh, sampleCount: 11 }, { state: 'TN', threshold: tn, sampleCount: 5 }]);
  assert.equal(r.global.toFixed(3), '0.139');
  assert.equal(r.perNode.MH.toFixed(3), '0.129');
  assert.equal(r.perNode.TN.toFixed(3), '0.159');
});

test('api: dispatch returns a recommendation; code, not Gemini, sets IDs and quantity', async () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  await withServer(geminiPicks('MH-02'), async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics, recipientId: 'MH-01', language: 'mr', counter: 1 });
    assert.equal(r.status, 'recommended');
    assert.equal(r.vials, 16);
    assert.equal(r.donor.name, 'PHC Shivpuri');
    assert.equal(r.source, 'gemini');
    assert.match(r.dispatchId, /^SK-\d{4}-MH-0001$/);
    assert.match(r.restockToken, /^RGT-[0-9A-F]{10}$/);
    assert.equal(r.approvalsRequired.length, 1);
    assert.match(r.waybill.english, /Take 16 vials of anti-snake venom \(ASV\) from PHC Shivpuri to PHC Rampur\. Keep at 2 to 8 °C\./);
    assert.equal(r.waybill.languageVerified, false, 'Marathi must stay unverified until a native speaker signs off');
    assert.ok(r.waybill.backTranslation.instruction);
  });
});

test('api: guardrail overrides a donor Gemini should not have picked', async () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  await withServer(geminiPicks('MH-04'), async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics, recipientId: 'MH-01', language: 'en' });
    assert.equal(r.donor.id, 'MH-02');
    assert.ok(r.guardrail);
  });
});

test('api: Gemini failure falls back to a template waybill, never an error', async () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  await withServer(async () => { throw new Error('boom'); }, async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics, recipientId: 'MH-01', language: 'ta' });
    assert.equal(r.status, 'recommended');
    assert.equal(r.source, 'fallback');
    assert.equal(r.vials, 16);
    assert.ok(r.waybill.english && r.waybill.local);
  });
});

test('api: first model fails, second model answers', async () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  const tried = [];
  const flaky = async (args) => {
    tried.push(args.model);
    if (args.model === 'model-a') throw new Error('Gemini HTTP 503');
    return geminiPicks('MH-02')(args);
  };
  await withServer(flaky, async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics, recipientId: 'MH-01', language: 'en' });
    assert.equal(r.source, 'gemini');
    assert.equal(r.model, 'model-b');
    assert.equal(r.donor.name, 'PHC Shivpuri');
    assert.deepEqual(tried, ['model-a', 'model-b']);
  }, { GEMINI_MODEL: 'model-a', GEMINI_FALLBACK_MODEL: 'model-b' });
});

test('api: both models fail, template waybill is returned', async () => {
  const clinics = E.applyScenario(MH.clinics, SC.oneClinic, 'MH-01');
  const tried = [];
  await withServer(async ({ model }) => { tried.push(model); throw new Error('Gemini HTTP 429'); }, async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics, recipientId: 'MH-01', language: 'mr' });
    assert.equal(r.status, 'recommended');
    assert.equal(r.source, 'fallback');
    assert.equal(r.model, null);
    assert.equal(r.vials, 16);
    assert.ok(r.waybill.english && r.waybill.local);
    assert.deepEqual(tried, ['model-a', 'model-b']);
  }, { GEMINI_MODEL: 'model-a', GEMINI_FALLBACK_MODEL: 'model-b' });
});

test('api: district-wide surge needs two approvals', async () => {
  const clinics = E.applyScenario(MH.clinics, SC.districtWide, 'MH-01');
  await withServer(geminiPicks('MH-09'), async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics, recipientId: 'MH-01', language: 'en' });
    assert.equal(r.tier, 2);
    assert.equal(r.approvalsRequired.length, 2);
    assert.equal(r.donor.name, 'PHC Lonand');
  });
});

test('api: no transfer when the clinic is fine', async () => {
  await withServer(geminiPicks('MH-02'), async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'MH', clinics: MH.clinics, recipientId: 'MH-01', language: 'en' });
    assert.equal(r.status, 'no_transfer_needed');
  });
});

test('api: federated route only accepts thresholds and counts', async () => {
  await withServer(geminiPicks('MH-02'), async (post) => {
    const ok = await post('/api/federated', { nodes: [{ state: 'MH', threshold: 0.12, sampleCount: 11 }, { state: 'TN', threshold: 0.18, sampleCount: 5 }] });
    assert.equal(ok.global.toFixed(3), '0.139');
    const bad = await post('/api/federated', { nodes: [{ state: 'MH', clinics: MH.clinics }] });
    assert.ok(bad.error);
  });
});

test('api: check-in falls back to a friendly message when Gemini fails', async () => {
  await withServer(async () => { throw new Error('down'); }, async (post) => {
    const r = await post('/api/checkin', { message: 'PHC Rampur: ASV 6 vial, doctor upasthit' });
    assert.equal(r.ok, false);
  });
});

// Mayurbhanj, Odisha: the default data set.
test('mayurbhanj: six facilities, labelled simulated, no named doctors, coordinates marked approximate', () => {
  assert.equal(MBJ.clinics.length, 6);
  assert.match(MBJ.note, /SIMULATED DATA/);
  assert.equal(MBJ.stateCode, 'OD');
  for (const c of MBJ.clinics) {
    assert.ok(!('doctorName' in c), `${c.name} must not carry a doctor name`);
    assert.equal(c.coordinates, 'approximate', `${c.name} coordinates are placed, not surveyed`);
    assert.ok(c.sources && c.sources.name && c.sources.position, `${c.name} records where its name and position came from`);
  }
  assert.ok(!/\bDr\.?\s/.test(JSON.stringify(MBJ)), 'no doctor names anywhere in the file');
});

test('engine: Mayurbhanj surge needs 14 vials, Betnoti donates, Udala and Baripada Rural are rejected for the right reason', () => {
  const clinics = E.applyScenario(MBJ.clinics, SC.oneClinic, 'OD-01');
  const t = E.findTransfer(clinics, 'OD-01', TODAY);
  assert.equal(t.need, 14);
  assert.equal(t.tier, 1);
  assert.deepEqual(t.eligible.map((d) => [d.name, d.distanceKm]), [['CHC Betnoti', 16.4], ['CHC Khunta', 22.8], ['CHC Dukura', 31]]);
  const why = Object.fromEntries(t.rejected.map((r) => [r.name, r.reason]));
  assert.equal(why['SDH Udala'], 'doctor absent');
  assert.equal(why['PHC Baripada Rural'], 'beds at or above 85%');
  assert.ok(t.eligible.every((d) => d.keepsDaysAfter >= 3), 'a donor keeps at least 3 days');
});

test('engine: at the start of the surge Mayurbhanj needs no transfer', () => {
  assert.equal(E.findTransfer(MBJ.clinics, 'OD-01', TODAY).need, 0);
});

test('api: Mayurbhanj dispatch in Odia uses an unreviewed template and an OD dispatch ID', async () => {
  const clinics = E.applyScenario(MBJ.clinics, SC.oneClinic, 'OD-01');
  await withServer(geminiPicks('OD-02'), async (post) => {
    const r = await post('/api/dispatch', { stateCode: 'OD', clinics, recipientId: 'OD-01', language: 'or', counter: 1 });
    assert.equal(r.status, 'recommended');
    assert.equal(r.vials, 14);
    assert.equal(r.donor.name, 'CHC Betnoti');
    assert.match(r.dispatchId, /^SK-\d{4}-OD-0001$/);
    assert.equal(r.waybill.languageCode, 'or');
    assert.equal(r.waybill.languageName, 'Odia');
    assert.equal(r.waybill.languageVerified, false, 'Odia must stay unverified until a native speaker signs off');
    assert.match(r.waybill.local, /14 ଶିଶି/);
    assert.match(r.waybill.local, /2 ରୁ 8 °C/);
  });
});

test('languages: every local language is unverified until a named reviewer is recorded', () => {
  const L = JSON.parse(readFileSync(new URL('../config/languages.json', import.meta.url), 'utf8')).languages;
  assert.deepEqual(Object.keys(L).sort(), ['en', 'hi', 'mr', 'or', 'ta']);
  for (const k of ['or', 'mr', 'hi', 'ta']) assert.ok(L[k].verified === false || (L[k].verified === true && L[k].reviewer), `${k} needs a reviewer to be verified`);
  assert.equal(L.or.verified, false);
});
