// p35 M2: sim step cost at the biggest armies (headless, one core).  Usage: node perf_step.cjs <label> [level ...]
import { createBattle } from '/home/claude/bw/bluewall_handoff/code/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bw/bluewall_handoff/code/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bw/bluewall_handoff/code/bluewall/client/src/basetargets.json';
const U = DEFS.units, TICK = 1 / 30;
const PLAN = { spear: .07, sword: .07, guard: .05, archer: .08, cavalry: .08, pegasus: .06, baby: .05, dragon: .05, catapult: .05, giant: .05, imp: .04, mage: .05, ram: .04, cannon: .05, werewolf: .05, trebuchet: .05, hill: .05, shieldmaiden: .03, lord: .03 };
const fullArmy = (L) => {            // a full house of castle level L: the same recipe as military.ref_power
  const cap = DEFS.army_cap[L - 1], open = Object.keys(PLAN).filter((u) => (U[u].lv <= L)), tot = open.reduce((s, u) => s + PLAN[u], 0), army = {}, fu = {}; let used = 0;
  for (const u of open) { const sp = U[u].space, f = U[u].fam; let n = Math.floor(cap * PLAN[u] / tot / sp); n = Math.max(0, Math.min(n, Math.floor((DEFS.fam_cap[f][L - 1] - (fu[f] || 0)) / sp), Math.floor((cap - used) / sp))); if (u === 'shieldmaiden' || u === 'lord') n = Math.min(n, 3); if (n) { army[u] = n; used += n * sp; fu[f] = (fu[f] || 0) + n * sp; } }
  return army;
};
const keepT = BT.targets.find((t) => t.type === 'keep');
const label = process.argv[2], levels = process.argv.slice(3).map(Number);
for (const L of levels) {
  const army = fullArmy(L), space = Object.entries(army).reduce((s, [u, n]) => s + n * U[u].space, 0), bodies = Object.values(army).reduce((s, n) => s + n, 0);
  const P = Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.035 * (L - 1)), 0);
  const spec = { seed: 7, ratio: 1.0, power: Math.round(P), levels: { keep: L, wall: L, towers: L }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
  const t0 = process.hrtime.bigint();
  const sim = createBattle({ spec, army, forge: Math.min(L, 20), targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
  const build = Number(process.hrtime.bigint() - t0) / 1e6;
  const g = sim.base.deploy, gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  for (const ty of Object.keys(army)) { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); }
  const ms = []; let maxAlive = 0, maxDef = 0;
  for (let t = 0; t < 120 && !sim.over; t += TICK) { const a = process.hrtime.bigint(); sim.step(TICK); ms.push(Number(process.hrtime.bigint() - a) / 1e6); maxAlive = Math.max(maxAlive, sim.alive()); }
  ms.sort((a, b) => a - b); const mean = ms.reduce((s, x) => s + x, 0) / ms.length;
  const defs = sim.defenders ? sim.defenders.length : (sim.def ? sim.def.length : -1);
  console.log(label, 'L' + L, 'army space', space, 'bodies', bodies, '| defenders at start', defs, '| buildings', sim.buildings.length, '| build', build.toFixed(0) + 'ms', '| step mean', mean.toFixed(2), 'p95', ms[Math.floor(ms.length * 0.95)].toFixed(2), 'max', ms[ms.length - 1].toFixed(2), 'ms (' + ms.length + ' steps, over=' + sim.over + ', maxAlive ' + maxAlive + ')');
}
