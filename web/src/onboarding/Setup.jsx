import { useEffect, useRef } from 'react';
import { Lock, Check } from '@phosphor-icons/react';
import { GateTop } from './Gate.jsx';
import { LanguageOptions, WaybillPreview } from './LanguageWaybill.jsx';

export const ROLES = [
  { key: 'dmo', label: 'District Medical Officer' },
  { key: 'facility', label: 'Facility in-charge' },
  { key: 'state', label: 'State programme officer' },
];

const RULES = [
  'A donor always keeps at least 3 days of its own supply.',
  'Same district first, within 35 km. Then the next district, within 80 km, with two approvals.',
  'Never a donor with no medical officer on duty, beds 85% full, or an expired batch.',
  'Nothing is sent until you approve.',
];

function Option({ checked, disabled, onSelect, title, desc, tag, tagColor }) {
  return (
    <button type="button" role="radio" className="opt" aria-checked={checked} aria-disabled={disabled || undefined} onClick={disabled ? undefined : onSelect}>
      <span className="radio" />
      <span className="txt"><span className="t">{title}</span>{desc && <span className="d">{desc}</span>}</span>
      {tag && <span className="ob-tag" style={{ color: tagColor }}>{tag}</span>}
    </button>
  );
}

// A setup step. Every step uses the same card, so the card never changes size: the top bar, "Step n of 3",
// a title that takes focus, a body of fixed height, and a footer with Back and one primary button.
function Step({ n, title, sub, gate, children, back, primary, disabled, onPrimary, note }) {
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  return (
    <div className="gate">
      <GateTop {...gate} />
      <main className="setup" aria-labelledby="setup-title">
        <p className="step-of">Step {n} of 3</p>
        <h1 id="setup-title" tabIndex={-1} ref={titleRef}>{title}</h1>
        <p className="ob-sub">{sub}</p>
        <div className="step-body">{children}</div>
        <div className="ob-foot">
          <button type="button" className="ob-btn" onClick={back}>Back</button>
          <div className="note" role="status">{note}</div>
          <button type="button" className="ob-btn primary" onClick={onPrimary} disabled={disabled}>{primary}</button>
        </div>
      </main>
    </div>
  );
}

// Step 1. The district is fixed to the demo district. The role is only a label shown in the dashboard header.
export function Place({ role, setRole, onNext, onBack, gate }) {
  return (
    <Step n={1} gate={gate} title="Your district and role" sub="Pressing the Sanket logo at any time clears your setup and returns to the start."
      back={onBack} primary="Continue" onPrimary={onNext}>
      <div className="two">
        <div>
          <div className="group-label" id="s-district">Your district</div>
          <div className="opts" role="radiogroup" aria-labelledby="s-district">
            <Option checked onSelect={() => {}} title="Mayurbhanj, Odisha" desc="6 facilities. Simulated data." tag="Current" tagColor="var(--acc-t)" />
            <Option checked={false} disabled title="Other districts" desc="Not in this pilot." tag="Roadmap" tagColor="var(--muted)" />
          </div>
        </div>
        <div>
          <div className="group-label" id="s-role">Your role</div>
          <div className="opts" role="radiogroup" aria-labelledby="s-role" aria-describedby="s-role-note">
            {ROLES.map((r) => <Option key={r.key} checked={role === r.key} onSelect={() => setRole(r.key)} title={r.label} />)}
          </div>
          <div className="fine" id="s-role-note" style={{ marginTop: 8 }}>A label shown in the header. It does not change what the dashboard does. Sign-in is simulated.</div>
        </div>
      </div>
    </Step>
  );
}

// Step 2. The waybill preview is the real component, so the choice is made on what the person will actually see.
export function Language({ lang, setLang, onNext, onBack, gate }) {
  return (
    <Step n={2} gate={gate} title="Waybill language" sub="Choose a language and see the waybill in it, live."
      back={onBack} primary="Continue" onPrimary={onNext}>
      <div className="lang-grid">
        <LanguageOptions lang={lang} setLang={setLang} />
        <WaybillPreview lang={lang} />
      </div>
    </Step>
  );
}

// Step 3. One safety acknowledgement, then the dashboard opens.
export function Safety({ ack, setAck, onDone, onBack, gate }) {
  return (
    <Step n={3} gate={gate} title="One safety rule" sub="Confirm how Sanket works before you open the dashboard."
      back={onBack} primary="Open dashboard" onPrimary={onDone} disabled={!ack} note={!ack && 'Confirm the safety rule above to open the dashboard.'}>
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
    </Step>
  );
}
