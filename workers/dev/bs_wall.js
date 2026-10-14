// regression harness: counts how often a ground unit crosses an INTACT wall / gate segment, and how far the battle gets (real map)
import { createBattle, TUNE } from '/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
import BT from '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const NAVON = !process.env.NONAV;
const NAV = buildNav({ height: L.height, bridges: bridgesFromLayout(L) });         // (the sim and the counter share it: the counter is what proves nobody wades)
let WETSTEPS = 0, ONBRIDGE = 0, NOROUTE = 0, PINNED = 0;
const U = DEFS.units;
const power = (army, forge = 1) => Object.entries(army).reduce((s, [t, n]) => s + n * Math.sqrt(U[t].hp * U[t].dps) / 3 * (1 + 0.06 * (forge - 1)), 0);
const keepT = BT.targets.find((t) => t.type === 'keep');
const X = (ax, az, bx, bz, cx, cz, dx, dz) => { const rx = bx - ax, rz = bz - az, sx = dx - cx, sz = dz - cz, den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return false; const t = ((cx - ax) * sz - (cz - az) * sx) / den, u = ((cx - ax) * rz - (cz - az) * rx) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1; };
function play(army, ratio, level, seed, forge, style) {
  const P = power(army, forge);
  const spec = { seed, ratio, power: Math.round(P * ratio), levels: { keep: level, wall: level, towers: level }, loot: { ruby: 1000, emerald: 1000, turq: 1000 } };
  const sim = createBattle({ spec, army, forge, targets: JSON.parse(JSON.stringify(BT.targets)), meta: process.env.DEPLOY ? { ...BT.meta, deploy: { d: +process.env.DEPLOY.split(',')[0], lat: +process.env.DEPLOY.split(',')[1] } } : BT.meta, nav: NAVON ? NAV : null });
  const g = sim.base.deploy, gx = BT.meta.gates[0].x, gz = BT.meta.gates[0].z, order = DEFS.order.filter((u) => army[u] > 0);
  const prio = { giant: 0, tank: 1, infantry: 2, cavalry: 3, siege: 4, ranged: 5, air: 6 }, seq = order.slice().sort((a, b) => prio[U[a].role] - prio[U[b].role]);
  const sendTo = (ty) => { const role = U[ty].role; if (role === 'air') sim.send(ty, keepT.x, keepT.z); else if (role === 'ranged' || role === 'siege') sim.send(ty, gx - g.nx * 14, gz - g.nz * 14); else sim.send(ty, gx, gz); };
  const walls = sim.buildings.filter((b) => b.ring);
  let t = 0, k = 0, nextSend = 0, cross = 0, first = -1, s2 = 0; const dt = 0.1;
  const prev = new Map();
  while (!sim.over && t < 185) {
    if (style === 'all') { if (k === 0) { for (const ty of seq) sendTo(ty); k = 99; } } else if (t >= nextSend && k < seq.length) { sendTo(seq[k++]); nextSend = t + 2.5; }
    if (style === 'smart' && !s2 && t > 45) { s2 = 1; for (const ty of seq) sim.send(ty, keepT.x + (k % 3 - 1) * 15, keepT.z); }
    const ground = sim.units.filter((u) => !u.air && !u.dead);
    for (const u of ground) prev.set(u.id, [u.x, u.z]);
    const wasAlive = walls.map((w) => !w.dead);
    sim.step(dt); t += dt; if (process.env.TRACE && Math.abs(t*10 - Math.round(t*10))<1e-6 && Math.round(t*10)%20===0 && t>100) { const u = sim.units.find((q)=>q.type==='spear'&&!q.dead); if (u) console.log('  T',t.toFixed(0),'pos',u.x.toFixed(1),u.z.toFixed(1),'go',u.go&&[u.go.x|0,u.go.z|0],'tgt',u.target&&(u.target.type),u.target&&[u.target.x|0,u.target.z|0],'blk',u.block&&[u.block.type,u.block.x|0,u.block.z|0, u.block.hp|0],'stuck',(u.stuck||0).toFixed(1),'bl',u.blocker&&[u.blocker.type,u.blocker.x|0,u.blocker.z|0],'cd',u.cd.toFixed(1)); }
    for (const u of ground) { if (!u.wade && NAV.isWet(u.x, u.z)) WETSTEPS++; if (NAV.onBridge(u.x, u.z)) ONBRIDGE++; }
    for (const u of ground) { const p = prev.get(u.id); if (!p) continue; if (process.env.JDBG) { const j = Math.hypot(u.x - p[0], u.z - p[1]); if (j > 3.2) console.log('   JUMP', u.type, 't', t.toFixed(1), j.toFixed(1), 'spd', (u.spd*dt).toFixed(2), 'from', p.map((q)=>q.toFixed(1)).join(','), 'go', u.go && [u.go.x|0, u.go.z|0]); } walls.forEach((w, i) => { if (wasAlive[i] && !w.dead && X(p[0], p[1], u.x, u.z, w.a[0], w.a[1], w.b[0], w.b[1])) { cross++; if (first < 0) first = t; if (process.env.XDBG) console.log('   X', u.type, 't', t.toFixed(1), 'from', p.map((q)=>q.toFixed(1)).join(','), 'to', u.x.toFixed(1), u.z.toFixed(1), 'wall', w.type, w.x|0, w.z|0, 'rot', w.rot.toFixed(2), 'w', w.w.toFixed(0), 'd', w.d, 'stuck', (u.stuck||0).toFixed(1)); } }); }
  }
  const r = sim.result(); if (process.env.DBG) { const al = {}; sim.units.filter((u)=>!u.dead).forEach((u)=>{al[u.type]=(al[u.type]||0)+1}); const lt = {}; sim.buildings.filter((b)=>!b.dead&&b.value>0).forEach((b)=>{lt[b.type]=(lt[b.type]||0)+1}); if (process.env.DBG>1) sim.units.filter((u)=>!u.dead).slice(0,8).forEach((u)=>console.log('   u',u.type,u.x.toFixed(0),u.z.toFixed(0),'go',u.go&&[u.go.x|0,u.go.z|0],'tgt',u.target&&(u.target.type||u.target.side),u.target&&[u.target.x|0,u.target.z|0, u.target.dead],'blk',u.block&&u.block.type,'stuck',(u.stuck||0).toFixed(1),'bl',u.blocker&&u.blocker.type)); console.log('  DBG style',style,'alive',JSON.stringify(al),'left',JSON.stringify(lt),'des',r.destruction,'t',r.time.toFixed(0), 'sim.rest', sim.rest); }
  NOROUTE += sim.units.reduce((a, u) => a + (u.noRoute || 0), 0); PINNED += sim.units.filter((u) => !u.dead && u.wst > 0.5).length;
  const stuck = sim.units.filter((u) => !u.dead && u.hp > 0).length;
  return { r, cross, first, stuck, left: sim.buildings.filter((b) => !b.dead && b.value > 0).length, wallsLeft: walls.filter((w) => !w.dead).length };
}
const mixes = {
  early: { spear: 12, archer: 6 },
  mid: { spear: 25, sword: 14, archer: 16, cavalry: 4, catapult: 2 },
  late: { spear: 30, sword: 30, guard: 12, archer: 30, cavalry: 8, pegasus: 6, baby: 3, catapult: 5, giant: 3 },
  roster: { spear: 12, sword: 12, guard: 6, archer: 14, cavalry: 5, pegasus: 4, baby: 2, dragon: 1, catapult: 2, giant: 1, imp: 6, mage: 5, ram: 3, cannon: 3, werewolf: 2, trebuchet: 2, hill: 1, shieldmaiden: 1, lord: 1 },
  siegefull: { spear: 20, archer: 20, ram: 4, cannon: 4, trebuchet: 3, catapult: 3, hill: 2, shieldmaiden: 2, lord: 2, mage: 6 },
};
const forges = { early: 1, mid: 4, late: 10, roster: 14, siegefull: 12 }, lv = { early: 3, mid: 8, late: 14, roster: 16, siegefull: 15 };
const ratio = +(process.argv[2] || 1.15), NS = +(process.env.NS || 6);
let tc = 0, n = 0;
for (const [name, a] of Object.entries(mixes)) {
  if (process.env.ONLY && process.env.ONLY !== name) continue;
  const res = []; for (let s = (+process.env.S0 || 1); s <= (+process.env.S0 || 1) + NS - 1; s++) res.push(play(a, ratio, lv[name], s, forges[name], ['smart', 'all'][s % 2]));
  const c = res.reduce((s, x) => s + x.cross, 0), des = res.reduce((s, x) => s + x.r.destruction, 0) / res.length, tm = res.reduce((s, x) => s + x.r.time, 0) / res.length;
  const st = [0, 0, 0, 0]; res.forEach((x) => st[x.r.stars]++);
  console.log(`${name.padEnd(9)} crossings/battle ${(c / NS).toFixed(1).padStart(6)}  first@${res.map((x) => x.first < 0 ? '-' : x.first.toFixed(0)).join(',')}  destr ${des.toFixed(0)}%  time ${tm.toFixed(0)}s  stars ${st.join('/')}  100%:${res.filter((x) => x.r.destruction >= 99.9).length}/${NS}  leftTargets ${res.map((x) => x.left).join(',')} wallsLeft ${res.map((x) => x.wallsLeft).join(',')}`);
  tc += c; n += NS;
}
console.log('TOTAL crossings per battle:', (tc / n).toFixed(2), ' ground unit-steps in water:', WETSTEPS, ' on a bridge:', ONBRIDGE, ' noRoute events:', NOROUTE, ' pinned at end:', PINNED);
