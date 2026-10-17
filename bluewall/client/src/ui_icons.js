// ui_icons.js — UI3: the ONE icon set of the interface.  Inline SVG only (no shader, no model, no request), a 24 grid, ONE stroke weight per look (ui_tokens.js ICON_STYLE), `currentColor`.
//   ico(name, size)          -> small line icon (inherits the text colour).  Look 3 adds an 18 % duotone fill under closed shapes.
//   icoUrl(name, color, px)  -> a `url("data:image/svg+xml,…")` string, for the few places that can only take CSS (the hero crown button, the Arrange button: they are drawn by other modules)
//   gemSvg(key, size)        -> the five gems (ruby / emerald / turq / sap / onyx) as ONE faceted style
//   badgeSvg() / gearSvg()   -> the level badge (hexagon) and its little gear
// Every glyph the old modules drew (hub tiles, shop tabs, building emblems, HUD gems, Assist, crown, Arrange) comes from here, so they all share weight, corners and colour logic.
import { T, GEM, ICON_STYLE, G } from './ui_tokens.js';

export const P = {
  // actions / ui
  up: 'M12 20V5M5.5 11.5L12 5l6.5 6.5', collect: 'M12 3v12M7 10l5 5 5-5M5 20h14', bolt: 'M13 3L5 13.5h6L10 21l8-10.5h-6z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.4', list: 'M5 7h14M5 12h14M5 17h14',
  move: 'M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5', x: 'M6 6l12 12M18 6L6 18',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', check: 'M5 12.5l4.5 4.5L19 7.5', arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M15 5l-7 7 7 7', chev: 'M9 5l7 7-7 7', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16.5 16.5L21 21', grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  copy: 'M9 9h10v11H9zM5 15V4h10', share: 'M12 15V3M8 7l4-4 4 4M5 13v7h14v-7', eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  // things
  shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  swords: 'M4.5 4.5L15 15M12.5 17.5l5-5M16 16l3.5 3.5M19.5 4.5L9 15M11.5 17.5l-5-5M8 16l-3.5 3.5', sword: 'M5 5l11 11M13 18.5l5.5-5.5M17 17l3.5 3.5',
  hammer: 'M19.6 10.8L16.8 13.6 10.4 7.2 13.2 4.4zM13.6 10.4L4.5 19.5', assist: 'M21 3L8.5 15.5M6.5 13.5l4 4M8.5 15.5L4 20M8.14 3.04l2.82 2.82-5.1 5.1-2.82-2.82zM8.4 8.4L21 21', bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8', cup: 'M8 4h8v5.5a4 4 0 0 1-8 0zM8 6H5.2v1.3A3 3 0 0 0 8 10M16 6h2.8v1.3A3 3 0 0 1 16 10M12 13.5V17M9.5 17h5v3h-5z',
  crown: 'M3.5 17.5l-1-9 5 3.5L12 5l4.5 6.5 5-3.5-1 9zM4.5 21h15', clan: 'M12 3l7.5 2.6v5.6c0 4.6-3.2 8.2-7.5 9.8-4.3-1.6-7.5-5.2-7.5-9.8V5.6zM8.5 11.5l3.5 3 3.5-3',
  friends: 'M9 5.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM2.8 20c.6-3.6 3.2-5.6 6.2-5.6s5.6 2 6.2 5.6M18 6.5v6M15 9.5h6', log: 'M6 3.5h9.5l3.5 3.5v13.5H6zM9 11h7M9 14.5h7M9 18h4',
  helm: 'M5 19v-7a7 7 0 0 1 14 0v7zM8.5 12.5h7M12 5v7.5M4 19h16', flag: 'M6 21V4M6 5h11l-2.4 3.6L17 12H6', gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 20c0-2.6-1.7-4.8-4-5.5', home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5',
  undo: 'M9 5L4 10l5 5M4 10h9.5a5.5 5.5 0 0 1 0 11H10', rotl: 'M4.5 4.5V10H10M5.4 14a7.5 7.5 0 1 0 1.6-6.8L4.5 10', rotr: 'M19.5 4.5V10H14M18.6 14a7.5 7.5 0 1 1-1.6-6.8L19.5 10', edit: 'M4 20h4.2L19 9.2 14.8 5 4 15.8zM12.8 7l4.2 4.2',
  box: 'M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9', drop: 'M12 3c3.5 4.5 6 7.2 6 10.5a6 6 0 0 1-12 0C6 10.2 8.5 7.5 12 3z', arrange: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6',
  // building glyphs (the emblem)
  keep: 'M4 21V9l3-2v3h2V6l3-3 3 3v4h2V7l3 2v12zM10 21v-5h4v5', wall: 'M3 20V8h3v3h3V8h3v3h3V8h3v12zM9 20v-4h6v4', towers: 'M8 21V8h8v13M7 8V5h2v1h2V5h2v1h2V5h2v3M11 14h2v3h-2z',
  train: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5a.5.5 0 1 0 0 1', training: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5a.5.5 0 1 0 0 1',
  barracks: 'M4.5 4.5L15 15M12.5 17.5l5-5M16 16l3.5 3.5M19.5 4.5L9 15M11.5 17.5l-5-5M8 16l-3.5 3.5',
  stable: 'M6 21v-3a6 6 0 1 1 12 0v3M3 21h5M16 21h5M9 11l3-3 3 3', workshop: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  lair: 'M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 1 2 1 3-4zM9 14l3 3 3-3', forge: 'M3 9h14l-2 4h-4v3h4v3H7v-3h2v-3M17 9c2 0 4-1 4-3',
  mine: 'M5 21l10-10M8 5c4-2 9-1 12 3-4-1-7 0-9 2z', vault: 'M4 8h16v12H4zM4 8a8 4 0 0 1 16 0M10 13h4v3h-4z',
  wheat: 'M12 21V9M12 9c-3 0-4-2-4-5 3 0 4 2 4 5zM12 9c3 0 4-2 4-5-3 0-4 2-4 5zM12 15c-3 0-4-2-4-4M12 15c3 0 4-2 4-4', axe: 'M6 21l8-12M12 5c3-2 7-1 8 2-2 3-5 3-8 1z', fish: 'M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2zM8 11.5v.1',
  civic: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6',
};
// closed shapes that get the look-3 duotone fill (open strokes like arrows / checks must never be filled)
const DUO = new Set(['shield', 'heart', 'star', 'lock', 'info', 'clock', 'bag', 'cup', 'crown', 'clan', 'log', 'helm', 'flag', 'home', 'box', 'drop', 'keep', 'wall', 'towers', 'vault', 'hammer', 'civic', 'fish', 'lair', 'people', 'friends', 'training', 'train', 'grid', 'arrange', 'copy', 'eye']);
const { sw, join, duo } = ICON_STYLE;
const cap = join === 'miter' ? 'square' : 'round';
export const ico = (n, sz = 18, cls = '') => `<svg class="k-ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${join}" aria-hidden="true">${duo && DUO.has(n) ? `<path d="${P[n] || P.keep}" fill="currentColor" fill-opacity=".18" stroke="none"/>` : ''}<path d="${P[n] || P.keep}"/></svg>`;
export const icoUrl = (n, color = '#fff', px = 24) => 'url("data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="${cap}" stroke-linejoin="${join}"><path d="${P[n] || P.keep}"/></svg>`) + '")';

