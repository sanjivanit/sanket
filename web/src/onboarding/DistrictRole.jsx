import { useMemo } from 'react';
import { buildView, INITIAL } from '../model.js';

// The same rings as the dashboard map: the inner disc is District A (35 km), the outer ring is District B (80 km).
// The map is a pointer shortcut. The lists beside it are the keyboard and screen-reader path to the same choices.
const CX = 180, CY = 165, R_A = 68, R_B = 156;
const ANNULUS = `M${CX - R_B},${CY} a${R_B},${R_B} 0 1,0 ${2 * R_B},0 a${R_B},${R_B} 0 1,0 ${-2 * R_B},0 Z M${CX - R_A},${CY} a${R_A},${R_A} 0 1,1 ${2 * R_A},0 a${R_A},${R_A} 0 1,1 ${-2 * R_A},0 Z`;

function DistrictMap({ district, onPickA, onBlockedB }) {
  const nodes = useMemo(() => buildView(INITIAL).map.nodes, []);
  const selected = district === 'A';
  return (
    <svg className="dmap" width="360" height="330" viewBox="0 0 360 330" aria-hidden="true">
      <path className="district blocked" d={ANNULUS} fillRule="evenodd" onClick={onBlockedB}
        style={{ fill: 'var(--tier2)', stroke: 'var(--rule3)' }} strokeWidth="1" strokeDasharray="3 5" />
      <circle className="district" cx={CX} cy={CY} r={R_A} onClick={onPickA}
        style={{ fill: selected ? 'var(--acc-bg)' : 'var(--panel)', stroke: selected ? 'var(--acc)' : 'var(--rule3)' }} strokeWidth={selected ? 3 : 1.5} />
      {selected && <circle className="pulse-once" cx={CX} cy={CY} r={R_A} fill="none" style={{ stroke: 'var(--acc)' }} strokeWidth="2" />}
      {selected && nodes.map((n, i) => {
        const x = n.x - 233, y = n.y - 13;
        return <circle key={n.label} className="pop" style={{ '--i': i, fill: Math.hypot(x - CX, y - CY) <= R_A ? 'var(--text2)' : 'var(--faint)', pointerEvents: 'none', transformOrigin: `${x}px ${y}px` }} cx={x} cy={y} r="4.5" />;
      })}
      {selected && <circle cx={CX} cy={CY} r="6.5" style={{ fill: 'var(--acc)', stroke: 'var(--panel)', pointerEvents: 'none' }} strokeWidth="2" />}
      <text x={CX} y={CY - R_A - 8} textAnchor="middle" fontSize="13" fontWeight="600" style={{ fill: selected ? 'var(--acc-t)' : 'var(--text)', pointerEvents: 'none' }}>{selected ? '✓ ' : ''}District A</text>
      <text x={CX} y="22" textAnchor="middle" fontSize="13" fontWeight="600" style={{ fill: 'var(--muted)', pointerEvents: 'none' }}>District B</text>
    </svg>
  );
}

function Option({ checked, disabled, onSelect, title, desc, tag, tagColor }) {
  return (
    <button type="button" role="radio" className="opt" aria-checked={checked} aria-disabled={disabled || undefined} onClick={disabled ? undefined : onSelect}>
      <span className="radio" />
      <span className="txt"><span className="t">{title}</span><span className="d">{desc}</span></span>
      <span className="ob-tag" style={{ color: tagColor }}>{tag}</span>
    </button>
  );
}

export default function DistrictRole({ ob, setOb, mapNote, setMapNote }) {
  const pickA = () => { setMapNote(''); setOb((s) => ({ ...s, district: 'A' })); };
  return (
    <div className="pick">
      <div>
        <DistrictMap district={ob.district} onPickA={pickA} onBlockedB={() => setMapNote('District B has no dashboard in this demo. It is searched only when District A cannot cover a need.')} />
        <div className="dmap-note" role="status">{mapNote || 'Sample locations in Maharashtra, distances to scale. Tap District A to place its clinics.'}</div>
      </div>
      <div>
        <div className="group-label" id="ob-district-label">Your district</div>
        <div className="opts" role="radiogroup" aria-labelledby="ob-district-label">
          <Option checked={ob.district === 'A'} onSelect={pickA} title="District A" desc="8 clinics, where the surge happens." tag="Demo district" tagColor="var(--acc-t)" />
          <Option checked={false} disabled title="District B" desc="3 clinics. The next district, searched only if A cannot cover a need." tag="Roadmap" tagColor="var(--muted)" />
        </div>
        <div className="group-label" id="ob-role-label" style={{ marginTop: 18 }}>Your role</div>
        <div className="opts" role="radiogroup" aria-labelledby="ob-role-label">
          <Option checked={ob.role === 'dmo'} onSelect={() => setOb((s) => ({ ...s, role: 'dmo' }))} title="District Medical Officer" desc="See your clinics, get early warnings, approve transfers." tag="Demo role" tagColor="var(--acc-t)" />
          <Option checked={false} disabled title="State health cell" desc="See every district, every warning and the shared model." tag="Roadmap" tagColor="var(--muted)" />
          <Option checked={false} disabled title="PHC medical officer" desc="Report stock by message and see your own clinic." tag="Roadmap" tagColor="var(--muted)" />
        </div>
      </div>
    </div>
  );
}
