// ui_theme.js — UI1: the shared icon set for the building sheets (and the old sheet / Kingdom page).  Inline SVG only, ONE stroke weight (1.8 on a 24 grid), no requests.
//   ico(name, size)        -> small stroke icon (inherits currentColor)
//   glyphOf(id)            -> the emblem glyph key of a building id / site kind / family
// Visual layer only: no rules, no data.
import { injectKit2 } from './ui_theme_r2.js';
const P = {
  // actions / ui
  up: 'M12 20V5M5.5 11.5L12 5l6.5 6.5', train: 'M5 14a7 7 0 0 1 14 0v5H5zM5 14h14M12 7v7', collect: 'M12 3v12M7 10l5 5 5-5M5 20h14', bolt: 'M13 3L5 13.5h6L10 21l8-10.5h-6z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.4', list: 'M5 7h14M5 12h14M5 17h14',
  move: 'M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5', x: 'M6 6l12 12M18 6L6 18',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', check: 'M5 12.5l4.5 4.5L19 7.5', arrow: 'M5 12h14M13 6l6 6-6 6',
  shield: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z', heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', sword: 'M5 19L19 5M14 5h5v5M7 14l3 3M4 20l3-3',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 20c0-2.6-1.7-4.8-4-5.5', home: 'M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5',
  box: 'M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9', drop: 'M12 3c3.5 4.5 6 7.2 6 10.5a6 6 0 0 1-12 0C6 10.2 8.5 7.5 12 3z',
  // building glyphs (the emblem)
  keep: 'M4 21V9l3-2v3h2V6l3-3 3 3v4h2V7l3 2v12zM10 21v-5h4v5', wall: 'M3 20V8h3v3h3V8h3v3h3V8h3v12zM9 20v-4h6v4', towers: 'M8 21V8h8v13M7 8V5h2v1h2V5h2v1h2V5h2v3M11 14h2v3h-2z',
  training: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5a.5.5 0 1 0 0 1', barracks: 'M5 19L17 7M14 6h4v4M4 20l2-2M19 19L7 7M10 6H6v4M20 20l-2-2',
  stable: 'M6 21v-3a6 6 0 1 1 12 0v3M3 21h5M16 21h5M9 11l3-3 3 3', workshop: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  lair: 'M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 1 2 1 3-4zM9 14l3 3 3-3', forge: 'M3 9h14l-2 4h-4v3h4v3H7v-3h2v-3M17 9c2 0 4-1 4-3',
  mine: 'M5 21l10-10M8 5c4-2 9-1 12 3-4-1-7 0-9 2z', vault: 'M4 8h16v12H4zM4 8a8 4 0 0 1 16 0M10 13h4v3h-4z',
  wheat: 'M12 21V9M12 9c-3 0-4-2-4-5 3 0 4 2 4 5zM12 9c3 0 4-2 4-5-3 0-4 2-4 5zM12 15c-3 0-4-2-4-4M12 15c3 0 4-2 4-4', axe: 'M6 21l8-12M12 5c3-2 7-1 8 2-2 3-5 3-8 1z', fish: 'M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2zM8 11.5v.1',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1',
  civic: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6',
};
export const ico = (n, sz = 18) => `<svg class="k-ic" viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[n] || P.keep}"/></svg>`;

// id / site kind -> glyph key
const WS_GLYPH = { farm: 'wheat', greenhouse: 'wheat', mill: 'wheat', bakery: 'wheat', lumber: 'axe', sawmill: 'axe', fishery: 'fish', smokehouse: 'fish', livestock: 'fish', slaughter: 'fish', butcher: 'fish',
  quarry: 'mine', iron: 'mine', gold: 'mine', panning: 'mine', oil: 'mine', masonry: 'gear', smelter: 'gear', mint: 'gear', refinery: 'gear' };
export function glyphOf(id) {
  id = String(id || '');
  if (id.startsWith('mine_')) return 'mine'; if (id.startsWith('vault_')) return 'vault'; if (id.startsWith('home:')) return 'home'; if (id.startsWith('civic:')) return 'civic';
  if (id.startsWith('ws:')) { const k = id.slice(3).replace(/[_\d].*$/, ''); return WS_GLYPH[k] || 'gear'; }
  return P[id] ? id : 'keep';
}
export const emblemGlyph = (id, sz = 34) => ico(glyphOf(id), sz);

// ---- the shared look (UI1, "parchment & metal"): the old info sheet (ui.js .bw-sheet) and the Kingdom page (upgradeui.js .bwu-*) get the same leather / brass / parchment tokens as the building sheet.
// Injected once as a style sheet of its own so ui.js / upgradeui.js stay untouched; every rule starts with ".bw-ui " (one class more than the original rule, so it wins whatever the order).
const DISPLAY = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
const LEATHER = 'linear-gradient(180deg,#3c2a1b 0%,#291c11 52%,#1b120b 100%)', PARCH = 'linear-gradient(180deg,#ecdcb2,#d6bf8a)', BRASS = 'linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014)',
  BRASS2 = 'linear-gradient(180deg,#ffe9a6,#d49a2a 54%,#9a6a14)', BTN = 'linear-gradient(180deg,#5b4731,#3b2c1c)', PLATE = 'inset 0 0 0 4px #1b120b,inset 0 0 0 5px rgba(196,154,84,.55)';