// ---- the five gems: one faceted cut, flat facets in the gem's own light / mid / dark, a small sparkle.  32 x 32.
const mixh = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export const gemSvg = (k, sz = 28, cls = 'gem3') => {
  const g = GEM[k] || GEM.ruby, id = 'g' + k, d2 = mixh(g.m, g.d, .5), l2 = mixh(g.l, g.m, .5);
  return `<svg class="${cls}" viewBox="0 0 32 32" width="${sz}" height="${sz}" aria-hidden="true" style="overflow:visible"><path d="M10 5h12l7 7-13 17L3 12z" fill="${g.g}" fill-opacity=".28" transform="translate(0 .6) scale(1)" stroke="none"/>`
    + `<path d="M10 5L3 12h9.5z" fill="${l2}"/><path d="M10 5h12l-2.5 7h-7z" fill="${g.l}"/><path d="M22 5l7 7h-9.5z" fill="${g.m}"/><path d="M3 12h9.5L16 29z" fill="${g.m}"/><path d="M12.5 12h7L16 29z" fill="${d2}"/><path d="M19.5 12H29L16 29z" fill="${g.d}"/>`
    + `<path d="M10 5h12l7 7-13 17L3 12zM3 12h26M12.5 12L10 5M19.5 12L22 5M12.5 12L16 29M19.5 12L16 29" fill="none" stroke="${g.d}" stroke-width="1" stroke-linejoin="round" stroke-opacity=".85"/>`
    + `<path d="M22.2 6.4l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" fill="#fff" fill-opacity=".92"/></svg>`;
};

// ---- the level badge (hexagon: silver bezel, deep-navy field, an ice inner line) and its little gear; ids kLb1 / kLb2 are the gradients the CSS and the gear reuse
export const badgeSvg = () => `<svg class="k-lvb" viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><defs><linearGradient id="kLb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="${T.silver2}"/><stop offset="1" stop-color="${T.silver3}"/></linearGradient>`
  + `<linearGradient id="kLb2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.n3}"/><stop offset="1" stop-color="${T.n0}"/></linearGradient></defs>`
  + `<path d="M30 2.5L54.5 16.5v27L30 57.5 5.5 43.5v-27z" fill="url(#kLb1)" stroke="${T.n0}" stroke-width="1.6" stroke-linejoin="round"/>`
  + `<path d="M30 8.5L49.5 19.5v21L30 51.5 10.5 40.5v-21z" fill="url(#kLb2)" stroke="${T.n0}" stroke-width="1"/>`
  + `<path d="M30 11.8L46.7 21.4v17.2L30 48.2 13.3 38.6V21.4z" fill="none" stroke="${T.ice2}" stroke-opacity=".6" stroke-width="1"/></svg>`;
export const gearSvg = () => `<svg class="k-lvg" viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="url(#kLb1)" stroke="${T.n0}" stroke-width="1.2"/><g fill="none" stroke="${T.n0}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">`
  + `<circle cx="11" cy="11" r="2.8"/><path d="M11 4.3v2.1M11 15.6v2.1M4.3 11h2.1M15.6 11h2.1M6.3 6.3l1.5 1.5M14.2 14.2l1.5 1.5M15.7 6.3l-1.5 1.5M7.8 14.2l-1.5 1.5"/></g></svg>`;
export { G };
