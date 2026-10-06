// The kingdom plan: wall polygons, gate, building spots, river.
// Shared by terrain (flatten / moat / ground paint) and by the builders.
import { makeNoise, smooth, lerp, clamp } from './noise.js';

export const NOISE = makeNoise(20261001);

// Wall dimensions per ring (castle.js builds the walls from these, patrol.js walks on top of them):
// H = wall height, T = thickness, R = tower radius. The walkway surface is H + 0.145.
export const WALL = { outer: { H: 9.5, T: 4.2, R: 4.6 }, inner: { H: 7.5, T: 3.2, R: 3.5 }, town: { H: 8.2, T: 3.8, R: 3.9 } };

// Two maps share every builder:
//   night — the Blue Wall citadel (irregular wall, moat, inner citadel, keep)
//   day   — a Siegefall-style square fort on open grass (towers every 1/3 side)
export let MAP = 'night';

const DEG = Math.PI / 180;
const ring = (pts) => pts.map(([a, r]) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r]);
const polar = (a, r) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r];
// p35 P4 (owner: "the map a bit bigger, more houses"): the lower town grows x1.2 (a second ring street, more lanes, a bigger house quota in town.js) and everything outside it
// (fields, windmill, lake, river, pasture, camp, muster ground, lair, the three mines, the mountain ring) moves PUSH metres outward, so the gaps stay as they were.  The Blue Wall citadel is untouched.
export const GROW = 1.2, PUSH = 60;       // (p38: 27 -> 60 — the valley is 33 m wider all round: room for the worksites, a wider camera; the town itself is untouched)
const pushXZ = ([x, z]) => { const r = Math.hypot(x, z) || 1, k = (r + PUSH) / r; return [x * k, z * k]; };
const pushO = (o) => { const [x, z] = pushXZ([o.x, o.z]); return { ...o, x, z }; };
const LAKE_N = pushO({ x: -128, z: 196, r: 40 });
const NIGHT = {
  OUTER: [[-50, -40], [-18, -54], [22, -52], [52, -32], [58, 8], [40, 44], [-6, 54], [-44, 38], [-60, 2]],
  GATE_SEG: 4,
  INNER: [[-40, -30], [-16, -41], [1, -27], [-5, -7], [-29, -2], [-45, -15]],
  INNER_GATE_SEG: 2,
  // the lower town's wall (third ring): main gate in line with the Blue Wall gate, west gate toward lake & mines
  TOWN: ring([[11.6, 132], [41.6, 132], [72, 140], [102, 128], [133, 142], [163, 134], [194, 140], [224, 130], [254, 142], [284, 132], [314, 138], [344, 130]].map(([a, r]) => [a, r * GROW])),
  TOWN_GATES: [0, 6],
  KEEP: { x: -21, z: -20, rot: 0.35 },
  PLAZA: { x: 12, z: 6, r: 9 },
  MOAT: { off: 10, half: 4.2, level: -0.75, on: false },
  MOAT2: { off: 13, half: 5.0 },
  WINDMILL: pushO({ x: 236, z: 34 }),
  FIELDS: pushO({ x: 206, z: -22, w: 66, d: 44, rot: 0.12 }),
  FIELDS2: pushO({ x: 150, z: 168, w: 52, d: 36, rot: -0.75 }),
  LAKE: LAKE_N,
  // p38: the river does not stop at the town moat any more: it runs on THROUGH the town (in at the NE wall, a water gate, square under the ring street, round the north between the two ring streets, out through a second water gate in the WSW wall) and on to the lake.
  // (points 0..4 are the old river, pushed with the rest of the map; from point 5 on the numbers are absolute — dev/p38/rivertown.mjs computes them from the real streets: >= 11 m between the river's centre and both ring streets, every crossing square)
  RIVER: [[492, -282], [396, -258], [304, -228], [250, -166], [186, -138]].map(pushXZ).concat([
    [168, -119.7], [156.5, -110.1], [145, -100.4], [134.2, -91.4], [123.3, -82.1], [112.3, -72.9],
    [101.5, -64], [89.1, -67.2], [80.1, -78.3], [69.8, -88.3], [57, -96.5], [43.3, -102.4],
    [29, -106.9], [14.5, -111.7], [-0.5, -114.5], [-14.6, -114.8], [-29.5, -111.2], [-43.6, -104.7],
    [-56.3, -96.1], [-67.2, -86], [-77.1, -75], [-87.8, -65], [-98.4, -54], [-107.3, -42.9],
    [-112.5, -28.5], [-114.1, -14.4], [-113.6, 1], [-111.3, 16], [-107.4, 30.6], [-103.1, 44.8],
    [-98.6, 58.2], [-103.1, 70.3], [-116.3, 76.8], [-129.3, 83.1], [-142.2, 89.3], [-155.7, 93.7],
    [-157.2, 107.4], [-153.3, 122.3], [-151.7, 136.9], [-150, 152],
  ]).concat([[LAKE_N.x - 4, LAKE_N.z - LAKE_N.r - 22], [LAKE_N.x - 2, LAKE_N.z - LAKE_N.r - 10], [LAKE_N.x + 3, LAKE_N.z - LAKE_N.r + 4]]),      // (the last stretch follows the lake, wherever PUSH puts it)
  // the two water gates in the town wall: wall segment, distance of the gate's middle from the segment's first corner, half width of the opening
  WGATES: [{ seg: 10, c: 34.8, half: 6.6 }, { seg: 4, c: 43.1, half: 6.6 }],
  // stone bridges over the river (where the farm road to the ruby mine crosses it): centre, direction of travel (unit), length, width
  RBRIDGES: [],                                                               // (p38: roads.js adds a bridge wherever a road meets the river — see autoBridges)
  PASTURE: pushO({ x: 46, z: 206, r: 30, fr: 44 }),
  CAMP: pushO({ x: -34, z: -212, r: 30, fr: 46 }),
  MUSTER: pushO({ x: 215, z: 60, r: 34, fr: 66 }),
  LAIR: pushO({ x: 272, z: 4, r: 24 }),
  MINES: [
    { id: 'ruby', ...xz(polar(-62, 238 + PUSH)), a: -62 },
    { id: 'emerald', ...xz(polar(163, 244 + PUSH)), a: 163 },
    { id: 'turq', ...xz(polar(232, 240 + PUSH)), a: 232 },
  ],
  MOUNT: 445 + PUSH,
};
// p38 (owner 6 Oct 2026, «روح بده به بازی»): the production worksites of the valley (worksites.js builds them). Positions come from the OFFLINE search dev/p38/wsplan.mjs (flat-ish ground,
// off the roads / hamlets / mines, forest for the lumber camps, the lake shore and the river bank for the fisheries) and are frozen here, so the map never depends on run-time randomness.
// ry = the way the site faces (local +z: toward its road, the lake, the river); r = the footprint radius; link = the nearest country road (the haul road starts there).
// Every site stands on a level pad (see PADS in height()), so the buildings sit on the ground.
export const WS_SITES = [
  { id: 'lumber1', kind: 'lumber', x: 241.0, z: -232.7, ry: -1.020, r: 24, link: [159.1, -182.4] },
  { id: 'lumber2', kind: 'lumber', x: -253.4, z: 228.2, ry: 1.938, r: 24, link: [-137.9, 183.8] },
  { id: 'oil', kind: 'oil', x: -310.6, z: -125.5, ry: 0.963, r: 26, link: [-213.2, -57.7] },
  { id: 'quarry', kind: 'quarry', x: 37.5, z: -357.0, ry: 0.787, r: 24, link: [137.1, -257.8] },
  { id: 'iron', kind: 'iron', x: 249.4, z: 258.2, ry: -2.058, r: 22, link: [160.0, 210.8] },
  { id: 'gold', kind: 'gold', x: 353.5, z: -62.3, ry: -1.650, r: 22, link: [226.7, -72.4] },
  { id: 'farm', kind: 'farm', x: 243.8, z: -98.5, ry: -1.020, r: 26, link: [219.7, -83.7] },
  { id: 'greenhouse', kind: 'greenhouse', x: 133.4, z: 183.6, ry: 1.563, r: 20, link: [160.1, 183.8] },
  { id: 'livestock', kind: 'livestock', x: -20.9, z: 298.3, ry: 1.925, r: 26, link: [97.1, 254.6] },
  { id: 'slaughter', kind: 'slaughter', x: -75.8, z: 264.3, ry: -2.417, r: 18, link: [-130.8, 202.2] },
  { id: 'fishery_lake', kind: 'fishery', x: -123.3, z: 280.0, ry: -2.304, r: 22, link: [-130.8, 202.2], water: [-160.8, 246.2] },
  { id: 'fishery_river', kind: 'fishery', x: 189.3, z: -169.3, ry: 0.686, r: 22, link: [173.2, -159.5], water: [205.1, -150.0] },
];
function xz([x, z]) { return { x, z }; }
const S = 46, T3 = S / 3;
const DAY = {
  OUTER: [[-S, -S], [-T3, -S], [T3, -S], [S, -S], [S, -T3], [S, T3], [S, S], [T3, S], [-T3, S], [-S, S], [-S, T3], [-S, -T3]],
  GATE_SEG: 7,
  INNER: null,
  INNER_GATE_SEG: -1,
  KEEP: { x: 0, z: 0, rot: 0 },
  PLAZA: { x: 0, z: 0, r: 0 },
  MOAT: { off: 10, half: 4.2, level: -0.75, on: false },
  WINDMILL: { x: 112, z: 58 },
  FIELDS: { x: 118, z: 96, w: 40, d: 28, rot: 0.6 },
  LAKE: { x: 150, z: -150, r: 34 },
  RIVER: [[-420, -40], [-300, -20], [-200, -60], [-140, -120], [-90, -190], [-60, -300], [-40, -420]],
};

