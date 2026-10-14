// R7 probe (planning agent C, read-only): the owner's own army (state._start_army at L20, forge 20) against the real map at a few
// defence ratios; prints stars / destruction / time.  Build: see r7.sh.  Light: NS seeds x few ratios.
import { createBattle, TUNE } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim_var_RA.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import ARMY0 from './owner_army.json';
import ARMYF from './owner_army_full.json';
if (process.env.TUNE_KV) for (const kv of process.env.TUNE_KV.split(',')) { const [k, v] = kv.split('='); TUNE[k] = +v; }
const ARMY = process.env.FULL ? ARMYF : ARMY0;
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const U = DEFS.units, FORGE = 20;
const power = (army, forge) => Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);
const keepT = BT.targets.find((t) => t.type === 'keep');
function play(army, ratio, seed, style, spells) {
  const P = power(army, FORGE);
  const spec = { seed, ratio, power: Math.round(P * ratio), levels: { keep: 20, wall: 20, towers: 20 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
  const sim = createBattle({ spec, army, forge: FORGE, spells, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
  const g = sim.base.deploy, gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z;
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
  const seq = DEFS.order.filter((u) => army[u] > 0).sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  const sendTo = (ty) => { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); };
  let t = 0, k = 0, nextSend = 0, s2 = 0, t50 = -1, tKeep = -1; const dt = 0.1; let cast = 0;
  while (!sim.over && t < 185) {
    if (style === 'all') { if (k === 0) { for (const ty of seq) sendTo(ty); k = 99; } } else if (t >= nextSend && k < seq.length) { sendTo(seq[k++]); nextSend = t + 2.5; }
    if (style === 'smart' && !s2 && t > 45) { s2 = 1; for (const ty of seq) sim.send(ty, keepT.x, keepT.z); }
    if (spells && t > 20 && cast < 6 && Math.round(t * 10) % 150 === 0) { const s = ['rage', 'heal', 'lightning', 'freeze', 'quake', 'lightning'][cast++]; sim.cast(s, keepT.x, keepT.z); }
    sim.step(dt); t += dt;
    if (t50 < 0 && sim.destruction() >= 50) t50 = t; if (tKeep < 0 && sim.keepDown) tKeep = t;
  }
  const r = sim.result();
  if (process.env.DBG && r.destruction < 100) { console.log('   seed', seed, 'left:', sim.buildings.filter((b) => !b.dead && b.value > 0).map((b) => b.type + '@' + Math.round(b.x) + ',' + Math.round(b.z) + ' hp' + Math.round(b.hp)).join(' | ')); const by = {}; for (const u of sim.units) if (!u.dead) { const k = u.type + (u.go ? '>go' : '') + (u.target ? '>' + (u.target.type || 'def') : '.idle'); by[k] = (by[k] || 0) + 1; } console.log('   alive:', JSON.stringify(by), 'guardians', sim.defenders.filter((d) => d.guardian && !d.dead).map((d) => d.type).join(',')); }
  return { r, t50, tKeep, left: sim.buildings.filter((b) => !b.dead && b.value > 0).map((b) => b.type) };
}
const ratios = (process.argv[2] || '0.54,1.0,1.15').split(',').map(Number), NS = +(process.env.NS || 4);
console.log('owner army power', power(ARMY, FORGE).toFixed(0), 'space', Object.entries(ARMY).reduce((s, [t, n]) => s + n * U[t].space, 0));
for (const ratio of ratios) for (const sp of [null, { lightning: 3, heal: 2, freeze: 2, rage: 1, quake: 1 }]) {
  const res = []; for (let s = 1; s <= NS; s++) res.push(play(ARMY, ratio, s, ['smart', 'all'][s % 2], sp));
  const st = [0, 0, 0, 0]; res.forEach((x) => st[x.r.stars]++);
  const lostSp = res.map((x) => Object.entries(x.r.lost).reduce((q, [ty, n]) => q + n * U[ty].space, 0));
  console.log(`ratio ${ratio} spells ${sp ? 'yes' : 'no '}: stars0/1/2/3 ${st.join('/')}  des ${res.map((x) => x.r.destruction.toFixed(0)).join(',')}  end ${res.map((x) => x.r.time.toFixed(0)).join(',')}s  t50 ${res.map((x) => x.t50.toFixed(0)).join(',')}  keepDown ${res.map((x) => x.tKeep.toFixed(0)).join(',')}  lostSpace ${lostSp.join(',')}  left ${res.map((x) => x.left.length).join(',')}`);
}
