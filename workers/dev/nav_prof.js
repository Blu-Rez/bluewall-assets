// R5: where do the 140-230 ms steps come from?  wraps NAV.route and times every call; prints the slowest ones and the worst sim steps
import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import ARMYF from './plan5/owner_army_full.json';
const NAV0 = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const calls = []; let cur = null;
const NAV = { ...NAV0, route: (ax, az, bx, bz) => { const t0 = process.hrtime.bigint(); const r = NAV0.route(ax, az, bx, bz); const ms = Number(process.hrtime.bigint() - t0) / 1e6; calls.push({ ms, ok: !!r, n: r ? r.length : 0, d: Math.hypot(bx - ax, bz - az), step: cur, q: [ax, az, bx, bz] }); return r; } };
if (NAV0.warm) for (let j = 0; j < NAV0.rows; j += 40) NAV0.warm(j, j + 40);
const U = DEFS.units, keepT = BT.targets.find((t) => t.type === 'keep');
const seeds = +(process.argv[2] || 4), worst = [];
for (let seed = 1; seed <= seeds; seed++) {
  const army = ARMYF, P = Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * 19), 0);
  const spec = { seed, ratio: 1, power: Math.round(P), levels: { keep: 20, wall: 20, towers: 20 }, loot: {} };
  const sim = createBattle({ spec, army, forge: 20, spells: {}, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
  const g = sim.base.deploy, gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z;
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
  const seq = DEFS.order.filter((u) => army[u] > 0).sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  for (const ty of seq) { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); }
  let t = 0;
  while (!sim.over && t < 185) { cur = seed + ':' + t.toFixed(1); const w0 = process.hrtime.bigint(); sim.step(0.1); t += 0.1; const ms = Number(process.hrtime.bigint() - w0) / 1e6; worst.push([ms, cur]); }
}
worst.sort((a, b) => b[0] - a[0]);
worst.forEach((w)=>{}); const w2 = worst.filter((w) => { const t = +w[1].split(':')[1]; return t >= 1; }); console.log('slowest steps after t>=1:', w2.slice(0, 6).map((w) => w[0].toFixed(0) + 'ms@' + w[1]).join('  ')); const nav0 = calls.filter((c) => c.step && +c.step.split(':')[1] < 0.5); console.log('route ms inside t<0.5 steps:', nav0.reduce((a, c) => a + c.ms, 0).toFixed(0), 'of', nav0.length, 'calls'); console.log('slowest steps:', worst.slice(0, 8).map((w) => w[0].toFixed(0) + 'ms@' + w[1]).join('  '));
const sum = calls.reduce((a, c) => a + c.ms, 0); calls.sort((a, b) => b.ms - a.ms);
console.log('route calls', calls.length, 'total', sum.toFixed(0) + 'ms', 'failed', calls.filter((c) => !c.ok).length, 'slowest:', calls.slice(0, 8).map((c) => `${c.ms.toFixed(0)}ms ok=${c.ok} pts=${c.n} d=${c.d.toFixed(0)} @${c.step}`).join(' | '));
const ok = calls.filter((c) => c.ok), bad = calls.filter((c) => !c.ok);
console.log('ok calls avg', (ok.reduce((a, c) => a + c.ms, 0) / Math.max(1, ok.length)).toFixed(2), 'ms; failed calls avg', (bad.reduce((a, c) => a + c.ms, 0) / Math.max(1, bad.length)).toFixed(2), 'ms');

if (process.env.DUMP) require('fs').writeFileSync(process.env.DUMP, JSON.stringify(calls.map((c) => ({ ms: c.ms, q: c.q, n: c.n }))));
