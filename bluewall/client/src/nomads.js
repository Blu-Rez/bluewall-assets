// Nomad camps: small tent camps in the open country, so no stretch of the map stays empty (B26).
// Planned once, deterministically from the layout (no randomness at run time), exactly like the hamlets:
//   planNomads(roads)  -> [{ x, z, r, tents:[{ x, z, ry, w, d, h }], rugs:[...], props:[{ k, x, z, ry, s }] }]
//   nomads()           -> the cached plan;  nomadD(x, z) -> distance to the nearest camp centre (forest / flora keep-clear rules)
//   keepClear(x, z, pad) -> true inside the army camp / the muster field (+ pad): nothing may grow or stand there, ever
//   buildNomads(...)   -> ONE merged, vertex-coloured mesh with every tent, rug and hearth ring (one draw call)
// The tent is the black tent of the steppe: dark cloth on 5 poles with a steel-blue seam and hem, a woven reed wall on the back and the ends,
// the long front open towards the fire, a striped rug on the floor (navy / steel / soft liver red / sand).
import * as THREE from 'three';
import * as L from './layout.js';
import { rng } from './noise.js';
import { hamlets } from './hamlets.js';

let PLAN = null;
export const DBG = {};
const no = (k) => { DBG[k] = (DBG[k] || 0) + 1; return false; };
const seg = (px, pz, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / l2));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
};

// the horse-keepers' camp beside the stable (pas_stable.js builds its yurts, tent and fire at local u 18..37, v 4..30 of the stable plot)
let _KC = null, _KCfor = null;
export function keeperCamp() {
  const S = L.stableAt(); if (!S) return null;
  if (_KCfor !== S) { const [x, z] = S.W(27, 16); _KC = { x, z, r: 14 }; _KCfor = S; }
  return _KC;
}
// trodden ground of the stable estate (terrain.js paints it): the yard in front of the stalls, the keepers' camp
export function stableGrounds() {
  const S = L.stableAt(); if (!S) return [];
  const [yx, yz] = S.W(0, 15), K = keeperCamp();
  return [{ x: yx, z: yz, r: 20, a: 0.5 }, { x: K.x, z: K.z, r: K.r + 2, a: 0.62 }];
}
export const keepClear = (x, z, pad = 0) => {
  for (const Z of [L.CAMP, L.MUSTER]) if (Z && Z.r > 0 && Math.hypot(x - Z.x, z - Z.z) < Z.r + 10 + pad) return true;
  const Y = L.stableYard(); if (Y && Math.hypot(x - Y.x, z - Y.z) < Y.r + pad) return true;                // the stable and its pen
  const K = keeperCamp(); if (K && Math.hypot(x - K.x, z - K.z) < K.r + pad) return true;                 // the horse-keepers' camp
  return false;
};

// trees keep out of the pasture fence as well (the horses roam there)
export const treeClear = (x, z, pad = 0) => keepClear(x, z, pad) || (() => { const P = L.PASTURE; return !!(P && P.r > 0 && Math.hypot(x - P.x, z - P.z) < P.r + 3 + pad); })();

