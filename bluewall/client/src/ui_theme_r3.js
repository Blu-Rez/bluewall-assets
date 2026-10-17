// UI1-R3 — HUD placement for the LANDSCAPE-ONLY game (844x390 first; also 800x360 and 932x430).  CSS only, no game logic, no change in main.js / rpg.js (their buttons are placed here by class name).
// The «crown» button is `.rp-open` (main.js: enters hero mode, owner build); «Assist» is `.bwh-btn` (the hub, bottom-right).  Three layouts, switched by <html data-hud="1|2|3"> (owner picks by number; HUD_DEFAULT is the pick):
//   1  «Left rail»   crown on the left edge, centred between the level badge and the joystick zone; all five resources in ONE column top-right (the two special gems as a half-width pair under the three); Assist bottom-right
//   2  «Under badge» crown directly under the level badge with the two special gems beside it (one cluster top-left); the three mined gems alone top-right; Assist bottom-right
//   3  «Right stack» crown right above Assist: both game buttons in one stack for the right thumb; special gems stay under the level badge
// Thumb zones (all three layouts):  bottom-left 200x170 = movement (hero joystick) — nothing of the HUD enters it;  bottom-right = primary actions (strategic: Assist; hero: jump / dodge / sprint / use);
// top-left under Telegram's Close = level badge + name;  top-right under Telegram's ⌄ ⋮ = resources.  Every margin is a safe inset: max(env(), Telegram's own --tg-* sums), so nothing sits under a notch or a rounded corner.
// The hero buttons (rpg.js, `.rp-b[data-rp=…]`) are placed from here too: same safe insets, a thumb arc round the bottom-right corner, every target >= 44 px, no blur layer (cheaper on the phone).
// Dev knobs: ?hud=N (preview, remembered in localStorage), window.__bwHud(N).  Nothing animated, no JS in the frame loop.
import { T, G, A, mix, FONT } from './ui_tokens.js';                      // UI3: colours
import { icoUrl } from './ui_icons.js';                           // UI3: the crown / Arrange glyphs come from the one icon set
export const HUD_DEFAULT = 3;

const SAFE = (side) => `max(env(safe-area-inset-${side},0px),calc(var(--tg-safe-area-inset-${side},0px) + var(--tg-content-safe-area-inset-${side},0px)))`;