// p38: the worksite pads must not move the hamlets / nomad camps (they are planned from the natural ground): plan them with the pads switched off
export function withoutPads(fn) { const keep = PADS, dirty = PAD_DIRTY; PADS = []; PAD_DIRTY = false; try { return fn(); } finally { PADS = keep; PAD_DIRTY = dirty; } }
export const addBridge = (b) => { if (!RBRIDGES.some((q) => Math.hypot(q.x - b.x, q.z - b.z) < 6)) RBRIDGES.push(b); };
export let OUTER, GATE_SEG, INNER, INNER_GATE_SEG, KEEP, PLAZA, MOAT, WINDMILL, FIELDS, LAKE, RIVER, GATE, PASTURE, CAMP, MUSTER, LAIR, RBRIDGES = [], WGATES = [];
export let TOWN = null, TOWN_GATES = [], TGATES = [], MOAT2 = null, FIELDS2 = null, FARMS = [], MINES = [], MOUNT = 330;
let PAD_DIRTY = false;
export let PADS = [];                    // p38: the level pads under the worksites (see height())
export let SITES = [];                   // p38: the worksites of this map (WS_SITES on the night map, none on the day map)

// The stable estate: a barn 56 m west of the pasture with its doors toward it (military.js builds it, life.js fills the yard, nomads.js / terrain.js keep it clear).
// W(u, v): local u (right) / v (front, the door side) -> world x, z.
let _SA = null, _SY = null;
function calcStable() {
  const P = PASTURE; _SA = _SY = null; if (!P || !(P.r > 0)) return;
  const x = P.x - 56, z = P.z + 8, ry = Math.atan2(P.x - x, P.z - z), c = Math.cos(ry), s = Math.sin(ry);
  _SA = { x, z, ry, W: (u, v) => [x + c * u + s * v, z - s * u + c * v] };
  const [yx, yz] = _SA.W(-3, 14); _SY = { x: yx, z: yz, r: 27 };       // everything the estate occupies, as a circle
}
export const stableAt = () => _SA;
export const stableYard = () => _SY;

