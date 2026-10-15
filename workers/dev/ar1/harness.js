// AR1 harness: the REAL ui.js + armyui.js + bsheet.js + Econ (offline) on a plain page, no three.js scene (fast).
// window.__ar1 = { econ, army, ui, sheets }; ar1_browser.py then runs prep.js (the army state + the request stubs) in the page.
import { UI } from '../../bot/bluebot_v2/bluewall/client/src/ui.js';
import { Econ } from '../../bot/bluebot_v2/bluewall/client/src/econ.js';
import { createUpgradeUI } from '../../bot/bluebot_v2/bluewall/client/src/upgradeui.js';
import { createSheetUI } from '../../bot/bluebot_v2/bluewall/client/src/bsheet.js';
import { createArmyUI } from '../../bot/bluebot_v2/bluewall/client/src/armyui.js';
const q = new URLSearchParams(location.search);
const econ = new Econ({ level: +(q.get('lv') || 30) });
const ui = new UI({ tg: null, mount: document.body, version: 'ar1', owner: true });
const army = createArmyUI(ui.root, { econ, ui, audio: null, onAttack: () => {} });
const upgrade = createUpgradeUI(ui.root, { econ, ui, world: {}, audio: null, tg: null });
const sheets = createSheetUI(ui.root, { econ, ui, audio: null, upgrade, army, afterCollect: () => {} });
window.__ar1 = { econ, army, ui, sheets };
window.__ready = true;