export function planNomads(roads) {
  if (PLAN) return PLAN;
  PLAN = [];
  if (!L.TOWN || !roads || !L.PASTURE || L.PASTURE.r <= 0) return PLAN;
  const r = rng(51877);
  const zones = [L.PASTURE, L.CAMP, L.MUSTER, L.LAIR].filter((z) => z && z.r > 0);
  const flat = (x, z, rad) => {
    let lo = 1e9, hi = -1e9;
    for (const [dx, dz] of [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * 0.7, rad * 0.7], [-rad * 0.7, -rad * 0.7], [rad * 0.7, -rad * 0.7], [-rad * 0.7, rad * 0.7]]) { const h = L.height(x + dx, z + dz); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    return { lo, hi };
  };
  const roadD = (x, z) => { let d = 1e9; for (const R of roads) for (let i = 0; i < R.pts.length - 1; i++) d = Math.min(d, seg(x, z, R.pts[i], R.pts[i + 1]) - R.w / 2); return d; };
  const free = (x, z) => {
    if (L.sdTown(x, z) < 52) return no('town');
    if (L.fieldD(x, z) < 1.9) return no('field');
    for (const Z of zones) if (Math.hypot(x - Z.x, z - Z.z) < (Z.fr ?? Z.r) + 26) return no('zone');     // the army camp, the muster field, the pasture, the lair stay theirs
    if (Math.hypot(x - L.WINDMILL.x, z - L.WINDMILL.z) < 46) return no('mill');
    if (Math.hypot(x - L.LAKE.x, z - L.LAKE.z) < L.LAKE.r + 26) return no('lake');
    if (L.distPolyline(L.RIVER, x, z) < 24) return no('river');
    if (L.nearMine(x, z, 62)) return no('mine');
    for (const H of hamlets()) if (Math.hypot(x - H.x, z - H.z) < 52) return no('hamlet');
    return true;
  };
  const want = 4 + ((r() * 3) | 0);                                    // 4-6 camps
  for (let k = 0; k < 14000 && PLAN.length < want; k++) {
    const a = r() * Math.PI * 2, d0 = 172 + r() * 215, x = Math.cos(a) * d0, z = Math.sin(a) * d0;
    if (!free(x, z)) continue;
    if (PLAN.some((C) => Math.hypot(C.x - x, C.z - z) < 72)) { no('camp'); continue; }
    const f = flat(x, z, 15); if (f.lo < 1.3 || f.hi > 30 || f.hi - f.lo > 3.2) { no('flat'); continue; }
    const rd = roadD(x, z); if (rd < 20 || rd > 140) { no(rd < 20 ? 'road<' : 'road>'); continue; }            // near enough to a road to be believable, never on one
    const n = 3 + ((r() * 4) | 0), C = { x, z, r: 15, tents: [], rugs: [], props: [] };
    const a0 = r() * 6.28, span = n <= 4 ? Math.PI * 1.55 : Math.PI * 1.8;   // an arc round the fire, open on one side
    for (let i = 0; i < n; i++) {
      const aa = a0 + (i + 0.5) * span / n + (r() - 0.5) * 0.18, rr = 8.4 + n * 0.5 + r() * 1.3, tx = x + Math.cos(aa) * rr, tz = z + Math.sin(aa) * rr;
      const g = flat(tx, tz, 4); if (g.lo < 0.9 || g.hi - g.lo > 1.9) continue;
      if (roadD(tx, tz) < 6) continue;
      C.tents.push({ x: tx, z: tz, ry: Math.atan2(x - tx, z - tz), w: 6.2 + r() * 1.3, d: 3.7 + r() * 0.5, h: 2.55 + r() * 0.35, tone: r() });
    }
    if (C.tents.length < 3) { no('tents'); continue; }
    // a rug in front of the biggest tent, a barrel and a crate by the others, a haybale at the edge
    const big = C.tents.reduce((m, t) => (t.w > m.w ? t : m), C.tents[0]), cs = Math.cos(big.ry), sn = Math.sin(big.ry);
    C.rugs.push({ x: big.x + sn * (big.d / 2 + 1.9), z: big.z + cs * (big.d / 2 + 1.9), ry: big.ry, w: 3.0, d: 1.9 });
    for (const t of C.tents) {
      if (t === big || r() < 0.4) continue;
      const c = Math.cos(t.ry), s = Math.sin(t.ry), lx = (r() < 0.5 ? -1 : 1) * (t.w / 2 + 0.9);
      C.props.push({ k: r() < 0.5 ? 'barrel' : 'crate', x: t.x + c * lx + s * (t.d / 2 + 0.5), z: t.z - s * lx + c * (t.d / 2 + 0.5), ry: r() * 6.28, s: 1.2 });
    }
    PLAN.push(C);
  }
  return PLAN;
}
export const nomads = () => PLAN || [];
export function nomadD(x, z) {
  let d = 1e9;
  for (const C of PLAN || []) d = Math.min(d, Math.hypot(x - C.x, z - C.z));
  const K = keeperCamp(); if (K) d = Math.min(d, Math.max(0, Math.hypot(x - K.x, z - K.z) - 3));      // (the keepers' camp is trodden ground too: no tree, rock or bush right at its edge)
  return d;
}

// ------------------------------------------------------------------ the geometry (merged once)
const col = (hex) => new THREE.Color(hex);          // (already linear: the colour manager converts the sRGB hex)
const PAL = {
  cloth: [col('#34496b'), col('#2c3f5e'), col('#3b5075')], seam: col('#a9bfd9'), hem: col('#7f9dc4'), pole: col('#6b5640'),
  reed: [col('#c7b27c'), col('#ae9a66')], stone: col('#8b95a3'), ash: col('#2a2a2e'),
  rug: [col('#8a3340'), col('#27498a'), col('#e0d2a6'), col('#9db6d4')],
};

