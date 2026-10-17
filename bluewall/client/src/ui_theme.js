// ui_theme.js — UI1 / UI3: the shared icon entry points for the building sheets (and the old sheet / Kingdom page) + the Kingdom / old-sheet look.
//   ico(name, size)        -> small icon (inherits currentColor) — UI3: the ONE icon set lives in ui_icons.js (same stroke for every icon, per look); re-exported here so every old import keeps working
//   glyphOf(id)            -> the emblem glyph key of a building id / site kind / family
// Visual layer only: no rules, no data.  UI3: colours / fonts / shadows come from ui_tokens.js — no hex of its own.
import { injectKit2 } from './ui_theme_r2.js';
import { injectKit4 } from './ui_theme_r4.js';                       // UI1_R4: landscape two-pane list panels (CSS only)
import { T, G, A, mix, DISPLAY } from './ui_tokens.js';
import { P, ico } from './ui_icons.js';
export { ico };

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

// ---- the shared look (UI1 "parchment & metal" -> UI3 "glacier"): the old info sheet (ui.js .bw-sheet) and the Kingdom page (upgradeui.js .bwu-*) get the same panel / frost-card / button tokens as the building sheet.
// Injected once as a style sheet of its own so ui.js / upgradeui.js stay untouched; every rule starts with ".bw-ui " (one class more than the original rule, so it wins whatever the order).
export const KIT_CSS = `
.bw-ui .bw-sheet{border-radius:18px;padding:18px 20px 18px;background:${G.panel};border:1px solid ${T.line};box-shadow:${G.plate},0 20px 56px rgba(0,0,0,.72);color:${T.ink}}
.bw-ui .bw-sheet .h{font:900 17px/1.25 ${DISPLAY};letter-spacing:.8px;text-transform:uppercase;color:${T.ink};padding-right:44px}
.bw-ui .bw-sheet .d{color:${T.mute}}
.bw-ui .bw-sheet .chip{background:${A('ice',.1)};border-color:${A('line',.45)};color:${T.ice2}}
.bw-ui .bw-x{border-radius:12px;background:${G.btn};border:1px solid ${T.line};color:${T.ink}}
.bw-ui .bwu-pan{border-radius:18px;background:${G.panel};border:1px solid ${T.line};box-shadow:${G.plate},0 20px 60px rgba(0,0,0,.7);color:${T.ink}}
.bw-ui .bwu-h .t{font:900 18px/1.2 ${DISPLAY};letter-spacing:.8px;text-transform:uppercase;color:${T.ink}}
.bw-ui .bwu-x{border-radius:12px;background:${G.btn};border:1px solid ${T.line};color:${T.ink}}
.bw-ui .bwu-b{background:${A('ice',.08)};border-color:${A('line',.4)}}
.bw-ui .bwu-b .ic{color:${T.ice2}}.bw-ui .bwu-b .tx{color:${T.mute}}.bw-ui .bwu-b .tx i{color:${T.silver3}}
.bw-ui .bwu-b.busy{border-color:${T.ok};background:${A('ok',.12)}}.bw-ui .bwu-b.busy .tx{color:${T.ink}}.bw-ui .bwu-b.busy .ic{color:${T.ok}}
.bw-ui .bwu-b .bar{background:${G.bar}}
.bw-ui .bwu-tabs{border-color:${A('line',.25)}}
.bw-ui .bwu-tab{min-height:44px;display:flex;align-items:center;justify-content:center;gap:4px;color:${T.mute};background:${A('ice',.06)}}
.bw-ui .bwu-tab.on{color:${T.inkOn};background:${G.accent};border-color:${T.blue2}}
.bw-ui .bwu-cat{color:${T.mute};border-color:${A('line',.35)}}
.bw-ui .bwu-cat.on{color:${T.inkOn};background:${T.ice2};border-color:${T.blue2}}
.bw-ui .bwu-r{background:${G.card};border:1px solid ${T.line};color:${T.cardInk}}
.bw-ui .bwu-r.hl{border-color:${T.ice};box-shadow:0 0 0 2px ${T.ice},0 0 18px ${A('ice2',.6)}}
.bw-ui .bwu-t{background:${G.core};border:2px solid ${T.line};box-shadow:inset 0 2px 5px rgba(0,0,0,.7)}
.bw-ui .bwu-m .n{color:${T.cardInk}}.bw-ui .bwu-m .n small{color:${T.cardAcc}}.bw-ui .bwu-m .d{color:${T.cardMute}}
.bw-ui .bwu-cost{color:${T.cardInk}}.bw-ui .bwu-cost span{padding:1px 8px 1px 3px;border-radius:999px;background:${A('cardInk',.12)};border:1px solid ${A('cardInk',.3)}}
.bw-ui .bwu-cost span.no{background:rgba(255,64,88,.2);border-color:#c0283f;color:#8a1226}.bw-ui .bwu-cost .tm{background:none;border:0;color:${T.cardMute}}
.bw-ui .bwu-go button{min-height:44px;border:1px solid ${T.blue2};background:${G.accent};color:${T.inkOn};box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 -3px 0 ${A('blue3',.55)}}
.bw-ui .bwu-go button.sec{background:${G.btn};border-color:${T.line};color:${T.ink};box-shadow:none}
.bw-ui .bwu-go button.rush{background:${G.accent2}}
.bw-ui .bwu-pr{background:${T.n0};border-color:${T.line}}.bw-ui .bwu-pr i{background:${G.bar};box-shadow:none}
.bw-ui .bwu-up{color:${T.cardInk}}.bw-ui .bwu-note{color:${T.mute}}
.bw-ui .bwu-road b{color:${T.ice2}}.bw-ui .bwu-road span{color:${T.silver}}.bw-ui .bwu-road.done b{color:${T.ok}}.bw-ui .bwu-road.done span{color:${T.silver3}}
`;
export function injectKit() { injectKit2(); if (typeof document === 'undefined' || document.getElementById('k-kit')) return; const st = document.createElement('style'); st.id = 'k-kit'; st.textContent = KIT_CSS; document.head.appendChild(st); injectKit4(); }  // UI1_R4: injectKit4 LAST so its (.bw-ui.bw-ui) rules come after every other layer
