// Battle HUD (DOM over the canvas): timer, destruction %, three stars, enemy name, live loot, announcements, world-space HP bars
// and the result card. Pure view: battle.js feeds it numbers and listens to its callbacks.
import { GEMS } from './ui.js';
import { icon, NAME, unitPic } from './armyui.js';
import { SPELLS, spellIcon } from './spells.js';
import DEFS from './unitdefs.json';
import { crestImg } from './emblems.js';
import { BASE } from './assets.js';
import { abilOrb, heroNeon } from './spellart.js';
// the winner's cup: a real 3D golden chalice render (client/tools: cup icon renderer), the same size and light as the gems
const CUP = (c = 'gem3 cupg') => `<img class="${c}" alt="" draggable="false" decoding="async" src="${BASE}ui/cup_gold.webp">`;

const CSS = `
.bwb{position:absolute;inset:0;z-index:30;overflow:hidden;user-select:none;-webkit-user-select:none;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;
  --st:calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px));--sb:var(--tg-safe-area-inset-bottom,0px);--sl:var(--tg-safe-area-inset-left,0px);--sr:var(--tg-safe-area-inset-right,0px);-webkit-tap-highlight-color:transparent}
.bwb *{box-sizing:border-box}
.bwb-pad{position:absolute;inset:0;touch-action:none;pointer-events:auto}
.bwb-load{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:radial-gradient(circle at 50% 40%,#10294f,#02060f 75%);transition:opacity .7s}
.bwb-load .t{min-height:30px;font-size:24px;letter-spacing:1px;color:#d9f2ff;text-shadow:0 0 18px rgba(110,190,255,.55)}.bwb-load .s{font-size:12.5px;letter-spacing:2px;color:#8fb4e0;text-transform:uppercase}
.bwb-load .bar{width:min(260px,64vw);height:6px;border-radius:3px;background:#06122b;border:1px solid rgba(120,190,255,.35);overflow:hidden}.bwb-load .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2b86ff,#8fe8ff);box-shadow:0 0 10px #6fe8ff;transition:width .25s}
.bwb-load.pre{opacity:0}.bwb-load.off{opacity:0;pointer-events:none}
.bwb-load .pc{font-size:13px;letter-spacing:2px;color:#8fe8ff;font-variant-numeric:tabular-nums;text-shadow:0 0 10px rgba(110,200,255,.5);margin-top:-2px}
.bwb-load .cx{margin-top:14px;padding:8px 20px;border-radius:999px;font:inherit;font-size:11.5px;letter-spacing:1.6px;color:#9fc4ee;background:rgba(20,50,100,.45);border:1px solid rgba(140,200,255,.35);cursor:pointer;text-transform:uppercase}
.bwb-top{position:absolute;left:calc(8px + var(--sl));right:calc(8px + var(--sr));top:calc(var(--st) + 8px);display:flex;align-items:flex-start;justify-content:space-between;gap:8px;pointer-events:none}
.bwb-end{pointer-events:auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;font-size:15px;color:#ffd9de;background:linear-gradient(180deg,rgba(120,24,40,.9),rgba(40,6,14,.95));border:1px solid rgba(255,150,165,.5);box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:pointer;font-family:inherit}
.bwb-end.home{width:auto;padding:0 13px 0 10px;gap:6px;grid-auto-flow:column;font-size:12px;font-weight:800;letter-spacing:1.2px;color:#eaf6ff;background:linear-gradient(180deg,rgba(46,98,150,.95),rgba(14,34,66,.97));border:1px solid rgba(150,205,255,.6)}
.bwb-end.home svg{width:18px;height:18px;display:block}
.bwb-end.ask{width:auto;padding:0 12px;font-size:12px;letter-spacing:1px;background:linear-gradient(180deg,#d8283f,#7a0f20)}
.bwb-mid{position:absolute;top:0;left:calc(50% - (var(--sl) - var(--sr)) / 2);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}       /* (owner 5 Oct 18:34: timer, bar and stars exactly in the middle of the screen, whatever the widths of HOME and the player card) */
.bwb-tm{padding:5px 16px;border-radius:14px;font-size:18px;letter-spacing:1.5px;background:linear-gradient(180deg,rgba(24,52,104,.92),rgba(5,14,36,.94));border:1px solid rgba(140,200,255,.45);box-shadow:0 3px 10px rgba(0,0,0,.5);color:#e6f6ff;text-shadow:0 0 8px rgba(120,200,255,.5)}
.bwb-tm{font-variant-numeric:tabular-nums}
.bwb-tm.low{color:#ff9aa8;text-shadow:0 0 8px rgba(255,90,110,.6)}
.bwb-dm{position:relative;width:min(150px,32vw);min-width:0;height:20px;border-radius:10px;background:#050d20;border:1px solid rgba(140,200,255,.45);overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.5)}
.bwb-dm i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#d8283f,#ff8a5c);box-shadow:0 0 10px rgba(255,120,90,.7)}
.bwb-dm i:after{content:"";position:absolute;left:0;top:0;right:0;height:45%;background:rgba(255,255,255,.22)}
.bwb-dm b{position:absolute;inset:0;display:grid;place-items:center;font-size:11.5px;letter-spacing:1px;text-shadow:0 1px 0 #000,0 0 5px #000}
.bwb-dm u{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.5)}
.bwb-stars{display:flex;gap:3px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.7))}.bwb-stars svg{width:22px;height:22px;transition:transform .4s cubic-bezier(.2,2,.4,1),filter .4s}
.bwb-stars svg path{fill:#1b2f55;stroke:#9ab8e2;stroke-width:1.3}
.bwb-stars svg.on{transform:scale(1.25) rotate(-8deg);filter:drop-shadow(0 0 7px #ffd25c)}.bwb-stars svg.on path{fill:#ffcf45;stroke:#fff3b0}
.bwb-foe{display:flex;align-items:center;gap:8px;max-width:33vw;flex:0 1 auto;padding:5px 10px 5px 6px;border-radius:14px;background:linear-gradient(180deg,rgba(24,50,98,.92),rgba(5,12,32,.94));border:1px solid rgba(140,200,255,.45);box-shadow:0 3px 10px rgba(0,0,0,.5)}
.bwb-foe .em{flex:0 0 auto;width:36px;height:36px;display:grid;place-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,.55))}
.bwb-foe div.tx{min-width:0;text-align:left}
.bwb-foe b{display:block;font-size:13px;color:#eaf6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bwb-foe span{font-size:10.5px;letter-spacing:1px;color:#8fd0ff}
.bwb-sp{position:absolute;right:calc(8px + var(--sr));bottom:calc(var(--sb) + 14px);display:flex;flex-direction:column;gap:9px;pointer-events:none}
.bwb-sp .s{pointer-events:auto;position:relative;width:48px;height:48px;border-radius:50%;cursor:pointer;display:grid;place-items:center;transition:transform .15s,filter .15s;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6))}
.bwb-sp .s:active{transform:scale(.92)}
.bwb-sp .s svg{width:100%;height:100%}
.bwb-sp .s b{position:absolute;right:-6px;bottom:-4px;min-width:26px;height:20px;padding:0 4px;border-radius:10px;display:grid;place-items:center;font-size:12px;color:#fff;background:linear-gradient(180deg,#2b6bff,#0b2a8a);border:1.5px solid #cfe6ff;text-shadow:0 1px 0 #000}
.bwb-sp .s.sel{transform:scale(1.14);filter:drop-shadow(0 0 10px var(--g,#8fe8ff)) drop-shadow(0 0 3px #fff)}
.bwb-sp .s.sel:before{content:"";position:absolute;inset:-5px;border-radius:50%;border:2px solid #ffe08a;animation:bwbPulse 1s ease-in-out infinite}
.bwb-sp .s.dead{opacity:.35;pointer-events:none;filter:grayscale(.8)}
@keyframes bwbPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:.55}}
.bwb-fcol{position:relative;flex:0 1 auto;min-width:0;max-width:33vw}
.bwb-fcol .bwb-foe{max-width:none;min-width:122px}
.bwb-loot{position:absolute;left:-10px;right:0;top:calc(100% + 5px);display:grid;grid-template-columns:repeat(4,1fr);gap:0 1px;pointer-events:none}
.bwb-loot span{position:relative;display:flex;flex-direction:column;align-items:center;min-width:0;padding:0;font-size:11.5px;font-weight:800;line-height:1.1;color:#fff}
.bwb-loot span:before{content:"";flex:0 0 auto;width:33px;height:33px;box-sizing:border-box;border-radius:50%;border:3px solid transparent;
  background:radial-gradient(circle at 50% 28%,#2c5aa0 0,#0e2350 58%,#050c1e 100%) padding-box,conic-gradient(from 25deg,#f6faff,#8aa0c0 18%,#e9f1ff 36%,#586f90 58%,#cfdcf0 78%,#f6faff) border-box;box-shadow:0 0 0 1px #0a1426,0 3px 6px rgba(0,0,0,.65),inset 0 3px 6px rgba(0,0,0,.5)}
.bwb-loot .gem3{position:absolute;top:3.5px;left:50%;width:26px;height:26px;margin-left:-13px;object-fit:contain;filter:drop-shadow(0 2px 2px rgba(0,0,0,.7))}
.bwb-loot .cupg{filter:drop-shadow(0 2px 2px rgba(0,0,0,.7)) drop-shadow(0 0 4px rgba(255,200,80,.35))}
.bwb-loot b{position:relative;margin-top:-8px;min-width:30px;padding:1px 4px 2px;box-sizing:border-box;border-radius:9px;text-align:center;white-space:nowrap;font-size:11px;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,#25488a,#0a1634 78%);border:1px solid #e2bd62;box-shadow:0 2px 4px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.25);text-shadow:0 1px 0 #000}
.bwb-loot .cup:before{background:radial-gradient(circle at 50% 28%,#34589a 0,#102450 58%,#050c1e 100%) padding-box,conic-gradient(from 25deg,#fffbe2,#f5c94c 18%,#fffbe6 36%,#dba51f 58%,#ffe58c 78%,#fffbe2) border-box}
.bwb-loot .cup b{color:#fff0b4;border-color:#ffd75a}
.bwb-loot small{display:block;font-size:8.5px;line-height:1;color:#a9c6ea;font-weight:600}
@keyframes bwbGlint{0%,100%{box-shadow:0 3px 10px rgba(0,0,0,.5),0 0 12px rgba(90,170,255,.22)}50%{box-shadow:0 3px 10px rgba(0,0,0,.5),0 0 20px rgba(150,220,255,.55)}}
.bwb-next{position:absolute;left:calc(8px + var(--sl));bottom:calc(var(--sb) + 14px);pointer-events:auto;display:none;align-items:center;justify-content:center;gap:5px;width:140px;height:48px;padding:0 17px 0 21px;border:0;background:url(data:image/webp;base64,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) center/100% 100% no-repeat;font:inherit;font-size:14.5px;font-weight:800;letter-spacing:2.6px;color:#fff3cf;cursor:pointer;-webkit-tap-highlight-color:transparent;
  filter:drop-shadow(0 4px 5px rgba(0,0,0,.6)) drop-shadow(0 0 10px rgba(255,170,70,.28));text-shadow:0 1px 0 #3a0508,0 -1px 0 rgba(255,236,190,.28),0 2px 3px rgba(0,0,0,.65);animation:bwbNx 2.4s ease-in-out infinite}
.bwb-next span{position:relative}
.bwb-next svg{position:relative;width:19px;height:19px;filter:drop-shadow(0 1px 0 #3a0508)}
.bwb-next .sh{display:none}
.bwb-next:active{transform:scale(.95)}
@keyframes bwbNx{50%{filter:drop-shadow(0 4px 5px rgba(0,0,0,.6)) drop-shadow(0 0 20px rgba(255,170,70,.65))}}
@keyframes bwbNxS{0%,55%{left:-50%}100%{left:130%}}
.bwb-ann{position:absolute;left:0;right:0;top:34%;text-align:center;pointer-events:none;font-size:26px;letter-spacing:3px;color:#fff;text-shadow:0 0 20px rgba(110,190,255,.9),0 3px 0 #02060f,0 0 3px #000;opacity:0;transform:scale(.8)}
.bwb-ann.go{animation:bwbAnn 2.2s ease-out}
@keyframes bwbAnn{0%{opacity:0;transform:scale(.7)}12%{opacity:1;transform:scale(1.08)}22%{transform:scale(1)}78%{opacity:1}100%{opacity:0;transform:scale(1.05) translateY(-14px)}}
.bwb-hint{padding:5px 6px;background:linear-gradient(90deg,rgba(2,8,20,0),rgba(2,8,20,.55) 14%,rgba(2,8,20,.55) 86%,rgba(2,8,20,0));position:absolute;left:calc(8px + var(--sl));right:calc(64px + var(--sr));bottom:calc(var(--sb) + 70px);text-align:center;font-size:11.5px;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d9f2ff;text-shadow:0 1px 0 #000,0 0 8px #000;pointer-events:none;transition:opacity .5s}
.bwb-hint.off{opacity:0}
.bwb-bars{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.hb{position:absolute;left:0;top:0;width:92px;height:7px;margin:-3.5px 0 0 -46px;opacity:0;transition:opacity .25s;will-change:transform;--c0:#b84200;--c1:#ff8c1a;--c2:#ffd7a0;--gl:rgba(255,142,40,.9)}
.hb.on{opacity:1}.hb.out{opacity:0}
.hb.g{--c0:#057c7a;--c1:#15d8ae;--c2:#a6fff1;--gl:rgba(30,240,205,.9)}
.hb .fr{position:absolute;inset:0;border-radius:4px;background:linear-gradient(180deg,#0b1936,#040a18);box-shadow:0 0 0 1px rgba(176,208,236,.72),0 0 0 2px rgba(4,9,22,.95),0 3px 6px rgba(0,0,0,.7),0 0 10px -1px var(--gl)}
.hb .gh,.hb .fl{position:absolute;left:1.5px;top:1.5px;bottom:1.5px;border-radius:2.5px;width:calc((100% - 3px) * var(--k,1))}
.hb .gh{background:rgba(255,255,255,.8);transition:width .9s cubic-bezier(.2,.7,.2,1) .35s}
.hb .fl{overflow:hidden;background:linear-gradient(180deg,var(--c2) 0,var(--c1) 46%,var(--c0) 100%);transition:width .16s ease-out;box-shadow:0 0 5px 1px var(--gl),inset -1.5px 0 1.5px rgba(255,255,255,.55)}
.hb .fl:before{content:"";position:absolute;left:0;right:0;top:0;height:46%;background:linear-gradient(180deg,rgba(255,255,255,.7),rgba(255,255,255,.08))}
.hb .fl:after{content:"";position:absolute;top:0;bottom:0;width:32%;left:-40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);animation:hbSheen 2.3s linear infinite}
@keyframes hbSheen{0%{transform:translateX(0)}60%,100%{transform:translateX(480%)}}
.hb .tk{position:absolute;left:1.5px;right:1.5px;top:1.5px;bottom:1.5px;border-radius:2.5px;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0,transparent calc(25% - 1px),rgba(3,10,26,.6) calc(25% - 1px),rgba(3,10,26,.6) 25%)}.hb .cp{display:none}
.hb u{position:absolute;right:0;top:-13px;text-decoration:none;font:900 12px/1 Arial,sans-serif;color:#d2fff6;text-shadow:0 0 5px var(--gl),0 1px 1px #000;opacity:0}
.hb.hit .fl,.hb.hit2 .fl{animation:hbHit .24s ease-out}.hb.hit2 .fl{animation-name:hbHit2}
.hb.heal .fr,.hb.heal2 .fr{animation:hbHeal .75s ease-out}.hb.heal2 .fr{animation-name:hbHeal2}.hb.heal u,.hb.heal2 u{animation:hbPlus .75s ease-out}.hb.heal2 u{animation-name:hbPlus2}
.hb.low .fr:after{content:"";position:absolute;inset:0;border-radius:4px;box-shadow:0 0 0 1px #fff,0 0 10px var(--gl);opacity:0;will-change:opacity;animation:hbLow .55s ease-in-out infinite alternate}
@keyframes hbHit{0%{filter:brightness(2.4) saturate(.3)}100%{filter:none}}@keyframes hbHit2{0%{filter:brightness(2.4) saturate(.3)}100%{filter:none}}
@keyframes hbHeal{0%{box-shadow:0 0 0 1px #d8ffe6,0 0 0 2px rgba(0,0,0,.55),0 0 14px #3dff9a}100%{}}
@keyframes hbPlus{0%{opacity:1;transform:translateY(4px)}100%{opacity:0;transform:translateY(-8px)}}@keyframes hbPlus2{0%{opacity:1;transform:translateY(4px)}100%{opacity:0;transform:translateY(-8px)}}@keyframes hbHeal2{0%{box-shadow:0 0 0 1px #d8ffe6,0 0 0 2px rgba(0,0,0,.55),0 0 14px #3dff9a}100%{}}
@keyframes hbLow{0%{opacity:0}100%{opacity:1}}
.bwb-toast{position:absolute;left:50%;top:calc(var(--st) + 140px);transform:translateX(-50%);padding:7px 14px;border-radius:999px;background:rgba(3,10,26,.85);border:1px solid rgba(140,200,255,.4);font-size:12.5px;opacity:0;transition:opacity .4s;pointer-events:none;max-width:84%;width:max-content;text-align:center;line-height:1.35;z-index:5}
.bwb-toast.on{opacity:1}
.bwb-ab{position:absolute;left:calc(8px + var(--sl));bottom:calc(var(--sb) + 14px);display:flex;flex-direction:column;gap:16px;pointer-events:none}
.bwb-ab .a{pointer-events:auto;position:relative;width:54px;height:54px;border-radius:50%;cursor:pointer;display:grid;place-items:center;transition:transform .15s,filter .2s;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6))}
.bwb-ab .a svg{position:relative;width:100%;height:100%;display:block;pointer-events:none}
.bwb-ab .a:active{transform:scale(.93)}
.bwb-ab .a:before{content:"";position:absolute;inset:3px;z-index:1;border-radius:50%;background:conic-gradient(rgba(2,6,16,.82) calc(var(--f,0)*1turn),transparent 0);pointer-events:none}
.bwb-ab .a i{position:absolute;inset:0;z-index:2;display:grid;place-items:center;font-style:normal;font-size:15px;font-weight:700;color:#fff;text-shadow:0 1px 2px #000,0 0 6px #000;opacity:0}
.bwb-ab .a b{position:absolute;right:-6px;bottom:-4px;z-index:3;min-width:26px;height:20px;padding:0 4px;border-radius:10px;display:none;place-items:center;font-size:12px;color:#fff;background:linear-gradient(180deg,#2b6bff,#0b2a8a);border:1.5px solid #cfe6ff;text-shadow:0 1px 0 #000;pointer-events:none}.bwb-ab .a.multi b{display:grid}
.bwb-ab .a.cd i{opacity:1}.bwb-ab .a.cd svg{opacity:.45}
.bwb-ab .a{filter:drop-shadow(0 0 7px var(--g,#8fe8ff)) drop-shadow(0 3px 5px rgba(0,0,0,.6))}.bwb-ab .a.rdy{filter:drop-shadow(0 0 12px var(--g,#8fe8ff)) drop-shadow(0 0 4px #fff) drop-shadow(0 3px 5px rgba(0,0,0,.6));animation:bwbPulse 1.2s ease-in-out infinite}
.bwb-ab .a.off{display:none}
.bwb-ab .a.pop{animation:bwbAbIn .28s cubic-bezier(.2,1.6,.4,1)}@keyframes bwbAbIn{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
.bwb.nx .bwb-ab{bottom:calc(var(--sb) + 80px)}
.bwb-sqt{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--sb) + 14px);display:flex;gap:18px;pointer-events:none;opacity:0;transition:opacity .2s}
.bwb-sqt[data-m=pre] .t.go,.bwb-sqt[data-m=go] .t.pre{display:none}.bwb.nx .bwb-sqt{bottom:calc(var(--sb) + 70px)}
.bwb-pc{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--st) + 114px);display:none;gap:6px;pointer-events:none;white-space:nowrap}
.bwb-pc.on{display:flex}.bwb-pc span{padding:3px 9px;border-radius:11px;background:rgba(3,10,26,.82);border:1px solid rgba(150,205,255,.4);color:#d9f2ff;font-size:11px;font-weight:700;letter-spacing:.2px}.bwb-pc b{color:#9fd4ff;font-weight:800;margin-inline-start:4px}
.bwb-dc{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--sb) + 96px);width:min(290px,calc(100vw - 130px));display:none;padding:10px 14px;border-radius:16px;text-align:left;background:linear-gradient(180deg,rgba(14,38,86,.96),rgba(3,8,20,.97));border:1px solid rgba(130,200,255,.45);box-shadow:0 10px 30px rgba(0,0,0,.6);pointer-events:none}
.bwb-dc.on{display:block}.bwb-dc h4{margin:0 0 2px;font-size:14px;color:#fff;letter-spacing:.3px}.bwb-dc h4 i{font-style:normal;font-weight:600;color:#9fd4ff;font-size:12px;margin-inline-start:6px}.bwb-dc p{margin:0;font-size:12px;line-height:1.35;color:#c9def5}
.bwb-sqt.on{opacity:1}.bwb-sqt.on .t{pointer-events:auto}
.bwb-sqt .t{position:relative;width:42px;height:42px;padding:0;border:0;border-radius:50%;background:none;cursor:pointer;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6));transition:transform .15s,filter .15s}
.bwb-sqt .t svg{width:100%;height:100%;display:block;pointer-events:none}
.bwb-sqt .t:active{transform:scale(.93)}
.bwb-sqt .t.sel{transform:scale(1.12);filter:drop-shadow(0 0 9px #8fe8ff) drop-shadow(0 3px 5px rgba(0,0,0,.6))}
.bwb-cf{position:absolute;inset:0;z-index:48;display:grid;place-items:center;background:rgba(2,8,20,.66);opacity:0;pointer-events:none;transition:opacity .18s}
.bwb-cf.on{opacity:1;pointer-events:auto}
.bwb-cf .cd{width:min(300px,84vw);padding:20px 18px 16px;border-radius:20px;text-align:center;background:linear-gradient(180deg,#17376a,#07142c);border:1px solid rgba(150,205,255,.55);box-shadow:0 14px 40px rgba(0,0,0,.65),0 0 24px rgba(80,160,255,.2);transform:scale(.92);transition:transform .22s cubic-bezier(.2,1.6,.4,1)}
.bwb-cf.on .cd{transform:none}
.bwb-cf h3{margin:0 0 7px;font-size:21px;font-weight:700;letter-spacing:.4px;color:#eaf6ff;text-shadow:0 0 14px rgba(110,190,255,.4)}
.bwb-cf p{margin:0 0 16px;font-size:13px;line-height:1.45;color:#9fc4ee}
.bwb-cf .bt{display:flex;gap:10px}
.bwb-cf button{flex:1;height:44px;border-radius:13px;font:inherit;font-size:14.5px;font-weight:700;letter-spacing:.6px;cursor:pointer;border:1px solid;-webkit-tap-highlight-color:transparent}
.bwb-cf button:active{transform:scale(.96)}
.bwb-cf .no{flex:1.3;color:#e4f4ff;background:linear-gradient(180deg,#3170bf,#12306a);border-color:rgba(160,210,255,.6)}
.bwb-cf .yes{color:#ffc9d0;background:rgba(122,15,32,.35);border-color:rgba(255,150,165,.55)}
.bwb-res{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,3,10,.8);pointer-events:auto;opacity:0;transition:opacity .5s}
.bwb-res.on{display:flex;opacity:1}
.bwb-card{width:min(360px,90vw);max-height:92%;overflow-y:auto;border-radius:24px;padding:20px 18px 18px;text-align:center;background:linear-gradient(180deg,rgba(14,38,86,.97),rgba(3,8,20,.985));border:1px solid rgba(130,200,255,.45);box-shadow:0 22px 70px rgba(0,0,0,.7),0 0 40px rgba(80,150,255,.25);transform:translateY(24px) scale(.96);transition:transform .5s cubic-bezier(.2,1.2,.3,1)}
.bwb-res.on .bwb-card{transform:none}
.bwb-card h2{margin:0;font-size:28px;letter-spacing:4px;font-weight:700;text-shadow:0 0 22px rgba(110,190,255,.8),0 2px 0 #02060f}
.bwb-card h2.lose{color:#ff9aa8;text-shadow:0 0 22px rgba(255,90,110,.6),0 2px 0 #02060f}
.bwb-card .vs{margin-top:2px;font-size:12px;letter-spacing:1px;color:#8fb4e0}
.bwb-card .big{display:flex;justify-content:center;gap:6px;margin:12px 0 6px}.bwb-card .big svg{width:54px;height:54px;transform:scale(.4);opacity:0;transition:transform .55s cubic-bezier(.2,2,.4,1),opacity .3s,filter .5s}
.bwb-card .big svg:nth-child(2){margin-top:-10px}
.bwb-card .cup{display:flex;align-items:center;justify-content:center;gap:6px;margin:0 0 4px;font-size:17px;color:#ffe9a6;letter-spacing:.5px}.bwb-card .cup .gem3{width:30px;height:30px}.bwb-card .cup b{color:#fff3c8}.bwb-card .cup.lose,.bwb-card .cup.lose b{color:#ffb0bb}
.bwb-card .big svg path{fill:#1b2f55;stroke:#9ab8e2;stroke-width:1.2}.bwb-card .big svg.in{transform:scale(1);opacity:1}.bwb-card .big svg.on path{fill:#ffcf45;stroke:#fff3b0}.bwb-card .big svg.on{filter:drop-shadow(0 0 12px #ffd25c)}
.bwb-card .rows{display:flex;justify-content:space-around;margin:6px 0 8px;font-size:11.5px;color:#9fb8da;letter-spacing:.5px}.bwb-card .rows b{display:block;font-size:19px;color:#fff;letter-spacing:0}
.bwb-card .gl{display:flex;justify-content:center;gap:8px;margin:8px 0}.bwb-card .gl span{display:inline-flex;align-items:center;gap:5px;padding:5px 11px 5px 6px;border-radius:14px;font-size:15px;background:rgba(95,182,255,.09);border:1px solid rgba(120,190,255,.3)}.bwb-card .gl .gem3{width:24px;height:24px}
.bwb-card .un{margin:6px 0 2px;text-align:left;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(120,190,255,.16);padding:6px 10px}
.bwb-card .un div{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px;color:#c9def5}.bwb-card .un div svg{width:18px;height:18px;color:#9fd8ff}.bwb-card .un div span{flex:1;text-align:left}.bwb-card .un div em{font-style:normal;color:#7dffb5}.bwb-card .un div em.l{color:#ff9aa8}
.bwb-card .note{margin:8px 0 0;font-size:11px;line-height:1.5;color:#ffb0bb}
.bwb-card .dmg{margin:8px 0 2px;text-align:left;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(120,190,255,.16);padding:7px 10px 8px}
.bwb-card .dmg h3{margin:0 0 5px;font-size:10px;letter-spacing:1.8px;font-weight:700;color:#8fb4e0;text-transform:uppercase}
.bwb-card .dmg div{display:grid;grid-template-columns:96px 1fr 30px;align-items:center;gap:7px;padding:2.5px 0;font-size:11.5px;color:#c9def5}
.bwb-card .dmg i{display:block;position:relative;height:7px;border-radius:4px;background:#06122b;border:1px solid rgba(140,200,255,.28);overflow:hidden}
.bwb-card .dmg i:before{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--w);background:linear-gradient(90deg,#2b6bd6,#8fe8ff)}
.bwb-card .dmg em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums;color:#9fc4ee}
.bwb-card .tip{margin:8px 0 0;display:flex;gap:8px;align-items:flex-start;text-align:left;padding:8px 10px;border-radius:12px;font-size:11.5px;line-height:1.4;color:#d9ecff;background:linear-gradient(180deg,rgba(30,64,126,.55),rgba(6,16,40,.7));border:1px solid rgba(140,200,255,.32)}
.bwb-card .tip b{flex:0 0 auto;margin-top:1px;padding:1px 6px;border-radius:7px;font-size:9.5px;letter-spacing:1.4px;color:#06122b;background:#8fd0ff}
.bwb-card .bt{display:flex;gap:10px;margin-top:14px;position:sticky;bottom:-18px;padding:8px 0 0;background:linear-gradient(rgba(3,8,20,0),rgba(3,8,20,.97) 26%)}.bwb-card .bt button{flex:1;padding:13px 8px;border-radius:14px;border:1px solid #bfe6ff;background:linear-gradient(180deg,#5fb6ff,#1b4fb8);color:#fff;font-weight:700;font-size:14px;letter-spacing:1.5px;font-family:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(40,110,230,.4)}
.bwb-card .bt button.n{border-color:#ffc4c9;background:linear-gradient(180deg,#ff6b78,#b81f34);box-shadow:0 4px 14px rgba(220,40,60,.4)}.bwb-card .bt button:disabled{opacity:.45;filter:grayscale(.6)}
@media (orientation:landscape) and (max-height:560px){.bwb-sqt,.bwb.nx .bwb-sqt{bottom:calc(var(--sb) + 10px)}.bwb-pc{top:calc(var(--st) + 66px)}.bwb-dc{bottom:calc(var(--sb) + 66px)}.bwb.nx .bwb-ab{bottom:calc(var(--sb) + 66px)}.bwb-ab{bottom:calc(var(--sb) + 10px)}.bwb-hint{bottom:calc(var(--sb) + 62px)}.bwb-sp{bottom:calc(var(--sb) + 10px);gap:5px}.bwb-sp .s{width:40px;height:40px}.bwb-next{bottom:calc(var(--sb) + 10px)}.bwb-card{padding:12px 14px}.bwb-card .big svg{width:40px;height:40px}}
`;
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.2l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.1 6 20.6l1.3-6.7-5-4.7 6.8-.8z" stroke-linejoin="round"/></svg>';
const HOME_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#eaf6ff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 10v9.2h12.4V10"/><path d="M10 19.2v-5.4h4v5.4"/></svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const GORD = ['turq', 'emerald', 'ruby'];
// the cups a fight is worth (mirrors social.py attacker_delta: WIN_FULL 40 for 3 stars, one third per star, scaled 0.75 .. 1.35 by how strong the enemy is); the chip shows them like a gem: «0/N», N = the full cup
const cupFull = (ratio) => 40 * Math.max(0.75, Math.min(1.35, +ratio || 1));
const winCups = (ratio, stars) => Math.round((cupFull(ratio) * Math.max(0, Math.min(3, stars | 0))) / 3);
const fmtL = (n) => (n >= 1e6 ? (Math.floor(n / 1e5) / 10).toFixed(1) + 'M' : n >= 100000 ? Math.floor(n / 1000) + 'K' : fmtN(n));
export const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let cssDone = false;

