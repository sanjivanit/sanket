import { Ring, BedSquares, DocPill, SupplyBar, DataLabel } from './shared.jsx';
import DataSourceControl from './DataSourceControl.jsx';

const VIEWS = [{ key: 'tiles', label: 'Tiles' }, { key: 'table', label: 'Table' }, { key: 'charts', label: 'Charts' }];

function Tile({ c, extra }) {
  return (
    <div className="tile" style={{ borderColor: c.tileBorder, background: c.rowBg }}>
      <div>
        <div className="nm">{c.short}</div>
        <div className="mt">{c.tileMeta}</div>
      </div>
      <div className="ring-row">
        <Ring c={c} />
        <div>
          <div className="u">{c.unit} of supply</div>
          {!extra && <div className="st" style={{ color: c.textColor }}>{c.statusLabel}</div>}
        </div>
      </div>
      {c.hasChip && <span className="chip" style={{ color: c.chipColor }}>{c.chipText}</span>}
      <div>
        <BedSquares squares={c.bedSquares} />
        <div className="beds-note" style={{ color: c.bedColor }}>Beds {c.bedText}</div>
      </div>
      <DocPill c={c} />
    </div>
  );
}

function DistrictB({ rows, open, onToggle, table, district }) {
  if (rows.length === 0) return null;
  return (
    <div style={table ? { marginTop: 16 } : undefined}>
      <button type="button" className="disclose" style={table ? { paddingTop: 13, paddingBottom: 13 } : { marginTop: 12 }} onClick={onToggle} aria-expanded={open}>
        <span className="a" style={table ? { fontSize: 16 } : undefined}>Next district</span>
        <span className="b">{rows.length} facilities, searched only if {district} cannot cover the need</span>
        <span className="grow" />
        <span className="c">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (table
        ? rows.map((c) => <TableRow key={c.name} c={c} />)
        : <div className="tiles b">{rows.map((c) => <Tile key={c.name} c={c} extra />)}</div>)}
    </div>
  );
}

function TableRow({ c, withStatus }) {
  return (
    <div className="trow" style={{ background: withStatus ? c.rowBg : undefined }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="nm">{c.name}</span>
          {withStatus && c.hasChip && <span className="chip" style={{ color: c.chipColor }}>{c.chipText}</span>}
        </div>
        <div className="fine" style={{ marginTop: 2 }}>{c.meta}</div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="days num">{c.daysText}</span>
          <span className="days-u">{c.unit}</span>
        </div>
        {withStatus && <div className="fine" style={{ marginTop: 4, minHeight: 14, color: c.textColor }}>{c.statusLabel}</div>}
      </div>
      <div>
        <SupplyBar pct={c.fillPct} color={c.fill} />
        <div className="fine" style={{ marginTop: 8 }}>{c.supplyText}</div>
      </div>
      <div>
        <BedSquares squares={c.bedSquares} width={116} />
        <div className="fine" style={{ marginTop: 5, color: c.bedColor }}>{c.bedText}</div>
      </div>
      <div><DocPill c={c} /></div>
    </div>
  );
}

function Charts({ v }) {
  const s = v.surge;
  return (
    <div>
      <div className="charts2">
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Days of supply by facility</div>
          <div className="fine" style={{ margin: '2px 0 10px' }}>Ticks at 1 and 3 days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {v.chartSup.map((r) => (
              <div className="bar-row" key={r.name}>
                <div>{r.name}</div>
                <div className="bar"><div className="fill ease" style={{ width: r.pct + '%', background: r.color }} /><div className="tick t1" /><div className="tick t3" /></div>
                <div className="num" style={{ textAlign: 'right' }}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Beds in use by facility</div>
          <div className="fine" style={{ margin: '2px 0 10px' }}>Tick at 85%. Donors must stay below it</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {v.chartBeds.map((r) => (
              <div className="bar-row" key={r.name}>
                <div>{r.name}</div>
                <div className="bar"><div className="fill" style={{ width: r.pct + '%', background: r.color }} /><div className="tick t85" /></div>
                <div className="num" style={{ textAlign: 'right' }}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{v.names.target} days of supply through the surge</div>
        <svg width="100%" viewBox="0 0 796 150" style={{ display: 'block', marginTop: 6 }} role="img" aria-label={s.aria}>
          <line x1="30" y1="112" x2="766" y2="112" style={{ stroke: 'var(--rule2)' }} strokeWidth="1" />
          <line x1="30" y1={s.y3} x2="766" y2={s.y3} style={{ stroke: 'var(--warn)' }} strokeWidth="1" strokeDasharray="4 4" />
          <text x="34" y={s.y3l} style={{ fill: 'var(--warn-t)' }} fontSize="12">3 days</text>
          <line x1="30" y1={s.y1} x2="766" y2={s.y1} style={{ stroke: 'var(--crit)' }} strokeWidth="1" strokeDasharray="4 4" />
          <text x="34" y={s.y1l} style={{ fill: 'var(--crit-t)' }} fontSize="12">1 day</text>
          {s.future && <polyline points={s.future} fill="none" style={{ stroke: 'var(--rule3)' }} strokeWidth="2" strokeDasharray="5 4" />}
          <polyline points={s.solid} fill="none" style={{ stroke: 'var(--text)' }} strokeWidth="2.5" strokeLinejoin="round" />
          {s.dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="5" style={{ fill: d.color, opacity: d.opacity }} />)}
          {s.labels.map((t, i) => <text key={t} x={s.dots[i].x} y="134" textAnchor="middle" style={{ fill: 'var(--muted)' }} fontSize="12">{t}</text>)}
        </svg>
      </div>
    </div>
  );
}

export default function Clinics({ v, view, setView, showB, setShowB, source }) {
  const toggleB = () => setShowB(!showB);
  return (
    <div className="panel">
      <div className="panel-head">
        <div className="t"><h2 className="h2">Facilities</h2><span className="muted" style={{ fontSize: 13 }}>{v.place.district}, {v.place.sameDistrict} facilities</span><DataLabel source={v.source} /></div>
        <DataSourceControl {...source} />
        <div className="seg" role="group" aria-label="Facility view">
          {VIEWS.map((o) => <button type="button" className="wide" key={o.key} aria-pressed={view === o.key} onClick={() => setView(o.key)}>{o.label}</button>)}
        </div>
      </div>
      <div className="panel-body">
        {view === 'tiles' && (
          <div>
            <div className="tiles">{v.rowsA.map((c) => <Tile key={c.name} c={c} />)}</div>
            <DistrictB rows={v.rowsB} open={showB} onToggle={toggleB} district={v.place.district} />
          </div>
        )}
        {view === 'table' && (
          <div>
            <div className="trow head"><div>Facility</div><div>Supply</div><div>Stock, ticks at 1 and 3 days</div><div>Beds</div><div>Doctor</div></div>
            {v.rowsA.map((c) => <TableRow key={c.name} c={c} withStatus />)}
            <DistrictB rows={v.rowsB} open={showB} onToggle={toggleB} table district={v.place.district} />
          </div>
        )}
        {view === 'charts' && <Charts v={v} />}
      </div>
    </div>
  );
}
