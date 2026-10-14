import { planArmy, rankOf, tierOf } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const sets = {
 mid: {spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8},
 small: {spear: 30, sword: 20, archer: 20, cavalry: 8},
 max: JSON.parse(process.argv[2] || '{}'),
};
if (!Object.keys(sets.max).length) { const a = {}; for (const u of DEFS.order) a[u] = DEFS.heroes[u] ? 3 : 4 + (u.length * 7) % 30; sets.max = a; }
for (const [k, army] of Object.entries(sets)) {
  const p = planArmy(army, 1, true);
  console.log('==', k, 'units', Object.values(army).reduce((a, b) => a + b, 0), 'shelves', p.shelves.length, 'back1', p.back1.toFixed(1), 'lat', p.lat0.toFixed(0), p.lat1.toFixed(0));
  p.shelves.forEach((s, i) => console.log('  row', i, 'tier', s.tier, 'w', s.w.toFixed(0), 'depth', s.depth.toFixed(1), s.blocks.map(b => b.type + 'x' + b.n).join(' | ')));
}
