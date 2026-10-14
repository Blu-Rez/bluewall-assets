// p30: does a column of ground units get across the gate bridges?  prints per-type: units that never crossed / stalled on or at a bridge
import { createBattle } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });
const army = JSON.parse(process.env.ARMY || '{"spear":30,"sword":30,"guard":12,"archer":30,"cavalry":8,"giant":3}');
const spec = { seed: +(process.env.SEED || 3), ratio: 1, power: 4000, levels: { keep: 16, wall: 16, towers: 16 }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
const sim = createBattle({ spec, army, forge: 8, targets: JSON.parse(JSON.stringify(BT.targets)), meta: BT.meta, nav: NAV });
const keepT = BT.targets.find((t) => t.type === 'keep');
const gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z;
console.log('bridges', NAV.bridges.map((b) => [b.x | 0, b.z | 0, b.len, b.wid].join('/')).join('  '), ' gate', gx | 0, gz | 0, ' keep', keepT.x | 0, keepT.z | 0);
for (const ty of Object.keys(army)) sim.send(ty, keepT.x, keepT.z);
const wasOn = new Map(), everOn = new Set(); let t = 0;
const dt = 0.1, stall = new Map(), maxSt = new Map();
while (t < 150) {
  const ground = sim.units.filter((u) => !u.air && !u.dead && u.active);
  const prev = new Map(ground.map((u) => [u.id, [u.x, u.z]]));
  sim.step(dt); t += dt;
  for (const u of ground) {
    const b = NAV.onBridge(u.x, u.z, 4); if (b) everOn.add(u.id);
    const p = prev.get(u.id); const mv = Math.hypot(u.x - p[0], u.z - p[1]);
    const near = NAV.bridges.some((b) => Math.hypot(u.x - b.x, u.z - b.z) < 26);
    if (near && !u.target && mv < u.spd * dt * 0.2) { stall.set(u.id, (stall.get(u.id) || 0) + dt); maxSt.set(u.id, Math.max(maxSt.get(u.id) || 0, stall.get(u.id))); } else stall.set(u.id, 0);
  }
  if (Math.round(t * 10) % 300 === 0) { const al = sim.units.filter((u) => !u.air && !u.dead && u.active); const on = al.filter((u) => NAV.onBridge(u.x, u.z, 4)).length; const inside = al.filter((u) => Math.hypot(u.x - keepT.x, u.z - keepT.z) < 150).length; console.log('t', t.toFixed(0), 'alive', al.length, 'onBridge', on, 'insideTown', inside, 'everCrossed', everOn.size, 'pinned(wst>1)', al.filter((u) => u.wst > 1).length); }
}
const byType = {}; for (const u of sim.units) { if (u.air) continue; const k = u.type; byType[k] = byType[k] || { n: 0, cross: 0, dead: 0, stall3: 0 }; byType[k].n++; if (everOn.has(u.id)) byType[k].cross++; if (u.dead) byType[k].dead++; if ((maxSt.get(u.id) || 0) > 3) byType[k].stall3++; }
console.log(JSON.stringify(byType));
