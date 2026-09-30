import { Fragment } from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
import { BrandButton } from '../onboarding/Gate.jsx';

export function Header({ theme, setTheme, role, onHome }) {
  return (
    <header className="hdr">
      <BrandButton onHome={onHome}>
        <span style={{ textAlign: 'left' }}>
          <span className="brand-name">Sanket</span>
          <span className="brand-sub">National Health Resource Command</span>
        </span>
      </BrandButton>
      <nav className="nav" aria-label="Screens">
        <button type="button" className="nav-btn" aria-current="page">State node</button>
        <button type="button" className="nav-btn" aria-disabled="true" title="The National view is planned, not built">National</button>
      </nav>
      <div className="grow" />
      <span className="role-chip"><span className="k">Role</span>{role}</span>
      <select className="select" aria-label="State" disabled title="Fixed in this demo">
        <option>Maharashtra</option>
      </select>
      <select className="select" aria-label="Scenario" disabled title="Fixed in this demo">
        <option>One-clinic surge</option>
      </select>
      <div className="seg" role="group" aria-label="Colour theme">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun size={14} weight="bold" aria-hidden="true" />Light</button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={14} weight="bold" aria-hidden="true" />Dark</button>
      </div>
    </header>
  );
}

export function DemoControls({ v, onGoto, onReset, onAdvance, onInject, onTour }) {
  return (
    <div className="demo" role="group" aria-label="Demo controls: surge simulation">
      <div className="demo-label">
        <div className="k">Demo: surge simulation</div>
        <div className="v">{v.dayLabel}</div>
      </div>
      <div className="tl">
        {v.tlNodes.map((n, i) => (
          <Fragment key={n.label}>
            <button type="button" className="tl-node" onClick={() => onGoto(i)} aria-label={n.label + (n.current ? ', current step' : '')} aria-current={n.current ? 'step' : undefined}>
              <span className="tl-dot" style={{
                width: n.current ? 20 : 14, height: n.current ? 20 : 14,
                borderColor: n.on ? n.color : 'var(--rule3)', background: n.on ? n.color : 'var(--panel)',
                boxShadow: n.current ? '0 0 0 4px var(--acc-halo)' : undefined,
              }} />
              <span className="tl-label">{n.label}</span>
            </button>
            {n.showLine && <div className="tl-line" style={{ background: n.lineOn ? 'var(--acc)' : 'var(--rule2)' }} />}
          </Fragment>
        ))}
      </div>
      <div className="demo-actions">
        <button type="button" className="btn-ghost" onClick={onReset}>Reset</button>
        <button type="button" className="btn-line" onClick={onAdvance} disabled={v.advanceOff}>Advance day</button>
        <button type="button" className="btn-line" onClick={onInject}>Inject crisis surge</button>
        <button type="button" className="btn-line" onClick={onTour}>Take a 30-second tour</button>
      </div>
    </div>
  );
}

export function StatsStrip({ v }) {
  const s = v.stat;
  return (
    <div className="stats">
      <div className="stat">
        <div className="k">Clinics</div>
        <div className="row" style={{ alignItems: 'baseline' }}>
          <span className="big">{s.main}</span>
          <span className="sub" style={{ color: s.subColor }}>{s.sub}</span>
        </div>
      </div>
      <div className="stat">
        <div className="k">Beds in use</div>
        <div className="row">
          <span className="big">57 of 98</span>
          <div className="minibar"><div style={{ width: '58%', background: 'var(--faint)' }} /></div>
        </div>
      </div>
      <div className="stat">
        <div className="k">Doctors on duty</div>
        <div className="row">
          <span className="big">9 of 11</span>
          <div className="dots" role="img" aria-label="9 of 11 doctors on duty. 2 clinics have no doctor on duty.">
            {Array.from({ length: 11 }, (_, i) => <span key={i} style={{ background: i < 9 ? 'var(--ok)' : 'var(--doc)' }} />)}
          </div>
        </div>
      </div>
      <div className="stat">
        <div className="k">District A supply reserve</div>
        <div className="row">
          <span className="big">{s.reserveText}</span>
          <div className="minibar"><div className="ease" style={{ width: s.reservePct + '%', background: 'var(--ok)' }} /></div>
        </div>
      </div>
    </div>
  );
}
