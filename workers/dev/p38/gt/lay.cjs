// src/noise.js
function rng(seed = 1) {
  let s = seed >>> 0;
  return function() {
    s |= 0;
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
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
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
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
    let a = 1, f2 = 1, s = 0, norm = 0;
    for (let o = 0; o < oct; o++) {
      s += a * n2(x * f2, y * f2);
      norm += a;
      a *= gain;
      f2 *= lac;
    }
    return s / norm;
  }
  function ridged(x, y, oct = 5) {
    let a = 0.5, f2 = 1, s = 0, w = 1;
    for (let o = 0; o < oct; o++) {
      let v = 1 - Math.abs(n2(x * f2, y * f2));
      v *= v;
      v *= w;
      w = Math.min(1, Math.max(0, v * 2));
      s += v * a;
      a *= 0.5;
      f2 *= 2.05;
    }
    return s;
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
  const P = PASTURE;
  _SA = _SY = null;
  if (!P || !(P.r > 0)) return;
  const x = P.x - 56, z = P.z + 8, ry = Math.atan2(P.x - x, P.z - z), c = Math.cos(ry), s = Math.sin(ry);
  _SA = { x, z, ry, W: (u, v) => [x + c * u + s * v, z - s * u + c * v] };
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
  for (const w of SITES) PADS.push({ x: w.x, z: w.z, r: w.r * (w.water ? 0.72 : 0.9), b: 16, h: null });
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

// ../../../../../../tmp/claude-0/gt/lay.mjs
setMap("night");
var f = (a) => JSON.stringify(a, (k, v) => typeof v === "number" ? +v.toFixed(1) : v);
console.log("OUTER", OUTER && OUTER.length, f(OUTER && OUTER.slice(0, 3)), "GATE_SEG", f(GATE_SEG));
console.log("TOWN", TOWN && TOWN.length, "TOWN_GATES", f(TOWN_GATES), "TGATES", f(TGATES));
console.log("INNER", INNER && INNER.length, "INNER_GATE_SEG", f(INNER_GATE_SEG), "GATE", f(GATE), "MOAT", f(MOAT && Object.keys(MOAT)));
console.log("WGATES", f(WGATES), "KEEP", f(KEEP), "MUSTER", f(MUSTER), "CAMP", f(CAMP));
