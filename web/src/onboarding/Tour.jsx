import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from '@phosphor-icons/react';
import { buildView, actions, vials } from '../model.js';

// 7 moments, 30 seconds. Node numbers match the demo timeline (0 normal ... 5 approved, 6 delivered).
const DURATIONS = [4, 4, 4, 4, 6, 4, 4];
const TOTAL = DURATIONS.reduce((a, b) => a + b, 0);
const REGION = ['map', 'action', 'action', 'action', 'action', 'stepper', 'map'];
const CAPTIONS = [
  () => 'Before the surge, every facility has 3 days of supply or more.',
  (v) => `Day 1: visits at ${v.names.target} rise. Sanket forecasts ${v.alert.big} hours to empty and warns early.`,
  (v) => `Day 2: visits keep rising. The forecast shortens to ${v.alert.big} hours.`,
  (v) => `Day 3: ${v.alert.big} hours to empty. Sanket sizes a transfer of ${vials(v.need)} from ${v.names.donor}.`,
  (v) => `Day 4: ${v.alert.big} hours left. Sanket recommends ${vials(v.need)} from ${v.names.donor}, after code checks its rules.`,
  () => 'You approve, and only then does anything move. The vials are on their way.',
  (v) => `Delivered. ${v.names.target} is at ${v.alert.big} days, still under 3, so Sanket keeps watching.`,
];
const LABELS = ['Normal', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Approved', 'Delivered'];

// The optional 30-second tour: a coach bar docked at the bottom, driving the dashboard's own simulation.
export default function Tour({ lang, ds, onNode, onRegion, onFinish }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const views = useMemo(() => LABELS.map((_, i) => buildView(actions.goto(i, ds.need4), lang, ds)), [lang, ds]);
  const done = elapsed >= TOTAL;
  let idx = 0, acc = 0;
  for (let i = 0; i < DURATIONS.length; i++) { if (elapsed >= acc + DURATIONS[i]) { acc += DURATIONS[i]; idx = Math.min(i + 1, DURATIONS.length - 1); } }

  useEffect(() => {
    if (!playing || done) return undefined;
    const id = setInterval(() => setElapsed((e) => Math.min(e + 0.25, TOTAL)), 250);
    return () => clearInterval(id);
  }, [playing, done]);

  useEffect(() => { onNode(idx); onRegion(REGION[idx]); }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onRegion(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="coach" role="region" aria-label="30-second tour" tabIndex={-1} ref={ref}>
      <div className="cap" aria-live="polite">{done ? 'That is the whole flow. Press Advance day to play it yourself.' : CAPTIONS[idx](views[idx])}</div>
      <div className="row">
        <div className="prog">
          <div className="lbl"><span>{done ? 'Finished' : `Step ${idx + 1} of 7: ${LABELS[idx]}`}</span><span className="num">{Math.min(Math.round(elapsed), TOTAL)} of {TOTAL} s</span></div>
          <div className="track" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={Math.round(elapsed)} aria-label="Tour progress"><div style={{ width: (elapsed / TOTAL * 100) + '%' }} /></div>
        </div>
        {!done && (
          <button type="button" className="ob-btn" onClick={() => setPlaying(!playing)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {playing ? <Pause size={16} weight="bold" aria-hidden="true" /> : <Play size={16} weight="bold" aria-hidden="true" />}{playing ? 'Pause' : 'Play'}
          </button>
        )}
        {done
          ? <button type="button" className="ob-btn primary" onClick={onFinish}>Back to dashboard</button>
          : <button type="button" className="ob-btn" onClick={onFinish}>End the tour</button>}
      </div>
    </div>
  );
}
