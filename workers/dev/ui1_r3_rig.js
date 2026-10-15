// ui1_r3_rig.js — the REAL HUD (ui.js + assist.js) with stand-ins for the two button groups that other files own, using their inline styles copied from main.js (crown `.rp-open`) and rpg.js (`.rp-b[data-rp]`):
// geometry test for UI1-R3 (dev/ui1_r3_test.sh).  The real buttons in the real game are checked in the frames (ui1_r3_shots.py).
import { UI } from '../bot/bluebot_v2/bluewall/client/src/ui.js';
import { createAssist } from '../bot/bluebot_v2/bluewall/client/src/assist.js';
const root = document.getElementById('root');
const ui = new UI({ mount: root, tg: null, version: 'dev', onShop: () => {} });
const econ = { now: () => Date.now() / 1000, prem: () => ({ sap: 120, onyx: 8 }), st: { level: 30, vault: {}, tro: 27, prog: { builders: 3, builders_busy: 0, structs: {} }, army: { ready: 89, attack: true, space: 10, fam: { inf: { q: [] } }, spell: { q: [] } } } };
ui.setProfile({ name: 'Wingless', level: 30, cups: 27 });
ui.setGems({ ruby: { n: 1250, cap: 79603 }, emerald: { n: 860, cap: 178000 }, turq: { n: 3400, cap: 59562 } });
ui.setPrem(econ.prem());
createAssist(root, { econ, ui, audio: null, shop: { open() {} }, army: { open() {}, attack() {}, emblem() {} }, upgrade: { open() {} }, rank: { open() {} }, social: { unseen: () => 0, clanTag: () => '', open() {}, refresh() {} } });
// main.js line 404-405 (owner build): the crown that enters hero mode
const hb = document.createElement('button'); hb.className = 'rp-open';
hb.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l4.6 4.2L12 5.5l3.9 7.2 4.6-4.2-1.8 10H5.3z"/><path d="M5.8 21h12.4"/></svg>';
hb.style.cssText = 'position:absolute;z-index:6;left:10px;top:calc(env(safe-area-inset-top,0px) + 150px);width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.25);color:#e6ecf2';
root.appendChild(hb); window.__hero = (on) => { root.classList.toggle('hero-on', !!on); hb.style.display = on ? 'none' : 'flex'; };    // main.js hides the crown with style.display; rpg.js hides the HUD with `.rp-on>*:not(canvas):not(.rp-k){visibility:hidden!important}`
// rpg.js lines 15-34 + 536-543: the hero buttons (kept hidden until the test turns `hero` on)
const TOP = 'max(env(safe-area-inset-top,0px),calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px)))', BOT = 'max(env(safe-area-inset-bottom,0px),calc(var(--tg-safe-area-inset-bottom,0px) + var(--tg-content-safe-area-inset-bottom,0px)))';
const st = document.createElement('style'); st.textContent = '.rp-b{position:absolute;z-index:42;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(205,214,224,.5);background:rgba(40,46,54,.7);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}.rp-perf{position:absolute;z-index:43;top:calc(' + TOP + ' + 8px);right:8px;min-width:46px;padding:4px 7px}#rphud{position:absolute;inset:0;z-index:40;display:none;pointer-events:none}.hero-on #rphud{display:block}.hero-on>.bw-ui{visibility:hidden!important}'; document.head.appendChild(st);
const hud = document.createElement('div'); hud.id = 'rphud'; root.appendChild(hud);
const sb = `calc(${BOT} + `;
for (const [id, css] of [['jump', `right:22px;bottom:${sb}92px);width:78px;height:78px`], ['dodge', `right:110px;bottom:${sb}56px);width:62px;height:62px`], ['sprint', `right:30px;bottom:${sb}186px);width:58px;height:58px`], ['cam', `left:12px;top:calc(${TOP} + 58px);width:46px;height:46px`], ['exit', `left:12px;top:calc(${TOP} + 6px);width:42px;height:42px`], ['act', `right:30px;bottom:${sb}256px);width:62px;height:62px`], ['gate', `left:12px;top:calc(${TOP} + 116px);width:46px;height:46px`]]) {
  const b = document.createElement('div'); b.className = 'rp-b rp-k'; b.dataset.rp = id; b.style.cssText = css + ';pointer-events:auto'; b.textContent = id[0]; hud.appendChild(b);
}
const pf = document.createElement('div'); pf.className = 'rp-perf rp-k'; pf.textContent = '53 fps'; hud.appendChild(pf);
window.__ready = true;