function ensureCss() { if (!cssDone) { const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); cssDone = true; } }

// The ONE loading screen of the game's attack flow (owner's rule: no extra pages): who we march against + a bar + a percentage.  It is created the moment the player taps ATTACK / NEXT,
// follows the opponent search (0-35 %), then the battle HUD adopts it and carries the same bar on to 100 % while the battlefield is built.
export function createLoadView(root, { title = '', sub = 'Scouting the land…', z = 80 } = {}) {
  ensureCss();
  const el = document.createElement('div'); el.className = 'bwb-load pre'; el.style.zIndex = String(z);
  el.innerHTML = `<div class="t">${title}</div><div class="s">${esc(sub)}</div><div class="bar"><i></i></div><div class="pc">0%</div><button class="cx" type="button" style="display:none">Cancel</button>`;
  root.appendChild(el);
  const fill = el.querySelector('.bar i'), pcEl = el.querySelector('.pc'), subEl = el.querySelector('.s'), tEl = el.querySelector('.t'), cx = el.querySelector('.cx');
  let f = 0, base = 0, cancelFn = null, gone = false;
  const api = {
    el, get f() { return f; },
    show() { requestAnimationFrame(() => el.classList.remove('pre')); return api; },
    progress(x, txt) { const v = base + (1 - base) * Math.max(0, Math.min(1, x)); if (v > f) f = v; fill.style.width = (f * 100).toFixed(1) + '%'; const p = Math.round(f * 100) + '%'; if (pcEl.textContent !== p) pcEl.textContent = p; if (txt && subEl.textContent !== txt) subEl.textContent = txt; return api; },
    setTitle(html) { tEl.innerHTML = html; return api; },
    rebase() { base = f; return api; },                                              // (what follows counts from here to 100 %)
    onCancel(fn) { cancelFn = fn; setTimeout(() => { if (cancelFn && !gone) cx.style.display = ''; }, 3000); cx.onclick = () => { if (cancelFn) cancelFn(); }; return api; },
    noCancel() { cancelFn = null; cx.style.display = 'none'; return api; },
    hide() { if (gone) return; gone = true; el.classList.add('off'); setTimeout(() => el.remove(), 760); },
  };
  return api;
}

