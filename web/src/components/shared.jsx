import { Check } from '@phosphor-icons/react';

export function BrandMark({ size = 40, glyph = 28 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg width={glyph} height={glyph} viewBox="0 0 28 28" aria-hidden="true">
        <path d="M2 15 H8 L11 7 L15 22 L18 15 H26" fill="none" style={{ stroke: 'var(--acc-on)' }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Ring({ c }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={c.ringAria}>
      <circle cx="32" cy="32" r="28" fill="none" style={{ stroke: 'var(--track)' }} strokeWidth="7" />
      <circle cx="32" cy="32" r="28" fill="none" style={{ stroke: c.fill }} strokeWidth="7" strokeLinecap="round" strokeDasharray={c.ringDash} transform="rotate(-90 32 32)" />
      <text x="32" y="38" textAnchor="middle" style={{ fill: 'var(--text)' }} fontSize="17" fontWeight="700">{c.daysText}</text>
    </svg>
  );
}

export function BedSquares({ squares, width }) {
  return (
    <div className="beds" style={width ? { width } : undefined}>
      {squares.map((b, i) => <span key={i} style={{ background: b.bg, borderColor: b.bd }} />)}
    </div>
  );
}

// Doctor status. Never colour alone: a text label and a filled dot, and a violet pill when there is no medical officer.
export function DocPill({ c }) {
  return (
    <button type="button" className={'doc-pill' + (c.doc ? '' : ' no')} aria-label={c.docTip}>
      <span className="doc-dot" style={{ background: c.doc ? 'var(--ok)' : 'var(--doc)', borderColor: c.doc ? 'var(--ok)' : 'var(--doc)' }} />
      <span style={{ color: c.doc ? 'var(--text)' : 'var(--doc-t)', fontWeight: c.doc ? 400 : 600 }}>{c.doc ? 'On duty' : 'No medical officer'}</span>
      <span className={'tipbox' + (c.tipAbove ? ' above' : '')} role="tooltip">{c.docTip}</span>
    </button>
  );
}

export function SupplyBar({ pct, color }) {
  return (
    <div className="supply">
      <div className="fill ease" style={{ width: pct + '%', background: color }} />
      <div className="tick t1" /><div className="tick t3" />
    </div>
  );
}

// Says where the numbers on screen come from. Stock, beds and staffing are never shown without it.
export function DataLabel({ source }) {
  const imported = source && source.mode === 'csv';
  return <span className={'data-label' + (imported ? ' imported' : '')}>{imported ? 'Imported data: ' + source.fileName : 'Simulated data'}</span>;
}

export const Tick = () => <Check size={12} weight="bold" color="var(--acc-on)" aria-hidden="true" />;
