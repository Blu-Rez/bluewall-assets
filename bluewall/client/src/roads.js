// Road network of the kingdom (derived from the layout): the main street
// from the Blue Wall gate through the lower town and out of the town gate,
// the town's ring street, the west gate street, and country roads to the
// fields, the pasture, the lake, the army camp and the three gem mines.
import * as L from './layout.js';
import { planHamlets } from './hamlets.js';
import { planNomads, nomads } from './nomads.js';
import { spur } from './worksites.js';

export const ROADS = [];          // { name, pts: [[x, z]...], w, kind: 'cobble' | 'dirt', closed }
let built = false;

const off = (p, nx, nz, d) => [p.x + nx * d, p.z + nz * d];
const yard = (M, d) => { const a = M.a * Math.PI / 180; return [M.x - Math.cos(a) * d, M.z - Math.sin(a) * d]; };

export function buildRoads() {
  if (built) return ROADS; built = true;
  ROADS.length = 0;
  const G = L.GATE;
  if (!L.TOWN) {
    const sx = G.x + G.nx * 4, sz = G.z + G.nz * 4;
    ROADS.push({ name: 'main', w: 6, kind: 'dirt', pts: [[sx - G.nx * 8, sz - G.nz * 8], [sx, sz], [sx + G.nx * 22, sz + G.nz * 22], [sx + G.nx * 44 - 10, sz + G.nz * 44], [sx + G.nx * 70 - 4, sz + G.nz * 70 + 10], [-60, 220], [-40, 330]] });
    return ROADS;
  }
  const [T0, T1] = L.TGATES;
  // main street: Blue Wall bridge -> market -> town gate
  const m0 = off(G, G.nx, G.nz, L.MOAT.off + 9), m1 = off(T0, T0.nx, T0.nz, -5);
  ROADS.push({ name: 'mainst', w: 7, kind: 'cobble', pts: [off(G, G.nx, G.nz, -2), m0, [(m0[0] + m1[0]) / 2, (m0[1] + m1[1]) / 2], m1, off(T0, T0.nx, T0.nz, 3)] });
  // ring street (closed): town polygon pulled 30 m inward
  const ring = L.TOWN.map(([x, z]) => { const r = Math.hypot(x, z), k = (r - 31) / r; return [x * k, z * k]; });
  ROADS.push({ name: 'ring', w: 5.5, kind: 'cobble', closed: true, pts: [...ring, ring[0]] });
  // p35 P4: the bigger town gets a second ring street between the citadel's moat bank and the first ring, joined by more lanes: that is where the extra houses stand
  if (L.GROW > 1) {
    const ring2 = L.TOWN.map(([x, z]) => { const r = Math.hypot(x, z), k = (r - 67) / r; return [x * k, z * k]; });
    ROADS.push({ name: 'ring2', w: 5, kind: 'cobble', closed: true, pts: [...ring2, ring2[0]] });
    for (const a of [20, 64, 168, 212, 250, 342]) {
      const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180), r2 = Math.hypot(...ring2[0]) - 6, r1 = Math.hypot(...ring[0]) + 4;
      ROADS.push({ name: 'lane' + a, w: 4, kind: 'cobble', pts: [[ca * (r2 - 4), sa * (r2 - 4)], [ca * (r1 + 2), sa * (r1 + 2)]] });
    }
  }
  // west street: west gate -> ring street
  ROADS.push({ name: 'westst', w: 5, kind: 'cobble', pts: [off(T1, T1.nx, T1.nz, 3), off(T1, T1.nx, T1.nz, -5), off(T1, T1.nx, T1.nz, -33)] });
  // two lanes from the ring street to the inner moat bank (north and south quarters)
  for (const a of [118, 300]) {
    const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    ROADS.push({ name: 'lane' + a, w: 4, kind: 'cobble', pts: [[ca * 76, sa * 76], [ca * (a === 300 ? 97 : 104), sa * (a === 300 ? 97 : 104)]] });      // (p38: lane 300 ends at the second ring street — the river runs just outside it)
  }
  // country: main road out of the town gate toward the mountains
  const o0 = off(T0, T0.nx, T0.nz, L.MOAT2.off + 9);
  ROADS.push({ name: 'main', w: 6.5, kind: 'dirt', pts: [off(T0, T0.nx, T0.nz, 2), o0, [o0[0] + 60, o0[1] + 34], [o0[0] + 130, o0[1] + 58], [o0[0] + 210, o0[1] + 100], [o0[0] + 300, o0[1] + 150]] });
  // farm road -> fields, windmill; then south to the ruby mine
  const F = L.FIELDS, R = L.MINES.find((m) => m.id === 'ruby');
  ROADS.push({ name: 'farm', w: 5, kind: 'dirt', pts: [[o0[0] + 30, o0[1] + 18], [F.x - F.w / 2 - 12, F.z + 34], [F.x - F.w / 2 - 14, F.z - 10], [F.x - F.w / 2 - 6, F.z - F.d / 2 - 22], yard(R, 30), yard(R, 6)] });
  // pasture + north fields
  const P = L.PASTURE, F2 = L.FIELDS2;
  ROADS.push({ name: 'north', w: 4.5, kind: 'dirt', pts: [[o0[0] + 12, o0[1] + 8], [o0[0] + 4, o0[1] + 48], [F2.x - 30, F2.z - 2], [P.x + P.r + 8, P.z - 10]] });
  // west gate roads: lake & emerald mine, turquoise mine, army camp
  const w0 = off(T1, T1.nx, T1.nz, L.MOAT2.off + 9), E = L.MINES.find((m) => m.id === 'emerald'), Tq = L.MINES.find((m) => m.id === 'turq'), C = L.CAMP;
  ROADS.push({ name: 'west', w: 5.5, kind: 'dirt', pts: [off(T1, T1.nx, T1.nz, 2), w0, [w0[0] - 30, w0[1] - 4], [w0[0] - 58, w0[1] + 30], [E.x + 36, E.z + 6], yard(E, 30), yard(E, 6)] });
  ROADS.push({ name: 'lake', w: 4, kind: 'dirt', pts: [[w0[0] - 58, w0[1] + 30], [w0[0] - 50, w0[1] + 96], [L.LAKE.x + 30, L.LAKE.z - 44]] });
  ROADS.push({ name: 'turq', w: 5, kind: 'dirt', pts: [[w0[0] - 30, w0[1] - 4], [w0[0] - 34, w0[1] - 52], yard(Tq, 30), yard(Tq, 6)] });
  ROADS.push({ name: 'camp', w: 4.5, kind: 'dirt', pts: [[w0[0] - 34, w0[1] - 52], [C.x - 30, C.z + 52], [C.x - 6, C.z + C.r - 4]] });
  // roadside hamlets (hamlets.js): a short dirt spur from the nearest country road to each green
  L.withoutPads(() => planHamlets(ROADS)).forEach((H, i) => ROADS.push({ name: 'hamlet' + i, w: 3.6, kind: 'dirt', pts: H.spur }));
  L.withoutPads(() => planNomads(ROADS));                                                                   // nomad tent camps in the open country (nomads.js; no road of their own)
  for (const s of L.SITES || []) ROADS.push({ name: 'ws_' + s.id, w: 4.4, kind: 'dirt', pts: spur(s) });      // p38: the haul road of every worksite (worksites.js)
  autoBridges(); addFords();                                                                                // A2: a footbridge every ~FORD_GAP m along the mountain streams (a stream with no crossing is a wall to the ground units)
  return ROADS;
}

