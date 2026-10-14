// A1: wall rings by level — the table, the gates, the way in (logic only, node; the game itself is checked by dev/a1_shot.py)
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
import { GATE_HALF, RING_IDS, DIMS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/a1_rings.js';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- 1. the table: levels 1-10 one ring, 11-20 two, 21-30 three; the castle grows outward (keep ring, citadel wall, town wall)
const FULL = ['inner', 'outer', 'town'];
{
  let bad = [];
  for (let lv = 1; lv <= 30; lv++) { const want = FULL.slice(0, lv <= 10 ? 1 : lv <= 20 ? 2 : 3); if (!eq(L.ringsAt(lv), want)) bad.push(lv + ':' + L.ringsAt(lv)); }
  ok(!bad.length, 'ringsAt(1..30): 1-10 -> [inner], 11-20 -> [inner,outer], 21-30 -> [inner,outer,town]' + (bad.length ? '  BAD ' + bad.join(' ') : ''));
  const counts = [1, 10, 11, 20, 21, 30].map((lv) => L.ringsAt(lv).length); ok(eq(counts, [1, 1, 2, 2, 3, 3]), 'rows at levels 1 / 10 / 11 / 20 / 21 / 30 = ' + counts.join(' / '));
  ok(eq(L.ringsAt(0), ['inner']) && eq(L.ringsAt(99).length, 3) && eq(L.ringsAt(NaN), ['inner']) && eq(L.ringsAt(10.4), ['inner']) && eq(L.ringsAt(10.6).length, 2), 'out-of-range / fractional levels are clamped and rounded');
  let nested = true; for (let lv = 2; lv <= 30; lv++) { const a = L.ringsAt(lv - 1), b = L.ringsAt(lv); if (!a.every((r) => b.includes(r))) nested = false; }
  ok(nested, 'a ring never disappears when the level goes up');
  L.RING_ORDER.splice(0, 3, 'town', 'outer', 'inner'); const rev = [L.ringsAt(10), L.ringsAt(20), L.ringsAt(30)]; L.RING_ORDER.splice(0, 3, 'inner', 'outer', 'town');
  ok(eq(rev, [['town'], ['town', 'outer'], ['town', 'outer', 'inner']]), 'the order can be changed in ONE place (RING_ORDER), e.g. town wall first');
  L.setMap('day'); ok(eq(L.ringsAt(30), ['outer']) && eq(L.ringsAt(1), ['outer']), 'day map (square fort): only its one wall'); L.setMap('night');
}

// ---- 2. every ring has a gate that fits in its wall
const GATE_SEGS = { inner: [L.INNER_GATE_SEG], outer: [L.GATE_SEG], town: L.TOWN_GATES };
const POLY = { inner: L.INNER, outer: L.OUTER, town: L.TOWN }, DIM = DIMS;
for (const id of RING_IDS) {
  const P = POLY[id], segs = GATE_SEGS[id], need = 2 * GATE_HALF[id] + 1.2 * DIM[id].R * 0.6 + 1;
  const fit = segs.length >= 1 && segs.every((i) => Number.isInteger(i) && i >= 0 && i < P.length && Math.hypot(P[(i + 1) % P.length][0] - P[i][0], P[(i + 1) % P.length][1] - P[i][1]) >= need);
  ok(fit, id + ' ring: ' + segs.length + ' gate(s), the gate segment is long enough for the opening (' + (2 * GATE_HALF[id]).toFixed(1) + ' m)');
}
{
  const br = bridgesFromLayout(L);
  ok(L.TGATES.length === L.TOWN_GATES.length && L.TGATES.length >= 1, 'town wall: ' + L.TGATES.length + ' gatehouses');
  ok(L.TGATES.every((G) => br.some((b) => Math.hypot(b.x - (G.x + G.nx * (L.MOAT2.off + 0.5)), b.z - (G.z + G.nz * (L.MOAT2.off + 0.5))) < 0.5)), 'every town gate has its bridge over the moat in the nav list — at EVERY level (the bridge is not part of the ring, castle.js closes the ring before it)');
}

// ---- 3. a way in from outside to the keep for every level (walls = solids except the gate openings; water + bridges as in the game)
function wallSolids(ids, skipGates = false) {
  const out = [];
  for (const id of ids) {
    const P = POLY[id], { T, R } = DIM[id], gh = GATE_HALF[id], segs = GATE_SEGS[id];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dz = b[1] - a[1], Lt = Math.hypot(dx, dz), ux = dx / Lt, uz = dz / Lt;
      const gaps = []; if (!skipGates && segs.includes(i)) gaps.push([Lt / 2 - gh, Lt / 2 + gh]);
      for (const W of id === 'town' ? L.WGATES : []) if (W.seg === i) gaps.push([W.c - W.half, W.c + W.half]);       // (castle.js: a water gate cuts the wall too)
      gaps.sort((p, q) => p[0] - q[0]);
      const pieces = []; { let cur = R * 0.6; for (const [g0, g1] of gaps) { if (g0 - cur > 0.5) pieces.push([cur, g0]); cur = g1; } if (Lt - R * 0.6 - cur > 0.5) pieces.push([cur, Lt - R * 0.6]); }
      for (const [s0, s1] of pieces) for (let s = s0; s <= s1 + 0.01; s += 1.2) out.push([a[0] + ux * s, a[1] + uz * s, T / 2 - 0.6]);       // (nav closes cells within r + 0.9 m of a solid)
      out.push([a[0], a[1], R + 0.3]);                                                                                  // the tower at the corner
    }
  }
  return out;
}
const bridges = bridgesFromLayout(L), nav0 = (solids) => buildNav({ height: L.height, bridges, solids });
const K = L.KEEP, kc = Math.cos(K.rot), ks = Math.sin(K.rot), door = [K.x + 12 * ks, K.z + 12 * kc];          // (the keep's door looks along local +z)
const start = L.MUSTER;
for (const lv of [1, 10, 11, 20, 21, 30]) {
  const act = L.ringsAt(lv), nav = nav0(wallSolids(act)), s = nav.nearestDry(start.x, start.z), g = nav.nearestDry(door[0], door[1]);
  const r = nav.route(s[0], s[1], g[0], g[1]);
  let legsOk = !!r; if (r) { let px = s[0], pz = s[1]; for (const [x, z] of r) { if (!nav.clear(px, pz, x, z)) legsOk = false; px = x; pz = z; } if (!nav.clear(px, pz, g[0], g[1])) legsOk = false; }
  ok(r && legsOk, 'level ' + lv + ' (' + act.join('+') + '): a walkable route from the muster ground to the keep door through the gate(s) (' + (r ? r.length + ' waypoints' : 'NO ROUTE') + ')');
  if (lv === 30 || lv === 20 || lv === 10) {
    const out = act[act.length - 1], blocked = nav0(wallSolids(act, true)), s2 = blocked.nearestDry(start.x, start.z), g2 = blocked.nearestDry(door[0], door[1]);
    const r2 = blocked.route(s2[0], s2[1], g2[0], g2[1]);
    ok(!r2, '   control: with the gate openings walled up the same walk is impossible (so the route above really goes through the gates)');
  }
}
console.log(fails ? 'A1 FAILED (' + fails + ')' : 'A1 OK'); process.exit(fails ? 1 : 0);
