import { Snowflake } from '@phosphor-icons/react';

const TABS = [{ key: 'forecast', label: 'Forecast' }, { key: 'waybill', label: 'Waybill' }, { key: 'log', label: 'Log' }, { key: 'impact', label: 'Impact' }];

function Brief({ b }) {
  if (!b) return null;
  if (b.loading) return <div className="brief"><div className="fine" role="status">Asking Gemini for the warning brief</div></div>;
  return (
    <div className="brief">
      <div className="brief-head"><span className="brief-title">{b.headline}</span><span className={'src ' + (b.source === 'gemini' ? 'ok' : 'warn')}>{b.source === 'gemini' ? 'Written by Gemini' : 'Offline fallback used'}</span></div>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 6 }}>{b.explanation}</div>
      {b.suggestedAction && <div className="fine" style={{ marginTop: 4, lineHeight: 1.5 }}>{b.suggestedAction}</div>}
    </div>
  );
}

function Forecast({ v }) {
  const c = v.chart, a = v.map.arc;
  return (
    <div style={{ paddingTop: 14 }}>
      <svg width="100%" viewBox="0 0 512 200" role="img" aria-label={c.aria}>
        <line x1="36" y1="160" x2="476" y2="160" style={{ stroke: 'var(--rule2)' }} strokeWidth="1" />
        <line x1="36" y1={c.baseY} x2="476" y2={c.baseY} style={{ stroke: 'var(--rule3)' }} strokeWidth="1" strokeDasharray="2 4" />
        <text x="40" y={c.baseLabelY} style={{ fill: 'var(--muted)' }} fontSize="12">Normal: 20</text>
        <line x1={c.warnX} y1="14" x2={c.warnX} y2="160" style={{ stroke: 'var(--warn)', opacity: c.warnOp }} strokeWidth="1" strokeDasharray="4 3" />
        <text x={c.warnLabelX} y="24" style={{ fill: 'var(--warn-t)', opacity: c.warnOp }} fontSize="12" textAnchor="end">Early warning</text>
        <polyline points={c.hist} fill="none" style={{ stroke: 'var(--text)' }} strokeWidth="2" />
        <polyline points={c.proj} fill="none" style={{ stroke: 'var(--warn)', opacity: c.projOp }} strokeWidth="2" strokeDasharray="6 4" />
        <circle cx={c.warnX} cy={c.warnY} r="4" style={{ fill: 'var(--warn)', opacity: c.warnOp }} />
        <circle cx={c.todayX} cy={c.todayY} r="5" style={{ fill: a.color }} />
        <text x={c.todayLabelX} y={c.todayLabelY} style={{ fill: a.text, opacity: c.todayLabelOp }} fontSize="12" textAnchor="end">Today: {c.todayValue}</text>
        <text x="36" y="182" style={{ fill: 'var(--muted)' }} fontSize="12">10 days ago</text>
        <text x={c.todayX} y="182" style={{ fill: 'var(--muted)' }} fontSize="12" textAnchor="middle">Today</text>
        <text x={c.endX} y="182" style={{ fill: 'var(--muted)', opacity: c.projOp }} fontSize="12" textAnchor="middle">In 3 days</text>
      </svg>
      <Brief b={v.live && v.live.brief} />
    </div>
  );
}

export function Waybill({ v }) {
  const w = v.wb;
  return (
    <div className="wb">
      <div className="wb-head">
        <span style={{ fontSize: 14, fontWeight: 600 }}>Dispatch waybill</span>
        <span className="fine" style={{ color: w.statusColor }}>{w.status}</span>
      </div>
      <div className="wb-body">
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div className="wb-chips">
            <span className="chip solid">{w.vials}</span>
            <span className="chip solid">Batch ASV-26-B</span>
            <span className="chip solid" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Snowflake size={12} weight="bold" color="var(--acc)" aria-hidden="true" />2 to 8 °C</span>
            <span className="chip solid">{w.number}</span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>{w.english}</div>
          {w.showLocal && (
            <div>
              <div className="local" lang={w.langCode}>{w.local}</div>
              <div className="fine" style={{ lineHeight: 1.5, marginTop: 4 }}>{w.back}</div>
            </div>
          )}
          <div className="wb-chips" style={{ marginTop: 10 }}>
            {w.chips.map((ch) => <span className="tag" key={ch.text} style={{ color: ch.color }}>{ch.text}</span>)}
          </div>
        </div>
        <div style={{ flex: '0 0 72px' }}>
          {w.approved
            ? (
              <div>
                <svg width="72" height="72" viewBox="0 0 21 21" role="img" aria-label="Sample QR code" style={{ display: 'block' }}>
                  <rect width="21" height="21" style={{ fill: 'var(--panel)' }} /><path d={w.qr} style={{ fill: 'var(--text)' }} />
                </svg>
                <div className="fine" style={{ marginTop: 4, textAlign: 'center' }}>Sample QR</div>
              </div>
            )
            : <div className="qr-slot">QR on approval</div>}
        </div>
      </div>
    </div>
  );
}

