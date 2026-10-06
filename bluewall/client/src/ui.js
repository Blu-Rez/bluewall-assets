// HUD overlay (English only, Libre Baskerville):
//  left  — crystal hex level badge (tap = settings) + player name plate
//  right — jewelled gem gauges: % / FULL, "count / capacity", steel bezel with a 3D gem
//  plus the info sheet, mine sheet, settings panel and the cinematic welcome card.
import { settings, onSetting, resetSettings } from './settings.js';
import { tr } from './i18n.js';
import ART from './hud_art.json';
import { BASE } from './assets.js';

const GEM_KEYS = ['ruby', 'emerald', 'turq'], PREM_KEYS = ['sap', 'onyx'];
// the gems are real 3D cut-gem renders (client/tools: gemgeo.js + gem icon renderer), not drawings
const gemImg = (k) => `<img class="gem3" alt="" draggable="false" decoding="async" src="${BASE}ui/gem_${k}.webp">`;
export const GEMS = Object.fromEntries([...GEM_KEYS, ...PREM_KEYS].map((k) => [k, gemImg(k)]));      // (+ the special gems: sap = deep-blue sapphire, onyx = black onyx)
const LQ = {
  ruby: { l: '#ff9aab', m: '#ee2a4c', d: '#8e0a26', g: '#ff5a76' },
  emerald: { l: '#9cf7c6', m: '#19c46c', d: '#05703a', g: '#3fe592' },
  turq: { l: '#d4fbff', m: '#35d6ff', d: '#0a7fb8', g: '#6fe8ff' },
};
const FONT = "'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif";

