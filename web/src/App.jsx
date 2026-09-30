import { useEffect, useMemo, useState } from 'react';
import { buildView, actions, INITIAL } from './model.js';
import { Header, DemoControls, StatsStrip } from './components/Chrome.jsx';
import ReachMap from './components/ReachMap.jsx';
import Clinics from './components/Clinics.jsx';
import { ActionCard, Stepper } from './components/ActionCard.jsx';
import Detail from './components/Detail.jsx';
import './onboarding/onboarding.css';
import Splash from './onboarding/Splash.jsx';
import { Place, Language, Safety, ROLES } from './onboarding/Setup.jsx';
import { LANGS } from './onboarding/LanguageWaybill.jsx';
import Tour from './onboarding/Tour.jsx';
import Spotlight from './onboarding/Spotlight.jsx';
import { useLive } from './useLive.js';
import { applyLive } from './live.js';

const SETUP_KEY = 'sanket-setup';
const readTheme = () => {
  try { return localStorage.getItem('sanket-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};
// The setup flag: present only once setup was finished. Anything unreadable counts as not done.
const readSetup = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SETUP_KEY));
    return s && ROLES.some((r) => r.key === s.role) && LANGS.some((l) => l.key === s.lang) ? s : null;
  } catch { return null; }
};
const clearHash = () => { if (location.hash) history.replaceState(null, '', location.pathname + location.search); };

// The dashboard is its own component so that it is not even mounted until setup is done.
function Dashboard({ theme, setTheme, role, lang, onHome }) {
  const [sim, setSim] = useState(INITIAL);
  const [view, setView] = useState('tiles');
  const [tab, setTab] = useState('forecast');
  const [why, setWhy] = useState(false);
  const [showB, setShowB] = useState(false);
  const [hint, setHint] = useState(true);
  const [touring, setTouring] = useState(false);
  const [region, setRegion] = useState(null);

  const base = useMemo(() => buildView(sim, lang), [sim, lang]);
  const live = useLive(sim, lang);
  const v = useMemo(() => applyLive(base, live, sim.phase !== 'watch'), [base, live.dispatch, live.brief, sim.phase]);

  useEffect(() => { document.getElementById('dash-title')?.focus(); }, []);
  const startTour = () => { setSim(actions.reset()); setTouring(true); };
  const endTour = () => {
    setTouring(false); setRegion(null); setSim(actions.reset()); setHint(true);
    // The tour bar is gone, so put keyboard and screen-reader focus back at the top of the dashboard.
    setTimeout(() => document.getElementById('dash-title')?.focus(), 0);
  };

  return (
    <>
      <div className="board" inert={touring ? true : undefined}>
        <Header theme={theme} setTheme={setTheme} role={ROLES.find((r) => r.key === role).label} onHome={onHome} />
        <div className="status-bar" style={{ background: v.topBar }} />
        <DemoControls v={v} onGoto={(i) => setSim(actions.goto(i))} onReset={() => setSim(actions.reset())} onAdvance={() => setSim(actions.advance)} onInject={() => setSim(actions.inject())} onTour={startTour} />
        <StatsStrip v={v} />
        <main className="main" aria-label="State node dashboard">
          <h1 className="sr-only" id="dash-title" tabIndex={-1}>Sanket, state node dashboard</h1>
          <div className="col-left">
            <div id="tour-map"><ReachMap v={v} /></div>
            <Clinics v={v} view={view} setView={setView} showB={showB} setShowB={setShowB} />
          </div>
          <div className="col-right">
            <div id="tour-action">
              <ActionCard v={v} why={why} setWhy={setWhy}
                onApprove={() => setSim((s) => actions.approve(s, v.need))} onReject={() => setSim(actions.reject)} onDeliver={() => setSim(actions.deliver)} />
            </div>
            {v.showPlan && <div id="tour-stepper"><Stepper steps={v.stepper} /></div>}
            <Detail v={v} tab={tab} setTab={setTab} />
            <div className="foot" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <span>Sample data. Not for clinical use.</span>
              <span>Best viewed on a desktop browser, 1440 px or wider</span>
            </div>
          </div>
        </main>
        {hint && !touring && (
          <div className="hint" style={{ position: 'fixed' }}>
            <span>Try it: press <b>Advance day</b> to watch a surge unfold, then approve the transfer.</span>
            <button type="button" onClick={() => setHint(false)} aria-label="Dismiss tip">×</button>
          </div>
        )}
      </div>
      {touring && <Spotlight target={region} />}
      {touring && (
        <div className="tour-dock">
          <Tour lang={lang} onNode={(i) => setSim(actions.goto(i))} onRegion={setRegion} onFinish={endTour} />
        </div>
      )}
    </>
  );
}

export default function App() {
  const [saved, setSaved] = useState(readSetup);
  const [screen, setScreen] = useState('splash');
  const [theme, setTheme] = useState(readTheme);
  const [role, setRole] = useState(saved ? saved.role : 'dmo');
  const [lang, setLang] = useState(saved ? saved.lang : 'mr');
  const [ack, setAck] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('sanket-theme', theme); } catch { /* storage can be blocked */ }
  }, [theme]);
  // There is no URL that opens the dashboard: a hash such as #dashboard is dropped until setup is done.
  useEffect(() => {
    if (saved) return undefined;
    clearHash();
    window.addEventListener('hashchange', clearHash);
    return () => window.removeEventListener('hashchange', clearHash);
  }, [saved]);

  const goHome = () => {
    try { localStorage.removeItem(SETUP_KEY); } catch { /* storage can be blocked */ }
    clearHash(); setSaved(null); setAck(false); setScreen('splash');
  };
  const finish = () => {
    const s = { district: 'A', role, lang };
    try { localStorage.setItem(SETUP_KEY, JSON.stringify(s)); } catch { /* storage can be blocked */ }
    setSaved(s);
  };

  if (saved) return <Dashboard theme={theme} setTheme={setTheme} role={saved.role} lang={saved.lang} onHome={goHome} />;
  const gate = { onHome: goHome, theme, setTheme };
  if (screen === 'splash') return <Splash onHome={goHome} onStart={() => setScreen('place')} theme={theme} setTheme={setTheme} />;
  if (screen === 'place') return <Place role={role} setRole={setRole} onNext={() => setScreen('language')} onBack={() => setScreen('splash')} gate={gate} />;
  if (screen === 'language') return <Language lang={lang} setLang={setLang} onNext={() => setScreen('safety')} onBack={() => setScreen('place')} gate={gate} />;
  return <Safety ack={ack} setAck={setAck} onDone={finish} onBack={() => setScreen('language')} gate={gate} />;
}
