import { createHUD, createLoadView } from '../bot/bluebot_v2/bluewall/client/src/bhud.js';
import DEFS from '../bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const root = document.getElementById('root');
const mode = new URLSearchParams(location.search).get('m') || 'hud';
if (mode === 'load') {
  const L = createLoadView(root, { title: '', sub: 'Scouting the land…' }).show();
  L.progress(0.2 * 0.35, 'Matching by power…'); window.__L = L;
  window.__step = (n) => { if (n === 1) { L.noCancel(); L.setTitle('<b>Portrait</b>'); } if (n === 2) { const h = createHUD(root, { target: { name: 'Portrait', emblem: 'dragon', levels: { keep: 14 }, loot: {} }, types: DEFS.order, spells: [], loader: L }); h.progress(0.5, 'Raising the banners…'); window.__h = h; } };
  window.__ready = true;
} else {
const types = DEFS.order;
const h = createHUD(root, { target: { name: 'Portrait', emblem: 'dragon', levels: { keep: 14 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } }, types, spells: ['lightning', 'heal', 'freeze', 'rage', 'quake'], onSelect() {}, onSpell() {}, onEnd() {}, onNext() {} });
h.ready();
const squads = {}; types.forEach((t, i) => { squads[t] = { n: [20, 20, 7, 23, 7, 4, 1, 1, 2, 1, 5, 4, 2, 2, 1, 1, 1, 1, 1][i], hp: [1, 1, 0.9, 1, 0.6, 1, 1, 0.3, 1, 1, 1, 0.5, 1, 1, 1, 1, 1, 1, 1][i], sent: i % 4 === 1 }; });
squads.lord.n = 0;
h.update({ left: 150, des: 20, starsN: 1, loot: {}, squads, sel: 'cavalry', started: true, spellN: { lightning: 3, heal: 2, freeze: 2, rage: 2, quake: 2 }, selSpell: null });
window.__h = h; window.__ready = true;
}