export const KIT_CSS = `
.bw-ui .bw-sheet{border-radius:18px;padding:18px 20px 18px;background:${LEATHER};border:1px solid #8a6a3a;box-shadow:${PLATE},0 20px 56px rgba(0,0,0,.72);color:#f4e8cc}
.bw-ui .bw-sheet .h{font:900 17px/1.25 ${DISPLAY};letter-spacing:.8px;text-transform:uppercase;color:#f4e8cc;padding-right:44px}
.bw-ui .bw-sheet .d{color:#c9b48a}
.bw-ui .bw-sheet .chip{background:rgba(255,226,160,.1);border-color:rgba(196,154,84,.45);color:#e0b255}
.bw-ui .bw-x{border-radius:12px;background:${BTN};border:1px solid #8a6a3a;color:#f4e8cc}
.bw-ui .bwu-pan{border-radius:18px;background:${LEATHER};border:1px solid #8a6a3a;box-shadow:${PLATE},0 20px 60px rgba(0,0,0,.7);color:#f4e8cc}
.bw-ui .bwu-h .t{font:900 18px/1.2 ${DISPLAY};letter-spacing:.8px;text-transform:uppercase;color:#f4e8cc}
.bw-ui .bwu-x{border-radius:12px;background:${BTN};border:1px solid #8a6a3a;color:#f4e8cc}
.bw-ui .bwu-b{background:rgba(255,226,160,.08);border-color:rgba(196,154,84,.4)}
.bw-ui .bwu-b .ic{color:#e0b255}.bw-ui .bwu-b .tx{color:#c9b48a}.bw-ui .bwu-b .tx i{color:#a8926a}
.bw-ui .bwu-b.busy{border-color:#b9d48a;background:rgba(150,190,90,.12)}.bw-ui .bwu-b.busy .tx{color:#e3efc4}.bw-ui .bwu-b.busy .ic{color:#c5e58b}
.bw-ui .bwu-b .bar{background:linear-gradient(90deg,#c4872a,#f5d583)}
.bw-ui .bwu-tabs{border-color:rgba(196,154,84,.25)}
.bw-ui .bwu-tab{min-height:44px;display:flex;align-items:center;justify-content:center;gap:4px;color:#c9b48a;background:rgba(255,226,160,.06)}
.bw-ui .bwu-tab.on{color:#2c1a05;background:${BRASS};border-color:#4d300a}
.bw-ui .bwu-cat{color:#c9b48a;border-color:rgba(196,154,84,.35)}
.bw-ui .bwu-cat.on{color:#2c1a05;background:#e0b255;border-color:#4d300a}
.bw-ui .bwu-r{background:${PARCH};border:1px solid #8a6a3a;color:#3a2a14}
.bw-ui .bwu-r.hl{border-color:#f5d583;box-shadow:0 0 0 2px #f5d583,0 0 18px rgba(245,213,131,.6)}
.bw-ui .bwu-t{background:radial-gradient(circle at 50% 30%,#4a3622,#1b120b 80%);border:2px solid #c49a54;box-shadow:inset 0 2px 5px rgba(0,0,0,.7)}
.bw-ui .bwu-m .n{color:#3a2a14}.bw-ui .bwu-m .n small{color:#8f6014}.bw-ui .bwu-m .d{color:#6d5636}
.bw-ui .bwu-cost{color:#3a2a14}.bw-ui .bwu-cost span{padding:1px 8px 1px 3px;border-radius:999px;background:rgba(58,42,20,.12);border:1px solid rgba(58,42,20,.3)}
.bw-ui .bwu-cost span.no{background:rgba(255,64,88,.2);border-color:#c0283f;color:#8a1226}.bw-ui .bwu-cost .tm{background:none;border:0;color:#6d5636}
.bw-ui .bwu-go button{min-height:44px;border:1px solid #4d300a;background:${BRASS};color:#2c1a05;box-shadow:inset 0 1px 0 rgba(255,244,200,.85),inset 0 -3px 0 rgba(70,40,6,.55)}
.bw-ui .bwu-go button.sec{background:${BTN};border-color:#8a6a3a;color:#f4e8cc;box-shadow:none}
.bw-ui .bwu-go button.rush{background:${BRASS2}}
.bw-ui .bwu-pr{background:#1b120b;border-color:#8a6a3a}.bw-ui .bwu-pr i{background:linear-gradient(90deg,#c4872a,#f5d583);box-shadow:none}
.bw-ui .bwu-up{color:#3a2a14}.bw-ui .bwu-note{color:#c9b48a}
.bw-ui .bwu-road b{color:#e0b255}.bw-ui .bwu-road span{color:#e6d6b0}.bw-ui .bwu-road.done b{color:#b9d48a}.bw-ui .bwu-road.done span{color:#9c8f6e}
`;
export function injectKit() { injectKit2(); if (typeof document === 'undefined' || document.getElementById('k-kit')) return; const st = document.createElement('style'); st.id = 'k-kit'; st.textContent = KIT_CSS; document.head.appendChild(st); }
