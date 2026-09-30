import { useEffect, useRef } from 'react';
import { Lock, Check } from '@phosphor-icons/react';
import { BrandButton, ThemeButton } from './Gate.jsx';
import { LanguageOptions, WaybillPreview } from './LanguageWaybill.jsx';

export const ROLES = [
  { key: 'dmo', label: 'District Medical Officer' },
  { key: 'facility', label: 'Facility in-charge' },
  { key: 'state', label: 'State programme officer' },
];

const RULES = [
  'A donor always keeps at least 3 days of its own supply.',
  'Same district first, within 35 km. Then the next district, within 80 km, with two approvals.',
  'Never a donor with no doctor on duty, beds 85% full, or an expired batch.',
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

// The single setup screen. The district is fixed to the demo district. The role is only a label shown in the dashboard header.
export default function Setup({ role, setRole, lang, setLang, ack, setAck, onHome, onBack, onDone, theme, setTheme }) {
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  return (
    <div className="gate">
      <div className="gate-top">
        <BrandButton onHome={onHome} size={36} glyph={26}>
          <span className="name">Sanket</span>
          <span className="local" lang="hi">संकेत</span>
        </BrandButton>
        <ThemeButton theme={theme} setTheme={setTheme} />
      </div>
      <main className="setup" aria-labelledby="setup-title">
        <h1 id="setup-title" tabIndex={-1} ref={titleRef}>Set up your dashboard</h1>
        <p className="ob-sub">Choose once. Pressing the Sanket logo at any time clears this and returns to the start.</p>

        <div className="setup-grid">
          <div>
            <div className="group-label" id="s-district">Your district</div>
            <div className="opts" role="radiogroup" aria-labelledby="s-district">
              <Option checked onSelect={() => {}} title="District A" desc="8 clinics, where the surge happens." tag="Current" tagColor="var(--acc-t)" />
              <Option checked={false} disabled title="District B" desc="3 clinics. The next district." tag="Roadmap" tagColor="var(--muted)" />
            </div>

            <div className="group-label" id="s-role" style={{ marginTop: 18 }}>Your role</div>
            <div className="opts" role="radiogroup" aria-labelledby="s-role" aria-describedby="s-role-note">
              {ROLES.map((r) => <Option key={r.key} checked={role === r.key} onSelect={() => setRole(r.key)} title={r.label} />)}
            </div>
            <div className="fine" id="s-role-note" style={{ marginTop: 8 }}>A label shown in the header. It does not change what the dashboard does. Sign-in is simulated.</div>

            <LanguageOptions lang={lang} setLang={setLang} />
          </div>

          <div>
            <WaybillPreview lang={lang} />
            <div className="group-label" style={{ marginTop: 18 }}>How Sanket keeps you safe</div>
            <ul className="rules">
              {RULES.map((r) => (
                <li key={r}><span className="ic"><Lock size={14} weight="bold" color="var(--acc)" aria-hidden="true" /></span><span>{r}</span></li>
              ))}
            </ul>
            <button type="button" role="checkbox" className="ack" aria-checked={ack} onClick={() => setAck(!ack)}>
              <span className="box">{ack && <Check size={14} weight="bold" color="var(--acc-on)" aria-hidden="true" />}</span>
              <span>I understand Sanket only recommends. I approve every transfer.</span>
            </button>
          </div>
        </div>

        <div className="ob-foot">
          <button type="button" className="ob-btn" onClick={onBack}>Back</button>
          <div className="note" role="status">{!ack && 'Confirm the safety rule above to open the dashboard.'}</div>
          <button type="button" className="ob-btn primary" onClick={onDone} disabled={!ack}>Open dashboard</button>
        </div>
      </main>
    </div>
  );
}
