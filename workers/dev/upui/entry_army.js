import { createArmyUI } from '../../bot/bluebot_v2/bluewall/client/src/armyui.js';
import STATE from './army_state.json';
const root = document.createElement('div'); root.className = 'bw-ui';
root.style.cssText = 'position:absolute;inset:0;--st:24px;--sb:12px;--sl:0px;--sr:0px;--hs:1;font-family:"Libre Baskerville",Georgia,serif;font-weight:700;color:#e6f2ff;direction:ltr';
document.body.appendChild(root);
const econ = { st: { gems: STATE.gems, army: STATE.army }, now: () => STATE.now, army: async () => ({ ok: false, why: 'offline' }), scout: async () => ({ ok: false, why: 'bad' }), load: async () => {} };
const ui = { root, toast: (m) => console.log('toast', m), haptic() {} };
window.__ar = createArmyUI(root, { econ, ui, audio: {}, onAttack: (t) => console.log('attack', t) });
window.__ar.update();