const ABIL = { shieldmaiden: { label: 'Shield Wall', art: 'shield', col: '#63e6be' }, lord: { label: 'Rally Charge', art: 'rally', col: '#ffe066' }, captain: { label: 'Banner', art: 'banner', col: '#8ce0ff' }, gryphonknight: { label: 'Dive Strike', art: 'dive', col: '#ffd27a' }, darkrider: { label: 'Shadow Breath', art: 'shadow', col: '#a78bff' } };      // the buttons are the same glass orbs as the spells (spellart.js); the label is only the screen-reader name, nothing is written under the button

export function createHUD(root, { target, types, spells = [], onSpell, onAbility, onTool = null, toolSet = { squad: true, scout: false }, onEnd, onNext, loader = null }) {
  ensureCss();
  const el = document.createElement('div'); el.className = 'bwb';
  el.innerHTML = `<div class="bwb-pad"></div>
    <div class="bwb-top"><button class="bwb-end home" data-a="end" aria-label="Home">${HOME_SVG}<span>HOME</span></button>
      <div class="bwb-mid"><div class="bwb-tm">3:00</div><div class="bwb-dm"><i></i><u style="left:50%"></u><b>0%</b></div><div class="bwb-stars">${STAR}${STAR}${STAR}</div></div>
      <div class="bwb-fcol"><div class="bwb-foe"><div class="em">${crestImg(target.emblem, 36)}</div><div class="tx"><b>${esc(target.name)}</b><span>LV ${target.levels && target.levels.keep || '?'}</span></div></div><div class="bwb-loot"></div></div></div>
    <button class="bwb-next" data-a="next" aria-label="Next opponent"><i class="sh"></i><span>NEXT</span><svg viewBox="0 0 24 24" fill="none" stroke="url(#bwbNg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="bwbNg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6cf"/><stop offset=".55" stop-color="#ffd35a"/><stop offset="1" stop-color="#d9962a"/></linearGradient></defs><path d="M5.5 5l7 7-7 7"/><path d="M12.5 5l7 7-7 7"/></svg></button><div class="bwb-ann"></div><div class="bwb-hint">Drag a ring to send it · one order each, heroes any time</div>

    <div class="bwb-sp">${spells.map((k) => `<div class="s" data-s="${k}" style="--g:${SPELLS[k].glow}">${spellIcon(k, 48)}<b>×0</b></div>`).join('')}</div>
    <div class="bwb-ab">${types.filter((t) => ABIL[t]).map((t) => `<div class="a off" data-ab="${t}" aria-label="${ABIL[t].label}" style="--g:${ABIL[t].col}">${heroNeon(ABIL[t].art, ABIL[t].col, 54)}<i></i><b>×1</b></div>`).join('')}</div>
    ${onTool ? `<div class="bwb-sqt" data-m="go">${toolSet.scout ? `<button class="t pre" data-tool="scout" aria-label="Defence reach">${abilOrb('scout', 42)}</button>` : ''}${toolSet.squad ? `<button class="t go" data-tool="half" aria-label="Half of the squad">${abilOrb('half', 42)}</button><button class="t go" data-tool="focus" aria-label="Focus one building">${abilOrb('focus', 42)}</button>` : ''}</div>
    <div class="bwb-pc"></div><div class="bwb-dc"></div>` : ''}
    <div class="bwb-bars"></div><div class="bwb-toast"></div><div class="bwb-res"></div>
    <div class="bwb-cf" role="dialog" aria-modal="true"><div class="cd"><h3></h3><p></p><div class="bt"><button class="no" data-c="no"></button><button class="yes" data-c="yes"></button></div></div></div>`;
  root.appendChild(el);
  const foeTitle = `${crestImg(target.emblem, 26, 'crest', 'display:inline-block;vertical-align:middle;margin-inline-end:6px')}${esc(target.name)}`;
  const loadV = loader || createLoadView(el, { title: foeTitle, sub: 'Marching out…', z: 40 }).show();
  if (loader) { el.appendChild(loader.el); loader.el.style.zIndex = '40'; loader.setTitle(foeTitle).noCancel().rebase(); loader.progress(0, 'Marching out…'); }
  const q = (s) => el.querySelector(s);
  const pad = q('.bwb-pad'), tm = q('.bwb-tm'), dmI = q('.bwb-dm i'), dmB = q('.bwb-dm b'), stars = [...el.querySelectorAll('.bwb-stars svg')], lootEl = q('.bwb-loot'), ann = q('.bwb-ann'),
    hint = q('.bwb-hint'), bars = q('.bwb-bars'), toastEl = q('.bwb-toast'), res = q('.bwb-res'), endBtn = q('.bwb-end'), nextBtn = q('.bwb-next');
  const sqt = q('.bwb-sqt'), pcEl = q('.bwb-pc'), dcEl = q('.bwb-dc');
  const barMap = new Map();
  const abc = {}; for (const c of el.querySelectorAll('.bwb-ab .a')) abc[c.dataset.ab] = { el: c, n: c.querySelector('i'), b: c.querySelector('b'), cnt: 1, k: '' };
  const spc = {}; for (const c of el.querySelectorAll('.bwb-sp .s')) spc[c.dataset.s] = { el: c, n: c.querySelector('b'), v: -1 };
  const cache = {};
  const set = (k, node, v, prop = 'textContent') => { if (cache[k] !== v) { cache[k] = v; node[prop] = v; } };

  el.addEventListener('click', (e) => {
    const sp = e.target.closest('.bwb-sp .s'); if (sp && spc[sp.dataset.s]) { onSpell && onSpell(sp.dataset.s); return; }
    const ab = e.target.closest('.bwb-ab .a'); if (ab) { onAbility && onAbility(ab.dataset.ab); return; }
    const tl = e.target.closest('.bwb-sqt .t'); if (tl) { onTool && onTool(tl.dataset.tool); return; }
    if (e.target.closest('[data-a="next"]')) { if (onNext) onNext(); return; }
    if (e.target.closest('[data-a="end"]')) onEnd && onEnd();
  });
  // a real question in the middle of a fight (the old red RETREAT? pill was read as "restart"): Cancel the battle? No / Yes
  const cf = q('.bwb-cf'); let cfYes = null, cfNo = null;
  const closeCf = () => { cf.classList.remove('on'); cfYes = cfNo = null; };
  cf.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-c]'); if (!b) { if (e.target === cf) { const f = cfNo; closeCf(); f && f(); } return; }
    e.stopPropagation(); const f = b.dataset.c === 'yes' ? cfYes : cfNo; closeCf(); f && f();
  });
  let askT = 0;
  const api = {
    el, pad,
    progress(f, txt) { loadV.progress(f, txt); },
    ready() { loadV.progress(1); loadV.hide(); },
    endLook(started) { if (cache.st === started) return; cache.st = started; endBtn.classList.toggle('home', !started); endBtn.setAttribute('aria-label', started ? 'Retreat' : 'Home'); if (started) endBtn.textContent = '✕'; else endBtn.innerHTML = HOME_SVG + '<span>HOME</span>'; },
    confirm({ title, text, yes, no }, onYes, onNo) { cf.querySelector('h3').textContent = title; cf.querySelector('p').textContent = text; cf.querySelector('.yes').textContent = yes; cf.querySelector('.no').textContent = no; cfYes = onYes; cfNo = onNo; cf.classList.add('on'); },
    closeConfirm() { closeCf(); },
    ask(on) { endBtn.classList.toggle('ask', on); endBtn.classList.toggle('home', false); if (on) endBtn.textContent = 'RETREAT?'; else { cache.st = null; api.endLook(cache.started); } clearTimeout(askT); if (on) askT = setTimeout(() => api.ask(false), 3000); },
    update({ left, des, starsN, loot, started, spellN = {}, selSpell = null, abil = {}, tools = null }) {
      set('tm', tm, fmtTime(left)); tm.classList.toggle('low', started && left <= 20);
      set('des', dmB, Math.floor(des) + '%'); const w = Math.min(100, des).toFixed(1) + '%'; if (cache.dw !== w) { cache.dw = w; dmI.style.width = w; }
      stars.forEach((s, i) => s.classList.toggle('on', i < starsN));
      // before the first soldier is sent: the loot on offer (the reason to attack this one - or press NEXT); afterwards: what has been taken so far / what was on offer
      const avail = target.loot || {}, L = started ? loot : avail, win = winCups(target.ratio, starsN), full = Math.round(cupFull(target.ratio)), lk = (started ? 'e' : 'a') + win + '/' + full + (L ? GORD.filter((g) => g in L).map((g) => g + L[g]).join() : '');
      if (cache.loot !== lk && L) {
        cache.loot = lk;
        lootEl.innerHTML = GORD.filter((g) => g in L).map((g) => `<span>${GEMS[g] || ''}<b>${started ? fmtL(L[g]) + (avail[g] ? '<small>/' + fmtL(avail[g]) + '</small>' : '') : '+' + fmtL(L[g])}</b></span>`).join('') + `<span class="cup">${CUP()}<b>${started ? win + '<small>/' + full + '</small>' : '+' + full}</b></span>`;
      }
      if (cache.nx !== !started) { cache.nx = !started; nextBtn.style.display = started ? 'none' : 'flex'; el.classList.toggle('nx', !started); }
      for (const k of Object.keys(spc)) { const c = spc[k], n = spellN[k] || 0; if (c.v !== n) { c.v = n; c.n.textContent = '×' + n; c.el.classList.toggle('dead', n <= 0); } c.el.classList.toggle('sel', selSpell === k); }
      for (const t of Object.keys(abc)) {                                          // hero powers: ready (pulsing) / cooling down (sweep + seconds) / not sent yet or dead (grey)
        const c = abc[t], a = abil[t] || { n: 0, sent: false, f: 0, left: 0, ready: false };
        if (c.cnt !== a.n) { c.cnt = a.n; c.b.textContent = '×' + a.n; c.el.classList.toggle('multi', a.n > 1); }                 // p35 K2: up to 3 of a hero: the one button works for all of them, the badge says how many are alive
        const st = a.n <= 0 || !a.sent ? 'off' : a.ready ? 'rdy' : 'cd', k = st + (st === 'cd' ? Math.ceil(a.left) + ':' + a.f.toFixed(2) : '');
        if (c.k !== k) { if (c.k === 'off' || c.k === '') { if (st !== 'off') { c.el.classList.remove('pop'); void c.el.offsetWidth; c.el.classList.add('pop'); } } c.k = k; c.el.classList.toggle('off', st === 'off'); c.el.classList.toggle('rdy', st === 'rdy'); c.el.classList.toggle('cd', st === 'cd'); c.el.style.setProperty('--f', st === 'cd' ? a.f.toFixed(3) : '0'); c.n.textContent = st === 'cd' ? String(Math.ceil(a.left)) : ''; }
      }
      if (sqt) { const k = tools ? (tools.show ? 1 : 0) + ':' + (tools.half ? 1 : 0) + (tools.focus ? 1 : 0) + (tools.scout ? 1 : 0) + (started ? 'g' : 'p') : 'x'; if (cache.tl !== k) { cache.tl = k; sqt.dataset.m = started ? 'go' : 'pre'; sqt.classList.toggle('on', !!(tools && tools.show)); for (const b of sqt.querySelectorAll('.t')) b.classList.toggle('sel', !!(tools && tools[b.dataset.tool])); } }
      cache.started = started; if (!endBtn.classList.contains('ask')) api.endLook(started);
      hint.classList.toggle('off', started);
      if (!started) set('hint', hint, selSpell ? 'Tap the battlefield to cast ' + SPELLS[selSpell].name : 'Drag a ring to send it · one order each, heroes any time');
    },
    // S8: the % chips (what each part of the base is worth) and the defence card; null hides them
    scoutPanel(chips, card) {
      if (!pcEl) return;
      pcEl.classList.toggle('on', !!(chips && chips.length)); pcEl.innerHTML = chips ? chips.map((c) => `<span>${esc(c.k)}<b>${Math.round(c.p * 100)}%</b></span>`).join('') : '';
      dcEl.classList.toggle('on', !!card); dcEl.innerHTML = card ? `<h4>${esc(card.name)}<i>${esc(card.hits)}</i></h4><p>${esc(card.line)}</p>` : '';
    },
    announce(text) { ann.textContent = text; ann.classList.remove('go'); void ann.offsetWidth; ann.classList.add('go'); },
    toast(msg) { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(api._tt); api._tt = setTimeout(() => toastEl.classList.remove('on'), 2200); },
    // world-space bars: list of {id, x, y, k (0..1), u (own unit), sc} in CSS pixels. One element per entity (so the trailing "ghost" bar, the hit flash and the heal glow belong to it).
    bars(list) {
      const seen = new Set();
      for (const b of list) {
        seen.add(b.id);
        let e = barMap.get(b.id);
        if (!e) {
          const el = document.createElement('div'); el.className = 'hb';
          el.innerHTML = `<s class="fr"></s><i class="gh"></i><i class="fl"></i><s class="tk"></s><u>+</u>`;
          bars.appendChild(el); e = { el, k: b.k, gh: el.querySelector('.gh'), fl: el.querySelector('.fl'), tm: 0 }; barMap.set(b.id, e);
          el.style.setProperty('--k', b.k.toFixed(3)); e.gh.style.setProperty('--k', b.k.toFixed(3));
          requestAnimationFrame(() => el.classList.add('on'));
        }
        const el = e.el, k = Math.max(0.02, Math.min(1, b.k));
        el.style.transform = `translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px) scale(${(b.sc || 1).toFixed(2)})`;
        if (Math.abs(k - e.k) > 0.002) {
          const dmg = k < e.k;
          el.style.setProperty('--k', k.toFixed(3));
          e.flip ^= 1;                                                                                                    // (alternating class names restart a CSS animation without a forced reflow)
          if (dmg) { el.classList.remove('hit', 'hit2'); el.classList.add(e.flip ? 'hit' : 'hit2'); }                          // (the ghost keeps its old width and drains after a beat)
          else { e.gh.style.transition = 'none'; e.gh.style.setProperty('--k', k.toFixed(3)); clearTimeout(e.gt); e.gt = setTimeout(() => { e.gh.style.transition = ''; }, 40); el.classList.remove('heal', 'heal2'); el.classList.add(e.flip ? 'heal' : 'heal2'); }
          e.k = k; if (dmg) { clearTimeout(e.tm); e.tm = setTimeout(() => e.gh.style.setProperty('--k', e.k.toFixed(3)), 30); }
        }
        const cls = b.u ? 'g' : '';                                                                                          // (green light = mine, red light = the enemy's)
        if (e.cls !== cls) { if (e.cls) el.classList.remove(e.cls); if (cls) el.classList.add(cls); e.cls = cls; }
        el.classList.toggle('low', k < 0.28);
      }
      for (const [id, e] of barMap) if (!seen.has(id)) { barMap.delete(id); e.el.classList.remove('on'); e.el.classList.add('out'); setTimeout(() => e.el.remove(), 320); }
    },
    showResults(r, { onHome, onNext }) {
      const lootHtml = Object.keys(r.loot).map((g) => `<span>${GEMS[g] || ''}<b data-n="${r.loot[g]}">0</b></span>`).join('');
      const keys = DEFS.order.filter((t) => (r.sent[t] || 0) > 0);
      const spk = Object.keys(r.spells || {}).filter((k) => SPELLS[k] && r.spells[k] > 0);
      const un0 = spk.map((k) => `<div>${spellIcon(k, 18)}<span>${SPELLS[k].name}</span><em class="l">&nbsp;×${r.spells[k]}</em></div>`).join('');
      const un = un0 + keys.map((t) => `<div>${icon(t, 18)}<span>${NAME[t]}</span><em>${(r.sent[t] || 0) - (r.lost[t] || 0)} back</em>${r.lost[t] ? `<em class="l">&nbsp;−${r.lost[t]}</em>` : ''}</div>`).join('');
      // (p33 S10) where the damage came from + one hint: only when the battle hands them over (r.by / r.hint)
      const dmgHtml = r.by && r.by.length ? `<div class="dmg"><h3>Damage you took</h3>${r.by.map((x) => `<div><span>${esc(x.k)}</span><i style="--w:${Math.max(3, Math.round(x.p * 100))}%"></i><em>${Math.round(x.p * 100)}%</em></div>`).join('')}</div>` : '';
      const tipHtml = r.hint ? `<div class="tip"><b>TIP</b><span>${esc(r.hint)}</span></div>` : '';
      res.innerHTML = `<div class="bwb-card"><h2 class="${r.stars ? '' : 'lose'}">${r.stars ? 'VICTORY' : 'DEFEAT'}</h2><div class="vs">vs ${esc(target.name)}</div>
        <div class="big">${STAR}${STAR}${STAR}</div>
        ${r.cups ? `<div class="cup${r.cups < 0 ? ' lose' : ''}">${CUP('gem3')}<b>${r.cups > 0 ? '+' : '−'}${Math.abs(r.cups)}</b></div>` : ''}
        <div class="rows"><div><b data-n="${Math.floor(r.destruction)}" data-s="%">0%</b>destroyed</div><div><b>${fmtTime(r.time)}</b>time</div><div><b>${r.razed}/${r.buildings}</b>buildings</div></div>
        <div class="gl">${lootHtml}</div>${dmgHtml}${tipHtml}${keys.length || spk.length ? `<div class="un">${un}</div>` : ''}${r.note ? `<div class="note">${esc(r.note)}</div>` : ''}
        <div class="bt"><button data-b="home">HOME</button><button class="n" data-b="next" ${r.canNext ? '' : 'disabled'}>NEXT ▸</button></div></div>`;
      res.classList.add('on');
      const sv = [...res.querySelectorAll('.big svg')];
      sv.forEach((s, i) => setTimeout(() => { s.classList.add('in'); if (i < r.stars) setTimeout(() => s.classList.add('on'), 250); }, 350 + i * 420));
      const t0 = performance.now();
      const tick = () => { const k = Math.min(1, (performance.now() - t0) / 1500), e = 1 - (1 - k) ** 3; res.querySelectorAll('[data-n]').forEach((b) => { b.textContent = fmtN(+b.dataset.n * e) + (b.dataset.s || ''); }); if (k < 1 && res.isConnected) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      // (NEXT can fail or be cancelled: the card must come back alive - `resultsIdle()` - instead of being left with a dead '…' button)
      let busy = false; const nb = res.querySelector('[data-b="next"]'), nt = nb && nb.textContent;
      api.resultsIdle = () => { busy = false; if (nb && nb.isConnected) { nb.textContent = nt; nb.disabled = !r.canNext; } };
      res.onclick = (e) => {
        const b = e.target.closest('[data-b]'); if (!b || b.disabled || busy) return;
        if (b.dataset.b === 'home') { busy = true; res.onclick = null; onHome(); }
        else { busy = true; b.textContent = '…'; onNext(); }
      };
    },
    resultsIdle() {},
    dispose() { el.remove(); },
  };
  return api;
}
