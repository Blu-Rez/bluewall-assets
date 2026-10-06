// Road network of the kingdom (derived from the layout): the main street
// from the Blue Wall gate through the lower town and out of the town gate,
// the town's ring street, the west gate street, and country roads to the
// fields, the pasture, the lake, the army camp and the three gem mines.
import * as L from './layout.js';
import { planHamlets } from './hamlets.js';
import { planNomads } from './nomads.js';
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
  autoBridges();
  return ROADS;
}

// p38: every road that meets the river gets a stone bridge (deck along the road, long enough for the water + both banks, a little wider than the road)
function autoBridges() {
  const R = L.RIVER; if (!R || R.length < 2) return;
  const inter = (a, b, c, d) => { const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], den = rx * sz - rz * sx; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { x: a[0] + rx * t, z: a[1] + rz * t, u } : null; };
  for (const Rd of ROADS) {
    if (Rd.name.startsWith('hamlet')) continue;
    for (let i = 0; i < Rd.pts.length - 1; i++) for (let j = 0; j < R.length - 1; j++) {
      const x = inter(Rd.pts[i], Rd.pts[i + 1], R[j], R[j + 1]); if (!x) continue;
      const dx = Rd.pts[i + 1][0] - Rd.pts[i][0], dz = Rd.pts[i + 1][1] - Rd.pts[i][1], l = Math.hypot(dx, dz), rx = R[j + 1][0] - R[j][0], rz = R[j + 1][1] - R[j][1], rl = Math.hypot(rx, rz);
      const sin = Math.max(0.3, Math.sqrt(1 - Math.pow((dx * rx + dz * rz) / (l * rl), 2)));
      L.addBridge({ x: +x.x.toFixed(1), z: +x.z.toFixed(1), nx: +(dx / l).toFixed(4), nz: +(dz / l).toFixed(4), len: Math.max(22, Math.round(17.5 / sin + 3)), wid: Rd.w >= 5.5 ? 7 : 5.5 });
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
