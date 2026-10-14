import { planArmy } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
const sets = {
 mid: {spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8},
 small: {spear: 30, sword: 20, archer: 20, cavalry: 8},
 ownerMax: {"spear": 61, "sword": 61, "guard": 21, "archer": 69, "cavalry": 23, "pegasus": 13, "baby": 5, "dragon": 1, "catapult": 7, "giant": 3, "imp": 17, "mage": 14, "ram": 6, "cannon": 6, "werewolf": 5, "trebuchet": 4, "hill": 2, "shieldmaiden": 3, "lord": 3, "legionary": 43, "captain": 3, "ogre": 2, "gryphon": 3, "lich": 3, "treant": 2, "gryphonknight": 1, "darkrider": 1, "baby3": 1, "dragon3": 1},
};
for (const [k, army] of Object.entries(sets)) {
  const p = planArmy(army, 2, true);
  console.log('==', k, 'units', Object.values(army).reduce((a, b) => a + b, 0), 'rows', p.shelves.length, 'back1', p.back1.toFixed(1), 'lat', p.lat0.toFixed(0), p.lat1.toFixed(0));
  p.shelves.forEach((s, i) => console.log('  row', i, 'tier', s.tier, 'w', s.w.toFixed(0), 'depth', s.depth.toFixed(1), s.blocks.map(b => b.type + 'x' + b.n).join(' | ')));
}
