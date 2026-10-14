import { UI } from '../bot/bluebot_v2/bluewall/client/src/ui.js';
import { createAssist } from '../bot/bluebot_v2/bluewall/client/src/assist.js';
import { createShopUI } from '../bot/bluebot_v2/bluewall/client/src/shopui.js';
import { Econ } from '../bot/bluebot_v2/bluewall/client/src/econ.js';
const q = new URLSearchParams(location.search);
const root = document.getElementById('root');
let shop = null;
const ui = new UI({ mount: root, tg: null, version: 'dev', onShop: (k) => shop && shop.open(k) });
let T0 = Date.now() / 1000;
const busy = +(q.get('busy') || 0), ready = +(q.get('ready') || 89), un = +(q.get('un') || 0);
const structs = {}; ['barracks', 'keep', 'wall'].slice(0, busy).forEach((e, i) => { structs[e] = { up: { end: T0 + 3600 * (i + 1) + 1234, dur: 7200 * (i + 1), reserved: false } }; });
const econ = { now: () => Date.now() / 1000, prem: () => ({ sap: +(q.get('sap') || 120), onyx: +(q.get('onyx') || 8) }), st: { level: +(q.get('lv') || 20), vault: { ruby: 79603, emerald: 178000, turq: 59562 }, tro: 27, prog: { builders: 3, builders_busy: busy, structs }, army: { ready, attack: true, space: 10, fam: { inf: { q: q.get('train') ? [{ n: 12, fin: T0 + 900 }] : [] } }, spell: { q: [] } } } };
// the real offline Econ drives the shop (local price list = the server defaults)
const E = new Econ({ token: null, level: +(q.get('lv') || 20) }); E.st.prem = econ.prem();
if (q.get('bst')) E.st.bst = { build: { p: 20, end: T0 + 6 * 86400 + 3 * 3600 }, mine: { p: 10, end: T0 + 5 * 3600 } };
if (q.get('own')) E.st.own = { tesla: 1, dragonling: true };
E.st.shop = null; E.buy({ id: 'none' });
econon: { econ.st.shop = E.st.shop; econ.st.bst = E.st.bst; econ.prem = () => E.prem(); econ.boosts = () => E.boosts(); econ.buy = async (b) => { const r = await E.buy(b); econ.st.shop = E.st.shop; econ.st.bst = E.st.bst; return r; }; }
const social = { unseen: () => un, clanTag: () => 'BF', open() {}, refresh() {} };
ui.setProfile({ name: q.get('name') || 'Wingless', level: +(q.get('lv') || 20), cups: 27 });
const cap = 79603;
ui.setGems({ ruby: { n: 1250, cap }, emerald: { n: 860, cap: 178000 }, turq: { n: q.get('full') ? 59562 : 3400, cap: 59562 } });
shop = createShopUI(root, { econ, ui, audio: null });
ui.setPrem(econ.prem());
const assist = createAssist(root, { econ, ui, audio: null, shop, army: { open() {}, attack() {}, emblem() {} }, upgrade: { open() {} }, rank: { open() {} }, social });
window.__shop = shop; window.__ui = ui; window.__assist = assist; window.__ready = true;
if (q.get('wel')) {
  const raids = q.get('wel') === 'held' ? [{ who: 'Dariush', stars: 0, pct: 31, tro: 5, loot: {}, t: Date.now() / 1000 - 3000 }]
    : [{ who: 'Sepideh', stars: 2, pct: 64, tro: -18, loot: { ruby: 1200, emerald: 800, turq: 300 }, t: Date.now() / 1000 - 5400 }, { who: 'Kian', stars: 1, pct: 41, tro: -9, loot: { ruby: 450 }, t: Date.now() / 1000 - 40000 }, { who: 'Mahsa The Brave', stars: 3, pct: 100, tro: -27, loot: { emerald: 2100, turq: 90 }, t: Date.now() / 1000 - 90000 }, { who: 'Arman', stars: 1, pct: 22, tro: -6, loot: {}, t: Date.now() / 1000 - 100000 }];
  ui.showWelcome({ date: '12 Mehr 750', time: '14:20', tod: 'day' }, { auto: 600, raids: q.get('wel') === 'none' ? [] : raids });
}
