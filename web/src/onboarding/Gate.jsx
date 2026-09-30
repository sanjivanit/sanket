import { Sun, Moon } from '@phosphor-icons/react';
import { BrandMark } from '../components/shared.jsx';

// The logo is a button everywhere. Pressing it clears the setup flag and returns to the splash.
export function BrandButton({ onHome, size, glyph, className = '', children }) {
  return (
    <button type="button" className={'brand brand-btn ' + className} onClick={onHome} aria-label="Sanket. Clear setup and return to the start screen">
      <BrandMark size={size} glyph={glyph} />
      {children}
    </button>
  );
}

export function ThemeButton({ theme, setTheme }) {
  return (
    <button type="button" className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
      {theme === 'light' ? <Moon size={18} weight="bold" aria-hidden="true" /> : <Sun size={18} weight="bold" aria-hidden="true" />}
    </button>
  );
}