function Impact({ v }) {
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>What Sanket changes</div>
      <div className="impact">
        {v.impact.map((m) => (
          <div key={m.label}>
            <div className="fine">{m.label}</div>
            <div className="n" style={{ color: m.color }}>{m.value}</div>
            <div className="fine" style={{ marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div className="fine" style={{ marginTop: 10 }}>* Assumption, source needed.</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 22 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Shared across states</span>
        <span className="fine">Clinic records never leave a state. Simulated in this demo.</span>
      </div>
      <svg width="100%" viewBox="0 0 480 112" style={{ display: 'block', marginTop: 8 }} role="img" aria-label="Maharashtra shares a warning threshold of 12 percent and Tamil Nadu 18 percent. The national average is 13.9 percent. Maharashtra now uses 12.9 percent.">
        <rect x="0.5" y="6.5" width="150" height="44" rx="8" style={{ fill: 'var(--panel3)', stroke: 'var(--rule2)' }} />
        <text x="12" y="24" style={{ fill: 'var(--muted)' }} fontSize="12">Maharashtra</text>
        <text x="12" y="42" style={{ fill: 'var(--text)' }} fontSize="14" fontWeight="700">12.0%</text>
        <rect x="0.5" y="62.5" width="150" height="44" rx="8" style={{ fill: 'var(--panel3)', stroke: 'var(--rule2)' }} />
        <text x="12" y="80" style={{ fill: 'var(--muted)' }} fontSize="12">Tamil Nadu</text>
        <text x="12" y="98" style={{ fill: 'var(--text)' }} fontSize="14" fontWeight="700">18.0%</text>
        <line x1="150" y1="28" x2="211" y2="45" style={{ stroke: 'var(--rule3)' }} strokeWidth="2" strokeLinecap="round" />
        <polygon points="218,46 209.3,47.8 211.3,40.1" style={{ fill: 'var(--rule3)' }} />
        <line x1="150" y1="84" x2="211" y2="67" style={{ stroke: 'var(--rule3)' }} strokeWidth="2" strokeLinecap="round" />
        <polygon points="218,66 211.3,71.9 209.2,64.2" style={{ fill: 'var(--rule3)' }} />
        <circle cx="252" cy="56" r="34" style={{ fill: 'var(--acc-bg)', stroke: 'var(--acc)' }} strokeWidth="2" />
        <text x="252" y="56" textAnchor="middle" style={{ fill: 'var(--text)' }} fontSize="15" fontWeight="700">13.9%</text>
        <text x="252" y="72" textAnchor="middle" style={{ fill: 'var(--muted)' }} fontSize="12">average</text>
        <line x1="286" y1="56" x2="332" y2="56" style={{ stroke: 'var(--acc)' }} strokeWidth="2" strokeLinecap="round" />
        <polygon points="340,56 332,52 332,60" style={{ fill: 'var(--acc)' }} />
        <rect x="340.5" y="34.5" width="139" height="44" rx="8" style={{ fill: 'var(--acc-bg)', stroke: 'var(--acc)' }} />
        <text x="352" y="52" style={{ fill: 'var(--muted)' }} fontSize="12">Maharashtra uses</text>
        <text x="352" y="70" style={{ fill: 'var(--acc-t)' }} fontSize="14" fontWeight="700">12.9%</text>
      </svg>
    </div>
  );
}

export default function Detail({ v, tab, setTab }) {
  return (
    <div className="detail">
      <div className="tabs">
        {TABS.map((t) => <button type="button" className="tab" key={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>
      {tab === 'forecast' && <Forecast v={v} />}
      {tab === 'waybill' && <Waybill v={v} />}
      {tab === 'log' && <div className="log">{v.logLines.map((l, i) => <div key={i} className={l.latest ? 'latest' : undefined}>{l.text}</div>)}</div>}
      {tab === 'impact' && <Impact v={v} />}
    </div>
  );
}
