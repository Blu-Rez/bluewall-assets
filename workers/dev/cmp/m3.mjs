import { planArmy } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import fs from 'fs';
const sets = {
 mid: {spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8},
 small: {spear: 30, sword: 20, archer: 20, cavalry: 8},
 g4: {giant: 4, spear: 20},
 ownerMax: {"spear": 61, "sword": 61, "guard": 21, "archer": 69, "cavalry": 23, "pegasus": 13, "baby": 5, "dragon": 1, "catapult": 7, "giant": 3, "imp": 17, "mage": 14, "ram": 6, "cannon": 6, "werewolf": 5, "trebuchet": 4, "hill": 2, "shieldmaiden": 3, "lord": 3, "legionary": 43, "captain": 3, "ogre": 2, "gryphon": 3, "lich": 3, "treant": 2, "gryphonknight": 1, "darkrider": 1, "baby3": 1, "dragon3": 1},
};
const out = {};
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const RB = new Proxy({}, { get: (_, t) => { const d = DEFS.units[t]; return (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * 2; } });
for (const [k, army] of Object.entries(sets)) {
  const p = planArmy(army, 2, true);
  console.log('==', k, 'units', Object.values(army).reduce((a, b) => a + b, 0), 'ranks', p.shelves.length, 'back1', p.back1.toFixed(1), 'lat', p.lat0.toFixed(0), p.lat1.toFixed(0), 'width', p.width.toFixed(0), 'depth', p.depth.toFixed(0), 'aspect', (p.width/p.depth).toFixed(2));
  p.shelves.forEach((s, i) => console.log('  group', i, s.tier, s.blocks.map(b => b.type + 'x' + b.n + '(' + b.cols + 'x' + b.rows + ',R' + b.R.toFixed(1) + ')').join(' | ')));
  // ring overlap check from the soldiers' real positions (what squadring.js draws: farthest soldier from the centroid + 3.2)
  const R = {}; for (const t of p.types) { const P = p.pos[t]; let cx = 0, cz = 0; for (const q of P) { cx += q[0]; cz += q[1]; } cx /= P.length; cz /= P.length; let far = 0; for (const q of P) far = Math.max(far, Math.hypot(q[0] - cx, q[1] - cz)); R[t] = { cx, cz, r: Math.max(4.5, far + 0.5 * RB[t] + 1.2) }; }
  let bad = 0, minGap = 1e9; const ts = p.types;
  for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const A = R[ts[i]], B = R[ts[j]], g = Math.hypot(A.cx - B.cx, A.cz - B.cz) - A.r - B.r; minGap = Math.min(minGap, g); if (g < 0) { bad++; console.log('   OVERLAP', ts[i], ts[j], g.toFixed(1)); } }
  console.log('  ring overlaps:', bad, 'min gap', minGap.toFixed(2), 'max ring r', Math.max(...ts.map(t => R[t].r)).toFixed(1));
  out[k] = { rings: R, pos: p.pos };
}
fs.writeFileSync('/tmp/cmp/m3.json', JSON.stringify(out));
