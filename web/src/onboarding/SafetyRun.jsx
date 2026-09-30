import { useEffect, useMemo, useState } from 'react';
import { Lock, Check, Pause, Play } from '@phosphor-icons/react';
import { buildView, actions, vials } from '../model.js';

export const RULES = [
  'A donor always keeps at least 3 days of its own supply.',
  'Same district first, within 35 km. Then the next district, within 80 km, with two approvals.',
  'Never a donor with no doctor on duty, beds 85% full, or an expired batch.',
  'Nothing is sent until you approve.',
];

export function SafetyBody({ ack, setAck }) {
  return (
    <div>
      <ul className="rules">
        {RULES.map((r) => (
          <li key={r}><span className="ic"><Lock size={14} weight="bold" color="var(--acc)" aria-hidden="true" /></span><span>{r}</span></li>
        ))}
      </ul>
      <div className="fine" style={{ marginTop: 12 }}>These rules run in plain code, from the repository configuration. Gemini cannot change them.</div>
      <button type="button" role="checkbox" className="ack" aria-checked={ack} onClick={() => setAck(!ack)}>
        <span className="box">{ack && <Check size={14} weight="bold" color="var(--acc-on)" aria-hidden="true" />}</span>
        <span>I understand Sanket only recommends. I approve every transfer.</span>
      </button>
      <p className="run-intro">Next, a 30-second guided run plays a surge on sample data so you see the whole flow. You can skip it at any time.</p>
    </div>
  );
}

// 7 moments, 30 seconds. Node numbers match the demo timeline (0 normal ... 5 approved, 6 delivered).
const DURATIONS = [4, 4, 4, 4, 6, 4, 4];
const TOTAL = DURATIONS.reduce((a, b) => a + b, 0);
const REGION = ['map', 'action', 'action', 'action', 'action', 'stepper', 'map'];
const CAPTIONS = [
  () => 'Before the surge, every clinic has 3 days of supply or more.',
  (v) => `Day 1: visits at Rampur rise. Sanket forecasts ${v.alert.big} hours to empty and warns early.`,
  (v) => `Day 2: visits keep rising. The forecast shortens to ${v.alert.big} hours.`,
  (v) => `Day 3: ${v.alert.big} hours to empty. Sanket sizes a transfer of ${vials(v.need)} from Shivpuri.`,
  (v) => `Day 4: ${v.alert.big} hours left. Sanket recommends ${vials(v.need)} from Shivpuri, after code checks its rules.`,
  () => 'You approve, and only then does anything move. The vials are on their way.',
  (v) => `Delivered. Rampur is at ${v.alert.big} days, still under 3, so Sanket keeps watching.`,
];
const LABELS = ['Normal', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Approved', 'Delivered'];

export function Coach({ lang, onNode, onTour, onFinish }) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const views = useMemo(() => LABELS.map((_, i) => buildView(actions.goto(i), lang)), [lang]);
  const done = elapsed >= TOTAL;
  let idx = 0, acc = 0;
  for (let i = 0; i < DURATIONS.length; i++) { if (elapsed >= acc + DURATIONS[i]) { acc += DURATIONS[i]; idx = Math.min(i + 1, DURATIONS.length - 1); } }

  useEffect(() => {
    if (!playing || done) return undefined;
    const id = setInterval(() => setElapsed((e) => Math.min(e + 0.25, TOTAL)), 250);
    return () => clearInterval(id);
  }, [playing, done]);

  useEffect(() => { onNode(idx); onTour(REGION[idx]); }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onTour(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="coach" role="region" aria-label="Guided run">
      <div className="cap" aria-live="polite">{done ? 'That is the whole flow. Press Advance day on the dashboard to play it yourself.' : CAPTIONS[idx](views[idx])}</div>
      <div className="row">
        <div className="prog">
          <div className="lbl"><span>{done ? 'Finished' : `Step ${idx + 1} of 7: ${LABELS[idx]}`}</span><span className="num">{Math.min(Math.round(elapsed), TOTAL)} of {TOTAL} s</span></div>
          <div className="track" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={Math.round(elapsed)} aria-label="Guided run progress"><div style={{ width: (elapsed / TOTAL * 100) + '%' }} /></div>
        </div>
        {!done && (
          <button type="button" className="ob-btn" onClick={() => setPlaying(!playing)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {playing ? <Pause size={16} weight="bold" aria-hidden="true" /> : <Play size={16} weight="bold" aria-hidden="true" />}{playing ? 'Pause' : 'Play'}
          </button>
        )}
        {done
          ? <button type="button" className="ob-btn primary" onClick={onFinish}>Open dashboard</button>
          : <button type="button" className="ob-btn" onClick={onFinish}>Skip the run</button>}
      </div>
    </div>
  );
}