const CSS = `
.bw-ui{position:absolute;inset:0;overflow:hidden;overflow:clip;pointer-events:none;z-index:10;direction:ltr;text-align:left;font-family:${FONT};font-weight:700;color:#e6f2ff;
  --glass:rgba(3,8,20,.72);--line:rgba(120,190,255,.32);
  --st:calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px));--sb:var(--tg-safe-area-inset-bottom,0px);--sl:calc(var(--tg-safe-area-inset-left,0px) + var(--tg-content-safe-area-inset-left,0px));--sr:calc(var(--tg-safe-area-inset-right,0px) + var(--tg-content-safe-area-inset-right,0px));--hs:.64}
.bw-ui .num{color:#fff;white-space:nowrap;text-shadow:0 1.5px 0 #01060f,1px 0 0 #01060f,-1px 0 0 #01060f,0 -1px 0 #01060f,0 0 5px rgba(0,0,0,.7)}
.bw-top{position:absolute;left:0;right:0;top:0;height:calc(var(--st) + 120px);background:linear-gradient(rgba(0,6,20,.5),rgba(0,6,20,0));pointer-events:none}
/* ---- level badge + name (top LEFT), the two special gems directly under them side by side; the three mined gems stay on the RIGHT. The Assist button is the only button on the HUD */
.bw-ui{--u:calc(var(--hs) / .64)}
.bw-lvl{pointer-events:auto;position:absolute;left:calc(8px + var(--sl));top:calc(var(--st) + 8px);width:60px;height:60px;cursor:pointer;-webkit-tap-highlight-color:transparent;transform:scale(calc(var(--u) * .8));transform-origin:0 0;z-index:2}
.bw-lvl:active{transform:scale(calc(var(--u) * .75))}
.bw-ui>.bw-top,.bw-ui>.bw-lvl,.bw-ui>.bw-who,.bw-ui>.bw-gems{transition:opacity .8s ease}
.bw-ui.wel>.bw-top,.bw-ui.wel>.bw-lvl,.bw-ui.wel>.bw-who,.bw-ui.wel>.bw-gems{opacity:0}
.bw-lvl .lvn{position:absolute;left:0;right:0;top:19px;text-align:center;font-size:19px}
.bw-lvl .gear{position:absolute;left:39px;top:39px}
.bw-who{position:absolute;left:calc(8px + var(--sl) + 33px * var(--u));top:calc(var(--st) + 11px * var(--u));transform:scale(var(--u));transform-origin:0 0;width:150px;box-sizing:border-box;padding:5px 14px 5px 22px;border-radius:0 14px 14px 0;text-align:left;
  background:linear-gradient(90deg,rgba(6,18,44,.82),rgba(6,18,44,.62) 70%,rgba(6,18,44,.35));border:1px solid rgba(150,205,255,.32);border-left:0;box-shadow:0 3px 9px rgba(0,0,0,.4);pointer-events:none}
.bw-who .nm{unicode-bidi:plaintext;font-size:14.5px;letter-spacing:.3px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bw-who .sub{display:flex;align-items:center;gap:4px;margin-top:1px;font-size:11px;line-height:14px;color:#9fd2ff;font-variant-numeric:tabular-nums}.bw-who .sub svg{width:12px;height:12px}
/* ---- gem capsules (top right) */
.bw-gems{position:absolute;right:calc(10px + var(--sr));top:calc(var(--st) + 10px);width:128px;display:flex;flex-direction:column;gap:7px;pointer-events:none;transform:scale(var(--u));transform-origin:100% 0}
.bw-g{position:relative;height:28px;border-radius:14px;background:linear-gradient(180deg,rgba(28,60,120,.9),rgba(4,12,32,.94));border:1px solid rgba(150,205,255,.42);box-shadow:0 3px 9px rgba(0,0,0,.45),inset 0 1px 0 rgba(200,232,255,.24)}
.bw-g .gm{position:absolute;left:-8px;top:-6px;width:38px;height:38px;z-index:2}
.bw-g .ct{position:absolute;left:30px;right:10px;top:1px;display:flex;align-items:baseline;justify-content:flex-end;gap:3px;white-space:nowrap;font-size:14px;line-height:21px}
.bw-g .ct small{font-size:9.5px;color:#9fc4ea;font-weight:700}
.bw-g .tk{position:absolute;left:32px;right:11px;bottom:4px;height:3px;border-radius:2px;background:rgba(255,255,255,.13);overflow:hidden}
.bw-g .fl{height:100%;width:0;border-radius:2px;background:linear-gradient(90deg,var(--d),var(--m) 55%,var(--l));transition:width .9s cubic-bezier(.2,.8,.2,1)}
.bw-g.full{border-color:var(--gl)}
.bw-g.full .ct span{color:var(--l)}
.bw-g.full:after{content:"";position:absolute;inset:-2px;border-radius:16px;box-shadow:0 0 11px 2px var(--gl);opacity:.55;animation:bwFull 1.9s ease-in-out infinite;pointer-events:none}
@keyframes bwFull{50%{opacity:.12}}
.gem3{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55));pointer-events:none;user-select:none}
.bw-col i .gem3{width:26px;height:26px}
.bw-g.pop .gm{animation:bwPop .6s}
@keyframes bwPop{40%{transform:scale(1.2)}}
/* ---- the two special gems (left, directly under the level + name, side by side; together exactly as wide as the name box, never wider): deep-blue sapphire and black onyx. No vault and no gauge: they are bought or won; tap = the shop */
.bw-pm{position:absolute;left:calc(8px + var(--sl));top:calc(var(--st) + 8px + 58px * var(--u));display:flex;flex-direction:row;gap:3px;transform:scale(var(--u));transform-origin:0 0;pointer-events:none;transition:opacity .8s ease}
.bw-ui.wel>.bw-pm{opacity:0}
.bw-p{pointer-events:auto;position:relative;box-sizing:border-box;width:84px;height:28px;margin-left:6px;border-radius:14px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s;background:linear-gradient(180deg,var(--c1),var(--c2));border:1px solid var(--bd);box-shadow:0 3px 9px rgba(0,0,0,.45),inset 0 1px 0 var(--hl)}
.bw-p:active{transform:scale(.95)}
.bw-p .gm{position:absolute;left:-7px;top:-6px;width:36px;height:36px;z-index:2}
.bw-p .ct{position:absolute;left:28px;right:12px;top:0;text-align:right;font-size:13.5px;line-height:26px;white-space:nowrap}
.bw-p[data-p="sap"]{--c1:rgba(22,56,160,.96);--c2:rgba(2,8,40,.98);--bd:rgba(120,165,255,.7);--hl:rgba(170,200,255,.38)}
.bw-p[data-p="onyx"]{--c1:rgba(46,53,70,.98);--c2:rgba(1,2,5,.99);--bd:rgba(205,218,242,.6);--hl:rgba(232,240,255,.32)}
.bw-p.pop .gm{animation:bwPop .6s}
/* ---- misc */
.bw-fps{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--st) + 3px);font:700 10px ${FONT};color:#9fe3ff;background:rgba(0,0,0,.4);padding:2px 7px;border-radius:8px;display:none;pointer-events:none;white-space:nowrap}
.bw-toast{position:absolute;z-index:90;left:50%;transform:translateX(-50%);top:calc(var(--st) + 112px);max-width:86vw;width:max-content;box-sizing:border-box;text-align:center;line-height:1.35;padding:9px 16px;border-radius:18px;background:var(--glass);border:1px solid var(--line);font-size:13px;opacity:0;transition:opacity .6s;pointer-events:none}
.bw-toast.on{opacity:1}
.bw-sheet{pointer-events:auto;position:absolute;z-index:11;left:12px;right:12px;bottom:calc(var(--sb) + 14px);max-width:520px;margin:0 auto;padding:16px 18px 18px;border-radius:20px;background:linear-gradient(180deg,rgba(11,30,66,.95),rgba(3,8,20,.97));border:1px solid var(--line);box-shadow:0 10px 40px rgba(0,0,0,.55);transform:translateY(160%);transition:transform .45s cubic-bezier(.2,.9,.25,1.1)}
.bw-sheet.on{transform:none}
.bw-sheet .h{display:flex;align-items:center;gap:10px;font-size:18px;color:#d9f2ff}
.bw-sheet .h .e{font-size:24px}
.bw-sheet .d{margin-top:8px;font-size:13.5px;font-weight:400;line-height:1.75;color:#a9c4e6}
.bw-sheet .chip{display:inline-block;margin-top:10px;padding:5px 12px;border-radius:999px;background:rgba(95,182,255,.12);border:1px solid var(--line);font-size:12px;color:#9fd8ff}
.bw-x{position:absolute;right:12px;top:12px;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.07);font-size:14px;cursor:pointer;pointer-events:auto}
.bw-mine{margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bw-mine div{padding:8px 6px;border-radius:12px;background:rgba(95,182,255,.08);border:1px solid rgba(120,190,255,.2);text-align:center}
.bw-mine b{display:block;font-size:18px;color:#fff}.bw-mine span{font-size:10.5px;font-weight:400;color:#9fc4e8}
.bw-col{margin-top:12px;width:100%;padding:12px;border-radius:14px;border:1px solid #bfe6ff;background:linear-gradient(180deg,#5fb6ff,#1b4fb8);color:#fff;font:700 15px ${FONT};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 18px rgba(27,79,184,.45)}
.bw-col i svg{width:24px;height:24px;display:block}.bw-col:disabled{opacity:.45;filter:grayscale(.4)}
/* ---- settings */
.bw-set{position:absolute;inset:0;z-index:13;pointer-events:auto;background:rgba(0,3,10,.6);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
.bw-set.on{opacity:1;visibility:visible}
.bw-panel{position:absolute;left:max(22px,calc(var(--sl) + 16px));right:max(22px,calc(var(--sr) + 16px));top:calc(var(--st) + max(64px,12vh));bottom:calc(var(--sb) + max(64px,12vh));max-width:440px;margin:0 auto;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:linear-gradient(180deg,rgba(9,26,60,.97),rgba(2,6,16,.98));border:1px solid var(--line);box-shadow:0 20px 60px rgba(0,0,0,.65);transform:translateY(16px) scale(.98);transition:transform .3s}
.bw-set.on .bw-panel{transform:none}
.bw-ph{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(120,190,255,.18)}
.bw-ph .t{flex:1;font-size:18px;color:#d9f2ff}
.bw-kd{display:flex;gap:10px;padding:10px 16px 2px}
.bw-kd div{flex:1;padding:8px 10px;border-radius:12px;background:rgba(95,182,255,.07);border:1px solid rgba(120,190,255,.18)}
.bw-kd span{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:#7fb4e6}
.bw-kd b{display:block;margin-top:3px;font-size:15px;color:#fff}
.bw-tabs{display:flex;gap:6px;padding:10px 12px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid rgba(120,190,255,.12)}
.bw-tabs::-webkit-scrollbar{display:none}
.bw-tab{flex:0 0 auto;padding:7px 12px;border-radius:12px;font-size:13px;color:#a9bfe0;background:rgba(255,255,255,.04);border:1px solid transparent;cursor:pointer;white-space:nowrap}
.bw-tab.on{color:#03122b;background:linear-gradient(180deg,#d9f2ff,#6fc0ff);border-color:#bfe6ff}
.bw-body{flex:1;overflow-y:auto;padding:8px 16px 18px;-webkit-overflow-scrolling:touch}
.bw-row{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.bw-row .l{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#dce9fb;gap:10px}
.bw-row .v{font-size:13px;color:#8fd3ff}
.bw-row input[type=range]{width:100%;margin-top:10px;-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;background:linear-gradient(90deg,#4aa8ff var(--p,50%),rgba(255,255,255,.12) var(--p,50%));outline:none}
.bw-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#6fc0ff);border:2px solid #0b2a5c;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.bw-row input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#6fc0ff;border:2px solid #0b2a5c}
.bw-seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.bw-seg span{padding:7px 11px;border-radius:10px;font-size:12.5px;color:#c4d4ee;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);cursor:pointer}
.bw-seg span.on{color:#03122b;background:linear-gradient(180deg,#d9f2ff,#6fc0ff);border-color:#bfe6ff}
.bw-tg{width:46px;height:26px;border-radius:26px;background:rgba(255,255,255,.12);position:relative;cursor:pointer;flex:0 0 auto;transition:background .2s}
.bw-tg::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#dfe7f6;transition:transform .2s}
.bw-tg.on{background:linear-gradient(90deg,#1b4fb8,#4aa8ff)}.bw-tg.on::after{transform:translateX(20px)}
.bw-btnw{margin-top:16px;width:100%;padding:11px;border-radius:12px;border:1px solid var(--line);background:rgba(95,182,255,.08);color:#9fd8ff;font:700 13px ${FONT};cursor:pointer}
.bw-about h3{margin:10px 0 4px;color:#d9f2ff;font-size:16px}.bw-about p{margin:6px 0;color:#a9c4e6;font-size:13px;font-weight:400;line-height:1.8}
.bw-cred{font-size:12px;font-weight:400;line-height:1.7;color:#cfdaf0;margin-top:8px}
.bw-cred div{padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.07)}.bw-cred b{color:#8fd3ff}.bw-cred .lc{color:#6f9fd0;font-size:11px}
.bw-cred h4{margin:14px 0 4px;color:#5fb6ff;letter-spacing:1px;font-size:12px}
/* ---- welcome card (over the live scene) */
.bw-wel{position:absolute;inset:0;pointer-events:auto;z-index:30;overflow:hidden;cursor:pointer;opacity:1;transition:opacity .8s ease}
.bw-wel.out{opacity:0;pointer-events:none}
.bw-wel .bg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 45%,rgba(10,30,70,.62),rgba(2,6,18,.93))}
.bw-wel .grade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,44,96,.30),rgba(5,12,30,.06) 40%,rgba(2,6,16,.55))}
.bw-wel .rays{position:absolute;left:50%;top:-30%;width:180%;height:120%;margin-left:-90%;background:repeating-conic-gradient(from 0deg at 50% 0%,rgba(140,200,255,.0) 0deg 6deg,rgba(140,200,255,.07) 6deg 9deg);
  -webkit-mask-image:radial-gradient(60% 70% at 50% 0%,#000,transparent);mask-image:radial-gradient(60% 70% at 50% 0%,#000,transparent);opacity:.9}
.bw-wel canvas{position:absolute;inset:0;width:100%;height:100%}
.bw-wel .lb{position:absolute;left:0;right:0;height:11vh;background:#000;transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}
.bw-wel .lb.t{top:0;transform:translateY(-100%)}.bw-wel .lb.b{bottom:0;transform:translateY(100%)}
.bw-wel.in .lb{transform:none}
.bw-wel .blk{position:absolute;left:0;right:0;top:50%;transform:translateY(-55%);text-align:center}
.bw-wel .blk>*{opacity:0;transform:translateY(14px);transition:opacity 1.1s ease,transform 1.1s cubic-bezier(.2,.8,.2,1)}
.bw-wel.in .blk>*{opacity:1;transform:none}
.bw-wel .pre{font-size:15px;letter-spacing:9px;padding-left:9px;color:#dcefff;text-shadow:0 0 18px rgba(120,190,255,.6);transition-delay:.35s}
.bw-wel .lord{margin-top:8px;font-size:clamp(46px,15vw,64px);line-height:1.08;letter-spacing:.5px;
  background:linear-gradient(180deg,#ffffff 0%,#dff1ff 40%,#8fc8ff 78%,#4e93ea 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 2px 0 rgba(1,8,24,.9)) drop-shadow(0 0 22px rgba(90,170,255,.55));transition-delay:.6s}
.bw-wel .dv{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px auto 14px;transition-delay:.9s}
.bw-wel .dv b{width:80px;height:1px;background:linear-gradient(90deg,rgba(207,234,255,0),#cfeaff)}.bw-wel .dv b:last-child{transform:scaleX(-1)}
.bw-wel .dv i{width:8px;height:8px;transform:rotate(45deg);border:1.2px solid #cfeaff;box-shadow:0 0 8px rgba(120,200,255,.9)}
.bw-wel .dt{font-size:17px;letter-spacing:5px;padding-left:5px;color:#eaf6ff;text-shadow:0 0 14px rgba(110,190,255,.6),0 2px 0 #000;transition-delay:1.1s}
.bw-wel .tm{margin-top:8px;font-size:12px;letter-spacing:4px;padding-left:4px;text-transform:uppercase;color:#a9d6ff;text-shadow:0 2px 0 #000;transition-delay:1.25s}
.bw-wel .rp{width:min(326px,calc(100% - 36px));margin:18px auto 0;padding:11px 12px 10px;box-sizing:border-box;border-radius:18px;text-align:left;background:linear-gradient(180deg,rgba(14,36,82,.78),rgba(3,9,24,.82));border:1px solid rgba(150,205,255,.42);box-shadow:0 10px 30px rgba(0,0,0,.55),inset 0 1px 0 rgba(200,230,255,.2);transition-delay:1.5s}
.bw-wel .rp h4{margin:0 0 7px;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#9fd8ff;text-align:center}
.bw-wel .rp .rw{display:flex;align-items:center;gap:9px;padding:7px 4px;border-top:1px solid rgba(150,205,255,.16)}
.bw-wel .rp .rw:first-of-type{border-top:0}
.bw-wel .rp .ic{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#ffb3c0;background:rgba(255,120,140,.14);border:1px solid rgba(255,150,170,.4)}
.bw-wel .rp .rw.ok .ic{color:#9ff0c8;background:rgba(110,240,180,.12);border-color:rgba(130,240,190,.4)}
.bw-wel .rp .mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.bw-wel .rp .mid b{font-size:13.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bw-wel .rp .mid span{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:400;color:#a9c9ee;white-space:nowrap}
.bw-wel .rp .mid i{display:inline-flex;align-items:center;gap:2px;font-style:normal;color:#ffc2cc;font-weight:700}
.bw-wel .rp .mid i .gem3{width:14px;height:14px}
.bw-wel .rp .cu{flex:0 0 auto;text-align:right;font-size:16px;color:#ff9fb0;font-variant-numeric:tabular-nums;line-height:1}
.bw-wel .rp .cu small{display:block;margin-top:2px;font-size:9px;font-weight:400;letter-spacing:1px;color:#a9c9ee;text-transform:uppercase}
.bw-wel .rp .rw.ok .cu{color:#8ff0c0}
.bw-wel .rp .more{padding:5px 0 0;font-size:11px;font-weight:400;text-align:center;color:#a9c9ee;border-top:1px solid rgba(150,205,255,.16)}
.bw-wel.has-rp .blk{top:11vh;bottom:11vh;transform:none;display:flex;flex-direction:column;justify-content:center}
.bw-wel.has-rp .lord{font-size:clamp(36px,11.5vw,50px)}.bw-wel.has-rp .dv{margin:10px auto 8px}
@media (max-height:620px){.bw-wel .rp .rw:nth-of-type(n+3){display:none}.bw-wel.has-rp .lord{font-size:34px}.bw-wel.has-rp .rp{margin-top:10px}}
.bw-wel .tap{position:absolute;left:0;right:0;bottom:calc(5.5vh - 7px);text-align:center;font-size:11px;letter-spacing:6px;padding-left:6px;text-transform:uppercase;color:#9fc8ef;opacity:0;transition:opacity 1s ease 1.8s}
.bw-wel.in .tap{opacity:.85;animation:bwTap 2.4s ease-in-out 2.8s infinite}
@keyframes bwTap{50%{opacity:.35}}
/* ---- very narrow phones (320px): the whole HUD scales down a little so the left group never touches the gems on the right */
@media (max-width:340px){.bw-ui{--hs:.56}}
/* ---- landscape phones: the sheet moves to the side so it never covers the middle of the view */
@media (orientation:landscape) and (max-height:560px){
  .bw-ui{--hs:.58}
  .bw-sheet{left:auto;right:calc(12px + var(--sr));width:min(360px,44vw);margin:0;max-height:calc(100% - var(--st) - 120px);overflow:auto;padding:12px 14px 14px}
  .bw-panel{max-width:560px;left:calc(14px + var(--sl));right:calc(14px + var(--sr));top:calc(var(--st) + 22px);bottom:calc(var(--sb) + 22px)}
  .bw-toast{top:calc(var(--st) + 78px)}
}
`;

