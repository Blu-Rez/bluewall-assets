import { createUpgradeUI } from '../../bot/bluebot_v2/bluewall/client/src/upgradeui.js';
import STATE from './state.json';
const root = document.createElement('div'); root.className = 'bw-ui';
root.style.cssText = 'position:absolute;inset:0;--st:24px;--sb:12px;--sl:0px;--sr:0px;--hs:1;font-family:"Libre Baskerville",Georgia,serif;font-weight:700;color:#e6f2ff;direction:ltr';
document.body.appendChild(root);
const econ = { st: { gems: STATE.gems, prog: STATE.prog }, now: () => STATE.now, upgrade: async () => ({ ok: false, why: 'offline' }), load: async () => {} };
const ui = { root, toast: (m) => console.log('toast', m), haptic() {} };
window.__up = createUpgradeUI(root, { econ, ui, audio: {} });
window.__up.update();
