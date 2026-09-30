import { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { buildTelemetry } from '../telemetry.js';
import { DataLabel } from './shared.jsx';
import { reducedMotion } from '../motion.js';

const CHECKS = ['Facility names removed', 'Medical officers removed', 'Location generalised to one decimal place', 'No patient data collected'];

// A slide-over that shows exactly what would be shared. Nothing is sent anywhere from this panel.
export default function TelemetryPanel({ v, ds, onClose }) {
  const closeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Leave the way it came: slide out, then unmount.
  const close = () => {
    if (leaving) return;
    if (reducedMotion()) { onClose(); return; }
    setLeaving(true);
    setTimeout(onClose, 200);
  };
  const json = useMemo(() => JSON.stringify(buildTelemetry(v, ds), null, 2), [v, ds]);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leaving]); // eslint-disable-line react-hooks/exhaustive-deps
  const copy = () => { navigator.clipboard?.writeText(json).then(() => setCopied(true)).catch(() => {}); };

  return (
    <div className={'drawer-wrap' + (leaving ? ' out' : '')}>
      <div className="drawer-scrim" onClick={close} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="tele-title">
        <div className="drawer-head">
          <h2 id="tele-title" className="h2">Anonymised telemetry</h2>
          <DataLabel source={v.source} />
        </div>
        <p className="fine" style={{ lineHeight: 1.5 }}>This is what a state node could share about the surge. Nothing is sent from this screen. It is a preview.</p>
        <pre className="drawer-json" tabIndex={0} aria-label="Telemetry JSON">{json}</pre>
        <ul className="drawer-checks">
          {CHECKS.map((c) => <li key={c}><Check size={14} weight="bold" color="var(--ok-t)" aria-hidden="true" /><span>{c}</span></li>)}
        </ul>
        <div className="fine" style={{ lineHeight: 1.5 }}>Snake venom, ICD-11 code XM4KN1, to be confirmed by a clinical coder. ICD-11 has no single snakebite envenoming category.</div>
        <div className="drawer-foot">
          <button type="button" className="btn-line" onClick={copy}>{copied ? 'Copied' : 'Copy JSON'}</button>
          <button type="button" className="btn-primary" onClick={close} ref={closeRef}>Close</button>
        </div>
      </aside>
    </div>
  );
}
