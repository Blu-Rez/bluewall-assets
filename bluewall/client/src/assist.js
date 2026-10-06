// Home controls. The HUD has exactly ONE button: Assist (a medium circle, bottom right, no text beside it).
// Everything else is inside the hub it opens: a wide ATTACK tile on top (the crossed swords + a ring that fills with how
// ready the army is), then tiles — Build (free builders / next finish), Army (training / ready %), Shop, Rank, Clan, Friends,
// Log, Settings, Banner. Nothing else sits on the home screen.
// It only calls the other panels (upgradeui / armyui / rankui / socialui); none of their logic lives here.
// Navigation (p22): a panel opened from the hub gets a "‹" back button in its header that returns to the hub, and Telegram's own
// Back button (top-left in the Mini App) is live whenever the hub or a panel is open: hub -> map, panel -> hub (or map if opened directly).
//   createAssist(mount, { econ, ui, audio, army, upgrade, rank, social, shop, tg }) -> { update(), openHub(), closeHub(), back() }
import { icon } from './armyui.js';
import { crestImg } from './emblems.js';
import { BASE } from './assets.js';
import { leagueBadge, leagueIdx } from './cups.js';
import { attackLogo } from './logos.js';
import { GEMS } from './ui.js';

const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const fmtT = (s) => { s = Math.max(0, Math.ceil(s)); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), q = s % 60; return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + String(m).padStart(2, '0') + 'm' : m + ':' + String(q).padStart(2, '0'); };
const I = (d, sz = 28) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
  clan: '<path d="M12 3l7.5 2.6v5.6c0 4.6-3.2 8.2-7.5 9.8-4.3-1.6-7.5-5.2-7.5-9.8V5.6z"/><path d="M8.5 11.5l3.5 3 3.5-3"/>',
  friends: '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.8 20c.6-3.6 3.2-5.6 6.2-5.6s5.6 2 6.2 5.6"/><path d="M18 6.5v6M15 9.5h6"/>',
  log: '<path d="M6 3.5h9.5l3.5 3.5v13.5H6z"/><path d="M9 11h7M9 14.5h7M9 18h4"/>',
  set: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>',
  flag: '<path d="M6 21V4"/><path d="M6 5h11l-2.4 3.6L17 12H6"/>',
};

