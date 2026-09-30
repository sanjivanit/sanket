import { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { buildTelemetry } from '../telemetry.js';
import { DataLabel } from './shared.jsx';

const CHECKS = ['Facility names removed', 'Medical officers removed', 'Location generalised to one decimal place', 'No patient data collected'];

// A slide-over that shows exactly what would be shared. Nothing is sent anywhere from this panel.
export default function TelemetryPanel({ v, ds, onClose }) {
  const closeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const json = useMemo(() => JSON.stringify(buildTelemetry(v, ds), null, 2), [v, ds]);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const copy = () => { navigator.clipboard?.writeText(json).then(() => setCopied(true)).catch(() => {}); };

  return (
    <div className="drawer-wrap">
      <div className="drawer-scrim" onClick={onClose} aria-hidden="true" />
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
        <div className="fine" style={{ lineHeight: 1.5 }}>Snake venom is coded with the ICD-11 extension code XM4KN1. ICD-11 has no single snakebite envenoming category, so a clinical coder should confirm the code before real use.</div>
        <div className="drawer-foot">
          <button type="button" className="btn-line" onClick={copy}>{copied ? 'Copied' : 'Copy JSON'}</button>
          <button type="button" className="btn-primary" onClick={onClose} ref={closeRef}>Close</button>
        </div>
      </aside>
    </div>
  );
}
