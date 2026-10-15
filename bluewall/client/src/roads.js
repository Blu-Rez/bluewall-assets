// Road network of the kingdom (derived from the layout): the main street
// from the Blue Wall gate through the lower town and out of the town gate,
// the town's ring street, the west gate street, and country roads to the
// fields, the pasture, the lake, the army camp and the three gem mines.
import * as L from './layout.js';
import { planHamlets } from './hamlets.js';
import { planNomads, nomads } from './nomads.js';
import { spur } from './worksites.js';
const LANE118_ON = false;      // mother (GR1 + ST1 merge): GR1 ran lane 118 on to the first ring street, through the corner of ST1's iron yard (-60, 93): off, the lane ends at that yard's door (a destination)

export const ROADS = [];          // { name, pts: [[x, z]...], w, kind: 'cobble' | 'dirt', closed, surf, tier }
export const YARDS = [];          // GR1: trodden turn-arounds / junction aprons at road ends: { x, z, r, kind }
let built = false;

const off = (p, nx, nz, d) => [p.x + nx * d, p.z + nz * d];
const yard = (M, d) => { const a = M.a * Math.PI / 180; return [M.x - Math.cos(a) * d, M.z - Math.sin(a) * d]; };

export function buildRoads() {
  if (built) return ROADS; built = true;
  ROADS.length = 0; YARDS.length = 0;
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
  let ring2 = null;
  // p35 P4: the bigger town gets a second ring street between the citadel's moat bank and the first ring, joined by more lanes: that is where the extra houses stand
  if (L.GROW > 1) {
    ring2 = L.TOWN.map(([x, z]) => { const r = Math.hypot(x, z), k = (r - 67) / r; return [x * k, z * k]; });
    ROADS.push({ name: 'ring2', w: 5, kind: 'cobble', closed: true, pts: [...ring2, ring2[0]] });
    for (const a of [20, 64, 168, 212, 250, 342]) {
      const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180), r2 = Math.hypot(...ring2[0]) - 6, r1 = Math.hypot(...ring[0]) + 4;
      // GR1: the lane runs from the centre line of the second ring street to the centre line of the first (it used to overshoot both by 5-13 m: stubs that ended in nothing)
      const h2 = rayHit([...ring2, ring2[0]], a, r2 - 30, r2 + 30), h1 = rayHit([...ring, ring[0]], a, r1 - 30, r1 + 30);
      ROADS.push({ name: 'lane' + a, w: 4, kind: 'cobble', pts: [h2 || [ca * (r2 - 4), sa * (r2 - 4)], h1 || [ca * (r1 + 2), sa * (r1 + 2)]] });
    }
  }
  // west street: west gate -> ring street
  ROADS.push({ name: 'westst', w: 5, kind: 'cobble', pts: [off(T1, T1.nx, T1.nz, 3), off(T1, T1.nx, T1.nz, -5), off(T1, T1.nx, T1.nz, -33)] });
  // two lanes from the ring street to the inner moat bank (north and south quarters)
  for (const a of [118, 300]) {
    const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
    const lp = [[ca * 76, sa * 76], [ca * (a === 300 ? 97 : 104), sa * (a === 300 ? 97 : 104)]];      // (p38: lane 300 ends at the second ring street — the river runs just outside it)
    if (a === 118 && LANE118_ON) { const h1 = rayHit([...ring, ring[0]], a, 95, 150); if (h1) lp.push(h1); }      // mother (GR1 + ST1 merge): ST1's iron yard stands on this lane's way to the first ring street (-54, 101); the lane ends at the yard's door instead      // GR1: pts[1] stays where it was (the church stands by it); the lane now runs on to the first ring street instead of stopping 15 m short of it
    else if (false && ring2) { const h2 = rayHit([...ring2, ring2[0]], a, 70, 130); if (h2) lp[1] = h2; }      // mother (GR1 + ST1 merge): off — lane 300 ending ON ring2's centre line moves the B1 town plan (production lots overlap, p1_test); it keeps its p38 end                  // GR1: lane 300 ends ON the centre line of the second ring street
    // GR1: the other end used to stop 7-11 m short of the moat in open grass: it runs on down to the bank and stops there (a landing / washing place, not a stub)
    
    for (let r = 76; r > 40; r -= 1) { const x = ca * r, z = sa * r; if (L.height(x, z) < L.MOAT.level + 0.45) { lp[0] = [+(ca * (r + 2.2)).toFixed(1), +(sa * (r + 2.2)).toFixed(1)]; break; } }      // GR1: the moat-side end runs down to the bank (a landing / washing place, not a stub)
    ROADS.push({ name: 'lane' + a, w: 4, kind: 'cobble', pts: lp });
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
  trimMainTail();                                                                                           // GR1: the country trunk road ends in a turn-around at the foot of the mountains, not 100 m up the slope
  autoBridges(); addFords();                                                                                // A2: a footbridge every ~FORD_GAP m along the mountain streams (a stream with no crossing is a wall to the ground units)
  fixWet();                                                                                                 // GR1: no road runs through water: a short wet run gets a bridge, a long one is re-routed round the shore
  for (const R of ROADS) classify(R);                                                                       // GR1: hierarchy tier + surface class of every road
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

// ------------------------------------------------------------------------------------------------------------------ GR1: order of the map (hierarchy + surface), clean ends, no water
// first hit of the ray from the origin (angle a in degrees) with a polyline, nearest to the radius window [r0, r1]; null when there is none
function rayHit(poly, aDeg, r0, r1) {
  const dx = Math.cos(aDeg * Math.PI / 180), dz = Math.sin(aDeg * Math.PI / 180); let best = null;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i], b = poly[i + 1], ex = b[0] - a[0], ez = b[1] - a[1], den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue;
    const t = (a[0] * ez - a[1] * ex) / den, u = (a[0] * dz - a[1] * dx) / den;
    if (t > r0 && t < r1 && u >= 0 && u <= 1 && (!best || Math.abs(t - (r0 + r1) / 2) < Math.abs(best[2] - (r0 + r1) / 2))) best = [dx * t, dz * t, t];
  }
  return best ? [best[0], best[1]] : null;
}
const slopeAt = (x, z) => Math.hypot(L.height(x + 3, z) - L.height(x - 3, z), L.height(x, z + 3) - L.height(x, z - 3)) / 6;
const polyLen = (pts) => { let t = 0; for (let i = 0; i < pts.length - 1; i++) t += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return t; };
// point at arc length s along a polyline
function pointAt(pts, s) {
  for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); if (s <= l || i === pts.length - 2) { const t = l ? Math.min(1, Math.max(0, s / l)) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, (pts[i + 1][0] - pts[i][0]) / (l || 1), (pts[i + 1][1] - pts[i][1]) / (l || 1)]; } s -= l; }
  const q = pts[pts.length - 1]; return [q[0], q[1], 1, 0];
}
// the main country road used to climb the cliff wall toward the mountains (painted dirt on a rock face, ending in nothing): it now stops where the valley floor ends, in a turn-around
function trimMainTail() {
  const R = ROADS.find((r) => r.name === 'main'); if (!R || R.pts.length < 4) return;
  const tot = polyLen(R.pts); let cut = tot;
  for (let s = 100; s < tot; s += 1) { const [x, z] = pointAt(R.pts, s); if (slopeAt(x, z) > 0.35 || L.height(x, z) > 8) { cut = s - 8; break; } }
  if (cut >= tot - 1) { const [x, z] = pointAt(R.pts, tot); YARDS.push({ x, z, r: 8, kind: 'turn', road: 'main' }); return; }
  const out = []; let acc = 0;
  for (let i = 0; i < R.pts.length - 1; i++) { const l = Math.hypot(R.pts[i + 1][0] - R.pts[i][0], R.pts[i + 1][1] - R.pts[i][1]); if (!out.length) out.push(R.pts[i]); if (acc + l >= cut) break; out.push(R.pts[i + 1]); acc += l; }
  const e = pointAt(R.pts, cut), q = out[out.length - 1]; if (Math.hypot(q[0] - e[0], q[1] - e[1]) < 3) out.pop(); out.push([+e[0].toFixed(1), +e[1].toFixed(1)]); R.pts = out;
  YARDS.push({ x: e[0], z: e[1], r: 8, kind: 'turn', road: 'main' });
}

