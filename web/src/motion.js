// Motion helpers for the dashboard. CSS does the predetermined motion (see the "Motion" block in styles.css).
// This file is only for what CSS cannot do: counting a number up to its new value.
import { createElement, useEffect, useRef, useState } from 'react';

// The same curve as --ease-out in styles.css, so a counting number and a moving bar settle together.
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t;
  const Y = (t) => ((ay * t + by) * t + cy) * t;
  const dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x, d = dX(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return Y(Math.min(1, Math.max(0, t)));
  };
}
const easeOut = bezier(0.23, 1, 0.32, 1);

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Shows "16 min" or "10.9 km" counting from the previous number to the new one. Anything that is not a number
// ("-", "Stable") is shown as it is. With reduced motion the new value appears at once.
export function CountUp({ value, ms = 600 }) {
  const text = String(value);
  const m = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(text);
  const target = m ? Number(m[1]) : null;
  const decimals = m && m[1].includes('.') ? m[1].split('.')[1].length : 0;
  const suffix = m ? m[2] : '';
  const current = useRef(target);
  const [shown, setShown] = useState(target);

  useEffect(() => {
    if (target === null) { current.current = null; return undefined; }
    if (reducedMotion() || current.current === null || current.current === target) { current.current = target; setShown(target); return undefined; }
    const from = current.current, t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      // Keep the running value, so a change that arrives mid-count continues from where the number is now.
      current.current = from + (target - from) * easeOut(p);
      setShown(current.current);
      if (p < 1) raf = requestAnimationFrame(tick); else current.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  // Right after a non-number turns into a number, `shown` still holds the old null for one render.
  const now = shown === null ? target : shown;
  return createElement('span', null, target === null ? text : now.toFixed(decimals) + suffix);
}
