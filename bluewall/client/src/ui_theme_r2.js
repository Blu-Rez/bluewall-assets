// ui_theme_r2.js — UI1 round 2: look C ("parchment & metal": leather + brass + parchment) for every screen that is not a building sheet:
//   the top HUD (level badge, name plate, gem capsules, the two special gems), toasts, the Assist button + hub, the corner Kingdom / Army / Rank buttons,
//   the Army screen (+ unit info, emblem picker), the Shop (boosts / defense / gems), Rank + Clan / Friends / Log, Settings.
// Visual layer only (no rules, no data, no motion of its own).  Every rule starts with ".bw-ui " (one class more than the original rule, so it wins whatever the order);
// the screens keep every class / id / export they had.  Injected once as a style sheet of its own (id k-kit2) by ui_theme.js injectKit() and by the UI constructor.
const DISPLAY = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
const LEATHER = 'linear-gradient(180deg,#3c2a1b 0%,#291c11 52%,#1b120b 100%)', LEATHER2 = 'linear-gradient(180deg,#4a3622,#2d2014)', PARCH = 'linear-gradient(180deg,#ecdcb2,#d6bf8a)',
  BRASS = 'linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014)', BRASS2 = 'linear-gradient(180deg,#ffe9a6,#d49a2a 54%,#9a6a14)', BTN = 'linear-gradient(180deg,#5b4731,#3b2c1c)',
  WAR = 'linear-gradient(180deg,#b8483a,#7a2018 54%,#4d120d)', WELL = 'linear-gradient(180deg,#120b06,#1d130b)',
  PLATE = 'inset 0 0 0 4px #1b120b,inset 0 0 0 5px rgba(196,154,84,.55)', CAP = 'inset 0 0 0 2px rgba(27,18,11,.9),inset 0 0 0 3px rgba(196,154,84,.32)',
  EMB = 'inset 0 1px 0 rgba(255,244,200,.85),inset 0 -3px 0 rgba(70,40,6,.55)', RING = 'conic-gradient(from 210deg,#ffe9a6,#c0892a 18%,#6b4510 38%,#f5d583 55%,#a8731d 75%,#ffe9a6)';
const INK = '#3a2a14', CREAM = '#f4e8cc', MUTE = '#c9b48a', GOLD = '#e0b255', RIM = '#8a6a3a', DARKB = '#4d300a';

// the level badge of the HUD (replaces the blue crystal hex): a brass hexagon, a leather field, a fine inner line — the number and the little gear are drawn by the HUD itself
export const badgeC = () => `<svg class="k-lvb" viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><defs><linearGradient id="kLb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5d583"/><stop offset=".54" stop-color="#c0892a"/><stop offset="1" stop-color="#8f6014"/></linearGradient>`
  + `<linearGradient id="kLb2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3622"/><stop offset="1" stop-color="#1b120b"/></linearGradient></defs>`
  + `<path d="M30 2.5L54.5 16.5v27L30 57.5 5.5 43.5v-27z" fill="url(#kLb1)" stroke="#2c1a05" stroke-width="1.6" stroke-linejoin="round"/>`
  + `<path d="M30 8.5L49.5 19.5v21L30 51.5 10.5 40.5v-21z" fill="url(#kLb2)" stroke="#2c1a05" stroke-width="1"/>`
  + `<path d="M30 11.8L46.7 21.4v17.2L30 48.2 13.3 38.6V21.4z" fill="none" stroke="rgba(224,178,85,.6)" stroke-width="1"/></svg>`;
export const gearC = () => `<svg class="k-lvg" viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="url(#kLb1)" stroke="#2c1a05" stroke-width="1.2"/><g fill="none" stroke="#2c1a05" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">`
  + `<circle cx="11" cy="11" r="2.8"/><path d="M11 4.3v2.1M11 15.6v2.1M4.3 11h2.1M15.6 11h2.1M6.3 6.3l1.5 1.5M14.2 14.2l1.5 1.5M15.7 6.3l-1.5 1.5M7.8 14.2l-1.5 1.5"/></g></svg>`;

