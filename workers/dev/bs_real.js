// headless balance harness for battlesim.js on the REAL map (basetargets.json)
import { createBattle, TUNE } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
const U = DEFS.units;
const power = (army, forge = 1) => Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);
const keepT = BT.targets.find((t) => t.type === 'keep');
function play(army, ratio, level, seed, forge = 1, style = 'smart', T = 180) {
  const P = power(army, forge);
  const spec = { seed, ratio, power: Math.round(P * ratio), levels: { keep: level, wall: level, towers: level }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
  const sim = createBattle({ spec, army, forge, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta });
  const g = sim.base.deploy;                                  // in front of the main gate: gate center = deploy - n*62
  const gx = g.x - g.nx * 62, gz = g.z - g.nz * 62;
  const order = DEFS.order.filter((u) => army[u] > 0);
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
  const seq = order.slice().sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  let t = 0, k = 0, nextSend = 0; const dt = 0.1;
  const sendTo = (ty) => { const role = U[ty].role;
    if (role === 'air') sim.send(ty, keepT.x, keepT.z);
    else if (role === 'ranged' || role === 'siege') sim.send(ty, gx + g.nx * -14, gz + g.nz * -14);
    else sim.send(ty, gx, gz); };
  while (!sim.over && t < T + 5) {
    if (style === 'all') { if (k === 0) { for (const ty of seq) sendTo(ty); k = 99; } }
    else if (t >= nextSend && k < seq.length) { sendTo(seq[k++]); nextSend = t + 2.5; }
    // re-aim idle squads: once their group is stuck near nothing, send all to keep
    if (style === 'smart' && t > 40 && Math.floor(t) % 15 === 0 && Math.abs(t - Math.round(t)) < dt) for (const ty of seq) sim.send(ty, keepT.x + (k % 3 - 1) * 15, keepT.z);
    sim.step(dt); t += dt;
    if (process.env.TR && Math.abs(t / 20 - Math.round(t / 20)) < dt / 40) console.log('   t', t.toFixed(0), 'destr', sim.destruction().toFixed(0), 'alive', sim.alive(), 'keepDown', !!sim.keepDown, 'towersLeft', sim.buildings.filter((b) => !b.dead && b.def).length, 'wallsLeft', sim.buildings.filter((b) => !b.dead && b.ring).length);
  }
  if (process.env.DBG) { console.log('   left:', sim.buildings.filter((b) => !b.dead && b.value > 0).map((b) => b.type + '@' + Math.round(b.x) + ',' + Math.round(b.z) + ' hp' + Math.round(b.hp)).join(' | ')); const idle = sim.units.filter((u) => !u.dead && u.hp > 0); const by = {}; for (const u of idle) by[u.type + (u.target ? '>' + (u.target.type || 'def') : '.idle')] = (by[u.type + (u.target ? '>' + (u.target.type || 'def') : '.idle')] || 0) + 1; console.log('   units:', JSON.stringify(by)); }
  const r = sim.result(); return { r, P, sim };
}
const mixes = {
  early: { spear: 12, archer: 6 },
  mid: { spear: 25, sword: 14, archer: 16, cavalry: 4, catapult: 2 },
  late: { spear: 30, sword: 30, guard: 12, archer: 30, cavalry: 8, pegasus: 6, baby: 3, catapult: 5, giant: 3 },
  dragons: { sword: 20, archer: 20, baby: 6, dragon: 3, giant: 4 },
  roster: { spear: 12, sword: 12, guard: 6, archer: 14, cavalry: 5, pegasus: 4, baby: 2, dragon: 1, catapult: 2, giant: 1, imp: 6, mage: 5, ram: 3, cannon: 3, werewolf: 2, trebuchet: 2, hill: 1, shieldmaiden: 1, lord: 1 },
  siegefull: { spear: 20, archer: 20, ram: 4, cannon: 4, trebuchet: 3, catapult: 3, hill: 2, shieldmaiden: 2, lord: 2, mage: 6 },
};
const forges = { early: 1, mid: 4, late: 10, dragons: 14, roster: 14, siegefull: 12 }, lv = { early: 3, mid: 8, late: 14, dragons: 17, roster: 16, siegefull: 15 };
if (process.env.TH) TUNE.hp = +process.env.TH; if (process.env.TD) TUNE.dps = +process.env.TD; if (process.env.TT) TUNE.tower = +process.env.TT; if (process.env.US) TUNE.us = +process.env.US; if (process.env.SP) TUNE.sp = +process.env.SP;
const arg = process.argv[2], ratios = (process.argv[3] || '0.9,1.0,1.15,1.3,1.5').split(',').map(Number);
for (const [name, a] of Object.entries(mixes)) {
  if (arg && arg !== 'all' && arg !== name) continue;
  console.log('==', name, 'power', power(a, forges[name]).toFixed(0), 'space', Object.entries(a).reduce((s, [t, n]) => s + n * U[t].space, 0));
  for (const ratio of ratios) {
    const res = []; for (let seed = 1; seed <= (+process.env.NS || 6); seed++) res.push(play(a, ratio, lv[name], seed, forges[name], ['smart', 'all'][seed % 2]));
    const st = [0, 0, 0, 0]; res.forEach((x) => st[x.r.stars]++);
    const des = res.reduce((s, x) => s + x.r.destruction, 0) / res.length, tm = res.reduce((s, x) => s + x.r.time, 0) / res.length, lost = res.reduce((s, x) => s + Object.entries(x.r.lost).reduce((q, [ty, n]) => q + n * U[ty].space, 0), 0) / res.length;
    console.log(`  ratio ${ratio}: stars 0/1/2/3 = ${st.join('/')}  destr ${des.toFixed(0)}%  time ${tm.toFixed(0)}s  lostSpace ${lost.toFixed(0)}`);
  }
}