const CSS = `
/* ---- the Assist button: a forged steel bezel with a turning light, an enamelled core and the royal star seal; it breathes softly and pulses when something waits */
.bwh-btn{pointer-events:auto;position:absolute;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;transition:opacity .6s,transform .15s}
.bw-ui.wel>.bwh-btn{opacity:0;pointer-events:none}
.bwh-btn{right:calc(12px + var(--sr));bottom:calc(var(--sb) + 14px);width:58px;height:58px;cursor:pointer}
.bwh-btn:active{transform:scale(.92)}
.bwh-btn .halo{position:absolute;left:-12px;top:-12px;width:82px;height:82px;border-radius:50%;background:radial-gradient(circle,rgba(120,205,255,.42) 0,rgba(70,150,255,.16) 46%,rgba(40,110,255,0) 70%);pointer-events:none;will-change:opacity,transform;animation:bwhBr 4.2s ease-in-out infinite}
@keyframes bwhBr{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:.9;transform:scale(1.04)}}
.bwh-btn .bez{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,#f4f9ff,#93a9c6 16%,#33476a 34%,#dfeaf8 52%,#6b82a6 70%,#c9d8ec 86%,#f4f9ff);box-shadow:0 5px 14px rgba(0,0,0,.6),0 0 0 1.5px #01060f,inset 0 1px 1px rgba(255,255,255,.7)}
.bwh-btn .bez:after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0 64%,rgba(255,255,255,.95) 72%,rgba(190,235,255,.4) 76%,rgba(255,255,255,0) 84%);-webkit-mask:radial-gradient(circle,transparent 24.5px,#000 25.5px);mask:radial-gradient(circle,transparent 24.5px,#000 25.5px);will-change:transform;animation:bwhSp 7s linear infinite}
@keyframes bwhSp{to{transform:rotate(360deg)}}
.bwh-btn .core{position:absolute;inset:4px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 28%,#3d6db3,#0d2858 58%,#040d24);box-shadow:inset 0 2px 6px rgba(170,215,255,.45),inset 0 -4px 8px rgba(0,0,0,.6),0 0 0 1px #020a1c}
.bwh-btn .core:before{content:"";position:absolute;left:8%;right:8%;top:4%;height:44%;border-radius:50% 50% 45% 45%;background:linear-gradient(rgba(255,255,255,.28),rgba(255,255,255,0));pointer-events:none}
.bwh-btn .ico{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.7));pointer-events:none}
.bwh-btn .seal{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.65)) drop-shadow(0 0 5px rgba(120,210,255,.45));will-change:transform;animation:bwhSl 24s linear infinite}
@keyframes bwhSl{to{transform:rotate(45deg)}}
.bwh-btn .gem{position:absolute;left:50%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#ffffff 0,#bdf0ff 22%,#47b4ff 52%,#0d4fb8 82%,#05275f);box-shadow:0 0 0 1px #02122e,0 0 7px 1px rgba(110,210,255,.6)}
.bwh-btn .gem:after{content:"";position:absolute;left:-7px;top:-7px;right:-7px;bottom:-7px;border-radius:50%;background:radial-gradient(circle,rgba(170,235,255,.85),rgba(90,190,255,0) 70%);opacity:.3;will-change:opacity;animation:bwhGm 3.1s ease-in-out infinite}
@keyframes bwhGm{0%,100%{opacity:.25}50%{opacity:1}}
.bwh-btn .pulse{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px rgba(150,230,255,.9);opacity:0;pointer-events:none}
.bwh-btn.hot .pulse{will-change:transform,opacity;animation:bwhPu 2.4s ease-out infinite}
@keyframes bwhPu{0%{opacity:.9;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.55)}}
.bwh-btn.tap .core{animation:bwhTp .45s ease-out}
@keyframes bwhTp{0%{filter:brightness(1.9)}100%{filter:brightness(1)}}
.bwh-btn .bd{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;background:linear-gradient(#7dffb5,#12a85a);border:1.5px solid #01220f;color:#031a0e;font-size:10.5px;font-weight:700;line-height:17px;text-align:center;font-variant-numeric:tabular-nums;z-index:2}
.bwh-btn .bd:empty{display:none}
@media (prefers-reduced-motion:reduce){.bwh-btn .halo,.bwh-btn .bez:after,.bwh-btn .seal,.bwh-btn .gem,.bwh-btn.hot .pulse{animation:none}}
/* the wide ATTACK tile at the top of the hub */
.bwh-a{position:relative;display:flex;align-items:center;gap:12px;margin:0 0 10px;padding:7px 14px 7px 9px;border-radius:17px;cursor:pointer;color:#eaf6ff;overflow:hidden;background:linear-gradient(180deg,rgba(70,146,246,.42),rgba(8,28,70,.7));border:1px solid rgba(150,215,255,.6);box-shadow:inset 0 1px 0 rgba(200,232,255,.32),0 4px 14px rgba(0,0,0,.4);transition:transform .12s,filter .2s}
.bwh-a:active{transform:scale(.97)}
.bwh-a:after{content:"";position:absolute;top:0;bottom:0;left:-40%;width:34%;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(210,240,255,.22),rgba(255,255,255,0));transform:skewX(-18deg) translateX(0);pointer-events:none;opacity:0}
.bwh.on .bwh-a.hot:after{opacity:1;will-change:transform;animation:bwhSw 3.4s ease-in-out .6s infinite}
@keyframes bwhSw{0%{transform:skewX(-18deg) translateX(0)}55%,100%{transform:skewX(-18deg) translateX(460%)}}
.bwh-a .bz{flex:0 0 auto;width:64px;height:64px;padding:3px;box-sizing:border-box;border-radius:50%;background:conic-gradient(from 200deg,#f2f7ff,#8aa0bd 20%,#3a4d6e 40%,#d6e4f5 58%,#6d83a6 78%,#f2f7ff);box-shadow:0 3px 9px rgba(0,0,0,.5)}
.bwh-a .ring{position:relative;width:58px;height:58px;border-radius:50%;background:conic-gradient(from 0deg,#8fe8ff calc(var(--p,0) * 1%),#0a1c3e 0);box-shadow:0 0 0 1.5px #01060f}
.bwh-a .core{position:absolute;left:5px;top:5px;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 50% 24%,#35609f,#0b1f4a 62%,#030a1c);box-shadow:inset 0 2px 6px rgba(170,215,255,.4);overflow:hidden}
.bwh-a .core svg{position:absolute;left:50%;top:50%;margin:-30px 0 0 -26px;width:52px;height:52px;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6));pointer-events:none}
.bwh-a .tx{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.bwh-a .tx b{font-size:17px;letter-spacing:2.5px;text-transform:uppercase;color:#fff;line-height:20px;text-shadow:0 0 10px rgba(130,210,255,.55)}
.bwh-a .tx small{font-size:12px;color:#a9d4ff;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bwh-a .ch{flex:0 0 auto;width:22px;height:22px;color:#bfe6ff;opacity:.9}
.bwh-a.hot{border-color:#8fe8ff}
.bwh.on .bwh-a.hot .core:after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 14px 1px rgba(140,225,255,.95);opacity:0;will-change:opacity;pointer-events:none;animation:bwhGl 2.6s ease-in-out infinite}
@keyframes bwhGl{0%,100%{opacity:0}50%{opacity:1}}
.bwh-a.off{filter:grayscale(.55) brightness(.85)}
/* ---- the hub: a royal panel (steel-rimmed, enamel-dark, a light running along its top edge), the realm's crest in the header, medallion tiles that rise in one after another */
.bwh{position:absolute;inset:0;pointer-events:auto;z-index:12;background:radial-gradient(ellipse at 50% 46%,rgba(4,16,44,.5),rgba(0,3,10,.78));opacity:0;visibility:hidden;transition:opacity .22s,visibility .22s;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;-webkit-tap-highlight-color:transparent}
.bwh.on{opacity:1;visibility:visible}.bwh *{box-sizing:border-box}
.bwh-pan{position:absolute;left:50%;top:50%;width:min(344px,calc(100% - 32px - var(--sl) - var(--sr)));transform:translate(-50%,-46%) scale(.96);padding:12px 12px 14px;border-radius:24px;border:1.5px solid transparent;background:linear-gradient(180deg,#0f3068,#061331 38%,#020814) padding-box,conic-gradient(from 180deg,#dfeaf8,#5b7398 18%,#22324f 34%,#a9bedb 52%,#3b5072 70%,#c7d6ea 86%,#dfeaf8) border-box;box-shadow:0 22px 60px rgba(0,0,0,.75),inset 0 1px 0 rgba(200,230,255,.28),inset 0 0 40px rgba(60,130,255,.08);transition:transform .28s cubic-bezier(.2,.9,.25,1.1)}
.bwh-pan:before{content:"";position:absolute;left:18px;right:18px;top:-1px;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(140,220,255,0),rgba(200,240,255,.95),rgba(140,220,255,0));background-size:50% 100%;background-repeat:no-repeat;background-position:-60% 0;pointer-events:none}
.bwh.on .bwh-pan:before{animation:bwhEd 4.5s ease-in-out .3s infinite}
@keyframes bwhEd{0%{background-position:-60% 0}60%,100%{background-position:160% 0}}
.bwh.on .bwh-pan{transform:translate(-50%,-50%)}
.bwh-h{display:flex;align-items:center;gap:10px;padding:0 2px 10px}
.bwh-h .cr{flex:0 0 auto;width:36px;height:40px;display:grid;place-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}.bwh-h .cr img{width:34px;height:auto}
.bwh-h .tt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.bwh-h .tt b{font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#f2f9ff;text-shadow:0 0 12px rgba(120,200,255,.45)}
.bwh-h .tt span{font-size:11px;letter-spacing:.6px;color:#8fb4e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bwh-x{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(150,200,255,.28);font-size:13px;cursor:pointer}
.bwh-x:active{transform:scale(.9)}
.bwh-sep{height:1px;margin:0 6px 10px;background:linear-gradient(90deg,rgba(140,200,255,0),rgba(160,215,255,.55),rgba(140,200,255,0))}
.bwh-g{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.bwh-t{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;padding:8px 2px 7px;min-height:92px;border-radius:16px;cursor:pointer;color:#cfe6ff;background:linear-gradient(180deg,rgba(58,120,214,.26),rgba(8,26,64,.55));border:1px solid rgba(140,205,255,.3);box-shadow:inset 0 1px 0 rgba(190,225,255,.16);transition:transform .12s,border-color .2s}
.bwh-t:active{transform:scale(.93);border-color:rgba(170,225,255,.75)}
.bwh.on .bwh-t,.bwh.on .bwh-a{animation:bwhIn .34s cubic-bezier(.2,.85,.25,1.08) both;animation-delay:calc(var(--i,0) * 26ms)}
@keyframes bwhIn{from{opacity:0;transform:translateY(10px) scale(.94)}to{opacity:1;transform:none}}
.bwh-t .ic{position:relative;width:46px;height:46px;border-radius:50%;padding:2.5px;background:conic-gradient(from 210deg,#eef5ff,#8297b6 20%,#2c3d5d 40%,#cfdcef 58%,#5e7598 78%,#eef5ff);box-shadow:0 3px 8px rgba(0,0,0,.5)}
.bwh-t .ic>i{position:absolute;inset:2.5px;border-radius:50%;display:grid;place-items:center;color:#c9ecff;background:radial-gradient(circle at 50% 26%,#2f5c9e,#0b2049 60%,#040c22);box-shadow:inset 0 2px 5px rgba(170,215,255,.35)}
.bwh-t .ic svg{width:25px;height:25px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}
.bwh-t .ic img{width:34px;height:34px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.65))}
.bwh-t .ic .lgb{width:26px;height:auto}.bwh-t .ic .gem3{width:30px;height:30px;filter:drop-shadow(0 0 6px rgba(110,150,255,.7))}.bwh-t .ic img{width:27px;height:auto}
.bwh-t b{font-size:11.5px;letter-spacing:.4px;color:#eaf6ff;font-weight:700}
.bwh-t small{font-size:10.5px;color:#8fb4e0;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bwh-t .bd{position:absolute;right:-3px;top:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:linear-gradient(#7dffb5,#12a85a);border:1.5px solid #01220f;color:#031a0e;font-size:10.5px;font-weight:700;line-height:17px;text-align:center}.bwh-t .bd:empty{display:none}
@media (prefers-reduced-motion:reduce){.bwh.on .bwh-t,.bwh.on .bwh-a,.bwh.on .bwh-pan:before,.bwh.on .bwh-a.hot:after{animation:none}}
@media (orientation:landscape) and (max-height:560px){.bwh-pan{width:min(520px,calc(100% - 40px - var(--sl) - var(--sr)));padding:9px 12px 10px}.bwh-h{padding-bottom:6px}.bwh-sep{margin-bottom:7px}.bwh-g{grid-template-columns:repeat(5,1fr);gap:7px}.bwh-t{min-height:80px;padding-top:6px}.bwh-t .ic{width:40px;height:40px}.bwh-t small{font-size:10px}.bwh-a{margin-bottom:7px;padding:4px 14px 4px 8px}.bwh-a .bz{transform:scale(.82);margin:-6px -4px -6px -6px}}
/* the "‹" back button the hub puts into a panel it opened (returns to the hub) */
.bwnav{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#dff2ff;background:linear-gradient(180deg,rgba(90,160,255,.28),rgba(20,50,110,.35));border:1px solid rgba(150,210,255,.45);box-shadow:inset 0 1px 0 rgba(200,232,255,.25);-webkit-tap-highlight-color:transparent}
.bwnav:active{transform:scale(.9)}.bwnav svg{width:18px;height:18px}
.bw-ui .bwa-btn,.bw-ui .bwa-chip,.bw-ui .bwu-btn,.bw-ui .bwk-chip{display:none!important}
`;