export const KIT2_CSS = `
.bw-ui *{scrollbar-color:#8a6a3a #1b120b}
.bw-ui .bwu-body,.bw-ui .bwa-body,.bw-ui .bws-body,.bw-ui .bwk-body,.bw-ui .bw-body,.bw-ui .bwa-sheet,.bw-ui .bwh-pan{scrollbar-width:thin}
/* ---- top HUD: scrim, level badge, name plate, gem capsules, special gems */
.bw-ui .bw-top{background:linear-gradient(rgba(20,11,4,.6),rgba(20,11,4,0))}
.bw-ui .bw-lvl .k-lvb{display:block;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6))}
.bw-ui .bw-lvl .lvn{font:900 19px/1 ${DISPLAY};color:${CREAM};text-shadow:0 1px 0 #000,0 0 6px rgba(0,0,0,.85)}
.bw-ui .bw-lvl .gear{left:36px;top:36px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.bw-ui .bw-lvl:before{content:"";position:absolute;left:-8px;top:-8px;right:-8px;bottom:-8px}
.bw-ui .bw-who{background:${LEATHER};border:1px solid ${RIM};border-left:0;box-shadow:0 3px 9px rgba(0,0,0,.5),${CAP}}
.bw-ui .bw-who .nm{font-family:${DISPLAY};font-weight:900;letter-spacing:.6px;color:${CREAM};text-shadow:0 1px 0 #000}
.bw-ui .bw-who .sub{color:${GOLD}}
.bw-ui .bw-g{background:${LEATHER};border:1px solid ${RIM};box-shadow:0 3px 9px rgba(0,0,0,.5),${CAP}}
.bw-ui .bw-g .ct{color:${CREAM}}.bw-ui .bw-g .ct .num{text-shadow:0 1px 0 #000}
.bw-ui .bw-g .ct small{color:${MUTE}}
.bw-ui .bw-g .tk{background:#120b06;box-shadow:inset 0 0 0 1px rgba(196,154,84,.38)}
.bw-ui .bw-g.full{border-color:var(--gl)}
.bw-ui .bw-g.full:after{opacity:.5}
.bw-ui .bw-p{background:${LEATHER};border:1px solid ${RIM};box-shadow:0 3px 9px rgba(0,0,0,.5),${CAP}}
.bw-ui .bw-p:before{content:"";position:absolute;left:-8px;right:-4px;top:-10px;bottom:-10px}
.bw-ui .bw-p .ct{color:${CREAM}}
.bw-ui .bw-p[data-p="sap"]{border-color:#7f93d6}.bw-ui .bw-p[data-p="onyx"]{border-color:#b9b2a4}
.bw-ui .bw-toast{padding:11px 20px;border-radius:14px;background:${LEATHER};border:1px solid ${RIM};color:${CREAM};font-size:13.5px;box-shadow:${CAP},0 8px 22px rgba(0,0,0,.62)}
/* ---- the corner buttons (Kingdom / Army / Rank): brass ring, leather core; no gleam that runs forever */
.bw-ui .bwu-btn .ring{background:${RING};box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px #1b0f05}
.bw-ui .bwu-btn .core{background:radial-gradient(circle at 50% 28%,#5a4328,#2a1c10 62%,#140c06);box-shadow:inset 0 2px 6px rgba(255,226,160,.4),inset 0 -6px 12px rgba(0,0,0,.55)}
.bw-ui .bwu-btn.hot .ring{box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px #1b0f05,0 0 22px rgba(245,213,131,.85)}
.bw-ui .bwu-btn .core svg{color:${CREAM}}
.bw-ui .bwu-btn .lb,.bw-ui .bwa-btn .lb{font-family:${DISPLAY};color:${CREAM};text-shadow:0 1px 0 #140c06,1px 0 0 #140c06,-1px 0 0 #140c06,0 0 6px rgba(0,0,0,.85)}
.bw-ui .bwa-btn .ring{background:conic-gradient(from 0deg,#f5d583 calc(var(--p,0) * 1%),#1b120b 0);box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px #1b0f05}
.bw-ui .bwa-btn .ring:before{background:${RING}}
.bw-ui .bwa-btn .core{background:radial-gradient(circle at 50% 25%,#5a4328,#2a1c10 58%,#140c06);box-shadow:inset 0 2px 7px rgba(255,226,160,.4),inset 0 -6px 12px rgba(0,0,0,.6)}
.bw-ui .bwa-btn .core svg,.bw-ui .bwa-btn .core b{color:${CREAM}}
.bw-ui .bwa-btn.hot .ring{box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px #1b0f05,0 0 24px rgba(245,213,131,.85)}
.bw-ui .bwa-chip,.bw-ui .bwk-chip{height:44px;background:${LEATHER};border:1px solid ${RIM};color:${CREAM};box-shadow:${CAP},0 3px 10px rgba(0,0,0,.5)}
.bw-ui .bwa-chip i{color:#c5e58b}
/* ---- the Assist button (bottom right): brass bezel, leather core, a steady glow when something waits */
.bw-ui .bwh-btn .halo{background:radial-gradient(circle,rgba(245,213,131,.4) 0,rgba(196,134,42,.15) 46%,rgba(196,134,42,0) 70%);animation:none;opacity:.55}
.bw-ui .bwh-btn .bez{background:${RING};box-shadow:0 5px 14px rgba(0,0,0,.6),0 0 0 1.5px #1b0f05,inset 0 1px 1px rgba(255,244,200,.7)}
.bw-ui .bwh-btn .bez:after{animation:none;opacity:0}
.bw-ui .bwh-btn .core{background:radial-gradient(circle at 50% 28%,#5a4328,#2a1c10 58%,#140c06);box-shadow:inset 0 2px 6px rgba(255,226,160,.4),inset 0 -4px 8px rgba(0,0,0,.6),0 0 0 1px #1b0f05}
.bw-ui .bwh-btn .core:before{background:linear-gradient(rgba(255,240,200,.22),rgba(255,240,200,0))}
.bw-ui .bwh-btn .seal{animation:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.65))}
.bw-ui .bwh-btn .gem{background:radial-gradient(circle at 36% 30%,#fff,#ffe9a6 30%,#d49a2a 62%,#8f6014);box-shadow:0 0 0 1px #2c1a05,0 0 7px 1px rgba(245,213,131,.6)}
.bw-ui .bwh-btn .gem:after{animation:none;opacity:.35;background:radial-gradient(circle,rgba(255,233,166,.85),rgba(245,213,131,0) 70%)}
.bw-ui .bwh-btn.hot .pulse{animation:none;opacity:1;box-shadow:0 0 0 2px rgba(245,213,131,.95),0 0 14px rgba(245,213,131,.7)}
.bw-ui .bwh-btn:before{content:"";position:absolute;left:-6px;right:-6px;top:-6px;bottom:-6px}
/* ---- shared panel chrome: Army, Shop, Rank / Clan, Settings, Hub (the Kingdom page got it in round 1) */
.bw-ui .bwa,.bw-ui .bws,.bw-ui .bwk,.bw-ui .bw-set{background:rgba(12,6,2,.68)}
.bw-ui .bwh{background:radial-gradient(ellipse at 50% 46%,rgba(30,16,6,.5),rgba(10,5,2,.8))}
.bw-ui .bwa-pan,.bw-ui .bws-pan,.bw-ui .bwk-pan,.bw-ui .bw-panel,.bw-ui .bwh-pan{border-radius:18px;background:${LEATHER};border:1px solid ${RIM};box-shadow:${PLATE},0 20px 60px rgba(0,0,0,.72);color:${CREAM}}
.bw-ui .bwa-h .t b,.bw-ui .bws-h b,.bw-ui .bwk-h .t b,.bw-ui .bwh-h .tt b,.bw-ui .bw-ph .t{font-family:${DISPLAY};font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:${CREAM};text-shadow:none}
.bw-ui .bwk-h .t b{color:var(--lc,${CREAM})}
.bw-ui .bwk-h .t b{font-size:17px;letter-spacing:.4px}
.bw-ui .bwa-h .t span,.bw-ui .bwk-h .t span,.bw-ui .bwh-h .tt span{color:${MUTE}}
.bw-ui .bwk-h .t>span{display:block;line-height:1.45;font-size:12.5px}
.bw-ui .bwk-h .t>span{position:relative}
.bw-ui .bwk-h .t>span>svg{position:absolute;left:0;top:3px;margin:0}
.bw-ui .bwk-h .t>span>svg+b{margin-left:21px}
.bw-ui .bwk-h .t>span b{display:inline;font-family:inherit;font-size:14px;letter-spacing:0;text-transform:none;font-weight:700}
.bw-ui .bwk-h .t span.bwc-tag{display:inline-block;margin:0 6px 0 0;padding:1px 6px;font-size:11px;line-height:1.4;color:#2c1a05;vertical-align:1px}
.bw-ui .bwa-h .t span b{color:${GOLD}}
.bw-ui .bwa-x,.bw-ui .bws-x,.bw-ui .bwk-x,.bw-ui .bwh-x,.bw-ui .bwnav{flex:0 0 auto;width:44px;height:44px;border-radius:12px;background:${BTN};border:1px solid ${RIM};color:${CREAM};box-shadow:inset 0 1px 0 rgba(255,226,160,.22)}
.bw-ui .bwa-tabs,.bw-ui .bws-tabs,.bw-ui .bwk-tabs{background:rgba(0,0,0,.3);border:1px solid rgba(196,154,84,.32)}
.bw-ui .bwa-tabs button,.bw-ui .bws-tabs button,.bw-ui .bwk-tabs button{min-height:44px;color:${MUTE};font-family:${DISPLAY};font-weight:900}
.bw-ui .bwa-tabs button.on,.bw-ui .bws-tabs button.on,.bw-ui .bwk-tabs button.on{color:#2c1a05;background:${BRASS};border:1px solid ${DARKB};box-shadow:${EMB}}
.bw-ui .bwk-tabs button .dot{background:#9bd05a;box-shadow:none}
.bw-ui .bw-ph{border-bottom-color:rgba(196,154,84,.3)}
.bw-ui .bw-kd div{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.4)}
.bw-ui .bw-kd span{color:${GOLD}}.bw-ui .bw-kd b{color:${CREAM}}
.bw-ui .bw-tabs{border-bottom-color:rgba(196,154,84,.25)}
.bw-ui .bw-tabs{gap:4px}
.bw-ui .bw-tab{min-height:44px;padding:7px 9px;display:flex;align-items:center;color:${MUTE};background:rgba(255,226,160,.06)}
.bw-ui .bw-tab.on{color:#2c1a05;background:${BRASS};border-color:${DARKB};box-shadow:${EMB}}
/* ---- Settings */
.bw-ui .bw-row{border-bottom-color:rgba(196,154,84,.2)}
.bw-ui .bw-row .l{color:${CREAM}}.bw-ui .bw-row .v{color:${GOLD}}
.bw-ui .bw-row input[type=range]{height:44px;margin-top:0;background:linear-gradient(90deg,#c4872a var(--p,50%),rgba(255,226,160,.16) var(--p,50%)) center/100% 6px no-repeat}
.bw-ui .bw-row input[type=range]::-webkit-slider-thumb{width:26px;height:26px;background:radial-gradient(circle at 35% 30%,#fff3c4,#c0892a);border:2px solid #2c1a05}
.bw-ui .bw-row input[type=range]::-moz-range-thumb{width:24px;height:24px;background:#d49a2a;border:2px solid #2c1a05}
.bw-ui .bw-seg span{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;color:${CREAM};background:${BTN};border:1px solid ${RIM}}
.bw-ui .bw-seg span.on{color:#2c1a05;background:${BRASS};border-color:${DARKB};box-shadow:${EMB}}
.bw-ui .bw-tg{background:#1d130b;box-shadow:inset 0 0 0 1px ${RIM}}
.bw-ui .bw-tg:before{content:"";position:absolute;left:-6px;right:-6px;top:-9px;bottom:-9px}
.bw-ui .bw-tg::after{background:${MUTE}}
.bw-ui .bw-tg.on{background:linear-gradient(90deg,#8f6014,#e0b255)}.bw-ui .bw-tg.on::after{background:#2c1a05}
.bw-ui .bw-btnw{min-height:48px;border:1px solid ${RIM};background:${BTN};color:${CREAM}}
.bw-ui .bw-about h3{color:${GOLD};font-family:${DISPLAY}}.bw-ui .bw-about p{color:${MUTE}}
.bw-ui .bw-cred{color:${MUTE}}.bw-ui .bw-cred b{color:${GOLD}}.bw-ui .bw-cred .lc{color:#a8926a}.bw-ui .bw-cred h4{color:${GOLD}}
.bw-ui .bw-cred div{border-bottom-color:rgba(196,154,84,.18)}
/* ---- Hub */
.bw-ui .bwh-pan:before{background:linear-gradient(90deg,rgba(245,213,131,0),rgba(245,213,131,.9),rgba(245,213,131,0));background-size:100% 100%;background-position:0 0}
.bw-ui .bwh.on .bwh-pan:before{animation:none}
.bw-ui .bwh-sep{background:linear-gradient(90deg,rgba(196,154,84,0),rgba(196,154,84,.65),rgba(196,154,84,0))}
.bw-ui .bwh-a{min-height:80px;background:${BRASS};border:1px solid ${DARKB};color:#2c1a05;box-shadow:${EMB},0 4px 10px rgba(0,0,0,.45)}
.bw-ui .bwh-a:after{display:none}.bw-ui .bwh.on .bwh-a.hot:after{animation:none}
.bw-ui .bwh-a .bz{background:${RING}}
.bw-ui .bwh-a .ring{background:conic-gradient(from 0deg,#ffe9a6 calc(var(--p,0) * 1%),#1b120b 0);box-shadow:0 0 0 1.5px #1b0f05}
.bw-ui .bwh-a .core{background:radial-gradient(circle at 50% 24%,#5a4328,#2a1c10 62%,#140c06);box-shadow:inset 0 2px 6px rgba(255,226,160,.4)}
.bw-ui .bwh-a .tx b{font-family:${DISPLAY};font-weight:900;color:#2c1a05;text-shadow:0 1px 0 rgba(255,244,200,.55)}
.bw-ui .bwh-a .tx small{color:${DARKB}}.bw-ui .bwh-a .ch{color:#2c1a05;opacity:1}
.bw-ui .bwh-a.hot{background:${BRASS2};border-color:#2c1a05;box-shadow:${EMB},0 0 0 2px rgba(255,240,190,.9),0 4px 14px rgba(0,0,0,.5)}
.bw-ui .bwh.on .bwh-a.hot .core:after{animation:none;opacity:.55;box-shadow:inset 0 0 12px 1px rgba(255,226,160,.9)}
.bw-ui .bwh-t{background:${LEATHER2};border:1px solid ${RIM};box-shadow:inset 0 1px 0 rgba(255,226,160,.2),0 3px 8px rgba(0,0,0,.4)}
.bw-ui .bwh-t:active{border-color:#f5d583}
.bw-ui .bwh-t .ic{background:${RING}}
.bw-ui .bwh-t .ic>i{color:${CREAM};background:radial-gradient(circle at 50% 26%,#5a4328,#2a1c10 60%,#140c06);box-shadow:inset 0 2px 5px rgba(255,226,160,.3)}
.bw-ui .bwh-t .ic .gem3{filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.bw-ui .bwh-t b{color:${CREAM}}.bw-ui .bwh-t small{font-size:11px;color:${MUTE}}
/* ---- Army */
.bw-ui .bwa-em:after{background:${BRASS};border-color:${DARKB};color:#2c1a05}
.bw-ui .bwa-hs .r{color:${MUTE}}.bw-ui .bwa-hs .r b{color:${CREAM}}.bw-ui .bwa-hs .r em{color:#c5e58b}
.bw-ui .bwa-bar{background:#120b06;border-color:rgba(196,154,84,.5)}
.bw-ui .bwa-bar i{background:linear-gradient(90deg,#c4872a,#f5d583);box-shadow:none}
.bw-ui .bwa-bar i.q{background:repeating-linear-gradient(45deg,#8f6014,#8f6014 5px,#6b4510 5px,#6b4510 10px);opacity:1}
.bw-ui .bwa-ft{background:linear-gradient(0deg,#1b120b 60%,rgba(27,18,11,0))}
.bw-ui .bwa-ft button{min-height:56px;border:1px solid #2c0a06;background:${WAR};color:#fff1d6;font-family:${DISPLAY};font-weight:900;box-shadow:inset 0 1px 0 rgba(255,214,190,.45),inset 0 -3px 0 rgba(60,8,4,.6),0 4px 12px rgba(0,0,0,.45)}
.bw-ui .bwa-sec{color:${GOLD}}
.bw-ui .bwa-lane{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.42)}
.bw-ui .bwa-lane .hd,.bw-ui .bwa-lane .hd b{color:${CREAM}}.bw-ui .bwa-lane .hd .tm{color:${GOLD}}
.bw-ui .bwa-lane .rush{min-height:44px;padding:0 14px;border:1px solid ${DARKB};background:${BRASS2};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bwa-lane .mi{background:#1b120b;border-color:${RIM}}
.bw-ui .bwa-lane .mi:first-child{border-color:#f5d583;box-shadow:0 0 0 2px rgba(245,213,131,.3),0 0 10px rgba(245,213,131,.45)}
.bw-ui .bwa-lane .mi .nn{background:${BRASS};border-color:${DARKB};color:#2c1a05;text-shadow:none}
.bw-ui .bwa-lane .mi svg{color:${CREAM}}
.bw-ui .bwa-lane .hint{color:${MUTE};font-size:11px}
.bw-ui .bwa-c{background:${PARCH};border:2px solid var(--rc,${RIM});box-shadow:0 0 0 1px #2c1a05,0 3px 9px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,250,225,.7)}
.bw-ui .bwa-c .pic{background:radial-gradient(circle at 50% 30%,#5a4328,#1b120b 82%);box-shadow:inset 0 0 0 1px rgba(58,42,20,.7)}
.bw-ui .bwa-c.sp .pic{background:radial-gradient(circle at 50% 35%,#4a3622,#140c06)}
.bw-ui .bwa-c b.nm{color:${INK}}
.bw-ui .bwa-c .cs{color:${INK}}.bw-ui .bwa-c .cs span.no{color:#8a1226}
/* mother (AR1 merge): the soldier card's stat row + train time were light-on-navy; on the parchment panel they need ink */
.bw-ui .bwa-c.u .sr{color:${INK}}.bw-ui .bwa-c.u .sr svg{opacity:1}.bw-ui .bwa-c.u .cs .tm{color:#6b4a12}
.bw-ui .bwa-c .own{background:#2a1c10;border-color:${RIM};color:${CREAM}}
.bw-ui .bwa-c .qd{background:${BRASS};border-color:${DARKB};color:#2c1a05;text-shadow:none}
.bw-ui .bwa-c .gdb{background:#2a1c10;border-color:${GOLD};color:${CREAM}}
/* mother (AR1 merge): the card's info button is AR1's round 'i' (44x44 hit area, bottom-right of the picture) — UI1-R2's dark box + top move removed */
.bw-ui .bwa-c .rt{font-size:10px;letter-spacing:1px}.bw-ui .bws-tag{font-size:10px}.bw-ui .bwu-tab small{font-size:11px}
.bw-ui .bwu-cat{position:relative}.bw-ui .bwu-cat:before{content:"";position:absolute;left:-3px;right:-3px;top:-10px;bottom:-10px}.bw-ui .bwa-c .qd{top:32px}
.bw-ui .bwa-note{color:${MUTE}}
.bw-ui .bwa-ov{background:rgba(12,6,2,.74)}
.bw-ui .bwa-sheet{background:${LEATHER};border:1px solid ${RIM};box-shadow:${PLATE},0 18px 50px rgba(0,0,0,.72);color:${CREAM}}
.bw-ui .bwa-sheet h3{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.8px;color:${CREAM}}
.bw-ui .bwa-sheet p{color:${MUTE}}
.bw-ui .bwa-sheet .big{border-color:${GOLD};background:radial-gradient(circle at 50% 30%,#5a4328,#140c06);color:${CREAM}}
.bw-ui .bwa-sheet .st span{background:rgba(255,226,160,.08);border-color:rgba(196,154,84,.42);color:${CREAM}}
.bw-ui .bwa-gd{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.42);color:${CREAM}}
.bw-ui .bwa-gd>b,.bw-ui .bwa-gd.off span,.bw-ui .bwa-gd small{color:${MUTE}}
.bw-ui .bwa-gd button{width:44px;height:44px;border:1px solid ${DARKB};background:${BRASS};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bwa-emg button{min-height:44px;border-color:rgba(196,154,84,.35);background:radial-gradient(circle at 50% 30%,rgba(90,67,40,.7),rgba(20,12,6,.9))}
.bw-ui .bwa-emg{grid-template-columns:repeat(4,minmax(0,1fr))}.bw-ui .bwa-emg button>*{max-width:100%;height:auto}
.bw-ui .bwa-emg button.on{border-color:#f5d583;box-shadow:0 0 0 2px rgba(245,213,131,.4),0 0 12px rgba(245,213,131,.5)}
/* ---- Shop */
.bw-ui .bws-bal span{background:${LEATHER};border-color:${RIM};color:${CREAM};box-shadow:${CAP}}
.bw-ui .bws-bal span.s{border-color:#7f93d6}.bw-ui .bws-bal span.o{background:${LEATHER};border-color:#b9b2a4}
.bw-ui .bws-note{color:${MUTE}}.bw-ui .bws-note b{color:${CREAM}}
.bw-ui .bws-sm{color:${MUTE}}
.bw-ui .bws-c .bws-note,.bw-ui .bws-how .bws-sm{color:#5a4524}.bw-ui .bws-c .bws-note b{color:${INK}}
.bw-ui .bws-c{background:${PARCH};border:1px solid ${RIM};box-shadow:0 0 0 1px #2c1a05,0 3px 9px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,250,225,.7)}
.bw-ui .bws-c.gold{border-color:#c0892a;box-shadow:0 0 0 1px #2c1a05,0 0 0 3px rgba(245,213,131,.55),0 3px 9px rgba(0,0,0,.45)}
.bw-ui .bws-c .nm b{color:${INK}}.bw-ui .bws-c .nm small{font-size:11px;color:#6d5636}
.bw-ui .bws-c .art{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.bw-ui .bws-on{color:#10200a;background:linear-gradient(180deg,#a9c970,#5f7f2c);box-shadow:none}
.bw-ui .bws-tag{color:#2c1a05;background:${BRASS};border-color:${DARKB}}
.bw-ui .bws-seg button{min-height:44px;height:44px;border:1px solid #2c1a05;background:${BTN};color:${CREAM}}
.bw-ui .bws-seg button.on{color:#2c1a05;background:${BRASS};border-color:${DARKB};box-shadow:${EMB}}
.bw-ui .bws-row .sp{color:#6d5636}
.bw-ui .bws-buy{min-height:44px;height:44px;border:1px solid ${DARKB};background:${BRASS};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bws-buy.ok{background:${BRASS2};border-color:#2c1a05;box-shadow:${EMB},0 0 0 2px #fff0bf}
.bw-ui .bws-buy.dim{opacity:.6;filter:grayscale(.35)}
.bw-ui .bws-done{color:#10200a;border-color:#5f7f2c;background:linear-gradient(180deg,#a9c970,#5f7f2c)}
.bw-ui .bws-how{background:${PARCH};border:1px solid ${RIM};box-shadow:0 0 0 1px #2c1a05,0 3px 9px rgba(0,0,0,.45)}
.bw-ui .bws-how b{color:${INK}}.bw-ui .bws-how ol{color:${INK}}.bw-ui .bws-how ol em{color:#8f6014}
.bw-ui .bws-rt{border-bottom-color:rgba(58,42,20,.25);color:${INK}}
.bw-ui .bws-rt .ar{color:#8f6014}.bw-ui .bws-rt .sr,.bw-ui .bws-rt .ds{color:${INK}}
.bw-ui .bws-rt.hl{background:rgba(192,137,42,.22)}
/* ---- Rank / Clan / Friends / Log */
.bw-ui .bwk-pg .r{color:${MUTE}}.bw-ui .bwk-pg .r b{color:${CREAM}}
.bw-ui .bwk-bar{background:#120b06;border-color:rgba(196,154,84,.5)}
.bw-ui .bwk-bar i{background:linear-gradient(90deg,#c4872a,#f5d583);box-shadow:none}
.bw-ui .bwk-row{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.38);color:${CREAM}}
.bw-ui .bwk-row.me{border-color:#f5d583;background:rgba(245,213,131,.16);box-shadow:0 0 0 1px #f5d583}
.bw-ui .bwk-row .rk{color:${MUTE}}
.bw-ui .bwk-row .rk.m{color:var(--mc);text-shadow:0 1px 0 #000}
.bw-ui .bwk-row .nm b,.bw-ui .bwk-row .tp{color:${CREAM}}.bw-ui .bwk-row .nm span{color:${MUTE}}.bw-ui .bwk-row .tp svg{color:${GOLD}}
.bw-ui .bwk-row.cur{border-color:var(--lc);box-shadow:0 0 0 1px var(--lc)}
.bw-ui .bwk-row[style*="#43e0ff"] .rk.m{color:#f2c75c}
.bw-ui .bwk-row[style*="#dbe8f7"] .rk.m{color:#dfe3e8}
.bw-ui .bwk-row[style*="#8fa6c4"] .rk.m{color:#cf9460}
.bw-ui .bwk-pan .bwk-h{gap:10px}
.bw-ui .bwk-pan .bwk-h .bd,.bw-ui .bwk-pan .bwk-h .bd .lgb{width:48px}
.bw-ui .bwk-gap{color:#a8926a}.bw-ui .bwk-empty{color:${MUTE}}
.bw-ui .bwk-how{background:rgba(0,0,0,.28);border-color:rgba(196,154,84,.35);color:${MUTE}}.bw-ui .bwk-how b{color:${CREAM}}
.bw-ui .bwk-inv h3{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.8px;color:${CREAM}}.bw-ui .bwk-inv p{color:${MUTE}}
.bw-ui .bwk-inv .pay{background:${BRASS};border:1px solid ${DARKB};color:#2c1a05;box-shadow:${EMB}}.bw-ui .bwk-inv .pay small{color:${DARKB}}
.bw-ui .bwk-inv .stp li{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.38);color:${CREAM}}
.bw-ui .bwk-inv .stp i{background:${BRASS};border-color:${DARKB};color:#2c1a05}
.bw-ui .bwk-inv .st,.bw-ui .bwk-inv .st b{color:${MUTE}}
.bw-ui .bwk-lk input,.bw-ui .bwc-in input{min-height:44px;background:${WELL};border:1px solid ${RIM};color:${CREAM}}
.bw-ui .bwk-lk button,.bw-ui .bwk-sh,.bw-ui .bwc-btn,.bw-ui .bwc-row .go,.bw-ui .bwc-inv button{min-height:44px;border:1px solid ${DARKB};background:${BRASS};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bwk-sh,.bw-ui .bwc-btn{min-height:52px;font-family:${DISPLAY};font-weight:900}
.bw-ui .bwc-btn.sec,.bw-ui .bwc-btn.dng,.bw-ui .bwc-row .go.x{background:${BTN};border-color:${RIM};color:${CREAM};box-shadow:none}
.bw-ui .bwc-row .go.x{min-width:44px}
.bw-ui .bwc-row{gap:8px}
.bw-ui .bwc-row .nm span{text-transform:none;letter-spacing:.2px;font-size:11.5px}
.bw-ui .bwc-row .nm b{font-size:14px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.2;overflow-wrap:anywhere}
.bw-ui .bwc-row .tp{font-size:13.5px;gap:3px}
.bw-ui .bwc-row .go{padding:8px 10px}
.bw-ui .bwc-tag{color:#2c1a05;background:${BRASS};border-color:${DARKB}}
.bw-ui .bwc-h3{color:${GOLD}}
.bw-ui .bwc-card{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.42)}
.bw-ui .bwc-card .top b,.bw-ui .bwc-card .sub b{color:${CREAM}}.bw-ui .bwc-card .sub{color:${MUTE}}
.bw-ui .bwc-lg{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.35)}
.bw-ui .bwc-lg:before{background:${GOLD}}.bw-ui .bwc-lg.d:before{background:#8a7a5a}
.bw-ui .bwc-lg.new{border-color:#f5d583;box-shadow:0 0 0 1px #f5d583}
.bw-ui .bwc-lg .ic{color:${GOLD}}.bw-ui .bwc-lg.d .ic{color:#a8926a}
.bw-ui .bwc-lg .mid b,.bw-ui .bwc-lg .rt{color:${CREAM}}.bw-ui .bwc-lg .mid span,.bw-ui .bwc-lg .rt small{color:${MUTE}}
.bw-ui .bwc-inv{background:rgba(0,0,0,.28);border-color:rgba(196,154,84,.4)}
.bw-ui .bwc-inv .t{color:${MUTE}}.bw-ui .bwc-inv .t b{color:${CREAM}}
.bw-ui .bwc-ok{color:#c5e58b}.bw-ui .bwc-wait{color:${MUTE}}.bw-ui .bwc-err{color:#f0b890}
.bw-ui .bwc-row .nm span i.bwc-ok{color:#c5e58b}.bw-ui .bwc-row .nm span i.bwc-wait{color:${MUTE}}
.bw-ui .bwc-row svg path[fill="#43e0ff"]{fill:${GOLD};stroke:#6a4a10}
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
.bw-ui .bwa-pan .bwa-tabs,.bw-ui .bws-pan .bws-tabs,.bw-ui .bwk-pan .bwk-tabs{margin-top:6px}
.bw-ui .bwa-pan .bwa-ft{padding:5px 12px 8px}
.bw-ui .bwa-pan .bwa-ft button{min-height:44px;padding:8px}
.bw-ui .bws-pan .bws-h{padding:7px 12px 4px 16px}
.bw-ui .bwk-pan .bwk-h{padding:7px 12px 3px 14px;gap:10px}
.bw-ui .bwk-pan .bwk-h .bd,.bw-ui .bwk-pan .bwk-h .bd .lgb{width:46px}
.bw-ui .bw-panel .bw-ph{padding:7px 16px 6px}
.bw-ui .bw-panel .bw-kd{padding:6px 16px 0}
.bw-ui .bw-panel .bw-kd div{padding:4px 10px}
.bw-ui .bw-panel .bw-tabs{padding:6px 12px}
}
`;
export function injectKit2() { if (typeof document === 'undefined' || document.getElementById('k-kit2')) return; const st = document.createElement('style'); st.id = 'k-kit2'; st.textContent = KIT2_CSS; document.head.appendChild(st); }