// A2: the mountain streams cut the north plain into pockets (the camp lies between them). A footbridge about every FORD_GAP m, on dry flat banks and clear of
// the camp, worksites, mines, hamlets (greens and spurs) and nomad camps, keeps the ground routes short (castle.js builds the decks like every river bridge, nav.js sees them).
const FORD_GAP = 120;      // (ph) metres between the footbridges of one stream
function addFords() {
  if (!L.STREAMS || !L.STREAMS.length) return;
  const zones = [L.PASTURE, L.MUSTER, L.LAIR].filter((z) => z && z.r > 0).map((z) => [z.x, z.z, (z.fr ?? z.r) + 4]);
  zones.push([L.CAMP.x, L.CAMP.z, L.CAMP.r + 8]);          // (a track may run up to the camp's tents; the camp's own keep-clear ring is wider)
  for (const q of L.SITES || []) zones.push([q.x, q.z, q.r + 10]);
  for (const m of L.MINES) zones.push([m.x, m.z, 52]);
  for (const H of planHamlets(ROADS)) zones.push([H.x, H.z, 34]);
  for (const N of nomads()) zones.push([N.x, N.z, 28]);
  const spurs = ROADS.filter((r) => r.name.startsWith('hamlet'));
  const made = [];          // [x, z] of every footbridge so far (the road bridges are in L.RBRIDGES already)
  const near = (x, z, list, d) => list.some((b) => Math.hypot(b[0] - x, b[1] - z) < d);
  let n = 0;
  for (const S of L.STREAMS) {
    const P = S.pts, k = S.k || 1, cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const at = (s) => { let i = 1; while (i < P.length - 1 && cum[i] < s) i++; const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, t = Math.max(0, Math.min(1, (s - cum[i - 1]) / l)); return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, tx: (b[0] - a[0]) / l, tz: (b[1] - a[1]) / l }; };
    const total = cum[cum.length - 1], half = Math.max(22, Math.round(20.5 * k)) / 2 + 4;
    for (let target = 100; target < total - 55; target += FORD_GAP) {
      let best = null;
      for (let ds = 0; ds <= 75 && !best; ds += 5) for (const sg of ds ? [-1, 1] : [1]) {
        const s = target + sg * ds; if (s < 70 || s > total - 50) continue;
        const c = at(s), nx = -c.tz, nz = c.tx, e0 = [c.x - nx * (half + 4), c.z - nz * (half + 4)], e1 = [c.x + nx * (half + 4), c.z + nz * (half + 4)];
        if (L.sdTown(c.x, c.z) < 22 || L.fieldD(c.x, c.z) < 1.3) continue;
        if (made.some((b) => Math.hypot(b[0] - c.x, b[1] - c.z) < 45) || L.RBRIDGES.some((b) => Math.hypot(b.x - c.x, b.z - c.z) < 45)) continue;
        let ok = true;
        for (let u = -half - 4; u <= half + 4 && ok; u += 3) { const x = c.x + nx * u, z = c.z + nz * u, h = L.height(x, z); if (h > 45) ok = false; if (Math.abs(u) >= half && (h < 0.7 || L.distPolyline(L.RIVER, x, z) < Math.abs(u) * 0 + 5 * k * 0 + 1.5)) ok = false; }
        if (!ok) continue;
        if (Math.abs(L.height(c.x + nx * (half + 2), c.z + nz * (half + 2)) - L.height(c.x - nx * (half + 2), c.z - nz * (half + 2))) > 9) continue;
        if (zones.some(([zx, zz, zr]) => Math.hypot(zx - c.x, zz - c.z) < zr || Math.hypot(zx - e0[0], zz - e0[1]) < zr - 8 || Math.hypot(zx - e1[0], zz - e1[1]) < zr - 8)) continue;
        if (spurs.some((r) => r.pts.some((q, i) => i && segDist(c.x, c.z, r.pts[i - 1], q) < 14 || segDist(e0[0], e0[1], r.pts[i - 1] || q, q) < 8 || segDist(e1[0], e1[1], r.pts[i - 1] || q, q) < 8))) continue;
        best = { c, e0, e1 };
      }
      if (!best) continue;
      made.push([best.c.x, best.c.z]);
      L.addBridge({ x: +best.c.x.toFixed(1), z: +best.c.z.toFixed(1), nx: +(-best.c.tz).toFixed(4), nz: +best.c.tx.toFixed(4), len: Math.max(22, Math.round(20.5 * k)), wid: 5.5 });      // (a footbridge: the deck runs across the stream)
      n++;
    }
  }
}

