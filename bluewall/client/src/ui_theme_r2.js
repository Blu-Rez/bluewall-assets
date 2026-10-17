// ui_theme_r2.js — UI1 round 2 / UI3: the look of every screen that is not a building sheet:
//   the top HUD (level badge, name plate, gem capsules, the two special gems), toasts, the Assist button + hub, the corner Kingdom / Army / Rank buttons,
//   the Army screen (+ unit info, emblem picker), the Shop (boosts / defense / gems), Rank + Clan / Friends / Log, Settings.
// UI3: the brown / gold "leather + brass + parchment" colours are gone — every colour, gradient, font and shadow comes from ui_tokens.js (`T` / `G` / `A()` / `DISPLAY`); there is no hex of its own left here.
// Visual layer only (no rules, no data, no motion of its own).  Every rule starts with ".bw-ui " (one class more than the original rule, so it wins whatever the order);
// the screens keep every class / id / export they had.  Injected once as a style sheet of its own (id k-kit2) by ui_theme.js injectKit() and by the UI constructor.
import { T, G, A, mix, DISPLAY } from './ui_tokens.js';
import { badgeSvg, gearSvg, icoUrl } from './ui_icons.js';

// the level badge of the HUD: a silver hexagon, a navy field, a fine ice line — the number and the little gear are drawn by the HUD itself  (UI3: the drawing lives in ui_icons.js)
export const badgeC = badgeSvg;
export const gearC = gearSvg;

