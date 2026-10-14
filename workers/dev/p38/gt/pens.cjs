// src/noise.js
function rng(seed = 1) {
  let s2 = seed >>> 0;
  return function() {
    s2 |= 0;
    s2 = s2 + 1831565813 | 0;
    let t = Math.imul(s2 ^ s2 >>> 15, 1 | s2);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;
var GRAD = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
function makeNoise(seed = 7) {
  const r = rng(seed), p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = r() * (i + 1) | 0;
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function n2(x, y) {
    const s2 = (x + y) * F2, i = Math.floor(x + s2), j = Math.floor(y + s2);
    const t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0, tt, g;
    tt = 0.5 - x0 * x0 - y0 * y0;
    if (tt > 0) {
      g = GRAD[perm[ii + perm[jj]] & 7];
      tt *= tt;
      n += tt * tt * (g[0] * x0 + g[1] * y0);
    }
    tt = 0.5 - x1 * x1 - y1 * y1;
    if (tt > 0) {
      g = GRAD[perm[ii + i1 + perm[jj + j1]] & 7];
      tt *= tt;
      n += tt * tt * (g[0] * x1 + g[1] * y1);
    }
    tt = 0.5 - x2 * x2 - y2 * y2;
    if (tt > 0) {
      g = GRAD[perm[ii + 1 + perm[jj + 1]] & 7];
      tt *= tt;
      n += tt * tt * (g[0] * x2 + g[1] * y2);
    }
    return 70 * n;
  }
  function fbm(x, y, oct = 5, lac = 2, gain = 0.5) {
    let a = 1, f = 1, s2 = 0, norm = 0;
    for (let o = 0; o < oct; o++) {
      s2 += a * n2(x * f, y * f);
      norm += a;
      a *= gain;
      f *= lac;
    }
    return s2 / norm;
  }
  function ridged(x, y, oct = 5) {
    let a = 0.5, f = 1, s2 = 0, w = 1;
    for (let o = 0; o < oct; o++) {
      let v = 1 - Math.abs(n2(x * f, y * f));
      v *= v;
      v *= w;
      w = Math.min(1, Math.max(0, v * 2));
      s2 += v * a;
      a *= 0.5;
      f *= 2.05;
    }
    return s2;
  }
  return { n2, fbm, ridged };
}

// src/layout.js
var NOISE = makeNoise(20261001);
var MAP = "night";
var DEG = Math.PI / 180;
var ring = (pts) => pts.map(([a, r]) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r]);
var polar = (a, r) => [Math.cos(a * DEG) * r, Math.sin(a * DEG) * r];
var GROW = 1.2;
var PUSH = 60;
var pushXZ = ([x, z]) => {
  const r = Math.hypot(x, z) || 1, k = (r + PUSH) / r;
  return [x * k, z * k];
};
var pushO = (o) => {
  const [x, z] = pushXZ([o.x, o.z]);
  return { ...o, x, z };
};
var LAKE_N = pushO({ x: -128, z: 196, r: 40 });
var NIGHT = {
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
  MOAT2: { off: 13, half: 5 },
  WINDMILL: pushO({ x: 236, z: 34 }),
  FIELDS: pushO({ x: 206, z: -22, w: 66, d: 44, rot: 0.12 }),
  FIELDS2: pushO({ x: 150, z: 168, w: 52, d: 36, rot: -0.75 }),
  LAKE: LAKE_N,
  // p38: the river does not stop at the town moat any more: it runs on THROUGH the town (in at the NE wall, a water gate, square under the ring street, round the north between the two ring streets, out through a second water gate in the WSW wall) and on to the lake.
  // (points 0..4 are the old river, pushed with the rest of the map; from point 5 on the numbers are absolute — dev/p38/rivertown.mjs computes them from the real streets: >= 11 m between the river's centre and both ring streets, every crossing square)
  RIVER: [[492, -282], [396, -258], [304, -228], [250, -166], [186, -138]].map(pushXZ).concat([
    [168, -119.7],
    [156.5, -110.1],
    [145, -100.4],
    [134.2, -91.4],
    [123.3, -82.1],
    [112.3, -72.9],
    [101.5, -64],
    [89.1, -67.2],
    [80.1, -78.3],
    [69.8, -88.3],
    [57, -96.5],
    [43.3, -102.4],
    [29, -106.9],
    [14.5, -111.7],
    [-0.5, -114.5],
    [-14.6, -114.8],
    [-29.5, -111.2],
    [-43.6, -104.7],
    [-56.3, -96.1],
    [-67.2, -86],
    [-77.1, -75],
    [-87.8, -65],
    [-98.4, -54],
    [-107.3, -42.9],
    [-112.5, -28.5],
    [-114.1, -14.4],
    [-113.6, 1],
    [-111.3, 16],
    [-107.4, 30.6],
    [-103.1, 44.8],
    [-98.6, 58.2],
    [-103.1, 70.3],
    [-116.3, 76.8],
    [-129.3, 83.1],
    [-142.2, 89.3],
    [-155.7, 93.7],
    [-157.2, 107.4],
    [-153.3, 122.3],
    [-151.7, 136.9],
    [-150, 152]
  ]).concat([[LAKE_N.x - 4, LAKE_N.z - LAKE_N.r - 22], [LAKE_N.x - 2, LAKE_N.z - LAKE_N.r - 10], [LAKE_N.x + 3, LAKE_N.z - LAKE_N.r + 4]]),
  // (the last stretch follows the lake, wherever PUSH puts it)
  // the two water gates in the town wall: wall segment, distance of the gate's middle from the segment's first corner, half width of the opening
  WGATES: [{ seg: 10, c: 34.8, half: 6.6 }, { seg: 4, c: 43.1, half: 6.6 }],
  // stone bridges over the river (where the farm road to the ruby mine crosses it): centre, direction of travel (unit), length, width
  RBRIDGES: [],
  // (p38: roads.js adds a bridge wherever a road meets the river — see autoBridges)
  PASTURE: pushO({ x: 46, z: 206, r: 30, fr: 44 }),
  CAMP: pushO({ x: -34, z: -212, r: 30, fr: 46 }),
  MUSTER: pushO({ x: 215, z: 60, r: 34, fr: 66 }),
  LAIR: pushO({ x: 272, z: 4, r: 24 }),
  MINES: [
    { id: "ruby", ...xz(polar(-62, 238 + PUSH)), a: -62 },
    { id: "emerald", ...xz(polar(163, 244 + PUSH)), a: 163 },
    { id: "turq", ...xz(polar(232, 240 + PUSH)), a: 232 }
  ],
  MOUNT: 445 + PUSH
};
var WS_SITES = [
  { id: "lumber1", kind: "lumber", x: 241, z: -232.7, ry: -1.02, r: 24, link: [159.1, -182.4] },
  { id: "lumber2", kind: "lumber", x: -253.4, z: 228.2, ry: 1.938, r: 24, link: [-137.9, 183.8] },
  { id: "oil", kind: "oil", x: -310.6, z: -125.5, ry: 0.963, r: 26, link: [-213.2, -57.7] },
  { id: "quarry", kind: "quarry", x: 37.5, z: -357, ry: 0.787, r: 24, link: [137.1, -257.8] },
  { id: "iron", kind: "iron", x: 249.4, z: 258.2, ry: -2.058, r: 22, link: [160, 210.8] },
  { id: "gold", kind: "gold", x: 353.5, z: -62.3, ry: -1.65, r: 22, link: [226.7, -72.4] },
  { id: "farm", kind: "farm", x: 243.8, z: -98.5, ry: -1.02, r: 26, link: [219.7, -83.7] },
  { id: "greenhouse", kind: "greenhouse", x: 133.4, z: 183.6, ry: 1.563, r: 20, link: [160.1, 183.8] },
  { id: "livestock", kind: "livestock", x: -20.9, z: 298.3, ry: 1.925, r: 26, link: [97.1, 254.6] },
  { id: "slaughter", kind: "slaughter", x: -75.8, z: 264.3, ry: -2.417, r: 18, link: [-130.8, 202.2] },
  { id: "fishery_lake", kind: "fishery", x: -123.3, z: 280, ry: -2.304, r: 22, link: [-130.8, 202.2], water: [-160.8, 246.2] },
  { id: "fishery_river", kind: "fishery", x: 189.3, z: -169.3, ry: 0.686, r: 22, link: [173.2, -159.5], water: [205.1, -150] }
];
function xz([x, z]) {
  return { x, z };
}
var S = 46;
var T3 = S / 3;
var DAY = {
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
  RIVER: [[-420, -40], [-300, -20], [-200, -60], [-140, -120], [-90, -190], [-60, -300], [-40, -420]]
};
var OUTER;
var GATE_SEG;
var INNER;
var INNER_GATE_SEG;
var KEEP;
var PLAZA;
var MOAT;
var WINDMILL;
var FIELDS;
var LAKE;
var RIVER;
var GATE;
var PASTURE;
var CAMP;
var MUSTER;
var LAIR;
var RBRIDGES = [];
var WGATES = [];
var TOWN = null;
var TOWN_GATES = [];
var TGATES = [];
var MOAT2 = null;
var FIELDS2 = null;
var FARMS = [];
var MINES = [];
var MOUNT = 330;
var PAD_DIRTY = false;
var PADS = [];
var SITES = [];
var _SA = null;
var _SY = null;
function calcStable() {
  const P2 = PASTURE;
  _SA = _SY = null;
  if (!P2 || !(P2.r > 0)) return;
  const x = P2.x - 56, z = P2.z + 8, ry = Math.atan2(P2.x - x, P2.z - z), c = Math.cos(ry), s2 = Math.sin(ry);
  _SA = { x, z, ry, W: (u, v) => [x + c * u + s2 * v, z - s2 * u + c * v] };
  const [yx, yz] = _SA.W(-3, 14);
  _SY = { x: yx, z: yz, r: 27 };
}
function setMap(m) {
  MAP = m === "day" ? "day" : "night";
  const c = MAP === "day" ? DAY : NIGHT;
  ({ OUTER, GATE_SEG, INNER, INNER_GATE_SEG, KEEP, PLAZA, MOAT, WINDMILL, FIELDS, LAKE, RIVER } = c);
  PASTURE = c.PASTURE || { x: 1e4, z: 1e4, r: 0 };
  CAMP = c.CAMP || { x: 1e4, z: 1e4, r: 0 };
  MUSTER = c.MUSTER || { x: 1e4, z: 1e4, r: 0 };
  LAIR = c.LAIR || { x: 1e4, z: 1e4, r: 0 };
  RBRIDGES = c.RBRIDGES || [];
  WGATES = c.WGATES || [];
  calcStable();
  TOWN = c.TOWN || null;
  TOWN_GATES = c.TOWN_GATES || [];
  MOAT2 = c.MOAT2 || null;
  FIELDS2 = c.FIELDS2 || null;
  MINES = c.MINES || [];
  MOUNT = c.MOUNT || 330;
  FARMS = [FIELDS, FIELDS2].filter(Boolean);
  PADS = [];
  SITES = MAP === "night" && TOWN ? WS_SITES : [];
  for (const w of SITES) PADS.push({ x: w.x, z: w.z, r: w.r * 0.72, b: 16, h: null });
  PAD_DIRTY = PADS.length > 0;
  const gateOf = (poly, i) => {
    const mm = segMid(poly, i), n = segNormalOut(poly, i), a = poly[i], b = poly[(i + 1) % poly.length];
    return { x: mm[0], z: mm[1], nx: n[0], nz: n[1], rot: Math.atan2(b[0] - a[0], b[1] - a[1]), seg: i };
  };
  GATE = gateOf(OUTER, GATE_SEG);
  TGATES = TOWN ? TOWN_GATES.map((i) => gateOf(TOWN, i)) : [];
}
function segMid(poly, i) {
  const a = poly[i], b = poly[(i + 1) % poly.length];
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function segNormalOut(poly, i) {
  const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz);
  let nx = dz / l, nz = -dx / l;
  const m = segMid(poly, i);
  if (nx * m[0] + nz * m[1] < 0) {
    nx = -nx;
    nz = -nz;
  }
  return [nx, nz];
}
setMap("night");

// src/worksites.js
var sites = () => SITES || [];
var N = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / 29);
var tierOf = (lv) => lv <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv - 1) / 6));
var kScale = (lv) => 0.76 + 0.24 * (Math.max(1, lv) - 1) / 29;
var P = (n, x, z, ry = 0, s2 = 1) => ({ n: "ws_" + n, x, z, ry, s: s2 });
function row(out, name, n, x0, z0, x1, z1, ry = 0, s2 = 1, R = null, jit = 0) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    out.push(P(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s2));
  }
}
function block(out, name, n, x0, z0, cols, dx, dz, ry = 0, s2 = 1) {
  for (let i = 0; i < n; i++) out.push(P(name, x0 + i % cols * dx, z0 + Math.floor(i / cols) * dz, ry, s2));
}
function scatter(out, name, n, R, r0, r1, a0, a1, gap = 2, s0 = 1, s1 = 1, avoid = []) {
  const got = [];
  for (let k = 0; k < n * 14 && got.length < n; k++) {
    const rr = r0 + (r1 - r0) * Math.sqrt(R()), a = a0 + (a1 - a0) * R(), x = Math.sin(a) * rr, z = Math.cos(a) * rr;
    if (got.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) || avoid.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2])) continue;
    got.push([x, z]);
    out.push(P(name, x, z, R() * 6.283, s0 + (s1 - s0) * R()));
  }
}
var DEG2 = Math.PI / 180;
var BUILD = {
  // wood: the sawmill at the back, log stacks and carts in the yard, a stump field behind, lumberjacks' huts at the sides
  lumber(lv, R, s2) {
    const o = [], k = kScale(lv), t = tierOf(lv);
    o.push(P("lumbermill", 0, -6, 0, 0.78 * k));
    row(o, "logpile", N(lv, 2, 9), -15, 9, 3, 9, 0.05, 1, R, 0.6);
    if (lv >= 8) row(o, "logpile", N(lv, 0, 6), -15, 13.5, -2, 13.5, 0.05, 1, R, 0.6);
    row(o, "logs", N(lv, 1, 6), 8, 8, 16, 14, 0.5, 1, R, 1);
    o.push(P("stumpsA", -12, -17, 0.3, 1), P("stumpsB", 13, -18, 1.2, 1));
    scatter(o, "stump", N(lv, 5, 22), R, 10, 24, 150 * DEG2, 210 * DEG2, 2.4, 0.8, 1.3);
    o.push(P("workbench", 9.5, 3, -0.4), P("ladder", 8.2, -6, 1.57), P("cratelong", 11.5, 1, 0.5), P("pallet", 12.5, 4.5, 0.1), P("sack", 12.2, 4.4, 0));
    row(o, "cart1", N(lv, 1, 2), 2, 17, 2, 17 + 5 * (N(lv, 1, 2) - 1), Math.PI / 2, 1, R, 0.5);
    row(o, "wheelbarrow", N(lv, 1, 3), -4, 5, 3, 5.5, 0.4, 1, R, 0.5);
    if (t >= 2) o.push(P("hut", -17, -2, 1.2, 0.95));
    if (t >= 4) o.push(P("hut", 18, -5, -1.2, 0.95));
    if (t >= 3) o.push(P("stall_cart_empty", 14.5, 8, -0.8));
    return o;
  },
  // stone: a cut rock face behind, block stacks, cranes and scaffolding, masons' benches
  quarry(lv, R, s2) {
    const o = [], t = tierOf(lv);
    o.push(P("rockA", -8, -15, 0.4, 1), P("rockB", 9, -17, 2.2, 1));
    if (t >= 3) o.push(P("rockC", 0, -20, 1, 1));
    block(o, "stoneblocks", N(lv, 3, 16), -14, 3, 4, 3.9, 3.7, 0.15, 1);
    scatter(o, "boulderC", N(lv, 2, 7), R, 8, 22, 100 * DEG2, 260 * DEG2, 5, 0.8, 1.3);
    scatter(o, "boulderD", N(lv, 2, 6), R, 8, 22, -150 * DEG2, 150 * DEG2, 4, 0.8, 1.2);
    o.push(P("stageB", 10, 0, -0.3, 1));
    if (lv >= 7) o.push(P("scaffold", 17, -2, 0, 0.95));
    if (lv >= 15) o.push(P("stageC", -16, -7, 0.5, 1));
    row(o, "ladder", N(lv, 1, 4), -3, -9, 6, -9, 0, 1);
    row(o, "wheelbarrow", N(lv, 1, 4), -4, 8, 6, 8.5, 0.3, 1, R, 0.6);
    row(o, "cart2", N(lv, 1, 2), 14, 12, 14, 12 + 5 * (N(lv, 1, 2) - 1), Math.PI / 2, 1, R, 0.5);
    o.push(P("workbench", 6, 5, 0.2), P("whetstone", 8, 6.5, 0.4), P("pickaxe_bronze", 7.4, 5.2, 0.8), P("hut", -3, 13, 0, 0.9));
    return o;
  },
  // iron: the mine mouth at the back, rails + ore carts, the smelter (smithy) beside it
  iron(lv, R, s2) {
    const o = [], t = tierOf(lv);
    o.push(P("mine", 0, -10, 0, 0.9 + 0.1 * (lv / 30)));
    row(o, "minecart", N(lv, 1, 4), -3, 1, -3, 14, 0, 1, R, 0.3);
    row(o, "orecart", N(lv, 1, 4), 3, 1, 3, 12, 0.1, 1, R, 0.3);
    if (lv >= 5) o.push(P("smithy", -15, 0, 0.5, 1));
    if (lv >= 12) o.push(P("smithy", 16, -2, -0.5, 0.9));
    o.push(P("anvil_log", -9, 6, 0.2), P("cauldron", -10.5, 8, 0), P("chain_coil", 6, 7, 0.4), P("barrel_holder", 9, 9, 0.2), P("workbench", 9, 3, -0.2));
    scatter(o, "boulderA", N(lv, 2, 6), R, 12, 22, 70 * DEG2, 290 * DEG2, 5, 0.9, 1.3);
    scatter(o, "boulderE", N(lv, 2, 6), R, 10, 22, -160 * DEG2, 160 * DEG2, 4, 0.9, 1.2);
    row(o, "crate_wooden", N(lv, 2, 8), -7, 12, 8, 12.5, 0.1, 1, R, 0.6);
    if (t >= 3) o.push(P("hut", 17, 8, -1.2, 0.9));
    if (t >= 4) o.push(P("watchtower2", -18, 10, 0, 1));
    return o;
  },
  // gold: like the iron mine, but with panned nuggets, bars and a counting house under guard
  gold(lv, R, s2) {
    const o = [], t = tierOf(lv);
    o.push(P("mine", 0, -10, 0, 0.9 + 0.1 * (lv / 30)));
    row(o, "minecart", N(lv, 1, 4), -3, 1, -3, 13, 0, 1, R, 0.3);
    row(o, "orecart", N(lv, 1, 3), 3, 2, 3, 11, 0.1, 1, R, 0.3);
    o.push(P("stageC", -15, 2, 0.5, 1), P("workbench", 9, 3, -0.2), P("cage_small", 8, 8, 0.4), P("barrel_holder", 11, 7, 0.3));
    row(o, "nugget", N(lv, 2, 10), 4, 8, 13, 15, 0, 1, R, 1.5);
    row(o, "nugget2", N(lv, 1, 7), -9, 9, -1, 15, 0, 1, R, 1.5);
    row(o, "goldbars", N(lv, 1, 7), -8, 6, -14, 8, 0.2, 1, R, 0.5);
    row(o, "coin_pile", N(lv, 1, 3), -6, 12, 2, 13, 0, 1, R, 0.5);
    scatter(o, "boulderA", N(lv, 2, 6), R, 12, 22, 70 * DEG2, 290 * DEG2, 5, 0.9, 1.3);
    if (t >= 3) o.push(P("watchtower2", 17, 8, 0, 1));
    if (t >= 4) o.push(P("hut", -17, 12, 0.6, 0.9));
    if (t >= 5) o.push(P("market", 16, -3, -0.6, 0.9));
    return o;
  },
  // farm: barn + silos + coop, a fenced yard, crop plots that multiply (drawn by wsbuild), scarecrows
  farm(lv, R, s2) {
    const o = [], t = tierOf(lv), k = kScale(lv);
    o.push(P("barn", 0, -9, 0, 0.82 * k + 0.1));
    row(o, "silo", N(lv, 1, 2), 11, -9, 11, -9 + 5 * (N(lv, 1, 2) - 1), 0, 1, R, 0.2);
    row(o, "coop", N(lv, 1, 3), -12, -3, -12, -3 + 4.5 * (N(lv, 1, 3) - 1), 1.57, 1, R, 0.2);
    if (t >= 3) o.push(P("smallbarn", -14, -14, 0.3, 0.9));
    if (t >= 5) o.push(P("openbarn", 15, 8, -0.4, 0.9));
    for (let i = 0; i < 6; i++) {
      o.push(P("fence", -12.6 + i * 4.2, 6, 0));
      if (i < 5) o.push(P("fence", 12.6 - i * 4.2, 6, 0));
    }
    o.push(P("cart1", 3, 2.5, 1), P("farmcrate_apple", 6, 3.5, 0.2), P("farmcrate_apple", 6.2, 4.4, 0.6), P("barrel_apples", 8, 3.5, 0), P("sack", -6, 3, 0.4), P("bucket_wooden_1", -7, 2.2, 0.9), P("wheelbarrow", -4, 4.5, 0.5));
    return o;
  },
  // livestock: barns at the back, pens that multiply with the level (fenced squares with a trough), a cage + hay
  livestock(lv, R, s2) {
    const o = [], t = tierOf(lv), pens = N(lv, 1, 4);
    o.push(P("openbarn", -10, -11, 0.15, 0.9), P("smallbarn", 10, -12, -0.1, 0.9));
    if (t >= 4) o.push(P("barn", 0, -19, 0, 0.8));
    const cells = [[-9, 4], [9, 4], [-9, 16], [9, 16]];
    for (let p = 0; p < pens; p++) {
      const [cx, cz] = cells[p], w = 12.6, d = 8.4;
      for (let i = 0; i < 3; i++) {
        o.push(P("fence", cx - w / 2 + 2.1 + i * 4.2, cz - d / 2, 0), P("fence", cx - w / 2 + 2.1 + i * 4.2, cz + d / 2, 0));
      }
      for (let i = 0; i < 2; i++) {
        o.push(P("fence", cx - w / 2, cz - d / 2 + 2.1 + i * 4.2, Math.PI / 2), P("fence", cx + w / 2, cz - d / 2 + 2.1 + i * 4.2, Math.PI / 2));
      }
      o.push(P("barrel", cx - 1.4, cz + d / 2 - 1.2, 0.3), P("sack", cx + 1.2, cz + d / 2 - 1.2, 0.6));
    }
    o.push(P("cage_small", 0, 9, 0.3), P("cratelong", 1.5, 2.5, 0.3), P("sack", -1.5, 2.2, 0.3));
    return o;
  },
  // fishery (lake or river): jetty running out to the water (local +z), rowboats along it, drying racks and nets on the shore, huts + a fish stall
  fishery(lv, R, s2) {
    const o = [], t = tierOf(lv), boats = Math.ceil(N(lv, 1, 9) / 2), jet = lv >= 22 ? 2 : lv >= 11 ? 1 : 0;
    o.push(P("jetty", 0, s2.variant === "river" ? 11 : 15, 0, s2.variant === "river" ? 0.62 : 0.9));
    for (let i = 0; i < boats; i++) {
      const side = i % 2 ? 1 : -1, j = Math.floor(i / 2);
      o.push(P("rowboat", side * (5.6 + j % 2 * 3.2), (s2.variant === "river" ? 13 : 18) + j * 3.4, 1.57 + side * 0.08 + (R() - 0.5) * 0.2, 1));
    }
    if (jet >= 1) o.push(P("jetty", 14, s2.variant === "river" ? 9 : 12, 0.35, 0.5));
    if (jet >= 2) o.push(P("jetty", -14, s2.variant === "river" ? 9 : 12, -0.35, 0.5));
    row(o, "fishrack", N(lv, 1, 4), -14, -4, 14, -4, 0, 1, R, 0.8);
    row(o, "fishset", N(lv, 2, 6), -9, 5.5, 9, 6.5, 0, 1, R, 1.5);
    o.push(P("hut", -15, -12, 0.4, 0.95), P("barrel", 6, -9, 0), P("barrel", 7.2, -9.4, 0), P("bucket_wooden_1", 4.6, -8.4, 0.5));
    if (t >= 2) o.push(P("stall_empty", 10, -9, 0.1));
    if (t >= 3) o.push(P("hut", 16, -12, -0.3, 0.9));
    if (t >= 4) o.push(P("brewhouse", 0, -14, 0, 0.9));
    row(o, "barrelold", N(lv, 0, 6), -6, -10, 4, -10.5, 0, 1, R, 0.5);
    return o;
  },
  // slaughterhouse (clean, no gore): the butcher's hall, holding cages, meat racks, cart + barrels, a fenced yard
  slaughter(lv, R, s2) {
    const o = [], t = tierOf(lv);
    o.push(P("butcher", 0, -6, 0, 1.4 + 0.2 * (lv / 30)));
    o.push(P("smallbarn", -13, -6, 0.2, 0.85));
    row(o, "cage_small", N(lv, 1, 4), -12, 4, 2, 4.5, 0.1, 1, R, 0.5);
    row(o, "fishrack", N(lv, 1, 3), 4, 4, 14, 4, 0, 0.95, R, 0.6);
    row(o, "workbench", N(lv, 1, 3), 8, -4, 14, -4, 1.57, 1, R, 0.3);
    row(o, "barrel", N(lv, 2, 6), -5, 9, 8, 9.5, 0.1, 1, R, 0.8);
    o.push(P("cauldron", 6, 0, 0), P("cart3", 12, 9, 0.9), P("crate_wooden", 10.5, 1.5, 0.3));
    for (let i = 0; i < 5; i++) o.push(P("fence", -10.5 + i * 4.2, 13, 0));
    if (t >= 3) o.push(P("stall_empty", -4, 12, 0.1));
    if (t >= 4) o.push(P("hut", 15, -8, -0.6, 0.9));
    return o;
  },
  // greenhouse: glass houses (wsbuild draws them: frame, panes, plant rows) — here only the sheds, tubs and crates around them
  greenhouse(lv, R, s2) {
    const o = [], t = tierOf(lv);
    o.push(P("hut", -14, -10, 0.3, 0.85));
    row(o, "barrel", N(lv, 2, 6), -9, 11, 10, 11.5, 0, 1, R, 0.8);
    row(o, "farmcrate_empty", N(lv, 3, 12), -10, 8.5, 10, 8.8, 0.1, 1, R, 0.8);
    o.push(P("bucket_wooden_1", 3, 9, 0.2), P("wheelbarrow", 6, 9, 0.5), P("sack", 12, 9.5, 0), P("workbench", 14, -8, 1.57));
    if (t >= 3) o.push(P("cart1", 15, 5, 1.2));
    if (t >= 4) o.push(P("stageA", 16, -12, 0.2, 1));
    return o;
  },
  // oil (naphtha pits): pools and windlass derricks are drawn by wsbuild; here the jars, barrels, carts and the camel caravan
  oil(lv, R, s2) {
    const o = [], t = tierOf(lv);
    row(o, "barrelold", N(lv, 4, 16), -14, 9, 14, 9.5, 0, 1, R, 1.4);
    row(o, "barrel_holder", N(lv, 1, 3), -13, 13, 13, 13.5, 0.1, 1, R, 0.8);
    scatter(o, "amphora", N(lv, 4, 22), R, 3, 13, 20 * DEG2, 340 * DEG2, 1.6, 0.9, 1.25, [[0, 0, 0]]);
    row(o, "camel", N(lv, 1, 9), -15, 20, 15, 22, 1.57, 1, R, 1.8);
    row(o, "cart2", N(lv, 1, 2), -10, 16, 10, 17, 0.2, 1, R, 1);
    o.push(P("hut", -16, -9, 0.5, 0.9));
    if (t >= 3) o.push(P("stageC", 16, -9, -0.4, 0.95));
    if (t >= 4) o.push(P("watchtower2", 19, 4, 0, 1));
    if (t >= 5) o.push(P("smithy", -3, -15, 0, 0.9));
    return o;
  }
};
function pieces(site, lv) {
  if (lv <= 0) return [];
  const f = BUILD[site.kind];
  if (!f) return [];
  const R = rng((site.x * 73856093 ^ site.z * 19349663) >>> 0 || 7);
  return f(lv, R, site);
}

// ../../../../../../tmp/claude-0/gt/pens.mjs
var s = sites().find((q) => q.id === "livestock");
console.log(s);
for (const p of pieces(s, 30)) if (/pen|pasture|fence_big|ws_pen|floor|deck/i.test(p.n)) console.log(p.n, p.x.toFixed(1), p.z.toFixed(1), p.ry.toFixed(2), p.s);
