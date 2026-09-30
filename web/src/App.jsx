import { useEffect, useMemo, useState } from 'react';
import { buildView, actions, INITIAL } from './model.js';
import { Header, DemoControls, StatsStrip } from './components/Chrome.jsx';
import ReachMap from './components/ReachMap.jsx';
import Clinics from './components/Clinics.jsx';
import { ActionCard, Stepper } from './components/ActionCard.jsx';
import Detail from './components/Detail.jsx';
import Onboarding from './onboarding/Onboarding.jsx';
import Spotlight from './onboarding/Spotlight.jsx';
import { useLive } from './useLive.js';
import { applyLive } from './live.js';

const readTheme = () => {
  try { return localStorage.getItem('sanket-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};
const NEW_ONBOARDING = { step: 1, district: null, role: null, ack: false, running: false };

// A dashed outline that stands in for a region until the person's choices reveal it.
const Skel = ({ h }) => <div className="skel" style={{ height: h }} aria-hidden="true" />;

export default function App() {
  const [sim, setSim] = useState(INITIAL);
  const [theme, setTheme] = useState(readTheme);
  const [view, setView] = useState('tiles');
  const [tab, setTab] = useState('forecast');
  const [why, setWhy] = useState(false);
  const [showB, setShowB] = useState(false);
  const [hint, setHint] = useState(true);
  const [lang, setLang] = useState('mr');
  const [tour, setTour] = useState(null);
  // Onboarding opens on a first visit, with #onboarding, and from "Replay setup". #dashboard skips it.
  const [ob, setOb] = useState(() => {
    if (location.hash === '#dashboard') return null;
    let done = false;
    try { done = localStorage.getItem('sanket-setup-done') === '1'; } catch { /* storage can be blocked */ }
    return location.hash === '#onboarding' || !done ? NEW_ONBOARDING : null;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('sanket-theme', theme); } catch { /* storage can be blocked */ }
  }, [theme]);

  const base = useMemo(() => buildView(sim, lang), [sim, lang]);
  const live = useLive(sim, lang);
  const v = useMemo(() => applyLive(base, live, sim.phase !== 'watch'), [base, live.dispatch, live.brief, sim.phase]);

  // How much of the dashboard the choices on screen 1 have revealed: 0 nothing, 1 the district, 2 everything.
  const stage = !ob ? 2 : ob.step > 1 || ob.running ? 2 : ob.role ? 2 : ob.district ? 1 : 0;
  const R = (min, name, node, h) => (stage >= min ? (ob ? <div className="reveal" key={name}>{node}</div> : node) : <Skel key={name} h={h} />);

  const finish = () => {
    setOb(null); setTour(null); setSim(actions.reset()); setHint(true);
    try { localStorage.setItem('sanket-setup-done', '1'); } catch { /* storage can be blocked */ }
    if (location.hash === '#onboarding') history.replaceState(null, '', location.pathname + location.search);
    // The dialog is gone, so put keyboard and screen-reader focus at the top of the dashboard.
    setTimeout(() => document.getElementById('dash-title')?.focus(), 0);
  };
  const replay = () => { setSim(actions.reset()); setOb(NEW_ONBOARDING); };

  return (
    <>
      <div className="board" inert={ob ? true : undefined}>
        <Header theme={theme} setTheme={setTheme} />
        <div className="status-bar" style={{ background: v.topBar }} />
        {R(2, 'controls',
          <DemoControls v={v} onGoto={(i) => setSim(actions.goto(i))} onReset={() => setSim(actions.reset())} onAdvance={() => setSim(actions.advance)} onInject={() => setSim(actions.inject())} />, 76)}
        {R(1, 'stats', <StatsStrip v={v} />, 68)}
        <main className="main" aria-label="State node dashboard">
          <h1 className="sr-only" id="dash-title" tabIndex={-1}>Sanket, state node dashboard</h1>
          <div className="col-left">
            {R(1, 'map', <div id="tour-map"><ReachMap v={v} /></div>, 430)}
            {R(1, 'clinics', <Clinics v={v} view={view} setView={setView} showB={showB} setShowB={setShowB} />, 524)}
          </div>
          <div className="col-right">
            {R(2, 'action', (
              <div id="tour-action">
                <ActionCard v={v} why={why} setWhy={setWhy}
                  onApprove={() => setSim((s) => actions.approve(s, v.need))} onReject={() => setSim(actions.reject)} onDeliver={() => setSim(actions.deliver)} />
              </div>
            ), 116)}
            {stage >= 2 && v.showPlan && <div id="tour-stepper"><Stepper steps={v.stepper} /></div>}
            {R(2, 'detail', <Detail v={v} tab={tab} setTab={setTab} />, 470)}
            <div className="foot" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <span>Sample data. Not for clinical use.</span>
              <span>Best viewed on a desktop browser, 1440 px or wider</span>
              <button type="button" className="link-btn" onClick={replay}>Replay setup</button>
            </div>
          </div>
        </main>
        {hint && !ob && (
          <div className="hint" style={{ position: 'fixed' }}>
            <span>Try it: press <b>Advance day</b> to watch a surge unfold, then approve the transfer.</span>
            <button type="button" onClick={() => setHint(false)} aria-label="Dismiss tip">×</button>
          </div>
        )}
      </div>
      {ob && ob.running && <Spotlight target={tour} />}
      {ob && (
        <Onboarding ob={ob} setOb={setOb} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang}
          onNode={(i) => setSim(actions.goto(i))} onTour={setTour} onFinish={finish} />
      )}
    </>
  );
}