export const HUD3_CSS = `
/* ---- safe insets: one definition for the whole HUD (panels, sheets and the hub read the same variables) */
html[data-hud]{--hl:${SAFE('left')};--hr:${SAFE('right')};--ht:${SAFE('top')};--hb:${SAFE('bottom')}}
html[data-hud] .bw-ui{--sl:var(--hl);--sr:var(--hr);--st:var(--ht);--sb:var(--hb)}
/* ---- the crown (hero entry, main.js \`.rp-open\`): 48 px, placed per layout (its inline left/top are overridden) */
/* UI3: the crown is drawn from the one icon set (main.js's own svg is hidden; its inline colours are overridden by the rules below); same family as Assist: 48 px, silver rim, dark core */
html[data-hud] .rp-open{width:48px!important;height:48px!important;border:2px solid ${T.silver2}!important;background:${G.core}!important;color:${T.ice}!important;box-shadow:0 3px 9px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.28)!important}
html[data-hud] .rp-open:active{transform:scale(.92)}
html[data-hud] .rp-open svg{display:none}
html[data-hud] .rp-open:before{content:"";display:block;width:26px;height:26px;background:${icoUrl('crown', T.ice, 26)} center/contain no-repeat;filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}
/* UI3: the Arrange button (layout_ui.js .bwl .ent, its own module): a 48 px round button of the same family, the glyph from the icon set instead of the "✥" letter */
html .bwl .b.ent{width:48px;height:48px;min-width:48px;padding:0;border-radius:50%;border:2px solid ${T.silver2};background:${G.core};color:${T.ice};box-shadow:0 3px 9px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.28)}
html .bwl .b.ent i,html .bwl .b.ent small{display:none}
html .bwl .b.ent:before{content:"";display:block;width:26px;height:26px;background:${icoUrl('arrange', T.ice, 26)} center/contain no-repeat}
/* UI3: the Arrange editor's own toolbar (layout_ui.js: .bwl .b, the glyph letters ✔ ↶ ⌂ ✓ ✕ ⟲ ⟳ are text): the same silver / dark-blue buttons, the glyphs drawn from the icon set (the letter is hidden), Place / Cancel keep their green / red */
html .bwl{font-family:${FONT};color:${T.ink}}
html .bwl .b{border:1px solid ${T.line};background:${G.btn};color:${T.ink};box-shadow:0 3px 9px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.22);font-family:${FONT}}
html .bwl .b small{font:700 10px/10px ${FONT};opacity:1;letter-spacing:.4px;color:${T.mute}}
html .bwl .b.ok{background:linear-gradient(${mix('ok','#000000',.38)},${mix('ok','#000000',.66)});border-color:${T.ok}}
html .bwl .b.no{background:linear-gradient(${mix('bad','#000000',.4)},${mix('bad','#000000',.68)});border-color:${T.bad}}
html .bwl .b.ok small,html .bwl .b.no small{color:${T.ink}}
html .bwl .b:not(.ent) i{font-size:0;line-height:0;width:22px;height:22px;display:block}
html .bwl .b:not(.ent) i:before{content:"";display:block;width:22px;height:22px;background:center/contain no-repeat}
html .bwl .b[data-a="done"] i:before{background-image:${icoUrl('check', T.ice, 22)}}
html .bwl .b[data-a="undo"] i:before{background-image:${icoUrl('undo', T.ice, 22)}}
html .bwl .b[data-a="def"] i:before{background-image:${icoUrl('home', T.ice, 22)}}
html .bwl .b[data-a="all"] i:before{background-image:${icoUrl('rotl', T.ice, 22)}}
html .bwl .b[data-a="rotl"] i:before{background-image:${icoUrl('rotl', T.ice, 22)}}
html .bwl .b[data-a="rotr"] i:before{background-image:${icoUrl('rotr', T.ice, 22)}}
html .bwl .b[data-a="ok"] i:before{background-image:${icoUrl('check', '#ffffff', 22)}}
html .bwl .b[data-a="cancel"] i:before{background-image:${icoUrl('x', '#ffffff', 22)}}
html .bwl .pill{background:${A('n0', .84)};border:1px solid ${A('line', .7)};color:${T.ink};font:700 12.5px/1.2 ${FONT}}
html .bwl .pill.g{border-color:${T.ok};color:${mix('ok', '#ffffff', .72)}}
html .bwl .pill.r{border-color:${T.bad};color:${mix('bad', '#ffffff', .72)}}
html[data-hud="1"] .rp-open{left:calc(var(--hl) + 10px)!important;right:auto!important;bottom:auto!important;top:min(calc(50% - 24px),calc(100% - 218px - var(--hb)))!important}
html[data-hud="2"] .rp-open{left:calc(var(--hl) + 10px)!important;right:auto!important;bottom:auto!important;top:calc(var(--ht) + 62px)!important}
html[data-hud="3"] .rp-open{left:auto!important;top:auto!important;right:calc(var(--hr) + 14px)!important;bottom:calc(var(--hb) + 72px)!important}
/* ---- the resources: one compact column top-right (three mined gems; layout 1 adds the two special gems under them as a half-width pair, same column width) */
html[data-hud="1"] .bw-ui .bw-pm{left:auto;right:calc(10px + var(--sr));top:calc(var(--st) + 10px + 105px * var(--u));justify-content:flex-end;gap:4px;transform-origin:100% 0}
html[data-hud="1"] .bw-ui .bw-pm .bw-p{width:62px;margin:0}
html[data-hud="1"] .bw-ui .bw-pm .bw-p .ct{left:25px;right:7px;font-size:11.5px}
html[data-hud="2"] .bw-ui .bw-pm{left:calc(62px + var(--sl));top:calc(var(--st) + 73px)}
/* ---- Assist stays bottom-right (primary action zone) — only its margins become safe insets */
html[data-hud] .bw-ui .bwh-btn{right:calc(14px + var(--sr));bottom:calc(var(--sb) + 14px);width:48px;height:48px}
/* ---- the hero buttons (rpg.js): a thumb arc round the bottom-right corner, exit / camera / gate in one row under Telegram's Close (the left column stays free for the joystick); safe insets; >= 44 px; no backdrop blur */
html[data-hud] .rp-b{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
html[data-hud] .rp-b[data-rp="jump"]{width:78px!important;height:78px!important;right:calc(var(--hr) + 16px)!important;bottom:calc(var(--hb) + 22px)!important}
html[data-hud] .rp-b[data-rp="dodge"]{width:62px!important;height:62px!important;right:calc(var(--hr) + 104px)!important;bottom:calc(var(--hb) + 14px)!important}
html[data-hud] .rp-b[data-rp="sprint"]{width:58px!important;height:58px!important;right:calc(var(--hr) + 22px)!important;bottom:calc(var(--hb) + 110px)!important}
html[data-hud] .rp-b[data-rp="act"]{width:62px!important;height:62px!important;right:calc(var(--hr) + 98px)!important;bottom:calc(var(--hb) + 94px)!important}
html[data-hud] .rp-b[data-rp="exit"]{width:44px!important;height:44px!important;left:calc(var(--hl) + 12px)!important;top:calc(var(--ht) + 6px)!important}
html[data-hud] .rp-b[data-rp="cam"]{width:46px!important;height:46px!important;left:calc(var(--hl) + 66px)!important;top:calc(var(--ht) + 5px)!important}
html[data-hud] .rp-b[data-rp="gate"]{width:46px!important;height:46px!important;left:calc(var(--hl) + 120px)!important;top:calc(var(--ht) + 5px)!important}
html[data-hud] .rp-perf{right:calc(var(--hr) + 8px)!important}
`;

export function hudLayout() {
  let v = 0;
  try { v = +(new URLSearchParams(location.search).get('hud') || 0); } catch (e) { /* ignore */ }
  if (!(v >= 1 && v <= 3)) { try { v = +(localStorage.getItem('bw_hud') || 0); } catch (e) { v = 0; } }
  return v >= 1 && v <= 3 ? Math.floor(v) : HUD_DEFAULT;
}
export function setHudLayout(n, keep) {
  n = +n; if (!(n >= 1 && n <= 3)) n = HUD_DEFAULT;
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-hud', String(n));
  if (keep) { try { localStorage.setItem('bw_hud', String(n)); } catch (e) { /* ignore */ } }
  return n;
}
export function injectHudR3() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('k-hud3')) { const st = document.createElement('style'); st.id = 'k-hud3'; st.textContent = HUD3_CSS; document.head.appendChild(st); }
  setHudLayout(hudLayout());
  try { window.__bwHud = (n) => setHudLayout(n, true); } catch (e) { /* ignore */ }
}