export function setMap(m) {
  MAP = m === 'day' ? 'day' : 'night';
  const c = MAP === 'day' ? DAY : NIGHT;
  ({ OUTER, GATE_SEG, INNER, INNER_GATE_SEG, KEEP, PLAZA, MOAT, WINDMILL, FIELDS, LAKE, RIVER } = c);
  PASTURE = c.PASTURE || { x: 1e4, z: 1e4, r: 0 }; CAMP = c.CAMP || { x: 1e4, z: 1e4, r: 0 }; MUSTER = c.MUSTER || { x: 1e4, z: 1e4, r: 0 }; LAIR = c.LAIR || { x: 1e4, z: 1e4, r: 0 };
  RBRIDGES = c.RBRIDGES || []; WGATES = c.WGATES || [];
  calcStable();
  TOWN = c.TOWN || null; TOWN_GATES = c.TOWN_GATES || []; MOAT2 = c.MOAT2 || null; FIELDS2 = c.FIELDS2 || null; MINES = c.MINES || []; MOUNT = c.MOUNT || 330;
  FARMS = [FIELDS, FIELDS2].filter(Boolean);
  // p38: worksites — each stands on a level pad (flat inside 0.9 r (0.72 r at the fisheries), blended into the hills over 16 m); the pad's height is the natural ground at the site's middle
  PADS = []; SITES = MAP === 'night' && TOWN ? WS_SITES : [];
  for (const w of SITES) PADS.push({ x: w.x, z: w.z, r: w.r * (w.water ? 0.72 : 0.9), b: 16, h: null });     // (the fisheries keep their banks: the water lies at the pad's edge)
  PAD_DIRTY = PADS.length > 0;                  // (the pad heights are measured on the first height() call: setMap runs before the helpers below exist)
  const gateOf = (poly, i) => {
    const mm = segMid(poly, i), n = segNormalOut(poly, i), a = poly[i], b = poly[(i + 1) % poly.length];
    return { x: mm[0], z: mm[1], nx: n[0], nz: n[1], rot: Math.atan2(b[0] - a[0], b[1] - a[1]), seg: i };
  };
  GATE = gateOf(OUTER, GATE_SEG);
  TGATES = TOWN ? TOWN_GATES.map((i) => gateOf(TOWN, i)) : [];
}