const SCHEMA = {
  sound: [['master', 'range', 0, 1, 0.05, '%'], ['music', 'range', 0, 1, 0.05, '%'], ['ambience', 'range', 0, 1, 0.05, '%'], ['characters', 'range', 0, 1, 0.05, '%'], ['effects', 'range', 0, 1, 0.05, '%'], ['voice', 'toggle'], ['bgMute', 'toggle']],
  graphics: [['quality', 'seg', ['auto', 'low', 'medium', 'high', 'ultra'], true], ['shadows', 'toggle'], ['bloom', 'toggle'], ['resScale', 'range', 0.5, 1, 0.05, '%'], ['fps', 'seg', [30, 60]], ['idleEco', 'toggle'], ['fpsMeter', 'toggle'], ['coolMode', 'toggle'], ['perfInfo', 'toggle'], ['shake', 'toggle']],
  controls: [['rotSpeed', 'range', 0.5, 2, 0.1, 'x'], ['zoomSpeed', 'range', 0.5, 2, 0.1, 'x'], ['invertRotate', 'toggle'], ['haptics', 'toggle']],
  about: null,
};
const CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor" fill-opacity=".25"/><path d="M7 6H4.5v1.6A3.2 3.2 0 0 0 7.7 10.8M17 6h2.5v1.6a3.2 3.2 0 0 1-3.2 3.2M12 14v4M8 20h8"/></svg>';
const fmt = (n) => (n = Number.isFinite(+n) ? Math.max(0, +n) : 0, n >= 1e7 ? Math.floor(n / 1e6) + 'M' : n >= 1e6 ? (Math.floor(n / 1e5) / 10).toFixed(1) + 'M' : n >= 1e5 ? Math.floor(n / 1e3) + 'K' : n >= 1e4 ? (Math.floor(n / 100) / 10).toFixed(1) + 'K' : Math.floor(n).toLocaleString('en-US'));

