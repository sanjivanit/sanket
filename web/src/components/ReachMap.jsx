import { DataLabel } from './shared.jsx';
import { CountUp } from '../motion.js';

// Distance map centred on the surge target. Distances are to scale; positions are approximate.
export default function ReachMap({ v }) {
  const { map, callout } = v;
  const { line, arc, center } = map;
  const { x: cx, y: cy } = center;
  const vialDots = [0, 0.5, 1];
  return (
    <div>
      <div className="map-head">
        <h2 className="h2">Who can help {v.names.target} <DataLabel source={v.source} /></h2>
        <div className="legend">
          <span><i className="dot" style={{ background: 'var(--ok)' }} />Stable</span>
          <span><i className="dot" style={{ background: 'var(--crit)' }} />Critical</span>
          <span><i className="dot" style={{ background: 'var(--doc)' }} />No medical officer on duty</span>
          <span><i style={{ display: 'block', width: 20, height: 3, background: 'var(--acc)' }} />Transfer</span>
          <span>
            <svg width="20" height="12" viewBox="0 0 20 12" aria-hidden="true"><circle cx="5" cy="6" r="3" style={{ fill: 'var(--faint)' }} /><circle cx="14" cy="6" r="5" style={{ fill: 'var(--faint)' }} /></svg>
            Size = vials
          </span>
        </div>
      </div>
      <div className="map-sub">{map.sub}</div>
      <div className="map">
        <svg className="layer" width="826" height="348" viewBox="0 0 826 348" role="img" aria-label={map.aria}>
          {map.rings && (
            <>
              <circle cx="413" cy="178" r="156" style={{ fill: 'var(--tier2)', stroke: 'var(--rule3)' }} strokeWidth="1" strokeDasharray="3 5" />
              <circle cx="413" cy="178" r="68" style={{ fill: 'var(--acc-bg)', stroke: 'var(--rule3)' }} strokeWidth="1" />
              <text x="413" y="16" textAnchor="middle" style={{ fill: 'var(--muted)' }} fontSize="12">80 km, next district</text>
              <text x="413" y="102" textAnchor="middle" style={{ fill: 'var(--muted)' }} fontSize="12">35 km, same district</text>
            </>
          )}
          {map.scaleBar && (
            <g>
              <line x1={map.scaleBar.x1} y1={map.scaleBar.y} x2={map.scaleBar.x2} y2={map.scaleBar.y} style={{ stroke: 'var(--muted)' }} strokeWidth="2" strokeLinecap="round" />
              <line x1={map.scaleBar.x1} y1={map.scaleBar.y - 4} x2={map.scaleBar.x1} y2={map.scaleBar.y + 4} style={{ stroke: 'var(--muted)' }} strokeWidth="2" strokeLinecap="round" />
              <line x1={map.scaleBar.x2} y1={map.scaleBar.y - 4} x2={map.scaleBar.x2} y2={map.scaleBar.y + 4} style={{ stroke: 'var(--muted)' }} strokeWidth="2" strokeLinecap="round" />
              <text x={map.scaleBar.x1} y={map.scaleBar.y + 20} style={{ fill: 'var(--muted)' }} fontSize="12">{map.scaleBar.label}</text>
            </g>
          )}
          {map.nodes.filter((n) => n.leader).map((n) => (
            <line key={n.label} x1={n.leader.x1} y1={n.leader.y1} x2={n.leader.x2} y2={n.leader.y2} style={{ stroke: 'var(--rule3)' }} strokeWidth="1" />
          ))}
          <path className={line.standbyOp ? 'route-fade route-march' : 'route-fade'} d={line.d} fill="none" style={{ stroke: 'var(--acc)', opacity: line.standbyOp }} strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" />
          {/* The flowing line and the moving vials exist only while the transfer is in transit. */}
          {line.transitOp === 1 && <path className="flow" d={line.d} fill="none" style={{ stroke: 'var(--acc)' }} strokeWidth="3" strokeLinecap="round" />}
          <path className="route-fade" d={line.d} fill="none" style={{ stroke: 'var(--acc)', opacity: line.doneOp }} strokeWidth="3" strokeLinecap="round" />
          {line.transitOp === 1 && (
            <g>
              {vialDots.map((begin) => (
                <circle key={begin} className="vial-moving" r="4.5" opacity="0" style={{ fill: 'var(--acc)' }}>
                  <animateMotion dur="1.5s" begin={begin + 's'} repeatCount="indefinite" path={line.d} />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.5s" begin={begin + 's'} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}
          <circle cx={cx} cy={cy} r="23" fill="none" style={{ stroke: 'var(--track)' }} strokeWidth="4" />
          <circle className="arc-anim" cx={cx} cy={cy} r="23" fill="none" style={{ stroke: arc.color }} strokeWidth="4" strokeLinecap="round" strokeDasharray={arc.dash} transform={`rotate(-90 ${cx} ${cy})`} />
        </svg>

        {/* Pulses only while the state is early warning or critical. Once delivered it is a steady ring, no motion. */}
        <div className={arc.pulse ? 'abs pulse' : 'abs'} style={{ left: cx - 14, top: cy - 14, width: 28, height: 28, borderRadius: '50%', border: '2px solid ' + arc.color, opacity: arc.pulse || arc.steady ? 1 : 0 }} />
        <div className="abs" style={{ left: cx - 11, top: cy - 11, width: 22, height: 22, borderRadius: '50%', background: arc.color, border: '2px solid var(--panel)', boxShadow: '0 0 0 8px ' + arc.halo }} />
        <div className="rampur-label" style={{ color: arc.text, left: cx - 40, top: cy - 66 }}>{v.names.target}<div>{arc.sub}</div></div>

        <div className="map-stats left">
          <div><div className="n" style={{ color: 'var(--acc-t)' }}><CountUp value={callout.need} /></div><div className="l">{callout.needLabel}</div></div>
          <div><div className="n"><CountUp value={callout.donors} /></div><div className="l">donors in range</div></div>
        </div>
        <div className="map-stats right">
          <div><div className="n"><CountUp value={callout.dist} /></div><div className="l">nearest donor{v.approx ? ', approx.' : ''}</div></div>
          <div><div className="n"><CountUp value={callout.eta} /></div><div className="l">travel time</div></div>
        </div>

        {map.nodes.map((n, idx) => {
          const halo = n.nodoc ? 'var(--doc-halo)' : n.hot ? 'var(--acc-halo)' : 'var(--ok-halo)';
          return (
            <div key={n.label}>
              {n.ping && <div className="abs node-ping" style={{ left: n.x - n.rad, top: n.y - n.rad, width: n.rad * 2, height: n.rad * 2, borderRadius: '50%', border: '2px solid var(--acc)' }} />}
              <div className="abs node-pop" style={{ '--i': idx,
                left: n.x - n.rad, top: n.y - n.rad, width: n.rad * 2, height: n.rad * 2, borderRadius: '50%',
                background: n.nodoc ? 'var(--doc)' : 'var(--ok)',
                boxShadow: '0 0 0 2px var(--panel)' + (n.hot ? ', 0 0 0 4px var(--acc)' : '') + ', 0 0 0 ' + (n.hot ? 9 : 7) + 'px ' + halo,
              }} />
              <div className="abs node-pop" style={{ '--i': idx,
                left: n.right ? n.x + n.rad + 10 : n.x - n.rad - 10, top: n.y - 9 + (n.dy || 0),
                fontSize: 12, lineHeight: '18px', whiteSpace: 'nowrap', fontWeight: n.nodoc || n.hot ? 600 : 400,
                color: n.nodoc ? 'var(--doc-t)' : n.hot ? 'var(--acc-t)' : 'var(--text2)',
                transform: n.right ? undefined : 'translateX(-100%)',
              }}>{n.label}</div>
            </div>
          );
        })}
      </div>
      <div className="fine" style={{ marginTop: 6 }}>Approximate locations, distances to scale.{map.rings ? '' : ' Search range: 35 km in the same district, then 80 km in the next.'} The ring around {v.names.target} shows time left, out of 72 hours.</div>
    </div>
  );
}
