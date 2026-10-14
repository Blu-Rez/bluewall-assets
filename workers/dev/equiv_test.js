// the grid queries must give exactly the answers of the plain scans: same battle, step by step (hash of every body)
import { createBattle as NEW } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import { createBattle as OLD } from '/home/claude/bot/bluebot_v2/bluewall/client/src/_ref_battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
const U = DEFS.units, keepT = BT.targets.find((t) => t.type === 'keep');
const mixes = [
  { spear: 30, sword: 20, guard: 8, archer: 24, cavalry: 8, catapult: 4, giant: 3, mage: 6 },
  { spear: 20, archer: 20, ram: 4, cannon: 4, trebuchet: 3, catapult: 3, hill: 2, shieldmaiden: 3, lord: 3, mage: 6, pegasus: 8, baby: 3, dragon: 2 },
  { spear: 40, sword: 30, archer: 30, cavalry: 10, werewolf: 4, imp: 10, dragonling: 6, baby: 4, dragon: 3 },
];
const hashOf = (sim) => { let h = 2166136261; const mix = (v) => { h = Math.imul(h ^ (Math.round(v * 100) | 0), 16777619) >>> 0; }; for (const u of sim.units) { mix(u.x); mix(u.z); mix(u.hp); } for (const d of sim.defenders) { mix(d.x); mix(d.z); mix(d.hp); } for (const b of sim.buildings) mix(b.hp); return h; };
let bad = 0, n = 0;
for (const [mi, army] of mixes.entries()) for (const L of [8, 20, 30]) for (const seed of [3, 17]) {
  const P = Object.entries(army).reduce((s, [t, c]) => s + c * Math.sqrt(U[t].hp * U[t].dps) / 3, 0) * (1 + 0.035 * (L - 1));
  const mk = (F) => { const sim = F({ spec: { seed, ratio: 1, power: Math.round(P), levels: { keep: L, wall: L, towers: L }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } }, army, forge: Math.min(L, 20), targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
    const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
    for (const ty of Object.keys(army)) { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx + (mi - 1) * 6, gz); }
    return sim; };
  const a = mk(OLD), b = mk(NEW); let first = -1;
  for (let t = 0; t < 90 && !a.over; t += 1 / 30) { a.step(1 / 30); b.step(1 / 30); if (hashOf(a) !== hashOf(b)) { first = t; break; } }
  n++; if (first >= 0) { bad++; console.log('DIFF mix', mi, 'L', L, 'seed', seed, 'first at t =', first.toFixed(2)); } else console.log('same mix', mi, 'L' + L, 'seed', seed, 'time', a.time.toFixed(1), 'alive', a.alive(), 'destr', a.destruction().toFixed(1));
}
console.log(bad ? 'EQUIV FAILED ' + bad + '/' + n : 'EQUIV OK ' + n + ' battles');
process.exit(bad ? 1 : 0);
