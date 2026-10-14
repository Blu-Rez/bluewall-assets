// p37: the squad rings (the circle round every squad) of the army's starting formation never touch; every block is compact; the heroes stand in front, the archers / siege behind the infantry.
import { planArmy, ringMargin, tierOf, toFrame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/armyplan.js';
import DEFS from '/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const UR = 2, u = UR / 2, rbOf = (t) => { const d = DEFS.units[t]; return (d.space >= 8 ? 2.4 : d.space >= 3 ? 1.1 : 0.75) * UR; };
const ringsOf = (p) => { const R = {}; for (const t of p.types) { const P = p.pos[t]; let cx = 0, cz = 0; for (const q of P) { cx += q[0]; cz += q[1]; } cx /= P.length; cz /= P.length; let far = 0; for (const q of P) far = Math.max(far, Math.hypot(q[0] - cx, q[1] - cz)); R[t] = { cx, cz, r: Math.max(4.5 * u, far + ringMargin(rbOf(t), u)) }; } return R; };
const gaps = (p) => { const R = ringsOf(p), ts = p.types; let min = 1e9, bad = 0; for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const A = R[ts[i]], B = R[ts[j]], g = Math.hypot(A.cx - B.cx, A.cz - B.cz) - A.r - B.r; min = Math.min(min, g); if (g < 0) bad++; } return { min, bad, R }; };
const fullMax = { spear: 61, sword: 61, guard: 21, archer: 69, cavalry: 23, pegasus: 13, baby: 5, dragon: 1, catapult: 7, giant: 3, imp: 17, mage: 14, ram: 6, cannon: 6, werewolf: 5, trebuchet: 4, hill: 2, shieldmaiden: 3, lord: 3, legionary: 43, captain: 3, ogre: 2, gryphon: 3, lich: 3, treant: 2, gryphonknight: 1, darkrider: 1, baby3: 1, dragon3: 1 };
const sets = { small: { spear: 30, sword: 20, archer: 20, cavalry: 8 }, mid: { spear: 60, sword: 40, archer: 40, cavalry: 15, giant: 3, dragon: 1, catapult: 4, mage: 8 }, giants: { giant: 4, spear: 20, ram: 4, catapult: 3 }, 'his full army': fullMax, one: { spear: 7 }, 'only monsters': { giant: 9, dragon: 5, ogre: 4, treant: 4, gryphon: 6 } };
for (const [name, a] of Object.entries(sets)) { const p = planArmy(a, UR, true), g = gaps(p); ok(g.bad === 0 && (g.min >= 1.2 || p.types.length < 2), `${name}: no two rings touch (${p.types.length} rings, smallest gap ${p.types.length > 1 ? g.min.toFixed(2) : '-'} m, ${p.width.toFixed(0)} x ${p.depth.toFixed(0)} m)`); }
// random armies
let seed = 12345; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
let worst = 1e9, badSets = 0, N = 300; for (let k = 0; k < N; k++) { const a = {}; for (const t of DEFS.order) if (rnd() < 0.45) a[t] = 1 + Math.floor(Math.pow(rnd(), 2) * (DEFS.units[t].space >= 8 ? 12 : 90)); if (!Object.keys(a).length) continue; const p = planArmy(a, UR, true), g = gaps(p); if (g.bad) badSets++; if (p.types.length > 1) worst = Math.min(worst, g.min); }
ok(badSets === 0, `${N} random armies: no two rings touch (smallest gap over all ${worst.toFixed(2)} m)`);
// compact blocks
const pg = planArmy({ giant: 4 }, UR, true), cols = new Set(pg.pos.giant.map((q) => q[0].toFixed(1))), rows = new Set(pg.pos.giant.map((q) => q[1].toFixed(1)));
ok(cols.size === 2 && rows.size === 2, `4 giants stand 2 x 2 (${cols.size} files x ${rows.size} ranks)`);
const ps = planArmy({ spear: 61 }, UR, true), rs = new Set(ps.pos.spear.map((q) => q[1].toFixed(1))); ok(rs.size >= 6 && rs.size <= 9, `61 spearmen: ${rs.size} ranks (about as deep as wide)`);
// order: nobody of a later group stands in front of the middle of an earlier group's ring
{ const p = planArmy(fullMax, UR, true), R = ringsOf(p); let bad = [];
  const g = (t) => { const k = tierOf(t); return k <= 1 ? 0 : k <= 3 ? 1 : 2; };
  for (const a of p.types) for (const b of p.types) if (g(a) < g(b) && R[b].cz - R[b].r < R[a].cz - 0.5) bad.push(a + '>' + b);
  ok(bad.length === 0, `his full army: the archers / mages / siege never stand in front of the infantry, the infantry never in front of the heroes and great ones ${bad.slice(0, 3).join(' ')}`);
  const lat = (t) => R[t]; let l0 = 1e9, l1 = -1e9, b1 = 0; for (const t of p.types) { l0 = Math.min(l0, R[t].cx - R[t].r); l1 = Math.max(l1, R[t].cx + R[t].r); b1 = Math.max(b1, R[t].cz + R[t].r); }
  ok(l1 - l0 > b1 * 1.5, `his full army is wide, not tall: ${(l1 - l0).toFixed(0)} m x ${b1.toFixed(0)} m`);
  ok(l0 >= -92 - 0.5 && l1 <= 84 + 0.5, `and stands inside the muster plain (${l0.toFixed(0)} .. ${l1.toFixed(0)} m)`); }
// buildings on the plain (the windmill stands at about lat -70, back 55): no ring touches one, nothing changes for the rest
{ const OB = [[-70, 55, 9], [-132, 47, 11]], p = planArmy(fullMax, UR, true, OB), R = ringsOf(p), g = gaps(p); let near = 1e9; for (const t of p.types) for (const o of OB) near = Math.min(near, Math.hypot(R[t].cx - o[0], R[t].cz - o[1]) - R[t].r - o[2]);
  ok(near >= 3.0, `his full army with the windmill on the plain: every ring keeps ${near.toFixed(1)} m from it`); ok(g.bad === 0, `and still no two rings touch (smallest gap ${g.min.toFixed(2)} m, ${p.width.toFixed(0)} x ${p.depth.toFixed(0)} m)`);
  let worstO = 1e9; seed = 777; for (let k = 0; k < 150; k++) { const a = {}; for (const t of DEFS.order) if (rnd() < 0.5) a[t] = 1 + Math.floor(Math.pow(rnd(), 2) * (DEFS.units[t].space >= 8 ? 12 : 90)); if (!Object.keys(a).length) continue; const q = planArmy(a, UR, true, OB), Q = ringsOf(q), gg = gaps(q); if (gg.bad) fails++; for (const t of q.types) for (const o of OB) worstO = Math.min(worstO, Math.hypot(Q[t].cx - o[0], Q[t].cz - o[1]) - Q[t].r - o[2]); }
  ok(worstO >= 3.0, `150 random armies with buildings on the plain: the nearest ring is ${worstO.toFixed(1)} m from a building`); }
console.log(fails ? 'RINGS FAILED' : 'RINGS OK'); process.exit(fails ? 1 : 0);