class Soup {                                                  // a triangle soup with per-vertex colour, transformed into the world as it is added
  constructor() { this.p = []; this.c = []; }
  tri(a, b, c, k) { for (const v of [a, b, c]) { this.p.push(v[0], v[1], v[2]); this.c.push(k.r, k.g, k.b); } }
  quad(a, b, c, d, k) { this.tri(a, b, c, k); this.tri(a, c, d, k); }
}

export function addTent(S, T, hf) {      // (also used by pas_stable.js for the horse-keepers' camp)
  const w = T.w, d = T.d, hR = T.h, eB = 1.15, eF = 1.85, cs = Math.cos(T.ry), sn = Math.sin(T.ry);
  const y0 = (hf(T.x, T.z) * 2 + hf(T.x + cs * w / 2, T.z - sn * w / 2) + hf(T.x - cs * w / 2, T.z + sn * w / 2)) / 4 - 0.05;
  // local (lx along the ridge, lz across, +lz = the open front, ly up) -> world
  const W = (lx, ly, lz) => [T.x + lx * cs + lz * sn, y0 + ly, T.z - lx * sn + lz * cs];
  const Gd = (lx, lz) => hf(T.x + lx * cs + lz * sn, T.z - lx * sn + lz * cs) - y0;     // the ground under a point of the tent (the walls and poles reach down to it)
  const NX = 8, cl = PAL.cloth[(T.tone * 3) | 0];
  const yr = (x) => { const ph = (x + w / 2) / (w / 4); return hR - 0.2 * Math.abs(Math.sin(ph * Math.PI)); };
  const ye = (x, front) => (front ? eF : eB) - 0.14 * Math.abs(Math.sin(((x + w / 2) / (w / 4)) * Math.PI));
  const shade = (k, f) => new THREE.Color(k.r * f, k.g * f, k.b * f);
  for (let i = 0; i < NX; i++) {
    const x0 = -w / 2 + (w * i) / NX, x1 = -w / 2 + (w * (i + 1)) / NX, f = 0.9 + 0.2 * ((i & 1) ? 1 : 0.4);
    for (const side of [1, -1]) {                            // roof: ridge -> middle -> eave, two panels per side
      const front = side > 0, zE = side * d / 2, e0 = ye(x0, front), e1 = ye(x1, front), ya = yr(x0), yb = yr(x1);
      const m0 = (ya + e0) / 2 - 0.1, m1 = (yb + e1) / 2 - 0.1, zm = zE * 0.55;
      S.quad(W(x0, ya, 0), W(x1, yb, 0), W(x1, m1, zm), W(x0, m0, zm), shade(cl, f));
      S.quad(W(x0, m0, zm), W(x1, m1, zm), W(x1, e1, zE), W(x0, e0, zE), shade(cl, f * 0.96));
      // the hem band along the eave (steel-blue)
      S.quad(W(x0, e0, zE), W(x1, e1, zE), W(x1, e1 - 0.17, zE), W(x0, e0 - 0.17, zE), PAL.hem);
    }
    S.quad(W(x0, yr(x0) + 0.02, -0.07), W(x1, yr(x1) + 0.02, -0.07), W(x1, yr(x1) + 0.02, 0.07), W(x0, yr(x0) + 0.02, 0.07), PAL.seam);   // the ridge seam
    // reed wall on the back (-lz), woven in alternating tones
    S.quad(W(x0, Gd(x0, -d / 2) - 0.2, -d / 2), W(x1, Gd(x1, -d / 2) - 0.2, -d / 2), W(x1, ye(x1, false) - 0.17, -d / 2), W(x0, ye(x0, false) - 0.17, -d / 2), PAL.reed[i & 1]);
    // the rug on the floor: bands across the tent
    S.quad(W(x0 + 0.12, 0.05, -d / 2 + 0.35), W(x1 - 0.12, 0.05, -d / 2 + 0.35), W(x1 - 0.12, 0.05, d / 2 - 0.1), W(x0 + 0.12, 0.05, d / 2 - 0.1), PAL.rug[[0, 1, 0, 2, 0, 3, 0, 1][i]]);
  }
  for (const end of [-1, 1]) {                               // the two ends: reed to the eave, cloth gable above
    const x = end * w / 2, e = ye(x, false), eFr = eF - 0.14 * 0, yy = yr(x);
    S.quad(W(x, Gd(x, -d / 2) - 0.2, -d / 2), W(x, Gd(x, 0) - 0.2, 0), W(x, e - 0.17, 0), W(x, e - 0.17, -d / 2), PAL.reed[1]);
    S.quad(W(x, Gd(x, 0) - 0.2, 0), W(x, Gd(x, d / 2) - 0.2, d / 2), W(x, 0.9, d / 2), W(x, e - 0.17, 0), PAL.reed[0]);
    S.tri(W(x, e - 0.17, -d / 2), W(x, e - 0.17, 0), W(x, yy, 0), shade(cl, 0.8));
    S.tri(W(x, e - 0.17, 0), W(x, 0.9, d / 2), W(x, eFr, d / 2), shade(cl, 0.8));
    S.tri(W(x, e - 0.17, 0), W(x, eFr, d / 2), W(x, yy, 0), shade(cl, 0.8));
  }
  const pole = (lx, lz, top) => {                            // a thin square pole
    const q = 0.07, a = [[-q, -q], [q, -q], [q, q], [-q, q]];
    for (let k = 0; k < 4; k++) { const p = a[k], n = a[(k + 1) % 4]; const gy = Gd(lx, lz) - 0.15; S.quad(W(lx + p[0], gy, lz + p[1]), W(lx + n[0], gy, lz + n[1]), W(lx + n[0], top, lz + n[1]), W(lx + p[0], top, lz + p[1]), PAL.pole); }
  };
  for (let i = 0; i <= 4; i++) pole(-w / 2 + (w * i) / 4, 0, yr(-w / 2 + (w * i) / 4) + 0.3);
  pole(-w / 4, d / 2, eF + 0.12); pole(w / 4, d / 2, eF + 0.12);          // the two front poles that hold the awning up
}