const SHIELD_I = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/></svg>';
const starI = (on) => `<svg viewBox="0 0 24 24" width="12" height="12" style="display:block"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z" fill="${on ? '#ffcf45' : 'rgba(255,255,255,.12)'}" stroke="${on ? '#a8780a' : 'rgba(255,255,255,.18)'}" stroke-width="1"/></svg>`;
const escH = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const agoS = (s) => (s < 90 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago');
// the "while you were away" panel of the welcome card: who attacked, what it cost in cups and gems (at most 3 raids, the rest are counted)
export function raidReport(raids) {
  const now = Date.now() / 1000, lost = raids.filter((r) => r.stars > 0 || (r.tro || 0) < 0 || Object.keys(r.loot || {}).length), n = raids.length;
  const head = lost.length ? (n === 1 ? 'Raided while you were away' : `${n} raids while you were away`) : (n === 1 ? 'Your walls held' : `Your walls held ${n} times`);
  const rows = raids.slice(0, 3).map((r) => {
    const held = !(r.stars > 0), tro = Math.round(r.tro || 0);
    const gems = Object.entries(r.loot || {}).filter(([g, v]) => v > 0 && GEMS[g]).map(([g, v]) => `<i>${GEMS[g]}−${fmt(v)}</i>`).join('');
    const cup = tro ? `<div class="cu">${tro > 0 ? '+' : '−'}${Math.abs(tro)}<small>cups</small></div>` : '<div class="cu"></div>';
    return `<div class="rw${held ? ' ok' : ''}"><div class="ic">${SHIELD_I}</div><div class="mid"><b>${held ? 'Held against ' : 'Raided by '}${escH(r.who || 'a stranger')}</b>`
      + `<span>${held ? '' : [1, 2, 3].map((k) => starI(k <= r.stars)).join('') + '<em style="font-style:normal">' + Math.round(r.pct || 0) + '%</em>'}<em style="font-style:normal">${agoS(Math.max(0, now - (r.t || now)))}</em></span>${gems ? `<span>${gems}</span>` : ''}</div>${cup.replace('class="cu"', 'class="cu' + (tro > 0 ? ' up' : '') + '"')}</div>`;
  }).join('');
  const more = n > 3 ? `<div class="more">+ ${n - 3} more in your Log</div>` : '';
  return `<div class="rp"><h4>${head}</h4>${rows}${more}</div>`;
}
export class UI {
  constructor(opts) {
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const root = document.createElement('div'); root.className = 'bw-ui';
    (opts.mount || document.body).appendChild(root);
    this.root = root; this.tg = opts.tg; this.opts = opts; this.tab = 'sound'; this.shown = {}; this.prof = { name: '', level: 1 };
    this.build();
    onSetting((k) => { if (k === 'fpsMeter') this.fps.style.display = settings.fpsMeter ? 'block' : 'none'; });
  }
  build() {
    const t = tr(), root = this.root;
    root.innerHTML = `<div class="bw-top"></div>
      <div class="bw-lvl" data-a="set">${ART.badge}<div class="lvn num">1</div><div class="gear">${ART.gear}</div></div>
      <div class="bw-who"><div class="nm num"></div><div class="sub"></div></div>
      <div class="bw-gems">${GEM_KEYS.map((k) => `<div class="bw-g" data-g="${k}" style="--l:${LQ[k].l};--m:${LQ[k].m};--d:${LQ[k].d};--gl:${LQ[k].g}">
        <div class="gm">${GEMS[k]}</div><div class="ct num"><span>0</span><small>/ 0</small></div><div class="tk"><div class="fl"></div></div></div>`).join('')}</div>
      <div class="bw-pm">${PREM_KEYS.map((k) => `<div class="bw-p" data-p="${k}" role="button" aria-label="${k === 'sap' ? 'Sapphire' : 'Onyx'}"><div class="gm">${GEMS[k]}</div><div class="ct num"><span>0</span></div></div>`).join('')}</div>
      <div class="bw-fps"></div>
      <div class="bw-toast"></div>
      <div class="bw-sheet"><div class="bw-x" data-a="close">✕</div><div class="h"><span class="e"></span><span class="t"></span></div><div class="d"></div><div class="bw-mx"></div><span class="chip">${t.soon}</span></div>
      <div class="bw-set"><div class="bw-panel"><div class="bw-ph"><span class="t">${t.settings}</span><div class="bw-x" style="position:static" data-a="setclose">✕</div></div>
        <div class="bw-kd"><div><span>${t.kingdom.date}</span><b class="kd-d">—</b></div><div><span>${t.kingdom.time}</span><b class="kd-t">—</b></div></div>
        <div class="bw-tabs"></div><div class="bw-body"></div></div></div>`;
    const q = (s) => root.querySelector(s);
    this.sheet = q('.bw-sheet'); this.fps = q('.bw-fps'); this.set = q('.bw-set'); this.toastEl = q('.bw-toast');
    this.fps.style.display = settings.fpsMeter ? 'block' : 'none';
    this.rows = {};
    for (const k of GEM_KEYS) { const el = q(`[data-g="${k}"]`); this.rows[k] = { el, n: el.querySelector('.ct span'), cap: el.querySelector('.ct small'), fl: el.querySelector('.fl') }; }
    this.prows = {};
    for (const k of PREM_KEYS) { const el = q(`[data-p="${k}"]`); this.prows[k] = { el, n: el.querySelector('.ct span') }; el.addEventListener('click', () => { this.haptic('light'); this.opts.onShop && this.opts.onShop(k); }); }
    q('[data-a="close"]').addEventListener('click', () => this.hide());
    q('[data-a="set"]').addEventListener('click', () => { this.haptic('light'); this.opts.onClick && this.opts.onClick(); this.openSettings(true); });
    q('[data-a="setclose"]').addEventListener('click', () => this.openSettings(false));
    this.set.addEventListener('click', (e) => { if (e.target === this.set) this.openSettings(false); });
    this.renderTabs();
  }
  get settingsOpen() { return this.set.classList.contains('on'); }
  openSettings(on) { this.set.classList.toggle('on', on); if (on) { this.paintClock(); this.renderBody(); } }
  renderTabs() {
    const t = tr(), tabs = this.root.querySelector('.bw-tabs');
    tabs.innerHTML = Object.keys(SCHEMA).map((k) => `<div class="bw-tab${k === this.tab ? ' on' : ''}" data-t="${k}">${t.tabs[k]}</div>`).join('');
    tabs.querySelectorAll('.bw-tab').forEach((el) => el.addEventListener('click', () => { this.tab = el.dataset.t; this.haptic('light'); this.renderTabs(); this.renderBody(); }));
  }
  renderBody() {
    const t = tr(), body = this.root.querySelector('.bw-body'), list = SCHEMA[this.tab];
    if (!list) { this.renderAbout(body); return; }
    const Lb = t[this.tab] || {};
    body.innerHTML = '';
    for (const [key, type, a, b, step, unit] of list) {
      const row = document.createElement('div'); row.className = 'bw-row';
      const label = Lb[key] || key;
      if (type === 'toggle') {
        row.innerHTML = `<div class="l"><span>${label}</span><div class="bw-tg${settings[key] ? ' on' : ''}"></div></div>`;
        row.querySelector('.bw-tg').addEventListener('click', (e) => { settings[key] = !settings[key]; e.currentTarget.classList.toggle('on', settings[key]); this.haptic('light'); });
      } else if (type === 'range') {
        const f = (v) => (unit === '%' ? Math.round(v * 100) + '%' : unit === 'x' ? (+v).toFixed(1) + '×' : String(v));
        row.innerHTML = `<div class="l"><span>${label}</span><span class="v">${f(settings[key])}</span></div><input type="range" min="${a}" max="${b}" step="${step}" value="${settings[key]}">`;
        const inp = row.querySelector('input'), v = row.querySelector('.v');
        const paint = () => inp.style.setProperty('--p', ((inp.value - a) / (b - a) * 100) + '%');
        paint();
        inp.addEventListener('input', () => { settings[key] = +inp.value; v.textContent = f(inp.value); paint(); });
      } else if (type === 'seg') {
        const reload = b === true;
        row.innerHTML = `<div class="l"><span>${label}</span></div><div class="bw-seg">${a.map((o) => `<span data-v="${o}" class="${String(settings[key]) === String(o) ? 'on' : ''}">${t.opt[o] || o}</span>`).join('')}</div>`;
        row.querySelectorAll('span[data-v]').forEach((el) => el.addEventListener('click', () => {
          const raw = el.dataset.v, val = typeof a[0] === 'number' ? +raw : raw;
          if (settings[key] === val) return;
          settings[key] = val; this.haptic('light');
          row.querySelectorAll('span[data-v]').forEach((x) => x.classList.toggle('on', x === el));
          if (reload) { this.toast(t.reload); setTimeout(() => location.reload(), 900); }
        }));
      }
      body.appendChild(row);
    }
    const rb = document.createElement('button'); rb.className = 'bw-btnw'; rb.textContent = t.reset;
    rb.addEventListener('click', () => { resetSettings(); this.renderBody(); });
    body.appendChild(rb);
    if (this.opts.owner && this.opts.onOwner) {                        // (owner only: see the royal items without buying them; a test balance for the shop)
      const hd = document.createElement('div'); hd.textContent = 'OWNER TOOLS'; hd.style.cssText = 'margin:16px 2px 2px;font-size:11px;letter-spacing:2px;opacity:.7'; body.appendChild(hd);
      for (const [k, label] of [['max', 'Level 30: everything full'], ['royal', 'Showcase: 4 Tesla coils + the Dragonling'], ['plain', 'Remove the showcase'], ['gems', 'Test balance: +200 sapphire, +40 onyx']]) {
        const ob = document.createElement('button'); ob.className = 'bw-btnw'; ob.textContent = label; ob.style.marginTop = '8px';
        ob.addEventListener('click', async () => { this.haptic('light'); ob.disabled = true; let ok = false; try { ok = await this.opts.onOwner(k); } catch (e) { ok = false; } ob.disabled = false; this.toast(ok ? 'Done' : 'Not available right now'); });
        body.appendChild(ob);
      }
    }
    if (this.opts.onTutorial) { const tb = document.createElement('button'); tb.className = 'bw-btnw'; tb.textContent = t.tutorial || 'Replay the tutorial'; tb.style.marginTop = '8px'; tb.addEventListener('click', () => { this.haptic('light'); this.opts.onTutorial(); }); body.appendChild(tb); }
  }
  async renderAbout(body) {
    const t = tr().about;
    body.innerHTML = `<div class="bw-about"><h3>${t.title}</h3><p>${t.ver}: <b>${this.opts.version || '4.0'}</b><br>${t.made}: <b>Blue Hearts</b></p>
      <p>${t.thanks}</p><h3>${t.credits}</h3><div class="bw-cred">…</div></div>`;
    const box = body.querySelector('.bw-cred');
    try {
      const r = await fetch((window.BW_ASSETS || '/assets/') + 'credits.json', { cache: 'no-cache' }); const j = await r.json();
      const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const groups = {};
      for (const it of j.items) (groups[it.group || 'Models'] = groups[it.group || 'Models'] || []).push(it);
      box.innerHTML = Object.entries(groups).map(([g, items]) => `<h4>${esc(g)}</h4>` + items.map((it) => `<div>${esc(it.name)} — <b>${esc(it.by)}</b> <span class="lc">(${esc(it.license)})</span></div>`).join('')).join('');
    } catch (e) { box.textContent = 'Quaternius · KayKit · Poly Haven · OpenGameArt (CC0)'; }
  }
  toast(msg) { const el = this.toastEl; el.textContent = msg; el.classList.add('on'); clearTimeout(this._tt); this._tt = setTimeout(() => el.classList.remove('on'), 2500); }
  // c = { date, time, hour } — shown inside the settings panel only
  setClock(c) { this._clock = c; if (this.settingsOpen) this.paintClock(); }
  paintClock() {
    const c = this._clock; if (!c) return;
    this.root.querySelector('.kd-d').textContent = c.date;
    this.root.querySelector('.kd-t').textContent = `${tr().tod[c.tod] || ''} · ${c.time}`;
  }
  // p = { name, level }
  setProfile(p) {
    this.prof = { ...this.prof, ...p };
    this.root.querySelector('.bw-who .nm').textContent = this.prof.name || '';
    this.root.querySelector('.bw-lvl .lvn').textContent = this.prof.level || 1;
    const sub = this.root.querySelector('.bw-who .sub'), c = this.prof.cups;
    if (sub) { const h = c == null ? '' : CUP + '<span>' + Math.max(0, Math.floor(c)).toLocaleString('en-US') + '</span>'; if (sub.dataset.h !== h) { sub.innerHTML = h; sub.dataset.h = h; } sub.style.display = c == null ? 'none' : ''; }
  }
  // g = { ruby: { n, cap }, ... } — counts roll up, gauges glide, FULL pulses
  setGems(g) {
    for (const k of GEM_KEYS) {
      const v = g[k]; if (!v) continue;
      const R = this.rows[k], cap = Math.max(1, v.cap || 1), to = Math.max(0, v.n || 0), from = this.shown[k] ?? to;
      const pct = Math.min(100, (to / cap) * 100), full = to >= cap;
      R.el.classList.toggle('full', full);
      R.cap.textContent = '/ ' + fmt(cap);
      R.fl.style.width = pct.toFixed(1) + '%';
      this.shown[k] = to;
      if (to > from && this._ready) {
        R.el.classList.remove('pop'); void R.el.offsetWidth; R.el.classList.add('pop');
        const t0 = performance.now(), dur = 900, el = R.n, id = (R.anim = (R.anim || 0) + 1);
        const step = () => { if (R.anim !== id) return; const f = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - f, 3); el.textContent = fmt(from + (to - from) * e); if (f < 1) requestAnimationFrame(step); };
        step();
      } else { R.anim = (R.anim || 0) + 1; R.n.textContent = fmt(to); }
    }
    this._ready = true;
  }
  // the special gems: { sap, onyx } (no cap): the count rolls up when it grows
  setPrem(p) {
    if (!p) return;
    for (const k of PREM_KEYS) {
      const R = this.prows && this.prows[k]; if (!R) continue;
      const to = Math.max(0, p[k] || 0), key = 'p_' + k, from = this.shown[key] ?? to; this.shown[key] = to;
      if (to > from && this._ready) {
        R.el.classList.remove('pop'); void R.el.offsetWidth; R.el.classList.add('pop');
        const t0 = performance.now(), dur = 900, el = R.n, id = (R.anim = (R.anim || 0) + 1);
        const step = () => { if (R.anim !== id) return; const f = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - f, 3); el.textContent = fmt(from + (to - from) * e); if (f < 1) requestAnimationFrame(step); };
        step();
      } else { R.anim = (R.anim || 0) + 1; R.n.textContent = fmt(to); }
    }
  }
  // mine sheet: production numbers + collect button; get() returns { ready, rate, cap, room }
  showMine(id, get, onCollect) {
    const it = tr().info[id]; if (!it) return;
    const t = tr().mine, gem = id.replace('mine_', '');
    this.show(id);
    const box = this.sheet.querySelector('.bw-mx'); this.sheet.querySelector('.chip').style.display = 'none';
    box.innerHTML = `<div class="bw-mine"><div><b class="r1">0</b><span>${t.ready}</span></div><div><b class="r2">0</b><span>${t.rate}</span></div><div><b class="r3">0</b><span>${t.cap}</span></div></div>
      <button class="bw-col"><i>${GEMS[gem]}</i><span>${t.collect}</span></button>`;
    const btn = box.querySelector('.bw-col'), lab = btn.querySelector('span');
    const paint = () => {
      if (this.open !== id) return;
      const q = get(); box.querySelector('.r1').textContent = fmt(q.ready); box.querySelector('.r2').textContent = fmt(Math.round(q.rate)); box.querySelector('.r3').textContent = fmt(Math.floor(q.cap));
      const room = q.room ?? Infinity; btn.disabled = q.ready < 1 || room < 1 || this._busy;
      lab.textContent = room < 1 ? t.vault : q.ready < 1 ? t.empty : `${t.collect} +${fmt(Math.min(q.ready, room))}`;
    };
    paint(); clearInterval(this._mt); this._mt = setInterval(() => { if (this.open !== id) { clearInterval(this._mt); return; } paint(); }, 1000);
    btn.addEventListener('click', async () => {
      if (this._busy) return; this._busy = true; paint(); this.haptic('medium');
      let n = 0; try { n = await onCollect(); } catch (e) { console.warn('collect', e); } finally { this._busy = false; }
      lab.textContent = n > 0 ? `${t.got} +${fmt(n)}` : t.empty; btn.disabled = true;
      setTimeout(paint, 1400);
    });
  }
  setFPS(v, worst) { if (settings.fpsMeter) this.fps.textContent = v + ' FPS' + (worst ? ' · ' + worst + ' ms' : ''); }   // worst = longest frame in the last second (a hitch shows up here)
  showHint() {}
  haptic(kind = 'light') { if (!settings.haptics) return; try { this.tg && this.tg.HapticFeedback && this.tg.HapticFeedback.impactOccurred(kind); } catch (e) { /* not in telegram */ } }
  show(id) {
    const it = tr().info[id]; if (!it) return;
    this.sheet.querySelector('.bw-mx').innerHTML = ''; this.sheet.querySelector('.chip').style.display = '';
    this.sheet.querySelector('.e').textContent = it[0];
    this.sheet.querySelector('.t').textContent = it[1];
    this.sheet.querySelector('.d').textContent = it[2];
    this.sheet.classList.add('on'); this.open = id; this.haptic('light');
  }
  hide() { this.sheet.classList.remove('on'); this.open = null; }

  // ------------------------------------------------ cinematic welcome card over the live scene
  // c = { date, time, tod } ; resolves when the player taps (or after `auto` seconds)
  // raids = the attacks on this kingdom while the player was away (newest first): [{ who, stars, pct, tro, loot, t }]; with a report the card waits for a tap
  showWelcome(c, { auto = 9, raids = null } = {}) {
    const t = tr(), el = document.createElement('div'); el.className = 'bw-wel';
    const rp = raids && raids.length ? raidReport(raids) : '';
    if (rp) { el.classList.add('has-rp'); auto = Math.max(auto, 45); }
    el.innerHTML = `<div class="bg"></div><div class="grade"></div><div class="rays"></div><canvas></canvas><div class="lb t"></div><div class="lb b"></div>
      <div class="blk"><div class="pre">${t.welcome.pre.toUpperCase()}</div><div class="lord">${t.welcome.lord}</div><div class="dv"><b></b><i></i><b></b></div>
      <div class="dt">${c.date}</div><div class="tm">${t.tod[c.tod] || ''} · ${c.time}</div>${rp}</div><div class="tap">${t.welcome.tap}</div>`;
    this.root.appendChild(el); this.root.classList.add('wel');                                  // the HUD stays out of the way of the cinematic card
    // drifting light motes (tiny canvas, only while the card is up)
    const cv = el.querySelector('canvas'), g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.width = Math.round(el.clientWidth * dpr), H = cv.height = Math.round(el.clientHeight * dpr);
    const motes = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.6 + Math.random() * 1.8) * dpr, v: (6 + Math.random() * 16) * dpr, a: Math.random() * 6.28 }));
    const spr = document.createElement('canvas'); spr.width = spr.height = 32;                   // one soft dot, drawn once
    { const sg = spr.getContext('2d'), gr = sg.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(200,230,255,1)'); gr.addColorStop(1, 'rgba(200,230,255,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 32, 32); }
    let alive = true, last = performance.now(), acc = 0;
    const tick = (now) => {
      if (!alive) return; requestAnimationFrame(tick);
      const dt0 = Math.min(0.1, (now - last) / 1000); last = now; acc += dt0; if (acc < 0.033) return; const dt = acc; acc = 0;      // 30 fps is plenty for drifting dust
      g.clearRect(0, 0, W, H);
      for (const m of motes) {
        m.y -= m.v * dt; m.a += dt; m.x += Math.sin(m.a) * 6 * dpr * dt; if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
        g.globalAlpha = 0.35 + 0.35 * Math.sin(m.a * 2); const d = m.r * 6; g.drawImage(spr, m.x - d / 2, m.y - d / 2, d, d);
      }
      g.globalAlpha = 1;
    };
    requestAnimationFrame(tick);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    return new Promise((resolve) => {
      let done = false;
      const go = (tapped) => {
        if (done) return; done = true; clearTimeout(timer);
        if (tapped) this.haptic('medium');
        el.classList.add('out'); this.root.classList.remove('wel');
        setTimeout(() => { alive = false; el.remove(); }, 850);
        resolve(tapped);
      };
      const timer = setTimeout(() => go(false), auto * 1000);
      el.addEventListener('click', () => go(true));
    });
  }
}
