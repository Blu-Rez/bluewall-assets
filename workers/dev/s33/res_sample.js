// one real battle of the owner's army -> the numbers the result card shows (sample for S10)
import { createBattle, TUNE } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import { resultExtras } from '/home/claude/bot/bluebot_v2/bluewall/client/src/resultinfo.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import ARMYF from './../plan5/owner_army_full.json';
import fs from 'fs';
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const U = DEFS.units, army = ARMYF, seed = +(process.argv[2] || 1);
const P = Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * 19), 0);
const spec = { seed, ratio: 1, power: Math.round(P * 0.85), levels: { keep: 20, wall: 20, towers: 20 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
const sim = createBattle({ spec, army, forge: 20, spells: {}, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
const g = sim.base.deploy, gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z, keepT = BT.targets.find((t) => t.type === 'keep');
const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 };
const seq = DEFS.order.filter((u) => army[u] > 0).sort((a, b) => prio[U[a].role] - prio[U[b].role]);
for (const ty of seq) { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); }
let t = 0; while (!sim.over && t < 185) { sim.step(0.1); t += 0.1; }
const r = sim.result(); const sent = {}; for (const u of sim.units) if (u.active) sent[u.type] = (sent[u.type] || 0) + 1;
const x = resultExtras({ stats: sim.stats, sent, lost: r.lost, r });
const out = { stars: r.stars, destruction: r.destruction, time: r.time, loot: r.loot, sent, lost: r.lost, by: x && x.by, hint: x && x.hint, razed: 118, buildings: 122, cups: 28 };
fs.writeFileSync('/home/claude/dev/s33/res_sample.json', JSON.stringify(out)); console.log(JSON.stringify(out));