// the royal seal on the Assist button: an eight-point star (two squares) in forged steel, an inner navy star, four sparks
const SEAL = `<svg class="seal" viewBox="0 0 40 40"><defs><linearGradient id="bwhS1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c4dbf3"/><stop offset="1" stop-color="#6684b0"/></linearGradient>`
  + `<linearGradient id="bwhS2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4a8e"/><stop offset="1" stop-color="#06173a"/></linearGradient></defs>`
  + `<path d="M20 3.2L24.4 9.4 31.9 8.1 30.6 15.6 36.8 20 30.6 24.4 31.9 31.9 24.4 30.6 20 36.8 15.6 30.6 8.1 31.9 9.4 24.4 3.2 20 9.4 15.6 8.1 8.1 15.6 9.4Z" fill="url(#bwhS1)" stroke="#0a1a3a" stroke-width=".9" stroke-linejoin="round"/>`
  + `<path d="M20 9.6L22.6 13.7 27.4 12.6 26.3 17.4 30.4 20 26.3 22.6 27.4 27.4 22.6 26.3 20 30.4 17.4 26.3 12.6 27.4 13.7 22.6 9.6 20 13.7 17.4 12.6 12.6 17.4 13.7Z" fill="url(#bwhS2)" stroke="#9fd0ff" stroke-width=".5" stroke-opacity=".6"/>`
  + `<g fill="#e9f8ff"><circle cx="20" cy="5.6" r=".9"/><circle cx="34.4" cy="20" r=".9"/><circle cx="20" cy="34.4" r=".9"/><circle cx="5.6" cy="20" r=".9"/></g></svg>`;
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const CHEV = '<svg class="ch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createAssist(mount, { econ, ui, audio, army, upgrade, rank, social, shop, tg = null } = {}) {
  const host = (ui && ui.root) || mount;
  const stEl = document.createElement('style'); stEl.textContent = CSS; document.head.appendChild(stEl);
  const btn = document.createElement('div'); btn.className = 'bwh-btn'; btn.setAttribute('role', 'button'); btn.setAttribute('aria-label', 'Assist');
  btn.innerHTML = `<i class="halo"></i><div class="bez"></div><div class="core"><img class="ico" alt="" src="${BASE}ui/assist_icon.webp?v=3"></div><i class="pulse"></i><div class="bd"></div>`;   // (owner's pick: a real sword crossed over a smith's hammer — now with hammer B)
  const hub = document.createElement('div'); hub.className = 'bwh';
  hub.innerHTML = `<div class="bwh-pan"><div class="bwh-h"><div class="cr"></div><div class="tt"><b>Assist</b><span>&nbsp;</span></div><div class="bwh-x" data-a="x" role="button" aria-label="Close">✕</div></div><div class="bwh-sep"></div>`
    + `<div class="bwh-a" data-a="attack" role="button" aria-label="Attack"><div class="bz"><div class="ring"><div class="core">${attackLogo()}</div></div></div><div class="tx"><b>Attack</b><small>&nbsp;</small></div>${CHEV}</div>`
    + `<div class="bwh-g"></div></div>`;
  host.appendChild(btn); host.appendChild(hub);
  const G = hub.querySelector('.bwh-g'), AT = hub.querySelector('.bwh-a'), ATs = AT.querySelector('small'), ATr = AT.querySelector('.ring'), CR = hub.querySelector('.bwh-h .cr'), SUB = hub.querySelector('.bwh-h .tt span');
  const S = { open: false, ret: null };
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const now = () => (econ && econ.now ? econ.now() : Date.now() / 1000);
  const P = () => econ && econ.st && econ.st.prog;
  const A = () => econ && econ.st && econ.st.army;

  // ---- the attack tile: the ring fills with how ready the army is
  function paintAttack() {
    const a = A(); if (!a || !a.fam || !a.spell) { AT.style.display = 'none'; return; }
    AT.style.display = '';
    const rd = Math.max(0, Math.min(100, Math.round(+a.ready || 0)));
    const sub = !a.attack ? 'Attacks are not open yet' : a.space <= 0 ? 'Train an army first' : rd + '% ready';
    if (ATs.textContent !== sub) ATs.textContent = sub;
    ATr.style.setProperty('--p', rd);
    AT.classList.toggle('hot', rd >= 80 && !!a.attack); AT.classList.toggle('off', !a.attack || a.space <= 0);
  }

  // ---- the hub tiles. Build / Army carry the work status that used to sit on the home screen (builders, training queue)
  function tiles() {
    const p = P(), a = A(), t = Math.max(0, (econ.st && econ.st.tro) || 0), tn = now();
    let bsub = 'Kingdom';
    if (p && p.builders) {
      const busy = Object.values(p.structs || {}).filter((r) => r.up && !r.up.reserved), total = p.builders, free = Math.max(0, total - busy.length);
      if (free > 0) bsub = free + '/' + total + ' free';
      else { const nx = busy.reduce((m, r) => Math.min(m, r.up.end), Infinity); bsub = isFinite(nx) ? 'Next ' + fmtT(nx - tn) : 'All busy'; }
    }
    let asub = '';
    if (a && a.fam) {
      const lanes = [...Object.values(a.fam).map((f) => f.q), a.spell && a.spell.q].filter((q) => q && q.length);
      if (lanes.length) {
        const fin = lanes.reduce((m, q) => Math.max(m, q[q.length - 1].fin || 0), 0), n = lanes.reduce((s, q) => s + q.reduce((x, b) => x + (b.n || 0), 0), 0);
        asub = fmtN(n) + ' · ' + (fin > tn ? fmtT(fin - tn) : 'done');
      } else asub = (a.ready != null ? Math.round(a.ready) : 0) + '% ready';
    }
    const tag = social && social.clanTag ? social.clanTag() : '', un = social && social.unseen ? social.unseen() : 0;
    const li = leagueIdx(t), L = [
      ['build', `<img src="${BASE}ui/build_hammer.webp?v=2" alt="">`, 'Build', bsub, ''],
      ['army', icon('guard', 30), 'Army', asub, ''],
      ['shop', GEMS.sap, 'Shop', 'Gems & chests', ''],
      ['rank', leagueBadge(li, 28), 'Rank', fmtN(t) + ' cups', ''],
      ['clan', I(ICONS.clan, 30), 'Clan', tag ? '[' + esc(tag) + ']' : 'Join', ''],
      ['friends', I(ICONS.friends, 30), 'Friends', 'Invite', ''],
      ['log', I(ICONS.log, 30), 'Log', un ? un + ' new' : 'History', un ? String(un) : ''],
      ['set', I(ICONS.set, 30), 'Settings', '', ''],
      ['banner', crestImg((econ.st && econ.st.emblem) || 'swords', 30, 'crest', 'display:block'), 'Banner', 'Crest', ''],
    ];
    L.li = li; return L;
  }
  // The tiles are built once; afterwards only their status texts are patched, so a finger that is on a tile is never lost
  function paintHub() {
    paintAttack();
    const em = (econ.st && econ.st.emblem) || 'swords';
    if (CR.dataset.e !== em) { CR.dataset.e = em; CR.innerHTML = crestImg(em, 34, 'crest', 'display:block'); }
    const nm = (econ.st && econ.st.name) || '', lv = (econ.st && econ.st.level) || 1, sub = (nm ? nm + ' · ' : '') + 'Keep ' + lv;
    if (SUB.textContent !== sub) SUB.textContent = sub;
    const T = tiles(), sig = T.map((x) => x[0] + '\u0001' + x[2]).join('\u0002') + '\u0003' + T.li + '\u0004' + em;     // NOT the icon markup: it carries fresh ids every call
    if (G.dataset.sig !== sig) {
      G.dataset.sig = sig;
      G.innerHTML = T.map(([k, ic, l], i) => `<div class="bwh-t" data-a="${k}" role="button" style="--i:${i + 1}"><div class="ic"><i>${ic}</i></div><b>${l}</b><small>&nbsp;</small><i class="bd"></i></div>`).join('');
    }
    for (const [k, , , sub, bd] of T) {
      const tl = G.querySelector('[data-a="' + k + '"]'); if (!tl) continue;
      const sm = tl.querySelector('small'), v = String(sub || '');
      if (sm && sm.dataset.v !== v) { sm.dataset.v = v; sm.innerHTML = v || '&nbsp;'; }
      const b = tl.querySelector('.bd'); if (b && b.textContent !== bd) b.textContent = bd;
    }
  }
  function tick() { if (S.open && !document.hidden) paintHub(); }       // once a second while the hub is open: live timers
  function paintBadge() {
    const un = social && social.unseen ? social.unseen() : 0; const b = btn.querySelector('.bd'), s = un ? String(un) : ''; if (b.textContent !== s) b.textContent = s;
    const a = A(), hot = !!un || !!(a && a.attack && a.space > 0 && (+a.ready || 0) >= 80);        // the pulse ring: a new log entry, or the army is ready to march
    if (btn.classList.contains('hot') !== hot) btn.classList.toggle('hot', hot);
  }
  function openHub() { if (S.open) return; S.open = true; G.dataset.sig = ''; paintHub(); hub.classList.add('on'); click(); social && social.refresh && social.refresh(); sync(); }
  function closeHub() { if (!S.open) return; S.open = false; hub.classList.remove('on'); sync(); }

  // ---- navigation: which panel each tile opens, how to close it, where its header is (for the "‹" back button)
  const q = (sel) => document.querySelector(sel);
  const PANE = {
    build: { el: q('.bwu'), hd: '.bwu-h', close: () => upgrade && upgrade.close && upgrade.close() },
    army: { el: q('.bwa'), hd: '.bwa-h', close: () => army && army.close && army.close() },
    shop: { el: q('.bws'), hd: '.bws-h', close: () => shop && shop.close && shop.close() },
    rank: { el: q('.bwk:not(.bwc)'), hd: '.bwk-h', close: () => rank && rank.close && rank.close() },
    social: { el: q('.bwc'), hd: '.bwk-h', close: () => social && social.close && social.close() },
    set: { el: q('.bw-set'), hd: '.bw-ph', close: () => ui && ui.openSettings && ui.openSettings(false) },
  };
  const PANE_OF = { build: 'build', army: 'army', banner: 'army', shop: 'shop', rank: 'rank', clan: 'social', friends: 'social', log: 'social', set: 'set' };
  // the panels in the order they opened (a panel can open another on top of itself, e.g. the egg card opens the Shop over the Army): Back acts on the top one
  const order = [];
  const track = () => { for (const k of Object.keys(PANE)) { const e = PANE[k].el, on = !!(e && e.classList.contains('on')), i = order.indexOf(k); if (on && i < 0) order.push(k); else if (!on && i >= 0) order.splice(i, 1); } };
  const openPane = () => { track(); return order.length ? order[order.length - 1] : null; };
  function backBtn(k, on) {
    const P = PANE[k]; if (!P || !P.el) return;
    const hd = P.el.querySelector(P.hd); if (!hd) return;
    let b = hd.querySelector(':scope > .bwnav');
    if (on && !b) {
      b = document.createElement('div'); b.className = 'bwnav'; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Back'); b.innerHTML = BACK;
      b.addEventListener('click', (e) => { e.stopPropagation(); click(); back(); });
      hd.insertBefore(b, hd.firstChild);
    } else if (!on && b) b.remove();
  }
  // Telegram's own Back button (top-left in the Mini App) follows the same stack
  const TB = tg && tg.BackButton && (!tg.isVersionAtLeast || tg.isVersionAtLeast('6.1')) ? tg.BackButton : null;
  let tbOn = false;
  const onTB = () => back();
  if (TB) { try { TB.onClick(onTB); } catch (e) { /* ignore */ } }
  function sync() {
    const k = openPane();
    if (S.ret && !order.includes(S.ret)) { backBtn(S.ret, false); S.ret = null; }             // the panel the hub opened was closed (✕, outside tap, or another way)
    const want = S.open || !!k;
    if (TB && want !== tbOn) { tbOn = want; try { if (want) TB.show(); else TB.hide(); } catch (e) { /* ignore */ } }
  }
  function back() {
    if (S.open) { closeHub(); return; }
    const k = openPane(); if (!k) { sync(); return; }
    const toHub = S.ret === k;
    PANE[k].close();
    sync();
    if (toHub && !openPane()) openHub();
  }
  // panels open and close by themselves too (their ✕, a tap outside): watch only their own class attribute
  if (typeof MutationObserver !== 'undefined') { const mo = new MutationObserver(() => sync()); for (const k of Object.keys(PANE)) if (PANE[k].el) mo.observe(PANE[k].el, { attributes: true, attributeFilter: ['class'] }); }

  function go(k) {
    closeHub();
    if (k === 'attack') army && army.attack && army.attack();
    else if (k === 'build') upgrade && upgrade.open && upgrade.open();
    else if (k === 'army') army && army.open && army.open();
    else if (k === 'shop') shop && shop.open && shop.open();
    else if (k === 'rank') rank && rank.open && rank.open();
    else if (k === 'clan') social && social.open('clan');
    else if (k === 'friends') social && social.open('friends');
    else if (k === 'log') social && social.open('log');
    else if (k === 'set') ui && ui.openSettings && ui.openSettings(true);
    else if (k === 'banner') army && army.emblem && army.emblem();
    const pk = PANE_OF[k];
    if (pk && PANE[pk].el && PANE[pk].el.classList.contains('on')) { S.ret = pk; backBtn(pk, true); }
    sync();
  }
  btn.addEventListener('click', () => { btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap'); openHub(); });
  hub.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]'); if (!a) { if (e.target === hub) closeHub(); return; }
    if (a.dataset.a === 'x') { click(); closeHub(); return; }
    click(); go(a.dataset.a);
  });
  const timer = setInterval(tick, 1000);
  function update() { paintBadge(); if (S.open) paintHub(); }
  update();
  return { update, openHub, closeHub, back, get isOpen() { return S.open; }, dispose() { clearInterval(timer); if (TB) { try { TB.offClick(onTB); TB.hide(); } catch (e) { /* ignore */ } } } };
}
