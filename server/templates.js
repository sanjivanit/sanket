// Waybill text. Drug name, vial count and temperature come from CODE templates, never from Gemini.
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
export const LANGS = JSON.parse(readFileSync(new URL('config/languages.json', root), 'utf8')).languages;

const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k]);

export function buildInstructions({ lang, donor, recipient, vials, tempRange }) {
  const en = LANGS.en, loc = LANGS[lang] || LANGS.en;
  const vw = (L, n) => `${n} ${L.vialWord[n === 1 ? 0 : 1]}`;
  const range = (L) => tempRange.replace('-', ` ${L.rangeWord || 'to'} `);
  return {
    english: fill(en.instruction, { vials: vw(en, vials), donor, recipient, temp: range(en) }),
    local: fill(loc.instruction, { vials: vw(loc, vials), donor, recipient, temp: range(loc) }),
    languageCode: LANGS[lang] ? lang : 'en',
    languageName: loc.name,
    languageVerified: !!loc.verified,
  };
}

export function fallbackReasoning({ donor, vials, keepsDays }) {
  return {
    english: `${donor} is the nearest clinic that can give ${vials} vials, has a doctor on duty, and still keeps about ${keepsDays} days of its own supply.`,
    local: '',
  };
}
export function fallbackBrief({ clinic, hours }) {
  return {
    headline: `${clinic} may run out soon`,
    explanation: `About ${Math.round(hours)} hours of anti-snake venom are left at the current trend. Visits are rising.`,
    suggestedAction: 'prepare a transfer',
  };
}
