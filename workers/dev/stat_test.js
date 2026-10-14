// the sqrt distance changes the last digit of some numbers, so battles drift apart: same armies, 12 seeds, old vs new sim — do the outcomes agree on average?
import { createBattle as NEW } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import { createBattle as OLD } from '/home/claude/bot/bluebot_v2/bluewall/client/src/_ref_battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
const U = DEFS.units, keepT = BT.targets.find((t) => t.type === 'keep');
const mixes = [{ spear: 30, sword: 20, guard: 8, archer: 24, cavalry: 8, catapult: 4, giant: 3, mage: 6 }, { spear: 20, archer: 20, ram: 4, cannon: 4, trebuchet: 3, catapult: 3, hill: 2, shieldmaiden: 3, lord: 3, mage: 6, pegasus: 8, baby: 3, dragon: 2 }];
const run = (F, army, L, seed, P) => { const sim = F({ spec: { seed, ratio: 1, power: Math.round(P), levels: { keep: L, wall: L, towers: L }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } }, army, forge: Math.min(L, 20), targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  for (const ty of Object.keys(army)) { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); }
  while (!sim.over && sim.time < 150) sim.step(1 / 30); return [sim.destruction(), sim.alive(), sim.stars]; };
for (const [mi, army] of mixes.entries()) for (const L of [10, 30]) {
  const P = Object.entries(army).reduce((s, [t, c]) => s + c * Math.sqrt(U[t].hp * U[t].dps) / 3, 0) * (1 + 0.035 * (L - 1)), a = [], b = [];
  for (let seed = 1; seed <= 12; seed++) { a.push(run(OLD, army, L, seed, P)); b.push(run(NEW, army, L, seed, P)); }
  const m = (r, k) => r.reduce((s, x) => s + x[k], 0) / r.length;
  console.log('mix', mi, 'L' + L, '| destruction old/new', m(a, 0).toFixed(1), m(b, 0).toFixed(1), '| survivors', m(a, 1).toFixed(1), m(b, 1).toFixed(1), '| stars', m(a, 2).toFixed(2), m(b, 2).toFixed(2));
}
