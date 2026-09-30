import { Fragment } from 'react';
import { Tick, DataLabel } from './shared.jsx';

export function ActionCard({ v, why, setWhy, onApprove, onReject, onDeliver }) {
  const a = v.alert;
  return (
    <div className="alert" style={{ borderColor: a.bd, background: a.bg }}>
      <svg className="ecg" width="150" height="36" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
        <path d={a.ecg} fill="none" vectorEffect="non-scaling-stroke" style={{ stroke: a.fg }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="alert-top">
        <div className="alert-num" style={{ color: a.fg }}>
          <div className="n">{a.big}</div>
          <div className="u">{a.unit}</div>
        </div>
        <div className="alert-msg" role="status" aria-live="polite">
          <h2 className="hd">{a.head}</h2>
          <div className="sb">{a.sub}</div>
        </div>
      </div>

      {v.showPlan && (
        <div className="plan" style={{ borderTopColor: a.bd }}>
          <div className="plan-head">
            <div className="title">{v.planTitle} <DataLabel source={v.source} /></div>
            {v.live.note && <span className={'src ' + v.live.note.tone} role="status">{v.live.note.text}</span>}
          </div>
          <div className="route">
            <span className="dot" style={{ background: 'var(--ok)' }} />
            <span className="nm">{v.route ? v.route.donor : v.names.donor}</span>
            <div className="ln" />
            <span className="vl">{v.route && v.routeVials !== 'Standby' ? v.route.vials : v.routeVials}</span>
            <div className="ln" />
            <span className="nm">{v.names.target}</span>
            <span className="dot" style={{ background: v.map.arc.color }} />
          </div>
          <div className="route-sub">{v.route ? v.route.sub : `${v.callout.dist === '-' ? '' : v.callout.dist + ', '}about ${v.callout.eta === '-' ? '' : v.callout.eta}`}</div>

          <div style={{ marginTop: 14 }}>
            <div className="vials" style={{ marginTop: 0 }}>
              {v.vialIcons.map((k, i) => <span key={i} className={'vial ' + (k === 'solid' ? '' : k)} style={k === 'solid' ? { background: v.map.arc.color } : undefined} />)}
            </div>
            <div className="fine" style={{ marginTop: 6 }}>{v.vialLegend}</div>
          </div>

          <div className="act-row">
            {v.showApprove && (
              <>
                <button type="button" className="btn-primary" onClick={onApprove} disabled={v.approveOff}>Approve as DMO, {v.place.district}</button>
                <button type="button" className="btn-line roomy" onClick={onReject}>Reject</button>
              </>
            )}
            {v.showDeliver && <button type="button" className="btn-ok" onClick={onDeliver}>Mark delivered</button>}
            <span className="act-note">{v.actionNote}</span>
          </div>

          {v.showBedNote && v.targetBedsPct >= 80 && <div className="bed-note">▲ {v.names.target} beds are {v.targetBedsPct}% full. Plan to refer overflow patients.</div>}

          <button type="button" className="link-btn" style={{ marginTop: 4 }} onClick={() => setWhy(!why)} aria-expanded={why}>
            {why ? 'Hide details' : 'Details: what changes, and why this donor'}
          </button>
          {why && (
            <div>
              {v.reasoning && v.reasoning.english && (
                <p className="why-text">{v.reasoning.english}{v.reasoning.guardrail ? ' ' + v.reasoning.guardrail : ''}{v.route && v.route.donorDiffers ? ' The map above shows ' + v.names.donor + ', the nearest donor.' : ''}</p>
              )}
              {v.showBA && (
                <div className="ba">
                  <div className="key">
                    <span><i style={{ background: 'var(--rule3)' }} />Now</span>
                    <span><i style={{ background: 'var(--text)' }} />After transfer</span>
                  </div>
                  {v.beforeAfter.map((r) => (
                    <div className="ba-row" key={r.name}>
                      <div className="nm">{r.name}</div>
                      <div style={{ position: 'relative' }}>
                        <div style={{ height: 5, borderRadius: 2, background: 'var(--track)' }}><div className="ease" style={{ height: 5, borderRadius: 2, width: r.nowPct + '%', background: r.nowColor, opacity: 0.55 }} /></div>
                        <div style={{ height: 8, borderRadius: 3, background: 'var(--track)', marginTop: 4 }}><div className="ease" style={{ height: 8, borderRadius: 3, width: r.afterPct + '%', background: r.afterColor }} /></div>
                        <div className="tick t1" style={{ height: 24 }} /><div className="tick t3" style={{ height: 24 }} />
                      </div>
                      <div className="tx">{r.text}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="others">
                {(v.rejectedTags || v.others).map((o) => <span className="tag" key={o.text} style={{ color: o.color }}>{o.text}</span>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Stepper({ steps }) {
  return (
    <div className="stepper">
      {steps.map((s) => (
        <Fragment key={s.label}>
          <div className={'step' + (s.done ? ' done on' : s.cur ? ' cur on' : '')}>
            <span className="c">{s.done && <Tick />}</span>
            <span className="lb">{s.label}</span>
          </div>
          {s.showLine && <div className="step-line" style={{ background: s.line }} />}
        </Fragment>
      ))}
    </div>
  );
}
