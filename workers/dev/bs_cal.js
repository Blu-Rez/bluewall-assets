// headless balance harness for battlesim.js
import { createBattle, FIELD, TUNE } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const U = DEFS.units;
const power = (army, forge = 1) => Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);

// naive "player" AI: send squads in sequence at the gate, then spread
function play(army, ratio, level, seed, forge = 1, style = 'smart') {
  const P = power(army, forge);
  const spec = { seed, ratio, power: Math.round(P * ratio), levels: { keep: level, wall: level, towers: level }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
  const sim = createBattle({ spec, army, forge });
  const base = sim.base;
  const gate = base.ring[base.gateIndex];
  const gx = gate.x, gz = gate.z;
  const order = DEFS.order.filter((u) => army[u] > 0);
  const t0 = { ground: 0, air: 3, giant: 1, siege: 6 };
  const sentAt = {};
  let t = 0;
  const dt = 0.1;
  // schedule: tanks first, then melee, then ranged/siege, air last-ish
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
  const seq = order.slice().sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  let k = 0, nextSend = 0;
  while (!sim.over && t < 200) {
    if (style === 'sloppy') { if (t >= nextSend && k < seq.length) { const ty = seq[(k++ + seed) % seq.length]; sim.send(ty, gx + (seed % 3 - 1) * 14, gz + 6 + (seed % 5) * 3); nextSend = t + 1.0 + (seed % 4); } }
    else if (style === 'all') { if (k === 0) { for (const ty of seq) sim.send(ty, gx, gz + 8); k = 99; } }
    else if (t >= nextSend && k < seq.length) { const ty = seq[k++]; const role = U[ty].role; const tz = role === 'ranged' || role === 'siege' ? gz + 24 : role === 'air' ? 0 : gz + 3; sim.send(ty, role === 'air' ? gx : gx, tz); nextSend = t + 3.5; }
    sim.step(dt); t += dt;
  }
  const r = sim.result();
  return { r, P, spec, lostPct: Object.entries(r.lost).reduce((s, [ty, n]) => s + n * U[ty].space, 0) };
}

const mixes = {
  early: { spear: 12, archer: 6 },
  mid: { spear: 25, sword: 14, archer: 16, cavalry: 4, catapult: 2 },
  late: { spear: 30, sword: 30, guard: 12, archer: 30, cavalry: 8, pegasus: 6, baby: 3, catapult: 5, giant: 3 },
  dragons: { sword: 20, archer: 20, baby: 6, dragon: 3, giant: 4 },
  rush: { cavalry: 20, pegasus: 8 },
};
const forges = { early: 1, mid: 4, late: 10, dragons: 14, rush: 8 };
const lv = { early: 3, mid: 8, late: 14, dragons: 17, rush: 10 };
const ratios = [0.9, 1.0, 1.15, 1.3, 1.5];
const arg = process.argv[2]; if (process.argv[3]) TUNE.hp = +process.argv[3]; if (process.argv[4]) TUNE.dps = +process.argv[4]; if (process.argv[5]) TUNE.tower = +process.argv[5];
for (const [name, a] of Object.entries(mixes)) {
  if (arg && arg !== name) continue;
  console.log('==', name, 'power', power(a, forges[name]).toFixed(0), 'space', Object.entries(a).reduce((s, [t, n]) => s + n * U[t].space, 0));
  for (const ratio of ratios) {
    const res = [];
    for (let seed = 1; seed <= 9; seed++) res.push(play(a, ratio, lv[name], seed, forges[name], ['smart', 'all', 'sloppy'][seed % 3]));
    const st = [0, 0, 0, 0]; res.forEach((x) => st[x.r.stars]++);
    const des = res.reduce((s, x) => s + x.r.destruction, 0) / res.length, tm = res.reduce((s, x) => s + x.r.time, 0) / res.length;
    const lost = res.reduce((s, x) => s + x.lostPct, 0) / res.length;
    console.log(`  ratio ${ratio}: stars 0/1/2/3 = ${st.join('/')}  destr ${des.toFixed(0)}%  time ${tm.toFixed(0)}s  lostSpace ${lost.toFixed(0)}`);
  }
}
