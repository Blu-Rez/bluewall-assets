// The round unit medallions of the battle bar (owner 5 Oct): the SAME glass orb as the spell buttons (spellart.js: silver rim, dark channel, glossy bowl),
// with the squad's HEALTH as a coloured ring in the dark channel, the unit's portrait in the bowl (bowl tinted by the rarity of the unit so a blue
// soldier never sits on a blue background) and a thin rarity ring.  unitOrb(type) -> <svg>; unitOrbDefs() -> the shared gradients (once per HUD).
import { PORTRAIT } from './portraits.js';
import { icon } from './armyui.js';
import { RARITY } from './rarity.js';

// bowl colours per rarity: [centre, mid, edge]
const BOWL = {
  common: ['#f1e8d2', '#b9a97f', '#4d4128'],      // warm stone: the blue soldiers stand out from it
  rare: ['#c9f3da', '#4fae7c', '#16452f'],
  epic: ['#e6d3ff', '#8a5cc8', '#2f1a56'],
  legendary: ['#ffeab0', '#d19a2c', '#5a3a0c'],
  mythic: ['#cdeeff', '#3f9be0', '#0f3560'],
};
export function unitOrbDefs() {
  const bowls = Object.entries(BOWL).map(([k, c]) => `<radialGradient id="bwu-b-${k}" cx="50%" cy="36%" r="70%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`).join('');
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${bowls}
    <linearGradient id="bwu-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f9ff"/><stop offset=".45" stop-color="#9db4d2"/><stop offset="1" stop-color="#2b3c58"/></linearGradient>
    <radialGradient id="bwu-sh" cx="50%" cy="50%" r="50%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
    <linearGradient id="bwu-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="bwu-c"><circle cx="48" cy="48" r="36"/></clipPath></defs></svg>`;
}
export function unitOrb(t) {
  const r = RARITY[t] || { k: 'common', c: '#c3cfe0' }, pic = PORTRAIT[t];
  const art = pic ? `<image href="${pic}" x="12" y="12" width="72" height="72" clip-path="url(#bwu-c)" preserveAspectRatio="xMidYMid slice"/>`
    : `<g clip-path="url(#bwu-c)"><g transform="translate(24 24) scale(2)" color="#fff" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${icon(t, 24).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g></g>`;
  return `<svg class="uo" viewBox="0 0 96 96" aria-hidden="true">
    <circle cx="48" cy="48" r="44" fill="url(#bwu-r)"/><circle cx="48" cy="48" r="40.5" fill="#06122c"/>
    <circle cx="48" cy="48" r="38.4" fill="none" stroke="#12254a" stroke-width="3.8"/>
    <circle class="arc" cx="48" cy="48" r="38.4" fill="none" stroke-width="3.8" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100" transform="rotate(-90 48 48)"/>
    <circle cx="48" cy="48" r="36" fill="url(#bwu-b-${r.k})"/>${art}
    <circle cx="48" cy="48" r="36" fill="url(#bwu-sh)"/>
    <ellipse cx="48" cy="25" rx="25" ry="13" fill="url(#bwu-g)"/>
    <circle cx="48" cy="48" r="35.2" fill="none" stroke="${r.c}" stroke-opacity=".85" stroke-width="1.5"/></svg>`;
}