export function segMid(poly, i) { const a = poly[i], b = poly[(i + 1) % poly.length]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
export function segNormalOut(poly, i) { // outward normal of a clockwise-ish polygon
  const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
  let nx = dz / l, nz = -dx / l; const m = segMid(poly, i);
  if (nx * m[0] + nz * m[1] < 0) { nx = -nx; nz = -nz; }
  return [nx, nz];
}
setMap('night');

function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}
export function inside(poly, x, z) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
  }
  return c;
}
export function sdPoly(poly, x, z) {
  let d = 1e9;
  for (let i = 0; i < poly.length; i++) d = Math.min(d, segDist(x, z, poly[i], poly[(i + 1) % poly.length]));
  return inside(poly, x, z) ? -d : d;
}
export function distPolyline(pts, x, z) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i], pts[i + 1]));
  return d;
}

// normalized distance to the nearest farm field (<1 inside)
export function fieldD(x, z) {
  let d = 1e9;
  for (const F of FARMS) {
    const c = Math.cos(F.rot), s2 = Math.sin(F.rot), dx = x - F.x, dz = z - F.z;
    const lx = dx * c - dz * s2, lz = dx * s2 + dz * c;
    d = Math.min(d, Math.hypot(lx / (F.w / 2 + 8), lz / (F.d / 2 + 8)));
  }
  return d;
}
// mine-local frame: u = into the hill (outward from the town), v = sideways
export function mineLocal(M, x, z) {
  const ca = Math.cos(M.a * DEG), sa = Math.sin(M.a * DEG), dx = x - M.x, dz = z - M.z;
  return [dx * ca + dz * sa, -dx * sa + dz * ca];
}
export const sdTown = (x, z) => (TOWN ? sdPoly(TOWN, x, z) : 1e9);
// true inside the (generous) mining estate of any gem mine: trees, bushes and boulders keep out of the yard
export const nearMine = (x, z, r = 40) => MINES.some((M) => { const c = Math.cos(M.a * DEG), s = Math.sin(M.a * DEG); return Math.hypot(x - (M.x - c * 8), z - (M.z - s * 8)) < r; });

