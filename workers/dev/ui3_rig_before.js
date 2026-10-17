// ui3_rig.js — UI3: a LIGHT rig (no WebGL, no world): the REAL UI modules of the strategic mode (HUD, Assist hub, Kingdom, Army, Shop, Rank / Clan / Friends / Log, Settings, building sheets ARE here: __bw.sheets.open(id, __bw.SM) — the real bsheet.js, opened without the 3D tap)
// mounted on a still photo of the map, with the real Econ (offline state).  `window.__bw` has what ui1r4_census.py / ui1r4_scenes.py need for the menu scenes.  Loads in seconds (the full game needs ~15 min on the software GL box).
import { UI } from '../kit_before/bluewall/client/src/ui.js';
import { Econ } from '../kit_before/bluewall/client/src/econ.js';
import { createUpgradeUI } from '../kit_before/bluewall/client/src/upgradeui.js';
import { createArmyUI } from '../kit_before/bluewall/client/src/armyui.js';
import { createRankUI } from '../kit_before/bluewall/client/src/rankui.js';
import { createSocialUI } from '../kit_before/bluewall/client/src/socialui.js';
import { createShopUI } from '../kit_before/bluewall/client/src/shopui.js';
import { createAssist } from '../kit_before/bluewall/client/src/assist.js';
import { createLayoutUI } from '../kit_before/bluewall/client/src/layout_ui.js';
import { injectHudR3 } from '../kit_before/bluewall/client/src/ui_theme_r3.js';
import { createSheetUI } from '../kit_before/bluewall/client/src/bsheet.js';
import { injectKit } from '../kit_before/bluewall/client/src/ui_theme.js';      // (main.js gets it through createSheetUI)
const root = document.getElementById('root');
injectKit();
const audio = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}) });
const ui = new UI({ tg: null, mount: root, version: 'dev', owner: true, onOwner: () => false });
const econ = new Econ({ token: null, level: 30 });
ui.setProfile({ name: 'Blꪊe', level: econ.st.level }); ui.setGems(econ.wallet()); ui.setPrem(econ.prem());
const world = { events: {}, layout: {} };
const upgrade = createUpgradeUI(root, { econ, ui, world, audio, tg: null });
const shop = createShopUI(root, { econ, ui, audio });
const armyUI = createArmyUI(root, { econ, ui, audio, onAttack: () => {}, onShop: (k) => shop.open(k) });
const rankUI = createRankUI(root, { econ, ui, audio });
const socialUI = createSocialUI(root, { econ, ui, audio });
const assist = createAssist(root, { econ, ui, audio, army: armyUI, upgrade, rank: rankUI, social: socialUI, shop, tg: null });
const SM = { keep: 'keep', wall: 'wall', gate: 'wall', tower: 'wall', barracks: 'barracks', forge: 'forge', training: 'training', stable: 'stable', workshop: 'workshop', lair: 'lair', archer: 'towers', vault_ruby: 'vault_ruby', vault_emerald: 'vault_emerald', vault_turq: 'vault_turq' };   // = SHEET_MAP of main.js
const sheets = createSheetUI(root, { econ, ui, audio, upgrade, army: armyUI, afterCollect: () => {} });
// main.js line ~435 (owner build): the crown that enters hero mode — same markup and inline style
const hb = document.createElement('button'); hb.className = 'rp-open';
hb.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l4.6 4.2L12 5.5l3.9 7.2 4.6-4.2-1.8 10H5.3z"/><path d="M5.8 21h12.4"/></svg>';
hb.style.cssText = 'position:absolute;z-index:6;left:10px;top:calc(env(safe-area-inset-top,0px) + 150px);width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.25);color:#e6ecf2';
root.appendChild(hb);
// layout_ui.js's Arrange entry button (its real class names; the editor itself is not mounted)
const ent = document.createElement('button'); ent.className = 'bwl b ent'; ent.style.cssText = 'position:fixed;pointer-events:auto;left:10px;bottom:10px;z-index:39'; ent.innerHTML = '<i>✥</i><small>Arrange</small>'; const bwl = document.createElement('div'); bwl.className = 'bwl'; bwl.appendChild(ent); root.appendChild(bwl);
let paused = true, frames = 0; const tick = () => { if (!paused) frames++; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
window.__bw = { sheets, SM, ui, econ, armyUI, upgrade, shop, rankUI, socialUI, assist, audio, ctl: { intro: null, onTap: () => {} }, world, camera: { clearViewOffset() {}, updateProjectionMatrix() {} }, THREE: null, settings: {}, lateReady: true, pause(b) { paused = b !== false; }, get frames() { return frames; } };
window.__ready = true;
