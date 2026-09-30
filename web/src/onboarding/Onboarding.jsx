import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Check } from '@phosphor-icons/react';
import { BrandMark } from '../components/shared.jsx';
import DistrictRole from './DistrictRole.jsx';
import LanguageWaybill from './LanguageWaybill.jsx';
import { SafetyBody, Coach } from './SafetyRun.jsx';
import './onboarding.css';

const STEPS = ['District', 'Language', 'Safety'];
const TITLES = [
  ['Tap your district, then choose your role', 'The dashboard behind this card fills in as you choose.'],
  ['Choose the waybill language', 'Pick a language and see the waybill in it, live.'],
  ['One safety rule, then a 30-second run', 'Confirm how Sanket works, then watch a surge play out on sample data.'],
];

export default function Onboarding({ ob, setOb, theme, setTheme, lang, setLang, onNode, onTour, onFinish }) {
  const [mapNote, setMapNote] = useState('');
  const titleRef = useRef(null);
  const { step, running } = ob;
  useEffect(() => { if (!running) titleRef.current?.focus(); }, [step, running]);

  if (running) {
    return (
      <div className="ob running" role="dialog" aria-label="Sanket setup">
        <Coach lang={lang} onNode={onNode} onTour={onTour} onFinish={onFinish} />
      </div>
    );
  }

  const canNext = step === 1 ? ob.district === 'A' && ob.role === 'dmo' : step === 3 ? ob.ack : true;
  const next = () => (step === 3 ? setOb((s) => ({ ...s, running: true })) : setOb((s) => ({ ...s, step: s.step + 1 })));
  const back = () => setOb((s) => ({ ...s, step: s.step - 1 }));
  const cta = step === 1 ? 'Continue as demo DMO' : step === 2 ? 'Continue' : 'Start the guided run';
  const why = step === 1 ? 'Choose a district and a role to continue.' : step === 3 ? 'Confirm the rule above to start.' : '';

  return (
    <div className="ob" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <div className="ob-card">
        <div className="ob-top">
          <BrandMark size={36} glyph={26} />
          <span className="name">Sanket</span>
          <span className="local" lang="hi">संकेत</span>
          <ol className="ob-steps" aria-label={`Setup progress, step ${step} of 3`}>
            {STEPS.map((label, i) => (
              <li key={label} className={i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''} aria-current={i + 1 === step ? 'step' : undefined}>
                <span className="n">{i + 1 < step ? <Check size={14} weight="bold" color="var(--acc-on)" aria-hidden="true" /> : i + 1}</span>
                <span>{label}</span>
                {i + 1 < step && <span className="sr-only">, completed</span>}
              </li>
            ))}
          </ol>
          <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            {theme === 'light' ? <Moon size={18} weight="bold" aria-hidden="true" /> : <Sun size={18} weight="bold" aria-hidden="true" />}
          </button>
          <button type="button" className="skip" onClick={onFinish}>Skip setup</button>
        </div>

        <h1 className="ob-title" id="ob-title" tabIndex={-1} ref={titleRef}>{TITLES[step - 1][0]}</h1>
        <p className="ob-sub">{TITLES[step - 1][1]}</p>

        <div className="ob-body">
          {step === 1 && <DistrictRole ob={ob} setOb={setOb} mapNote={mapNote} setMapNote={setMapNote} />}
          {step === 2 && <LanguageWaybill lang={lang} setLang={setLang} />}
          {step === 3 && <SafetyBody ack={ob.ack} setAck={(v) => setOb((s) => ({ ...s, ack: v }))} />}
        </div>

        <div className="ob-foot">
          {step > 1 ? <button type="button" className="ob-btn" onClick={back}>Back</button> : null}
          <div className="note" role="status">
            {!canNext && <div>{why}</div>}
            {step === 1 && <div>Sign-in is simulated. The deployed app is designed for Firebase Authentication with Google accounts. The demo uses sample data only.</div>}
          </div>
          <button type="button" className="ob-btn primary" onClick={next} disabled={!canNext}>{cta}</button>
        </div>
      </div>
    </div>
  );
}
