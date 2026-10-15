// UI1-R4 — menus that really open in LANDSCAPE (the game is landscape-only; 844x390 first, also 800x360 and 932x430, with Telegram's own margins).  CSS only: no rule, id, class name, export or function of the other UI files changes.
// Problem found by the census (dev/ui1r4_census.py): the Kingdom / Army / Shop / Rank / Clan / Friends / Log / Settings panels stack header + status + tabs on top of each other and leave the list a 52-170 px sliver.
// Fix: every list panel becomes TWO PANES — a left rail (status + tabs [+ the Army "Find a target" button]) and a right pane that holds the whole list at full height.  The panel uses the full safe height
// (`--r4t` / `--r4b`: the Telegram safe insets minus 4 px, at least 6 px) and scrolls INSIDE (the list), never the page.  Targets >= 44 px, nothing under the notch, no horizontal page scroll, +0 shader programs.
// Scope: every rule starts with `.bw-ui.bw-ui` (one class more than round 2 / 3, so it wins without `!important`) and sits in a landscape media query (the second one only shortens the hub on phones <= 400 px high).  No transition, no animation, no backdrop-filter in this file.
const LAND = '@media (orientation:landscape) and (max-height:560px)';
const P = '.bw-ui.bw-ui';
export const KIT4_CSS = `
${LAND}{
${P}{--r4rail:178px;--r4t:max(6px,calc(var(--st,0px) - 4px));--r4b:max(6px,calc(var(--sb,0px) + 4px))}
/* ---- the shell: one grid for all five list panels.  Row 1 = header (both columns), rows 2-3 = the rail (column 1), the list = column 2 over rows 2-4 */
${P} .bwu-pan,${P} .bwa-pan,${P} .bws-pan,${P} .bwk-pan,${P} .bw-panel,${P} .bwc .bwk-pan{position:absolute;left:calc(var(--sl,0px) + 10px);right:calc(var(--sr,0px) + 10px);top:var(--r4t);bottom:var(--r4b);height:auto;max-height:none;max-width:760px;margin:0 auto;
  display:grid;grid-template-columns:var(--r4rail) minmax(0,1fr);grid-template-rows:auto auto auto minmax(0,1fr);align-content:stretch;overflow:hidden}
${P} .bwu-h,${P} .bwa-h,${P} .bws-h,${P} .bwk-h,${P} .bw-ph{grid-area:1/1/2/3;min-width:0}
${P} .bwu-body,${P} .bwa-body,${P} .bws-body,${P} .bwk-body,${P} .bw-body{grid-area:2/2/5/3;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;box-shadow:inset 1px 0 0 rgba(196,154,84,.28)}
/* the rail: tabs are stacked buttons (>= 44 px), the status blocks above them */
${P} .bwa-tabs,${P} .bws-tabs,${P} .bwk-tabs{grid-area:3/1;flex-direction:column;gap:6px;margin:6px 8px 0 12px;padding:4px;overflow:visible}
${P} .bwa-tabs button,${P} .bws-tabs button,${P} .bwk-tabs button{flex:0 0 auto;width:100%;min-height:44px}
${P} .bwa-hs{grid-area:2/1;margin:6px 8px 0 14px}
${P} .bwk-pg{grid-area:2/1;margin:6px 8px 0 14px}
${P} .bwa-hs .r,${P} .bwk-pg .r{flex-wrap:wrap;gap:0 8px;line-height:1.35}
${P} .bwa-ft{grid-area:4/1;align-self:end;padding:8px 8px 10px 12px;background:none}
${P} .bwa-ft button{min-height:48px;padding:8px 6px;font-size:13px;letter-spacing:.6px;white-space:normal;line-height:1.15}
/* ---- Kingdom: builders as three compact pips + the four tabs as a 2x2 block in the rail; the category chips (>= 44 px high) lead the list column */
${P} .bwu-bl{grid-area:2/1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:6px 8px 0 12px}
${P} .bwu-bl .bwu-b{padding:4px 1px 3px;min-height:48px}
${P} .bwu-bl .bwu-b .ic{height:18px}
${P} .bwu-bl .bwu-b .tx{font-size:9.5px;line-height:1.2;margin-top:1px}
${P} .bwu-tabs{grid-area:3/1;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px 8px 0 12px;border:0}
${P} .bwu-tabs .bwu-tab{height:44px;padding:0 2px;font-size:12px;min-width:0;display:flex;align-items:center;justify-content:center;gap:3px}
${P} .bwu-cats{grid-area:2/2;display:flex;gap:6px;padding:4px 12px 2px;overflow-x:auto;overflow-y:hidden;align-items:center;box-shadow:inset 1px 0 0 rgba(196,154,84,.28)}
${P} .bwu-cats .bwu-cat{flex:0 0 auto;min-height:44px;display:flex;align-items:center;padding:0 14px;font-size:12.5px}
${P} .bwu-body{grid-area:3/2/5/3}
/* Kingdom cards: name + description on the left, cost + the action on the right (a card is ~100 px high instead of 160); bars and rush rows keep the full width */
${P} .bwu-r{padding:9px 10px;margin-top:6px;gap:10px}
${P} .bwu-t{flex:0 0 52px;height:58px}
${P} .bwu-m{display:grid;grid-template-columns:minmax(120px,1fr) minmax(0,max-content);column-gap:12px;align-content:start}
${P} .bwu-m>.n{grid-column:1;grid-row:1}
${P} .bwu-m>.d{grid-column:1;grid-row:2/span 3;margin-top:2px}
${P} .bwu-m>.bwu-cost{grid-column:2;grid-row:1;margin:0;max-width:230px;justify-content:flex-end}
${P} .bwu-m>.bwu-cost+.bwu-go{grid-column:2;grid-row:2;margin-top:6px}
${P} .bwu-m>.bwu-pr,${P} .bwu-m>.bwu-up,${P} .bwu-m>.bwu-pr~.bwu-go,${P} .bwu-m>.bwu-up~.bwu-go{grid-column:1/-1}
/* ---- Settings: date / time stacked in the rail, the four tabs as a 2x2 block */
${P} .bw-kd{grid-area:2/1;display:grid;grid-template-columns:1fr;gap:6px;padding:6px 8px 0 12px}
${P} .bw-kd div{padding:3px 8px}
${P} .bw-tabs{grid-area:3/1;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px 8px 0 12px;overflow:visible}
${P} .bw-tabs .bw-tab{min-height:44px;padding:0 2px;font-size:12px;min-width:0}
/* ---- toasts (e.g. «+43K ruby — a gift from your games!»): a pill in the top strip between the two Telegram buttons, never in the middle of the view where the hero stands (it was at --st + 78 px = 130 px of 390) */
${P} .bw-toast{top:max(8px,calc(var(--st,0px) - 6px));max-width:min(520px,calc(100% - 2 * (max(var(--sl,0px),var(--sr,0px)) + 130px)));padding-top:7px;padding-bottom:7px}
/* ---- the hero picker (class names only; the picker belongs to RP1C and lives OUTSIDE .bw-ui, so the safe insets come from html[data-hud] — --hl / --hr / --ht of ui_theme_r3.js): the 6 cards and the close button stay inside the side margins (notch / Telegram), the close button is 44 px and sits under the Telegram Close pill */
html .rp-pick.rp-pick .rp-grid{width:min(calc(100% - var(--hl,0px) - var(--hr,0px) - 24px),820px)}
html .rp-pick.rp-pick .rp-x{left:calc(var(--hl,0px) + 6px);top:max(6px,calc(var(--ht,0px) - 4px));width:44px;height:44px}
/* ---- Assist hub: centred inside the SAFE box (never under the home bar / notch) and scrolls inside if a tiny screen still cannot hold it */
${P} .bwh-pan{top:calc((6px + 100% - var(--r4b)) / 2);max-height:calc(100% - 6px - var(--r4b));overflow-y:auto;overscroll-behavior:contain}
}
/* phones about 360-400 px high (800x360, 844x390): the hub gets shorter rows so its 3 rows (Attack + 2 x 5 tiles) fit with the header above the home bar */
@media (orientation:landscape) and (max-height:400px){
${P} .bwh-a{min-height:64px;margin-bottom:6px}
${P} .bwh-t{min-height:68px;gap:2px;padding-top:4px;padding-bottom:4px}
${P} .bwh-t .ic{width:38px;height:38px}
${P} .bwh-h{padding-bottom:4px}
${P} .bwh-pan{padding-top:7px;padding-bottom:8px}
}
`;
export function injectKit4() { if (typeof document === 'undefined' || document.getElementById('k-kit4')) return; const st = document.createElement('style'); st.id = 'k-kit4'; st.textContent = KIT4_CSS; document.head.appendChild(st); }