function addRug(S, R, hf) {
  const cs = Math.cos(R.ry), sn = Math.sin(R.ry), y0 = hf(R.x, R.z) + 0.05;
  const W = (lx, lz) => [R.x + lx * cs + lz * sn, y0, R.z - lx * sn + lz * cs];
  const bands = [0, 1, 2, 1, 0, 3, 0], bw = R.w / bands.length;
  bands.forEach((b, i) => S.quad(W(-R.w / 2 + i * bw, -R.d / 2), W(-R.w / 2 + (i + 1) * bw, -R.d / 2), W(-R.w / 2 + (i + 1) * bw, R.d / 2), W(-R.w / 2 + i * bw, R.d / 2), PAL.rug[b]));
}

function addHearth(S, C, hf) {                                // a ring of 9 stones round dark ash
  const y0 = hf(C.x, C.z);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, px = C.x + Math.cos(a) * 0.95, pz = C.z + Math.sin(a) * 0.95, s = 0.26, h = 0.3, ca = Math.cos(a + 0.4), sa = Math.sin(a + 0.4);
    const c4 = [[-s, -s], [s, -s], [s, s], [-s, s]].map(([x, z]) => [px + x * ca - z * sa, pz + x * sa + z * ca]);
    for (let k = 0; k < 4; k++) { const p = c4[k], n = c4[(k + 1) % 4]; S.quad([p[0], y0, p[1]], [n[0], y0, n[1]], [n[0], y0 + h * 0.8, n[1]], [p[0], y0 + h, p[1]], PAL.stone); }
    S.quad([c4[0][0], y0 + h, c4[0][1]], [c4[1][0], y0 + h * 0.8, c4[1][1]], [c4[2][0], y0 + h, c4[2][1]], [c4[3][0], y0 + h * 0.9, c4[3][1]], PAL.stone);
  }
  const n = 12; for (let i = 0; i < n; i++) { const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283; S.tri([C.x, y0 + 0.07, C.z], [C.x + Math.cos(a0) * 0.75, y0 + 0.05, C.z + Math.sin(a0) * 0.75], [C.x + Math.cos(a1) * 0.75, y0 + 0.05, C.z + Math.sin(a1) * 0.75], PAL.ash); }
}

export function buildNomads(scene, hf, { shadows = false } = {}) {
  const plan = nomads(); if (!plan.length) return null;
  const S = new Soup();
  for (const C of plan) { for (const T of C.tents) addTent(S, T, hf); for (const R of C.rugs) addRug(S, R, hf); addHearth(S, C, hf); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(S.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(S.c, 3));
  g.computeVertexNormals();                                 // (non-indexed: flat faces, which is the look of cloth stretched over poles)
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.35 }));
  mesh.name = 'nomads'; mesh.castShadow = !!shadows; mesh.receiveShadow = true; g.computeBoundingSphere();
  scene.add(mesh);
  return { mesh, tris: S.p.length / 9, camps: plan.length };
}
