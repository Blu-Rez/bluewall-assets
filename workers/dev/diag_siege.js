import * as SIM from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const tun = arg('tune', ''); if (tun) for (const kv of tun.split(',')) { const [k, v] = kv.split('='); SIM.TUNE[k] = +v; }
const U = DEFS.units, ARMY = JSON.parse(arg('army', '{"giant":6,"catapult":8,"cannon":4,"ram":6,"guard":11}')), profile = arg('profile', 'balanced');
const spec = { seed: 1, ratio: 1, power: 4500, levels: { keep: 20, wall: 20, towers: 20 }, loot: {}, profile };
const sim = SIM.createBattle({ spec, army: ARMY, forge: 20, spells: {}, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
const g = sim.base.deploy, gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z, keepT = BT.targets.find((t) => t.type === 'keep');
const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
const seq = DEFS.order.filter((u) => ARMY[u] > 0).sort((a, b) => prio[U[a].role] - prio[U[b].role]);
for (const ty of seq) { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); }
console.log('gate', gx.toFixed(0), gz.toFixed(0), 'deploy', g.x.toFixed(0), g.z.toFixed(0), 'n', g.nx.toFixed(2), g.nz.toFixed(2));
let t = 0;
while (!sim.over && t < 185) {
  sim.step(0.1); t += 0.1;
  if (Math.abs(t / 10 - Math.round(t / 10)) < 0.005) {
    const al = {}; for (const u of sim.units) if (!u.dead) al[u.type] = (al[u.type] || 0) + 1;
    const sg = sim.units.filter((u) => !u.dead && u.role === 'siege'); const dg = sg.length ? sg.reduce((a, u) => a + Math.hypot(u.x - gx, u.z - gz), 0) / sg.length : 0;
    const hunters = sim.defenders.filter((d) => !d.dead && d.hunter), hunting = hunters.filter((d) => d.target && d.target.role === 'siege').length;
    const gd = sim.defenders.filter((d) => d.guardian && !d.dead).map((d) => d.type[0] + ':' + (d.target ? d.target.type : '-') + '@' + Math.round(Math.hypot(d.target ? d.target.x - d.x : 0, d.target ? d.target.z - d.z : 0))).join(' ');
    console.log(gd);
    console.log('t' + t.toFixed(0).padStart(4), 'des', sim.destruction().toFixed(0), JSON.stringify(al), 'siegeDistGate', dg.toFixed(0), 'hunters', hunters.length, 'hunting', hunting, 'defs', sim.defenders.filter((d) => !d.dead).length);
  }
}
const r = sim.result(); console.log(JSON.stringify({ stars: r.stars, des: r.destruction, lost: r.lost, time: r.time }));
{ const tk = sim.stats.took; let tot = 0; const rows = []; for (const src in tk) { let s = 0; for (const ty in tk[src]) s += tk[src][ty]; tot += s; rows.push([src, Math.round(s), Object.entries(tk[src]).map(([a, b]) => a + ':' + Math.round(b)).join(',')]); } console.log('TOOK total', Math.round(tot), rows.map((r) => r.join(' ')).join(' | '));
  const hp = sim.units.reduce((a, u) => a + u.maxHp, 0), left = sim.units.filter((u) => !u.dead).reduce((a, u) => a + u.hp, 0); console.log('army hp', Math.round(hp), 'left', Math.round(left)); }
