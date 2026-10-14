import { createBattle as nw } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import { createBattle as od } from '/home/claude/bot/bluebot_v2/bluewall/client/src/_bs_old_tmp.js';
import { planArmy } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const army = {}; for (const u of DEFS.order) army[u] = 3 + (u.length * 7) % 40;
const spec = { levels: { keep: 12, wall: 12, towers: 12 }, seed: 5, power: 400, ratio: 1, loot: {} };
const a = nw({ spec, army, forge: 5 }), b = od({ spec, army, forge: 5 });
let bad = 0; for (let i = 0; i < a.units.length || i < b.units.length; i++) { const u = a.units[i], v = b.units[i]; if (!u || !v || u.x !== v.x || u.z !== v.z || u.type !== v.type) bad++; }
console.log('units', a.units.length, b.units.length, 'mismatch', bad);