// ---- water: where a road still meets water after the stone bridges, a short crossing gets a footbridge and a long one (or one that ends in the lake) is routed round the shore
const WET_Y = () => L.MOAT.level + 0.05;
const gateZone = (x, z) => (L.TGATES || []).some((g) => Math.hypot(g.x - x, g.z - z) < 34);        // the moat bridge of a town gate is the castle's own (castle.js), not a road bridge
const onBridge = (x, z, m = 1) => (L.RBRIDGES || []).some((b) => { const rx = x - b.x, rz = z - b.z; return Math.abs(rx * b.nx + rz * b.nz) <= b.len / 2 + m && Math.abs(-rx * b.nz + rz * b.nx) <= b.wid / 2 + m + 0.5; });
const wetAt = (x, z) => L.height(x, z) < WET_Y() && !onBridge(x, z) && !gateZone(x, z);
function wetRuns(R) {
  const runs = []; let cur = null, acc = 0; const tot = polyLen(R.pts);
  for (let i = 0; i < R.pts.length - 1; i++) {
    const a = R.pts[i], b = R.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s < l; s += 1) {
      const x = a[0] + (b[0] - a[0]) * s / l, z = a[1] + (b[1] - a[1]) * s / l, w = wetAt(x, z) || wetAt(x + (b[1] - a[1]) / l * R.w / 2, z - (b[0] - a[0]) / l * R.w / 2) || wetAt(x - (b[1] - a[1]) / l * R.w / 2, z + (b[0] - a[0]) / l * R.w / 2);
      if (w) { if (!cur) cur = { s0: acc + s, s1: acc + s, deep: 0 }; cur.s1 = acc + s; { const ex = (b[1] - a[1]) / l * R.w / 2, ez = (b[0] - a[0]) / l * R.w / 2; cur.deep = Math.max(cur.deep, WET_Y() - Math.min(L.height(x, z), L.height(x + ex, z - ez), L.height(x - ex, z + ez))); } } else if (cur) { runs.push(cur); cur = null; }
    }
    acc += l;
  }
  if (cur) runs.push(cur);
  return runs.map((r) => ({ ...r, len: r.s1 - r.s0 + 1, tot }));
}
// A* on a 2.5 m grid over the dry, gently sloping ground (water + 2.5 m of bank are closed): the shortest way round, simplified to a few points
function routeDry(a, b, extra = 70) {
  const cell = 2.5, x0 = Math.min(a[0], b[0]) - extra, z0 = Math.min(a[1], b[1]) - extra, nx = Math.ceil((Math.max(a[0], b[0]) + extra - x0) / cell) + 1, nz = Math.ceil((Math.max(a[1], b[1]) + extra - z0) / cell) + 1;
  const wet = new Uint8Array(nx * nz), cx = (i) => x0 + i * cell, cz = (j) => z0 + j * cell;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (L.height(cx(i), cz(j)) < WET_Y() + 0.15 || slopeAt(cx(i), cz(j)) > 0.55) wet[j * nx + i] = 1;
  const shut = new Uint8Array(nx * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (wet[j * nx + i]) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz) shut[jj * nx + ii] = 1; }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (shut[j * nx + i] && (onBridge(cx(i), cz(j), 0) || (!wet[j * nx + i] && onBridge(cx(i), cz(j), 4)))) shut[j * nx + i] = 0;       // a stone deck that already spans the water is open ground for the detour (it may be the way across)
  const idx = (p) => [Math.min(nx - 1, Math.max(0, Math.round((p[0] - x0) / cell))), Math.min(nz - 1, Math.max(0, Math.round((p[1] - z0) / cell)))];
  const nearOpen = (p) => { const [i0, j0] = idx(p); if (!shut[j0 * nx + i0]) return [i0, j0]; for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = i0 + di, j = j0 + dj; if (i >= 0 && j >= 0 && i < nx && j < nz && !shut[j * nx + i]) return [i, j]; } return null; };
  const S = nearOpen(a), G = nearOpen(b); if (!S || !G) return null;
  const g = new Float32Array(nx * nz).fill(1e9), from = new Int32Array(nx * nz).fill(-1), done = new Uint8Array(nx * nz), heap = [];
  const push = (k, f) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  const sk = S[1] * nx + S[0], gk = G[1] * nx + G[0]; g[sk] = 0; push(sk, 0);
  while (heap.length) {
    const [, k] = pop(); if (done[k]) continue; done[k] = 1; if (k === gk) break;
    const i = k % nx, j = (k / nx) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const k2 = jj * nx + ii; if (shut[k2] || done[k2]) continue;
      const step = (di && dj ? 1.414 : 1) * cell * (1 + 2.5 * slopeAt(cx(ii), cz(jj))), ng = g[k] + step;
      if (ng < g[k2]) { g[k2] = ng; from[k2] = k; push(k2, ng + Math.hypot(ii - G[0], jj - G[1]) * cell); }
    }
  }
  if (!done[gk]) return null;
  let path = []; for (let k = gk; k >= 0; k = from[k]) path.push([cx(k % nx), cz((k / nx) | 0)]); path.reverse();
  // string-pull: drop every point the straight line can skip over dry ground
  const clear = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); for (let s = 0; s <= l; s += 1.25) { const t = l ? s / l : 0, x = p[0] + (q[0] - p[0]) * t, z = p[1] + (q[1] - p[1]) * t; const [i, j] = idx([x, z]); if (shut[j * nx + i]) return false; } return true; };
  const out = [path[0]]; let at = 0;
  while (at < path.length - 1) { let far = at + 1; for (let k = path.length - 1; k > at + 1; k--) if (clear(path[at], path[k])) { far = k; break; } out.push(path[far]); at = far; }
  return out;
}
// the road with the wet run r replaced by a dry detour (A* round the water, through the deck of a bridge that is already there), or null when there is none
function rerouted(R, r) {
  const tot = r.tot, sA = Math.max(0, r.s0 - 6), pA = pointAt(R.pts, sA), tail = r.s1 > tot - 8, sB = tail ? tot : Math.min(tot, r.s1 + 6), pB = pointAt(R.pts, sB);
  const via = routeDry([pA[0], pA[1]], [pB[0], pB[1]]); if (!via || via.length < 2) return null;
  const e = via[via.length - 1]; if (!tail && Math.hypot(e[0] - pB[0], e[1] - pB[1]) > 6) return null;      // the goal snapped to the far side of some other water: not a way round
  const head = [], rest = []; { let acc = 0; for (let i = 0; i < R.pts.length - 1; i++) { const l = Math.hypot(R.pts[i + 1][0] - R.pts[i][0], R.pts[i + 1][1] - R.pts[i][1]); if (acc + l <= sA) head.push(R.pts[i]); else if (acc >= sB) rest.push(R.pts[i]); acc += l; } if (sB < tot) rest.push(R.pts[R.pts.length - 1]); }
  const mid = via.slice(); mid[0] = [pA[0], pA[1]]; if (!tail) mid[mid.length - 1] = [pB[0], pB[1]];
  return [...head, ...mid.map((q) => [+q[0].toFixed(1), +q[1].toFixed(1)]), ...rest.filter((q) => Math.hypot(q[0] - pB[0], q[1] - pB[1]) > 1)];
}
// a new footbridge that touches or overlaps a bridge that is already there and runs the same way is that bridge made longer (one deck, not two decks end to end)
function footBridge(nb) {
  for (const b of L.RBRIDGES || []) {
    if (b.nx * nb.nx + b.nz * nb.nz < 0.94) continue;
    const du = (nb.x - b.x) * b.nx + (nb.z - b.z) * b.nz, dv = -(nb.x - b.x) * b.nz + (nb.z - b.z) * b.nx;
    if (Math.abs(dv) > 7 || Math.abs(du) > (b.len + nb.len) / 2 + 3) continue;
    const lo = Math.min(-b.len / 2, du - nb.len / 2), hi = Math.max(b.len / 2, du + nb.len / 2), mid = (lo + hi) / 2;
    b.x = +(b.x + b.nx * mid).toFixed(1); b.z = +(b.z + b.nz * mid).toFixed(1); b.len = Math.round(hi - lo); return;
  }
  L.addBridge(nb);
}
function fixWet() {
  for (const R of ROADS) {
    if (R.closed || R.kind === 'cobble' || /^(ring|lane|mainst|westst)/.test(R.name)) continue;
    for (let pass = 0; pass < 3; pass++) {
      const runs = wetRuns(R).filter((r) => !(r.len <= 4 && r.deep < 0.7 && (r.s0 < 6 || r.s1 > r.tot - 6))        // a toe in the shore at the very end of a spur is the landing stage, not a crossing
                                       && !(r.len <= 8 && r.deep < 0.2));                                          // ankle-deep ford: the ground grazes the waterline for a few metres
      if (!runs.length) break;
      const r = runs[0], tot = r.tot, alt = rerouted(R, r);
      if (r.s0 > 4 && r.s1 < tot - 4 && r.len <= 16) {                                                                // dry on both sides, short: a way round if there is a short one, else a footbridge along the road
        if (alt && polyLen(alt) - polyLen(R.pts) < 40 && !wetRuns({ ...R, pts: alt }).some((q) => q.len > 4)) { R.pts = alt; continue; }
        const m = (r.s0 + r.s1) / 2, [x, z, tx, tz] = pointAt(R.pts, m);
        footBridge({ x: +x.toFixed(1), z: +z.toFixed(1), nx: +tx.toFixed(4), nz: +tz.toFixed(4), len: Math.max(22, Math.round(r.len + 16)), wid: R.w >= 5.5 ? 7 : 5.5 });
        continue;
      }
      if (!alt) break;
      R.pts = alt;
    }
  }
}

// ---- order: every road has a tier (1 = the streets that carry the kingdom, 4 = a spur to one yard) and a surface (cobble / gravel / packed / track) the ground shader draws
//   cobble  main street, ring streets, west street, town lanes            gravel  the country trunk roads (stone-chip, rutted)
//   packed  country roads, village lanes (hamlet spurs): packed earth with wheel ruts      track  field tracks and the haul roads of the worksites: grass-worn dirt
function classify(R) {
  const n = R.name;
  if (n === 'mainst') { R.tier = 1; R.surf = 'cobble'; }
  else if (n === 'ring' || n === 'ring2' || n === 'westst') { R.tier = 2; R.surf = 'cobble'; }
  else if (/^lane/.test(n)) { R.tier = 3; R.surf = 'cobble'; }
  else if (n === 'main' || n === 'west') { R.tier = n === 'main' ? 1 : 2; R.surf = 'gravel'; }
  else if (n === 'farm' || n === 'lake' || n === 'turq' || n === 'camp') { R.tier = 3; R.surf = 'packed'; }
  else if (/^hamlet/.test(n)) { R.tier = 4; R.surf = 'packed'; }
  else { R.tier = 4; R.surf = 'track'; }      // north (the field road) and every ws_* haul road
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
