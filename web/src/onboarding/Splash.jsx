import { useEffect, useRef } from 'react';
import { BrandButton, ThemeButton } from './Gate.jsx';

// First screen. One line on what the app does, one button.
export default function Splash({ onHome, onStart, theme, setTheme }) {
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  return (
    <div className="gate">
      <div className="gate-top">
        <span />
        <ThemeButton theme={theme} setTheme={setTheme} />
      </div>
      <main className="splash" aria-labelledby="splash-title">
        <BrandButton onHome={onHome} size={72} glyph={52} className="splash-brand" />
        <h1 id="splash-title" tabIndex={-1} ref={titleRef}>
          <span className="name">Sanket</span>
          <span className="local" lang="hi">संकेत</span>
        </h1>
        <p className="line">Warns your district before a clinic runs out of anti-snake venom, then recommends a safe transfer for you to approve.</p>
        <button type="button" className="ob-btn primary big" onClick={onStart}>Get started</button>
        <p className="fine">Simulated data. Not for clinical use.</p>
      </main>
    </div>
  );
}
