// ui_tokens.js — UI3: THE one file that defines the colours, fonts and shape of the whole interface (HUD, hub, every menu, every sheet).
// Nothing else in the UI may hold a hex colour of its own for chrome (panels, buttons, text, lines): it reads `T` / `G` from here.  (Game-art colours — the five gems, rarity, the red of danger — live here too, under `GEM` / `T.bad`.)
// Three looks, chosen by number; the owner picks one, DEFAULT = 1.  `?look=N` (remembered in localStorage `bw_ui_look_v1`) or `window.__bwLook(N)` switches (it reloads the page, because the CSS strings are built once at start-up).
//   1  Glacier     deep navy panels · ice-blue accents · silver metal · light frost cards · Barlow Semi Condensed
//   2  Midnight    near-black blue panels · electric-cyan accents · dark cards · sharp (mitred) icons · Saira Semi Condensed
//   3  Royal       royal-blue panels · periwinkle accents · white-silver cards · duotone icons · Inter
// Gold is ONLY a small accent (`gold`, `gold2`: the stars, a premium badge, a tiny underline) — never a surface.  The game is landscape-only; nothing here is animated.
// Persian: every font stack falls back to Vazirmatn (shipped in /pub), then Noto Sans Tai Viet (the owner's fancy-letter name), then the system font.  No CDN: Google Fonts is blocked in Iran — every file is in /pub.

const LOOKS = {
  1: { name: 'Glacier', fam: "'Barlow Semi Condensed'", files: ['ui-barlowsc-400', 'ui-barlowsc-700'], icon: { sw: 1.8, join: 'round', duo: 0 }, lh: 1.25, fs: 1,
    c: { n0: '#050d20', n1: '#0b1d40', n2: '#12315f', n3: '#1b4584', line: '#4b86cf', ice: '#c9eaff', ice2: '#8fd0ff', blue: '#4aa8ff', blue2: '#2b72e6', blue3: '#1b4fb8',
      silver: '#e6eefa', silver2: '#a9bcd8', silver3: '#6c83a8', ink: '#eef5ff', mute: '#9db4d6', inkOn: '#06224f',
      card0: '#eaf2fc', card1: '#cfe0f5', cardInk: '#0b2147', cardMute: '#4a6490', cardAcc: '#1b4fb8', cardLine: '#8aaedd',
      gold: '#f2c75c', gold2: '#ffe08a', goldInk: '#4a3300', ok: '#5fdc92', warn: '#ffb454', bad: '#ff5a6e', badInk: '#8a1226', badBg: '#ffd9de' } },
  2: { name: 'Midnight', fam: "'Saira Semi Condensed'", files: ['ui-sairasc-400', 'ui-sairasc-700'], icon: { sw: 2, join: 'miter', duo: 0 }, lh: 1.25, fs: 1,
    c: { n0: '#02060f', n1: '#071530', n2: '#0c2447', n3: '#14386b', line: '#1fb3e6', ice: '#bff4ff', ice2: '#6fe0ff', blue: '#2fd0ff', blue2: '#0f95d9', blue3: '#0a5fa8',
      silver: '#dbe8f4', silver2: '#9db8d2', silver3: '#5f7e9c', ink: '#e9f6ff', mute: '#8fb3d6', inkOn: '#021a33',
      card0: '#10294f', card1: '#0a1d3e', cardInk: '#e6f4ff', cardMute: '#8fb3d9', cardAcc: '#6fe0ff', cardLine: '#1c5a8a',
      gold: '#ffd36b', gold2: '#ffe9a6', goldInk: '#4a3300', ok: '#4be394', warn: '#ffb454', bad: '#ff5a6e', badInk: '#ffd0d6', badBg: '#5a1424' } },
  3: { name: 'Royal', fam: "Inter", files: ['ui-inter-400', 'ui-inter-700'], icon: { sw: 1.7, join: 'round', duo: 1 }, lh: 1.3, fs: 0.92,
    c: { n0: '#050f33', n1: '#0b2168', n2: '#123287', n3: '#1c47ad', line: '#8fb2ff', ice: '#e0eaff', ice2: '#aac4ff', blue: '#7aa2ff', blue2: '#4468e8', blue3: '#2a47b8',
      silver: '#f3f6fc', silver2: '#bfcbe4', silver3: '#7f8fb8', ink: '#f2f6ff', mute: '#aebdea', inkOn: '#0a1c55',
      card0: '#f7f9fd', card1: '#dde5f4', cardInk: '#0b1f55', cardMute: '#52609a', cardAcc: '#2a47b8', cardLine: '#9fb3e0',
      gold: '#ffd166', gold2: '#ffe6a0', goldInk: '#4a3300', ok: '#5fdc92', warn: '#ffb454', bad: '#ff5a6e', badInk: '#8a1226', badBg: '#ffd9de' } },
};