export const KIT2_CSS = `
.bw-ui *{scrollbar-color:${T.line} ${T.n0}}
.bw-ui .bwu-body,.bw-ui .bwa-body,.bw-ui .bwk-body,.bw-ui .bw-body,.bw-ui .bwa-sheet{scrollbar-width:thin}
/* ---- top HUD: scrim, level badge, name plate, gem capsules, special gems */
.bw-ui .bw-top{background:${G.scrim}}
.bw-ui .bw-lvl .k-lvb{display:block;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6))}
.bw-ui .bw-lvl .lvn{font:900 19px/1 ${DISPLAY};color:${T.ink};text-shadow:0 1px 0 #000,0 0 6px rgba(0,0,0,.85)}
.bw-ui .bw-lvl .gear{left:36px;top:36px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.bw-ui .bw-lvl:before{content:"";position:absolute;left:-8px;top:-8px;right:-8px;bottom:-8px}
.bw-ui .bw-who{background:${G.panel};border:1px solid ${T.line};border-left:0;box-shadow:0 3px 9px rgba(0,0,0,.5),${G.cap}}
.bw-ui .bw-who .nm{font-family:${DISPLAY};font-weight:900;letter-spacing:.6px;color:${T.ink};text-shadow:0 1px 0 #000}
.bw-ui .bw-who .sub{color:${T.ice2}}
.bw-ui .bw-g{background:${G.panel};border:1px solid ${T.line};box-shadow:0 3px 9px rgba(0,0,0,.5),${G.cap}}
.bw-ui .bw-g .ct{color:${T.ink}}.bw-ui .bw-g .ct .num{text-shadow:0 1px 0 #000}
.bw-ui .bw-g .ct small{color:${T.mute}}
.bw-ui .bw-g .tk{background:${T.n0};box-shadow:inset 0 0 0 1px ${A('line',.38)}}
.bw-ui .bw-g.full{border-color:var(--gl)}
.bw-ui .bw-g.full:after{opacity:.5}
.bw-ui .bw-p{background:${G.panel};border:1px solid ${T.line};box-shadow:0 3px 9px rgba(0,0,0,.5),${G.cap}}
.bw-ui .bw-p:before{content:"";position:absolute;left:-8px;right:-4px;top:-10px;bottom:-10px}
.bw-ui .bw-p .ct{color:${T.ink}}
.bw-ui .bw-p[data-p="sap"]{border-color:#7f93d6}.bw-ui .bw-p[data-p="onyx"]{border-color:${T.silver2}}
.bw-ui .bw-toast{padding:11px 20px;border-radius:14px;background:${G.panel};border:1px solid ${T.line};color:${T.ink};font-size:13.5px;box-shadow:${G.cap},0 8px 22px rgba(0,0,0,.62)}
/* ---- the corner buttons (Kingdom / Army / Rank): brass ring, leather core; no gleam that runs forever */
.bw-ui .bwu-btn .ring{background:${G.ring};box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px ${T.n0}}
.bw-ui .bwu-btn .core{background:${G.core};box-shadow:inset 0 2px 6px ${A('ice',.4)},inset 0 -6px 12px rgba(0,0,0,.55)}
.bw-ui .bwu-btn.hot .ring{box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px ${T.n0},0 0 22px ${A('ice2',.85)}}
.bw-ui .bwu-btn .core svg{color:${T.ink}}
.bw-ui .bwu-btn .lb,.bw-ui .bwa-btn .lb{font-family:${DISPLAY};color:${T.ink};text-shadow:0 1px 0 ${T.n0},1px 0 0 ${T.n0},-1px 0 0 ${T.n0},0 0 6px rgba(0,0,0,.85)}
.bw-ui .bwa-btn .ring{background:conic-gradient(from 0deg,${T.ice} calc(var(--p,0) * 1%),${T.n0} 0);box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px ${T.n0}}
.bw-ui .bwa-btn .ring:before{background:${G.ring}}
.bw-ui .bwa-btn .core{background:${G.core};box-shadow:inset 0 2px 7px ${A('ice',.4)},inset 0 -6px 12px rgba(0,0,0,.6)}
.bw-ui .bwa-btn .core svg,.bw-ui .bwa-btn .core b{color:${T.ink}}
.bw-ui .bwa-btn.hot .ring{box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px ${T.n0},0 0 24px ${A('ice2',.85)}}
.bw-ui .bwa-chip,.bw-ui .bwk-chip{height:44px;background:${G.panel};border:1px solid ${T.line};color:${T.ink};box-shadow:${G.cap},0 3px 10px rgba(0,0,0,.5)}
.bw-ui .bwa-chip i{color:${T.ok}}
/* ---- shared panel chrome: Army, Shop, Rank / Clan, Settings, Hub (the Kingdom page got it in round 1) */
.bw-ui .bwa,.bw-ui .bwk,.bw-ui .bw-set{background:${A('n0',.42)}}
.bw-ui .bwa-pan,.bw-ui .bwk-pan,.bw-ui .bw-panel{border-radius:18px;background:${G.panel};border:1px solid ${T.line};box-shadow:${G.plate},0 20px 60px rgba(0,0,0,.72);color:${T.ink}}
.bw-ui .bwa-h .t b,.bw-ui .bwk-h .t b,.bw-ui .bw-ph .t{font-family:${DISPLAY};font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:${T.ink};text-shadow:none}
.bw-ui .bwk-h .t b{color:var(--lc,${T.ink})}
.bw-ui .bwk-h .t b{font-size:17px;letter-spacing:.4px}
.bw-ui .bwa-h .t span,.bw-ui .bwk-h .t span {color:${T.mute}}
.bw-ui .bwk-h .t>span{display:block;line-height:1.45;font-size:12.5px}
.bw-ui .bwk-h .t>span{position:relative}
.bw-ui .bwk-h .t>span>svg{position:absolute;left:0;top:3px;margin:0}
.bw-ui .bwk-h .t>span>svg+b{margin-left:21px}
.bw-ui .bwk-h .t>span b{display:inline;font-family:inherit;font-size:14px;letter-spacing:0;text-transform:none;font-weight:700}
.bw-ui .bwk-h .t span.bwc-tag{display:inline-block;margin:0 6px 0 0;padding:1px 6px;font-size:11px;line-height:1.4;color:${T.inkOn};vertical-align:1px}
.bw-ui .bwa-h .t span b{color:${T.ice2}}
.bw-ui .bwa-x,.bw-ui .bwk-x{flex:0 0 auto;width:44px;height:44px;border-radius:12px;background:${G.btn};border:1px solid ${T.line};color:${T.ink};box-shadow:inset 0 1px 0 ${A('ice',.22)}}
.bw-ui .bwa-tabs,.bw-ui .bwk-tabs{background:rgba(0,0,0,.3);border:1px solid ${A('line',.32)}}
.bw-ui .bwa-tabs button,.bw-ui .bwk-tabs button{min-height:44px;color:${T.mute};font-family:${DISPLAY};font-weight:900}
.bw-ui .bwa-tabs button.on,.bw-ui .bwk-tabs button.on{color:${T.inkOn};background:${G.accent};border:1px solid ${T.blue2};box-shadow:${G.emb}}
.bw-ui .bwk-tabs button .dot{background:${T.ok};box-shadow:none}
.bw-ui .bw-ph{border-bottom-color:${A('line',.3)}}
.bw-ui .bw-kd div{background:${A('ice',.07)};border-color:${A('line',.4)}}
.bw-ui .bw-kd span{color:${T.ice2}}.bw-ui .bw-kd b{color:${T.ink}}
.bw-ui .bw-tabs{border-bottom-color:${A('line',.25)}}
.bw-ui .bw-tabs{gap:4px}
.bw-ui .bw-tab{min-height:44px;padding:7px 9px;display:flex;align-items:center;color:${T.mute};background:${A('ice',.06)}}
.bw-ui .bw-tab.on{color:${T.inkOn};background:${G.accent};border-color:${T.blue2};box-shadow:${G.emb}}
/* ---- Settings */
.bw-ui .bw-row{border-bottom-color:${A('line',.2)}}
.bw-ui .bw-row .l{color:${T.ink}}.bw-ui .bw-row .v{color:${T.ice2}}
.bw-ui .bw-row input[type=range]{height:44px;margin-top:0;background:linear-gradient(90deg,${T.blue} var(--p,50%),${A('ice',.2)} var(--p,50%)) center/100% 6px no-repeat}
.bw-ui .bw-row input[type=range]::-webkit-slider-thumb{width:26px;height:26px;background:radial-gradient(circle at 35% 30%,#ffffff,${T.ice2});border:2px solid ${T.inkOn}}
.bw-ui .bw-row input[type=range]::-moz-range-thumb{width:24px;height:24px;background:${T.ice2};border:2px solid ${T.inkOn}}
.bw-ui .bw-seg span{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;color:${T.ink};background:${G.btn};border:1px solid ${T.line}}
.bw-ui .bw-seg span.on{color:${T.inkOn};background:${G.accent};border-color:${T.blue2};box-shadow:${G.emb}}
.bw-ui .bw-tg{background:${T.n0};box-shadow:inset 0 0 0 1px ${T.line}}
.bw-ui .bw-tg:before{content:"";position:absolute;left:-6px;right:-6px;top:-9px;bottom:-9px}
.bw-ui .bw-tg::after{background:${T.mute}}
.bw-ui .bw-tg.on{background:linear-gradient(90deg,${T.blue3},${T.ice2})}.bw-ui .bw-tg.on::after{background:${T.inkOn}}
.bw-ui .bw-btnw{min-height:48px;border:1px solid ${T.line};background:${G.btn};color:${T.ink}}
.bw-ui .bw-about h3{color:${T.ice2};font-family:${DISPLAY}}.bw-ui .bw-about p{color:${T.mute}}
.bw-ui .bw-cred{color:${T.mute}}.bw-ui .bw-cred b{color:${T.ice2}}.bw-ui .bw-cred .lc{color:${T.silver3}}.bw-ui .bw-cred h4{color:${T.ice2}}
.bw-ui .bw-cred div{border-bottom-color:${A('line',.18)}}
/* ---- Army */
.bw-ui .bwa-em:after{background:${icoUrl('edit', T.inkOn, 12)} center/12px 12px no-repeat,${G.accent};border-color:${T.blue2};color:${T.inkOn}}
.bw-ui .bwa-hs .r{color:${T.mute}}.bw-ui .bwa-hs .r b{color:${T.ink}}.bw-ui .bwa-hs .r em{color:${T.ok}}
.bw-ui .bwa-bar{background:${T.n0};border-color:${A('line',.5)}}
.bw-ui .bwa-bar i{background:${G.bar};box-shadow:none}
.bw-ui .bwa-bar i.q{background:repeating-linear-gradient(45deg,${T.blue2},${T.blue2} 5px,${T.blue3} 5px,${T.blue3} 10px);opacity:1}
.bw-ui .bwa-ft{background:linear-gradient(0deg,${T.n0} 60%,${A('n0',0)})}
.bw-ui .bwa-ft button{min-height:56px;border:1px solid ${T.n0};background:${G.war};color:#ffffff;font-family:${DISPLAY};font-weight:900;box-shadow:inset 0 1px 0 rgba(255,255,255,.45),inset 0 -3px 0 ${A('n0',.6)},0 4px 12px rgba(0,0,0,.45)}
.bw-ui .bwa-sec{color:${T.ice2}}
.bw-ui .bwa-lane{background:${A('ice',.07)};border-color:${A('line',.42)}}
.bw-ui .bwa-lane .hd,.bw-ui .bwa-lane .hd b{color:${T.ink}}.bw-ui .bwa-lane .hd .tm{color:${T.ice2}}
.bw-ui .bwa-lane .rush{min-height:44px;padding:0 14px;border:1px solid ${T.blue2};background:${G.accent2};color:${T.inkOn};box-shadow:${G.emb}}
.bw-ui .bwa-lane .mi{background:${T.n0};border-color:${T.line}}
.bw-ui .bwa-lane .mi:first-child{border-color:${T.ice};box-shadow:0 0 0 2px ${A('ice2',.3)},0 0 10px ${A('ice2',.45)}}
.bw-ui .bwa-lane .mi .nn{background:${G.accent};border-color:${T.blue2};color:${T.inkOn};text-shadow:none}
.bw-ui .bwa-lane .mi svg{color:${T.ink}}
.bw-ui .bwa-lane .hint{color:${T.mute};font-size:11px}
.bw-ui .bwa-c{background:${G.card};border:2px solid var(--rc,${T.line});box-shadow:0 0 0 1px ${T.inkOn},0 3px 9px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.7)}
.bw-ui .bwa-c .pic{background:${G.core};box-shadow:inset 0 0 0 1px ${A('cardInk',.7)}}
.bw-ui .bwa-c.sp .pic{background:${G.core}}
.bw-ui .bwa-c b.nm{color:${T.cardInk}}
.bw-ui .bwa-c .cs{color:${T.cardInk}}.bw-ui .bwa-c .cs span.no{color:#8a1226}
/* mother (AR1 merge): the soldier card's stat row + train time were light-on-navy; on the parchment panel they need ink */
.bw-ui .bwa-c.u .sr{color:${T.cardInk}}.bw-ui .bwa-c.u .sr svg{opacity:1}.bw-ui .bwa-c.u .cs .tm{color:${T.cardMute}}
.bw-ui .bwa-c .own{background:${T.n1};border-color:${T.line};color:${T.ink}}
.bw-ui .bwa-c .qd{background:${G.accent};border-color:${T.blue2};color:${T.inkOn};text-shadow:none}
.bw-ui .bwa-c .gdb{background:${T.n1};border-color:${T.ice2};color:${T.ink}}
/* mother (AR1 merge): the card's info button is AR1's round 'i' (44x44 hit area, bottom-right of the picture) — UI1-R2's dark box + top move removed */
.bw-ui .bwa-c .rt{font-size:10px;letter-spacing:1px}.bw-ui .bwu-tab small{font-size:11px}
.bw-ui .bwu-cat{position:relative}.bw-ui .bwu-cat:before{content:"";position:absolute;left:-3px;right:-3px;top:-10px;bottom:-10px}.bw-ui .bwa-c .qd{top:32px}
.bw-ui .bwa-note{color:${T.mute}}
.bw-ui .bwa-ov{background:${A('n0',.74)}}
.bw-ui .bwa-sheet{background:${G.panel};border:1px solid ${T.line};box-shadow:${G.plate},0 18px 50px rgba(0,0,0,.72);color:${T.ink}}
.bw-ui .bwa-sheet h3{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.8px;color:${T.ink}}
.bw-ui .bwa-sheet p{color:${T.mute}}
.bw-ui .bwa-sheet .big{border-color:${T.ice2};background:${G.core};color:${T.ink}}
.bw-ui .bwa-sheet .st span{background:${A('ice',.08)};border-color:${A('line',.42)};color:${T.ink}}
.bw-ui .bwa-gd{background:${A('ice',.07)};border-color:${A('line',.42)};color:${T.ink}}
.bw-ui .bwa-gd>b,.bw-ui .bwa-gd.off span,.bw-ui .bwa-gd small{color:${T.mute}}
.bw-ui .bwa-gd button{width:44px;height:44px;border:1px solid ${T.blue2};background:${G.accent};color:${T.inkOn};box-shadow:${G.emb}}
.bw-ui .bwa-emg button{min-height:44px;border-color:${A('line',.35)};background:${G.core}}
.bw-ui .bwa-emg{grid-template-columns:repeat(4,minmax(0,1fr))}.bw-ui .bwa-emg button>*{max-width:100%;height:auto}
.bw-ui .bwa-emg button.on{border-color:${T.ice};box-shadow:0 0 0 2px ${A('ice2',.4)},0 0 12px ${A('ice2',.5)}}
/* ---- Rank / Clan / Friends / Log */
.bw-ui .bwk-pg .r{color:${T.mute}}.bw-ui .bwk-pg .r b{color:${T.ink}}
.bw-ui .bwk-bar{background:${T.n0};border-color:${A('line',.5)}}
.bw-ui .bwk-bar i{background:${G.bar};box-shadow:none}
.bw-ui .bwk-row{background:${A('ice',.07)};border-color:${A('line',.38)};color:${T.ink}}
.bw-ui .bwk-row.me{border-color:${T.ice};background:${A('ice2',.16)};box-shadow:0 0 0 1px ${T.ice}}
.bw-ui .bwk-row .rk{color:${T.mute}}
.bw-ui .bwk-row .rk.m{color:var(--mc);text-shadow:0 1px 0 #000}
.bw-ui .bwk-row .nm b,.bw-ui .bwk-row .tp{color:${T.ink}}.bw-ui .bwk-row .nm span{color:${T.mute}}.bw-ui .bwk-row .tp svg{color:${T.ice2}}
.bw-ui .bwk-row.cur{border-color:var(--lc);box-shadow:0 0 0 1px var(--lc)}
.bw-ui .bwk-row[style*="#43e0ff"] .rk.m{color:${T.gold}}
.bw-ui .bwk-row[style*="#dbe8f7"] .rk.m{color:#dfe3e8}
.bw-ui .bwk-row[style*="#8fa6c4"] .rk.m{color:#cf9460}
.bw-ui .bwk-pan .bwk-h{gap:10px}
.bw-ui .bwk-pan .bwk-h .bd,.bw-ui .bwk-pan .bwk-h .bd .lgb{width:48px}
.bw-ui .bwk-gap{color:${T.silver3}}.bw-ui .bwk-empty{color:${T.mute}}
.bw-ui .bwk-how{background:rgba(0,0,0,.28);border-color:${A('line',.35)};color:${T.mute}}.bw-ui .bwk-how b{color:${T.ink}}
.bw-ui .bwk-inv h3{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.8px;color:${T.ink}}.bw-ui .bwk-inv p{color:${T.mute}}
.bw-ui .bwk-inv .pay{background:${G.accent};border:1px solid ${T.blue2};color:${T.inkOn};box-shadow:${G.emb}}.bw-ui .bwk-inv .pay small{color:${T.n2}}
.bw-ui .bwk-inv .stp li{background:${A('ice',.07)};border-color:${A('line',.38)};color:${T.ink}}
.bw-ui .bwk-inv .stp i{background:${G.accent};border-color:${T.blue2};color:${T.inkOn}}
.bw-ui .bwk-inv .st,.bw-ui .bwk-inv .st b{color:${T.mute}}
.bw-ui .bwk-lk input,.bw-ui .bwc-in input{min-height:44px;background:${G.well};border:1px solid ${T.line};color:${T.ink}}
.bw-ui .bwk-lk button,.bw-ui .bwk-sh,.bw-ui .bwc-btn,.bw-ui .bwc-row .go,.bw-ui .bwc-inv button{min-height:44px;border:1px solid ${T.blue2};background:${G.accent};color:${T.inkOn};box-shadow:${G.emb}}
.bw-ui .bwk-sh,.bw-ui .bwc-btn{min-height:52px;font-family:${DISPLAY};font-weight:900}
.bw-ui .bwc-btn.sec,.bw-ui .bwc-btn.dng,.bw-ui .bwc-row .go.x{background:${G.btn};border-color:${T.line};color:${T.ink};box-shadow:none}
.bw-ui .bwc-row .go.x{min-width:44px}
.bw-ui .bwc-row{gap:8px}
.bw-ui .bwc-row .nm span{text-transform:none;letter-spacing:.2px;font-size:11.5px}
.bw-ui .bwc-row .nm b{font-size:14px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.2;overflow-wrap:anywhere}
.bw-ui .bwc-row .tp{font-size:13.5px;gap:3px}
.bw-ui .bwc-row .go{padding:8px 10px}
.bw-ui .bwc-tag{color:${T.inkOn};background:${G.accent};border-color:${T.blue2}}
.bw-ui .bwc-h3{color:${T.ice2}}
.bw-ui .bwc-card{background:${A('ice',.07)};border-color:${A('line',.42)}}
.bw-ui .bwc-card .top b,.bw-ui .bwc-card .sub b{color:${T.ink}}.bw-ui .bwc-card .sub{color:${T.mute}}
.bw-ui .bwc-lg{background:${A('ice',.07)};border-color:${A('line',.35)}}
.bw-ui .bwc-lg:before{background:${T.ice2}}.bw-ui .bwc-lg.d:before{background:${T.silver3}}
.bw-ui .bwc-lg.new{border-color:${T.ice};box-shadow:0 0 0 1px ${T.ice}}
.bw-ui .bwc-lg .ic{color:${T.ice2}}.bw-ui .bwc-lg.d .ic{color:${T.silver3}}
.bw-ui .bwc-lg .mid b,.bw-ui .bwc-lg .rt{color:${T.ink}}.bw-ui .bwc-lg .mid span,.bw-ui .bwc-lg .rt small{color:${T.mute}}
.bw-ui .bwc-inv{background:rgba(0,0,0,.28);border-color:${A('line',.4)}}
.bw-ui .bwc-inv .t{color:${T.mute}}.bw-ui .bwc-inv .t b{color:${T.ink}}
.bw-ui .bwc-ok{color:${T.ok}}.bw-ui .bwc-wait{color:${T.mute}}.bw-ui .bwc-err{color:${T.warn}}
.bw-ui .bwc-row .nm span i.bwc-ok{color:${T.ok}}.bw-ui .bwc-row .nm span i.bwc-wait{color:${T.mute}}
.bw-ui .bwc-row svg path[fill="#43e0ff"]{fill:${T.ice2};stroke:${T.blue3}}
.bw-ui .bwc-row .nm b svg{display:inline-block;vertical-align:-1px;margin-right:2px}
/* ---- landscape (phone held sideways, 390 px high): tighter headers so the lists keep room */
@media (orientation:landscape) and (max-height:560px){
.bw-ui .bwu-pan .bwu-h{padding:6px 14px 4px}
.bw-ui .bwu-pan .bwu-bl{padding:2px 14px 6px}
.bw-ui .bwu-pan .bwu-bl .bwu-b{padding:3px 6px 4px}
.bw-ui .bwu-pan .bwu-tabs{padding:5px 12px}
.bw-ui .bwu-pan .bwu-tabs .bwu-tab{height:44px;padding:0 4px}
.bw-ui .bwu-pan .bwu-cats{padding:5px 12px 2px}
.bw-ui .bwa-pan .bwa-h{padding:7px 12px 3px}
.bw-ui .bwa-pan .bwa-tabs,.bw-ui .bwk-pan .bwk-tabs{margin-top:6px}
.bw-ui .bwa-pan .bwa-ft{padding:5px 12px 8px}
.bw-ui .bwa-pan .bwa-ft button{min-height:44px;padding:8px}
.bw-ui .bwk-pan .bwk-h{padding:7px 12px 3px 14px;gap:10px}
.bw-ui .bwk-pan .bwk-h .bd,.bw-ui .bwk-pan .bwk-h .bd .lgb{width:46px}
.bw-ui .bw-panel .bw-ph{padding:7px 16px 6px}
.bw-ui .bw-panel .bw-kd{padding:6px 16px 0}
.bw-ui .bw-panel .bw-kd div{padding:4px 10px}
.bw-ui .bw-panel .bw-tabs{padding:6px 12px}
}
`;
export function injectKit2() { if (typeof document === 'undefined' || document.getElementById('k-kit2')) return; const st = document.createElement('style'); st.id = 'k-kit2'; st.textContent = KIT2_CSS; document.head.appendChild(st); }
