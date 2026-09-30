import { useEffect, useState } from 'react';
import { buildView } from './model.js';
import { fetchDispatch, fetchBrief } from './api.js';

const OFFLINE_RETRY_MS = 20000;

// Fetches the dispatch and the early-warning brief for the current day of the surge, and remembers each answer
// so replaying a day does not call the API again (it is rate limited).
export function useLive(sim, lang, ds) {
  const [store, setStore] = useState({});
  const needsDispatch = buildView({ step: sim.step, phase: 'watch', qty: 0, rejected: false }, lang, ds).need > 0;
  const dKey = `d|${ds.uid}|${sim.step}|${lang}`, bKey = `b|${ds.uid}|${sim.step}`;

  const load = (key, call, want) => {
    const cur = store[key];
    if (!want || (cur && (cur.status !== 'offline' || Date.now() - cur.at < OFFLINE_RETRY_MS))) return;
    setStore((s) => ({ ...s, [key]: { status: 'loading', at: Date.now() } }));
    // Results are stored under their own key, so an answer that arrives after the person moved on is still kept.
    call().then((data) => setStore((s) => ({ ...s, [key]: { status: 'ready', data, at: Date.now() } })))
      .catch(() => setStore((s) => ({ ...s, [key]: { status: 'offline', at: Date.now() } })));
  };

  useEffect(() => { load(dKey, () => fetchDispatch(sim.step, lang, ds), needsDispatch); }, [dKey, needsDispatch]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(bKey, () => fetchBrief(sim.step, ds), sim.step >= 1); }, [bKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { dispatch: needsDispatch ? store[dKey] : undefined, brief: sim.step >= 1 ? store[bKey] : undefined };
}