// ---------------------------------------------------------------- height
const N = NOISE;
export function height(x, z) {
  if (PAD_DIRTY) { PAD_DIRTY = false; for (const P of PADS) P.h = height(P.x, P.z); }
  const r = Math.hypot(x, z), sd = sdPoly(OUTER, x, z), sdT = sdTown(x, z);
  let h = N.fbm(x * 0.012, z * 0.012, 4) * 2.4 + N.fbm(x * 0.05, z * 0.05, 2) * 0.35;
  // rolling hills between the town and the mountains
  h += smooth(160, 300, r) * (N.fbm(x * 0.007 + 5, z * 0.007 - 3, 4) * 0.5 + 0.5) * 26;
  // mountain ring: domain-warped ridges, deep valleys, high snowy peaks
  const ang = Math.atan2(z, x);
  const ringR = MOUNT + N.fbm(Math.cos(ang) * 1.3 + 9, Math.sin(ang) * 1.3, 3) * 70;
  const m = smooth(ringR - 150, ringR + 40, r);
  if (m > 0) {
    const wx = x + N.fbm(x * 0.004 + 3, z * 0.004, 3) * 70, wz = z + N.fbm(x * 0.004, z * 0.004 + 7, 3) * 70;
    const ridge = N.ridged(wx * 0.0042 + 2, wz * 0.0042, 6);
    const peaks = Math.pow(Math.max(0, N.fbm(wx * 0.0022 - 4, wz * 0.0022 + 1, 3) * 0.5 + 0.55), 1.6);
    const gully = N.ridged(wx * 0.016 + 11, wz * 0.016, 3);
    h += m * (36 + ridge * 170 + peaks * 150 + gully * 14 * m + N.fbm(x * 0.03, z * 0.03, 3) * 6);
  }
  // flat grounds: the citadel, then the lower town inside its own wall
  if (TOWN) {
    const town = 0.45 + N.fbm(x * 0.03, z * 0.03, 2) * 0.25;
    h = lerp(town, h, smooth(4, 34, sdT));
    h = lerp(0.15 + N.fbm(x * 0.2, z * 0.2, 2) * 0.05, h, smooth(3, 16, sd));
  } else if (MAP === 'day') h = lerp(0.15 + N.fbm(x * 0.05, z * 0.05, 2) * 0.25, h, smooth(12, 60, sd));
  else h = lerp(0.15 + N.fbm(x * 0.2, z * 0.2, 2) * 0.05, h, smooth(3, 22, sd));
  // gem mines: a rocky spur behind each mine mouth, a flat yard in front
  for (const M of MINES) {
    const [u, v] = mineLocal(M, x, z);
    if (u > -40 && u < 140 && Math.abs(v) < 110) {
      const pad = 1.6 + N.fbm(M.x * 0.01, M.z * 0.01, 2);
      const w = 20 + Math.max(0, u) * 0.55;
      const spur = pad + 46 * smooth(2, 40, u) * Math.exp(-(v * v) / (w * w)) * (0.85 + 0.15 * N.fbm(x * 0.05, z * 0.05, 2));
      h = Math.max(h, spur);
      const dd = Math.hypot(u + 10, v * 0.8);
      if (dd < 36) h = lerp(pad, h, smooth(20, 36, dd));
    }
  }
  // open, gently flattened grounds: pasture and the army camp
  for (const Z of [PASTURE, CAMP, MUSTER]) {
    const dz = Math.hypot(x - Z.x, z - Z.z);
    if (dz < Math.max(Z.r + 26, (Z.fr ?? 0) + 16)) { const base = 1.2 + N.fbm(x * 0.03, z * 0.03, 2) * 0.5; h = lerp(base, h, smooth(Z.fr ?? Z.r * 0.75, Math.max(Z.r + 26, (Z.fr ?? 0) + 16), dz)); }
  }
  // the stable estate stands on a level pad, so the barn, rails, troughs and pen all sit on the ground
  if (_SY) { const dy = Math.hypot(x - _SY.x, z - _SY.z); if (dy < 54) h = lerp(1.7 + N.fbm(x * 0.03, z * 0.03, 2) * 0.2, h, smooth(30, 54, dy)); }
  // p38: the level pads of the worksites
  for (let i = 0; i < PADS.length; i++) { const P = PADS[i]; if (P.h == null) continue; const dx = x - P.x, dz = z - P.z, R = P.r + P.b; if (dx * dx + dz * dz < R * R) h = lerp(P.h, h, smooth(P.r, R, Math.hypot(dx, dz))); }
  h = Math.max(h, -0.3);                       // no stray puddles: only moats/river/lake go below the water line
  // moats: around the Blue Wall and around the town wall
  const md = Math.abs(sd - MOAT.off);
  if (MOAT.on && md < MOAT.half + 2.4) h = Math.min(h, lerp(-2.4, h, smooth(MOAT.half - 1.2, MOAT.half + 2.4, md)));
  if (MOAT2) { const m2 = Math.abs(sdT - MOAT2.off); if (m2 < MOAT2.half + 3) h = Math.min(h, lerp(-2.6, h, smooth(MOAT2.half - 1.2, MOAT2.half + 3, m2))); }
  // river valley + bed
  const rd = distPolyline(RIVER, x, z);
  if (rd < 30) {
    h = lerp(h, Math.min(h, 1.2 + rd * 0.35), 1 - smooth(8, 30, rd));
    // (p38: inside the town wall the river is a canal with steep banks — a stone quay stands on them (castle.js riverQuay); outside it keeps its soft banks)
    const wT = TOWN ? 1 - smooth(-8, 0, sdT) : 0;
    if (rd < 7) h = Math.min(h, lerp(-2.2, h, smooth(3.4 + 1.3 * wT, 7 - 1.3 * wT, rd)));
  }
  // lake
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z) - LAKE.r * (1 + 0.12 * N.fbm(x * 0.03, z * 0.03, 2));
  if (ld < 18) h = Math.min(h, lerp(-3, h, smooth(-6, 18, ld)));
  // fields: gentle flat patches
  const fd = fieldD(x, z);
  if (fd < 1.5) h = lerp(1.2 + N.fbm(x * 0.02, z * 0.02, 2) * 0.4, h, smooth(0.9, 1.5, fd));
  return h;
}
