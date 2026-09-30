import { useEffect, useMemo, useState } from 'react';
import { buildView, actions } from '../model.js';
import { Waybill } from '../components/Detail.jsx';
import { fetchDispatch } from '../api.js';
import { applyLive } from '../live.js';

export const LANGS = [
  { key: 'en', label: 'English', name: 'English' },
  { key: 'mr', label: 'मराठी', name: 'Marathi' },
  { key: 'hi', label: 'हिन्दी', name: 'Hindi' },
  { key: 'ta', label: 'தமிழ்', name: 'Tamil' },
];

export function LanguageOptions({ lang, setLang }) {
  return (
    <>
      <div className="group-label" id="ob-lang-label" style={{ marginTop: 18 }}>Waybill language</div>
      <div className="opts grid2" role="radiogroup" aria-labelledby="ob-lang-label">
        {LANGS.map((l) => (
          <button key={l.key} type="button" role="radio" className="opt" aria-checked={lang === l.key} onClick={() => setLang(l.key)} lang={l.key}>
            <span className="radio" />
            <span className="txt"><span className="t">{l.label}</span><span className="d" lang="en">{l.name}</span></span>
          </button>
        ))}
      </div>
    </>
  );
}

// The waybill shown is the real component, fed the sample recommendation from day 4 of the surge.
export function WaybillPreview({ lang }) {
  const base = useMemo(() => buildView(actions.goto(4), lang), [lang]);
  // Ask the real API for this language. Until it answers (or if it cannot), the template waybill is shown and labelled.
  const [res, setRes] = useState({ lang, status: 'loading' });
  useEffect(() => {
    let current = true;
    setRes({ lang, status: 'loading' });
    fetchDispatch(4, lang).then((data) => current && setRes({ lang, status: 'ready', data })).catch(() => current && setRes({ lang, status: 'offline' }));
    return () => { current = false; };
  }, [lang]);
  const v = useMemo(() => applyLive(base, { dispatch: res.lang === lang ? res : { status: 'loading' } }, false), [base, res, lang]);
  return (
    <div className="wb-live">
      <div className="cap"><span className="group-label" style={{ marginBottom: 0 }}>Waybill preview</span>{v.live.note ? <span className={'src ' + v.live.note.tone}>{v.live.note.text}</span> : <span className="fine">Sample data</span>}</div>
      <div aria-live="polite" aria-atomic="true">
        <div key={lang} className="fade"><Waybill v={v} /></div>
      </div>
      <div className="lang-note">
        {lang === 'en'
          ? 'English waybills need no language review.'
          : 'Local-language text comes from templates that keep the drug name, vials and temperature in code. It stays marked "not yet reviewed" until a native speaker signs off, and an English back-translation sits beside it.'}
      </div>
    </div>
  );
}
