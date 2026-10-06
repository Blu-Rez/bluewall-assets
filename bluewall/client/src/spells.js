// Spell catalogue for the UI: names, short descriptions, accent colours and glass-orb icons (spellart.js: hand-built SVG, no external art).
//   SPELL_ORDER, SPELLS[k] = { name, desc, c1, c2, glow }, spellIcon(k, size) -> inline <svg>
import { orb } from './spellart.js';
export const SPELL_ORDER = ['lightning', 'heal', 'freeze', 'rage', 'quake'];
export const SPELLS = {
  lightning: { name: 'Lightning', desc: 'Four bolts strike a small area: heavy damage to buildings and defenders.', c1: '#9fd8ff', c2: '#2b6bff', glow: 'rgba(120,190,255,.9)' },
  heal: { name: 'Healing', desc: 'A ring of light that heals your soldiers inside it for a few seconds.', c1: '#8dffb3', c2: '#10a24f', glow: 'rgba(90,255,150,.85)' },
  freeze: { name: 'Frost', desc: 'Freezes towers and ballistas in the area: they stop shooting for a while.', c1: '#d4f6ff', c2: '#3aa7e6', glow: 'rgba(170,235,255,.9)' },
  rage: { name: 'Rage', desc: 'Your soldiers inside hit much harder and move faster.', c1: '#ffb36b', c2: '#d6280f', glow: 'rgba(255,110,60,.9)' },
  quake: { name: 'Earthquake', desc: 'Shakes the ground: every building in the area loses a slice of its health.', c1: '#d9bf92', c2: '#7a5530', glow: 'rgba(230,190,120,.85)' },
};
// the icon every spell button / card / result row uses (style A: glass orb)
export function spellIcon(k, size = 40) { return SPELLS[k] ? orb(k, size) : ''; }
