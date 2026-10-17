// UI1-R4 — menus that really open in LANDSCAPE (the game is landscape-only; 844x390 first, also 800x360 and 932x430, with Telegram's own margins).  CSS only: no rule, id, class name, export or function of the other UI files changes.
// Problem found by the census (dev/ui1r4_census.py): the Kingdom / Army / Shop / Rank / Clan / Friends / Log / Settings panels stack header + status + tabs on top of each other and leave the list a 52-170 px sliver.
// Fix: every list panel becomes TWO PANES — a left rail (status + tabs [+ the Army "Find a target" button]) and a right pane that holds the whole list at full height.  The panel uses the full safe height
// (`--r4t` / `--r4b`: the Telegram safe insets minus 4 px, at least 6 px) and scrolls INSIDE (the list), never the page.  Targets >= 44 px, nothing under the notch, no horizontal page scroll, +0 shader programs.
// Scope: every rule starts with `.bw-ui.bw-ui` (one class more than round 2 / 3, so it wins without `!important`) and sits in a landscape media query (the second one only shortens the hub on phones <= 400 px high).  No transition, no animation, no backdrop-filter in this file.
import { T, A, FONT, FS, fs } from './ui_tokens.js';
const LAND = '@media (orientation:landscape) and (max-height:560px)';
const P = '.bw-ui.bw-ui';
export const KIT4_CSS = `
${LAND}{
/* UI3: every list panel is a SMALL centred card — at most 68 % of the screen height and 74 % of its width (the owner's rule: <= 70 % x <= 75 % at 844x390), centred inside the Telegram safe box, so most of the map stays visible.
   The panel is still TWO PANES (UI1_R4): a left rail (status + tabs) and a right pane that holds the list; the list scrolls INSIDE.  --r4h / --r4w are the only two numbers that size the panels. */
${P}{--r4rail:158px;--r4h:68%;--r4w:min(74%,640px)}
${P} .bwu-pan,${P} .bwa-pan,${P} .bws-pan,${P} .bwk-pan,${P} .bw-panel,${P} .bwc .bwk-pan{position:absolute;left:var(--sl,0px);right:var(--sr,0px);top:var(--st,0px);bottom:var(--sb,0px);width:var(--r4w);height:var(--r4h);max-width:none;max-height:none;margin:auto;
  display:grid;grid-template-columns:var(--r4rail) minmax(0,1fr);grid-template-rows:auto auto auto minmax(0,1fr);align-content:stretch;overflow:hidden}
${P} .bwu-h,${P} .bwa-h,${P} .bws-h,${P} .bwk-h,${P} .bw-ph{grid-area:1/1/2/3;min-width:0}
${P} .bwu-body,${P} .bwa-body,${P} .bws-body,${P} .bwk-body,${P} .bw-body{grid-area:2/2/5/3;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;box-shadow:inset 1px 0 0 ${A('line',.28)}}
/* the header: a 40 px back / close pair around the title, one slim row */
${P} .bwu-h,${P} .bwa-h,${P} .bws-h,${P} .bwk-h,${P} .bw-ph{padding:4px 8px 4px 10px;gap:8px;min-height:46px;align-items:center}
${P} .bwa-x,${P} .bws-x,${P} .bwk-x,${P} .bwu-x,${P} .bw-x,${P} .bwnav{width:40px;height:40px}
${P} .bwu-h .t,${P} .bwa-h .t b,${P} .bws-h b,${P} .bwk-h .t b,${P} .bw-ph .t{font-size:16px;letter-spacing:.8px}
/* the rail: tabs are stacked buttons (40 px), the status blocks above them */
${P} .bwa-tabs,${P} .bws-tabs,${P} .bwk-tabs{grid-area:3/1;flex-direction:column;gap:5px;margin:6px 8px 0 10px;padding:4px;overflow:visible}
${P} .bws-tabs{grid-area:2/1}
${P} .bwa-tabs button,${P} .bws-tabs button,${P} .bwk-tabs button{flex:0 0 auto;width:100%;min-height:40px;padding:0 4px}
${P} .bwa-tabs{flex-direction:row;gap:4px}
${P} .bwa-tabs button{flex:1 1 0;width:auto;min-width:0;padding:0 2px;font-size:${fs(11.5)}px;letter-spacing:.3px}
${P} .bwa-hs{grid-area:2/1;margin:4px 8px 0 12px}
${P} .bwk-pg{grid-area:2/1;margin:4px 8px 0 12px}
${P} .bwa-hs .r,${P} .bwk-pg .r{flex-wrap:wrap;gap:0 8px;line-height:1.3;font-size:11.5px}
${P} .bwa-ft{grid-area:4/1;align-self:end;padding:6px 8px 8px 10px;background:none}
${P} .bwa-ft button{min-height:44px;padding:6px 6px;font-size:${fs(12.5)}px;letter-spacing:${FS < 1 ? .2 : .6}px;white-space:normal;line-height:1.15;display:flex;align-items:center;justify-content:center;gap:6px}
/* ---- Kingdom: builders as three compact pips, the four tabs as a 2x2 block in the rail; the category chips lead the list column */
${P} .bwu-bl{grid-area:2/1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:4px 8px 0 10px}
${P} .bwu-bl .bwu-b{padding:3px 1px 3px;min-height:46px}
${P} .bwu-bl .bwu-b .ic{height:16px}
${P} .bwu-bl .bwu-b .tx{font-size:9px;line-height:1.4;margin-top:1px}
${P} .bwu-tabs{grid-area:3/1;display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:6px 8px 0 10px;border:0}
${P} .bwu-tabs .bwu-tab{height:40px;min-height:40px;padding:0 2px;font-size:11.5px;min-width:0;display:flex;align-items:center;justify-content:center;gap:3px}
${P} .bwu-cats{grid-area:2/2;display:flex;gap:6px;padding:4px 10px 2px;overflow-x:auto;overflow-y:hidden;align-items:center;box-shadow:inset 1px 0 0 ${A('line',.28)}}
${P} .bwu-cats .bwu-cat{flex:0 0 auto;min-height:40px;display:flex;align-items:center;padding:0 12px;min-width:44px;justify-content:center;font-size:12px}
${P} .bwu-body{grid-area:3/2/5/3}
/* Kingdom cards (UI3): the picture on the left; name + tier and the cost on the first line, one full-width action button under them (the static description is not shown in the list — it is in the building's Info) */
${P} .bwu-r{padding:6px 8px;margin-top:5px;gap:8px;align-items:center}
${P} .bwu-t{flex:0 0 44px;height:48px;align-self:flex-start;place-items:start center;padding-top:5px}
${P} .bwu-t>svg{width:25px;height:25px}
${P} .bwu-t .lv{bottom:3px;font-size:11.5px;line-height:13px}
${P} .bwu-m{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:8px;row-gap:4px;align-content:start}
${P} .bwu-m>.n{grid-column:1;grid-row:1;min-width:0}
${P} .bwu-m>.d{display:none}
${P} .bwu-m>.bwu-cost{grid-column:2;grid-row:1;margin:0;justify-content:flex-end}
${P} .bwu-m>.bwu-go{grid-column:1/-1;grid-row:2;margin-top:0}
${P} .bwu-m>.bwu-pr,${P} .bwu-m>.bwu-up,${P} .bwu-m>.bwu-note{grid-column:1/-1}
${P} .bwu-go button{min-height:40px;width:100%}
/* ---- Army cards (UI3): a card is a small HORIZONTAL tile — the picture on the left, rarity / name / stats / cost on the right; two per row (the old tall 2:3 card showed one cut row).
   .pic is made static so its badges (own / queued / level / guard / info / lock) are positioned against the CARD, not clipped by the picture. */
${P} .bwa-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:6px}
${P} .bwa-c[data-k]{display:grid;grid-template-columns:50px minmax(0,1fr);grid-template-rows:auto auto auto 1fr;align-content:start;justify-items:start;align-items:start;column-gap:7px;row-gap:2px;padding:6px;min-height:92px;text-align:left}
${P} .bwa-c[data-k] .pic{position:static;grid-column:1;grid-row:1/span 4;align-self:stretch;width:50px;height:auto;min-height:78px;aspect-ratio:auto;border-radius:8px;overflow:visible}
${P} .bwa-c[data-k] .pic:after{display:none}
${P} .bwa-c[data-k] .pic img{position:static;width:100%;height:100%;min-height:78px;object-fit:cover;object-position:50% 0;border-radius:8px}
${P} .bwa-c[data-k] .rt{position:static;transform:none;grid-column:2;grid-row:1;margin:0;height:14px;line-height:14px;padding:0 6px;font-size:9px;letter-spacing:.8px}
${P} .bwa-c[data-k] b.nm{grid-column:2;grid-row:2;margin:0;min-height:0;font-size:12px;line-height:1.15;justify-content:flex-start;text-align:left}
${P} .bwa-c[data-k] .sr{grid-column:2;grid-row:3;justify-content:flex-start;margin:0;gap:5px;flex-wrap:wrap}
${P} .bwa-c[data-k] .cs{grid-column:2;grid-row:4;justify-content:flex-start;margin:0;padding:0;gap:1px 6px;min-height:0;align-self:start}
${P} .bwa-c[data-k] .own{left:9px;top:9px;z-index:2}
${P} .bwa-c[data-k] .qd{left:9px;right:auto;top:29px;z-index:2}
${P} .bwa-c[data-k] .lvb{left:9px;bottom:9px;z-index:2}
${P} .bwa-c[data-k] .gdb{left:9px;bottom:29px;z-index:2}
${P} .bwa-c[data-k] .inf{right:0;bottom:0;top:auto;z-index:3}
${P} .bwa-c[data-k] .inf:before{right:6px;bottom:6px;top:auto;color:${T.ice};background:${A('n0',.9)};border:1px solid ${A('ice2',.85)};font:700 13px/1 ${FONT}}
${P} .bwa-c[data-k] .lock{left:6px;right:auto;width:50px;top:26px;padding:0;font-size:9.5px}
${P} .bwa-c.sp[data-k]{grid-template-rows:auto auto 1fr}
${P} .bwa-c.sp[data-k] .pic{grid-row:1/span 3}
${P} .bwa-c.sp[data-k] b.nm{grid-row:1}
${P} .bwa-c.sp[data-k] .cs{grid-row:2}
${P} .bwa-c.sp[data-k] .pic svg{width:70%;height:70%}
/* ---- Settings: date / time stacked in the rail, the four tabs as a 2x2 block */
${P} .bw-kd{grid-area:2/1;display:grid;grid-template-columns:1fr;gap:3px;padding:2px 8px 0 10px}
${P} .bw-kd div{padding:2px 8px}
${P} .bw-kd b{margin-top:1px;line-height:1.25}
${P} .bw-tabs{grid-area:3/1;display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px 8px 0 10px;overflow:visible}
${P} .bw-tabs .bw-tab{min-height:40px;padding:0 2px;font-size:11.5px;min-width:0}
/* ---- toasts (e.g. «+43K ruby — a gift from your games!»): a pill in the top strip between the two Telegram buttons, never in the middle of the view where the hero stands */
${P} .bw-toast{top:max(8px,calc(var(--st,0px) - 6px));max-width:min(520px,calc(100% - 2 * (max(var(--sl,0px),var(--sr,0px)) + 130px)));padding-top:7px;padding-bottom:7px}
/* ---- the hero picker (class names only; the picker belongs to RP1C and lives OUTSIDE .bw-ui, so the safe insets come from html[data-hud] — --hl / --hr / --ht of ui_theme_r3.js): the 6 cards and the close button stay inside the side margins (notch / Telegram), the close button is 44 px and sits under the Telegram Close pill */
html .rp-pick.rp-pick .rp-grid{width:min(calc(100% - var(--hl,0px) - var(--hr,0px) - 24px),820px)}
html .rp-pick.rp-pick .rp-x{left:calc(var(--hl,0px) + 6px);top:max(6px,calc(var(--ht,0px) - 4px));width:44px;height:44px}
}
`;
export function injectKit4() { if (typeof document === 'undefined' || document.getElementById('k-kit4')) return; const st = document.createElement('style'); st.id = 'k-kit4'; st.textContent = KIT4_CSS; document.head.appendChild(st); }
