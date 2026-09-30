import { useLayoutEffect, useState } from 'react';

// Dims the page and cuts a window around one region of the dashboard. The window glides to the next region.
export default function Spotlight({ target }) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!target) { setRect(null); return undefined; }
    const find = () => document.getElementById('tour-' + target);
    const measure = () => {
      const el = find(); if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ left: r.left - 8, top: r.top - 8, width: r.width + 16, height: r.height + 16 });
    };
    measure();
    const settle = setTimeout(measure, 150); // the stepper appears a moment after the day changes
    const el = find();
    const ro = el ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { clearTimeout(settle); ro && ro.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [target]);
  if (!rect) return null;
  return <div className="spot" style={rect} aria-hidden="true" />;
}