// p38: every road that meets the river gets a stone bridge (deck along the road, long enough for the water + both banks, a little wider than the road)
function autoBridges() { bridgesOver(L.RIVER, 1); for (const S of L.STREAMS) bridgesOver(S.pts, S.k || 1); }      // (A2: the mountain streams are bridged like the river; a wider one gets a longer deck)
function bridgesOver(R, k) {
  if (!R || R.length < 2) return;
  const inter = (a, b, c, d) => { const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a[0] + rx * t, z: a[1] + rz * t, u } : null; };
  for (const Rd of ROADS) {
    if (Rd.name.startsWith('hamlet')) continue;
    for (let i = 0; i < Rd.pts.length - 1; i++) for (let j = 0; j < R.length - 1; j++) {
      const x = inter(Rd.pts[i], Rd.pts[i + 1], R[j], R[j + 1]); if (!x) continue;
      const dx = Rd.pts[i + 1][0] - Rd.pts[i][0], dz = Rd.pts[i + 1][1] - Rd.pts[i][1], l = Math.hypot(dx, dz), rx = R[j + 1][0] - R[j][0], rz = R[j + 1][1] - R[j][1], rl = Math.hypot(rx, rz);
      const sin = Math.max(0.3, Math.sqrt(1 - Math.pow((dx * rx + dz * rz) / (l * rl), 2)));
      L.addBridge({ x: +x.x.toFixed(1), z: +x.z.toFixed(1), nx: +(dx / l).toFixed(4), nz: +(dz / l).toFixed(4), len: Math.max(22, Math.round((17.5 / sin + 3) * k)), wid: Rd.w >= 5.5 ? 7 : 5.5 });
    }
  }
}

function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}
// distance to the nearest road EDGE (negative = on the road)
export function roadDist(x, z, kind = null) {
  buildRoads();
  let d = 1e9;
  for (const R of ROADS) {
    if (kind && R.kind !== kind) continue;
    for (let i = 0; i < R.pts.length - 1; i++) d = Math.min(d, segDist(x, z, R.pts[i], R.pts[i + 1]) - R.w / 2);
  }
  return d;
}
export const road = (name) => { buildRoads(); return ROADS.find((r) => r.name === name); };