// ---- which look (read once, at import: the CSS strings of every UI module are built from it)
export function pickLook() {
  let v = 0;
  try { v = +(new URLSearchParams(location.search).get('look') || 0); if (v >= 1 && v <= 3) { try { localStorage.setItem('bw_ui_look_v1', String(v)); } catch (e) { /* storage blocked */ } } } catch (e) { /* no url */ }
  if (!(v >= 1 && v <= 3)) { try { v = +(localStorage.getItem('bw_ui_look_v1') || 0); } catch (e) { v = 0; } }
  return v >= 1 && v <= 3 ? Math.floor(v) : 1;
}
export const LOOK = pickLook();
export const LOOK_NAME = LOOKS[LOOK].name;
export const T = LOOKS[LOOK].c;                      // the active colours (hex strings)
export const ICON_STYLE = LOOKS[LOOK].icon;          // { sw: stroke width on the 24 grid, join: 'round' | 'miter', duo: 1 = a 18 % fill under the stroke }
export const LOOK_LIST = Object.keys(LOOKS).map((k) => ({ n: +k, name: LOOKS[k].name }));

// ---- helpers
const rgb = (h) => { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
export const A = (hex, a) => { const [r, g, b] = rgb(T[hex] || hex); return `rgba(${r},${g},${b},${a})`; };           // A('ice', .4)  /  A('#fff', .2)
export const mix = (h1, h2, t) => { const a = rgb(T[h1] || h1), b = rgb(T[h2] || h2); return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

// ---- fonts.  ONE family per look + Vazirmatn for Persian.  Weights: 400 (text) and 700 (headings, numbers, buttons); 900 asks fall to 700.
export const FONT = `${LOOKS[LOOK].fam},Vazirmatn,'Noto Sans Tai Viet',system-ui,sans-serif`;         // text
export const DISPLAY = FONT;                                                                           // headings use the same family at 700 (+ letter-spacing where the CSS wants it)
export const NUM = `${LOOKS[LOOK].fam},'Noto Sans Tai Viet',system-ui,sans-serif`;                    // digits / timers (no Persian fallback needed; Latin digits)
export const LH = LOOKS[LOOK].lh;
export const FS = LOOKS[LOOK].fs;                 // font-size factor for the tiny one-line labels (Inter is ~8 % wider than the two condensed families): fs(10.5) -> px
export const FONT_CSS = Object.entries({ 'Barlow Semi Condensed': ['ui-barlowsc-400', 'ui-barlowsc-700'], 'Saira Semi Condensed': ['ui-sairasc-400', 'ui-sairasc-700'], Inter: ['ui-inter-400', 'ui-inter-700'] })
  .map(([fam, [r, b]]) => `@font-face{font-family:'${fam}';src:url(/pub/${r}.woff2) format("woff2");font-weight:400;font-display:swap}@font-face{font-family:'${fam}';src:url(/pub/${b}.woff2) format("woff2");font-weight:700 900;font-display:swap}`).join('\n');

// ---- derived surfaces (gradients / shadows) — every UI module takes these, never its own hex
export const G = {
  panel: `linear-gradient(180deg,${T.n2} 0%,${T.n1} 52%,${T.n0} 100%)`,       // the dark panel / sheet
  panel2: `linear-gradient(180deg,${T.n3},${T.n1})`,                            // a raised dark block (HUD plates, name plate)
  scrim: `linear-gradient(180deg,${A('n0', .72)},${A('n0', 0)})`,              // the top-of-screen fade behind the HUD
  card: `linear-gradient(180deg,${T.card0},${T.card1})`,                        // a list card (light frost in look 1 / 3, dark in look 2)
  accent: `linear-gradient(180deg,${T.ice},${T.ice2} 54%,${T.blue})`,           // primary button / active tab / the ring of an icon button
  accent2: `linear-gradient(180deg,#ffffff,${T.ice} 54%,${T.ice2})`,            // the loudest button (Rush)
  btn: `linear-gradient(180deg,${T.n3},${T.n2})`,                               // a secondary button on a dark panel
  war: `linear-gradient(180deg,${T.blue},${T.blue2} 54%,${T.blue3})`,           // the loudest call to action on a dark panel (white text): Train / Battle
  core: `radial-gradient(circle at 50% 28%,${T.n3},${T.n1} 62%,${T.n0})`,      // the dark round core of an icon button / a picture well
  well: T.n0,                                                                   // an inset dark well (bars, tracks)
  plate: `inset 0 0 0 4px ${T.n0},inset 0 0 0 5px ${A('line', .55)}`,          // the thin inner frame of a panel
  cap: `inset 0 0 0 2px ${A('n0', .9)},inset 0 0 0 3px ${A('line', .34)}`,     // the frame of a small capsule
  emb: `inset 0 1px 0 rgba(255,255,255,.8),inset 0 -3px 0 ${A('blue3', .6)}`,  // the emboss of an accent button
  ring: `conic-gradient(from 210deg,#ffffff,${T.silver2} 18%,${T.silver3} 38%,${T.silver} 55%,${T.silver2} 75%,#ffffff)`,   // a silver bezel
  glow: `0 0 18px ${A('ice2', .6)}`,                                            // the steady glow of "something waits"
  bar: `linear-gradient(90deg,${T.blue2},${T.ice2})`,                           // a progress bar fill
  shadow: '0 20px 56px rgba(0,0,0,.72)',
};

// ---- the five gems (currency identity: they keep their own colour in every look)
export const GEM = {
  ruby: { l: '#ff9aab', m: '#ee2a4c', d: '#8e0a26', g: '#ff5a76' },
  emerald: { l: '#9cf7c6', m: '#19c46c', d: '#05703a', g: '#3fe592' },
  turq: { l: '#d4fbff', m: '#35d6ff', d: '#0a7fb8', g: '#6fe8ff' },
  sap: { l: '#a9c2ff', m: '#2d5fe6', d: '#10236f', g: '#6f96ff' },
  onyx: { l: '#a9b4c8', m: '#3a4358', d: '#06080f', g: '#c6d2ea' },
};

// ---- CSS custom properties (for CSS that cannot interpolate JS: index.html's loader, UI2's hero HUD, rpg.js) — `html[data-look]` is set too
export const fs = (px) => Math.round(px * FS * 10) / 10;
export const VARS_CSS = ':root{' + Object.entries(T).map(([k, v]) => `--ui-${k}:${v}`).join(';') + `;--ui-font:${FONT};--ui-num:${NUM};--ui-lh:${LH}}`;
export function injectTokens() {
  if (typeof document === 'undefined') return;
  try { document.documentElement.setAttribute('data-look', String(LOOK)); } catch (e) { /* a stub document (the node unit tests) */ return; }
  if (document.getElementById('ui3-tokens')) return;
  const web = typeof location !== 'undefined' && /^https?:$/.test(location.protocol);                      // (a file:// test page cannot fetch /pub/*.woff2 — no font requests there, the system sans fills in)
  const st = document.createElement('style'); st.id = 'ui3-tokens'; st.textContent = (web ? FONT_CSS + '\n' : '') + VARS_CSS; document.head.appendChild(st);
  if (web) for (const f of LOOKS[LOOK].files) { if (document.querySelector(`link[data-ui3font="${f}"]`)) continue; const l = document.createElement('link'); l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous'; l.href = `/pub/${f}.woff2`; l.setAttribute('data-ui3font', f); document.head.appendChild(l); }
  try { window.__bwLook = (n) => { n = +n; if (n >= 1 && n <= 3) { try { localStorage.setItem('bw_ui_look_v1', String(n)); } catch (e) { /* ignore */ } location.reload(); } return LOOK; }; } catch (e) { /* ignore */ }
}
injectTokens();
export const LOOKS_META = LOOKS;                                                   // (for the look sheet / UI3_TOKENS.md generator)
