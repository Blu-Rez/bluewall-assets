import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, roadDist } from '../bot/bluebot_v2/bluewall/client/src/roads.js';
import { planDefs, defItems, defCounts, defSolids, DEF_KINDS } from '../bot/bluebot_v2/bluewall/client/src/defplan.js';
L.setMap('night'); buildRoads();
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const plan = planDefs(), c30 = defCounts(30);
for (const [id, k] of Object.entries(DEF_KINDS)) ok((c30[id] || 0) >= (id === 'brazier' ? 1 : Math.ceil(k.max * 0.5)), `${id}: ${c30[id] || 0} of max ${k.max} placed at level 30`);
ok(defItems(1).length === 0, 'level 1: nothing yet');
let prev = -1, mono = true; for (let lv = 0; lv <= 30; lv++) { const n = defItems(lv).length; if (n < prev) mono = false; prev = n; }
ok(mono, 'the number of things only grows with the level');
const a = defItems(10).map((i) => i.x.toFixed(1) + i.z.toFixed(1)), b = new Set(defItems(30).map((i) => i.x.toFixed(1) + i.z.toFixed(1))); ok(a.every((k) => b.has(k)), 'nothing moves when the castle grows (level 10 ⊂ level 30)');
let wet = 0, onRoad = 0, inTown = 0; for (const it of plan) { if (L.height(it.x, it.z) <= L.MOAT.level + 1) wet++; if (it.role === 'trap' && roadDist(it.x, it.z) < 2.5) onRoad++; if (L.sdTown(it.x, it.z) < 16) inTown++; }
ok(wet === 0, 'nothing in the water'); ok(onRoad === 0, 'no trap on a road'); ok(inTown === 0, 'nothing inside / against the town wall');
const again = JSON.stringify(planDefs().map((i) => [i.x, i.z])); ok(again === JSON.stringify(plan.map((i) => [i.x, i.z])), 'deterministic');
console.log('total at 30:', defItems(30).length, 'solids', defSolids(30).length, JSON.stringify(c30));
if (process.argv[2] === 'dump') console.log(JSON.stringify({ plan: plan.map((i) => [i.id, +i.x.toFixed(1), +i.z.toFixed(1), i.gate]), gates: L.TGATES.map((g) => [g.x, g.z, g.nx, g.nz]) }));
console.log(bad ? 'DEF FAIL' : 'DEF OK');
