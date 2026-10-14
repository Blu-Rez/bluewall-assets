// b1_townplan.js — B1 TOWN PLAN ENGINE: which building goes where in the lower town (positions only, no art).
//
//   planTown(layout, castleLevel = 30, opts)  -> [{ id, kind, x, z, ry, r, w, d, role, fa, inside: true, unlockLv, quarter, ... }]
//   planTownFull(layout)                      -> { list, meta }   the level-30 plan every level is cut from (cached per layout object)
//   countAt(kind, level)                      -> how many of a kind stand at a castle level
//
// The plan is made ONCE for level 30 and every lower level is a PREFIX of it (the first countAt(kind, lv) records of each kind, in growth order): counts never decrease and a
// building never jumps when the castle levels up.  Nothing here knows a coordinate of the game: everything comes through the `layout` argument (see b1_layout.js: layoutFromGame):
//   layout = { town: [[x,z]..]            town wall polygon            outer: [[x,z]..]   Blue Wall polygon        moat: { off, half }  the Blue Wall's moat band
//              keep: {x,z}                market: {x,z,r}              gates: [{x,z}]     town gates + citadel gate front
//              streets: [{ name, w, pts: [[x,z]..] }]                  river: { pts: [[x,z]..], half }  (water half width; the stone quay stands at +0.5 m)
//              fixed: [{ id, kind, res, x, z, ry, r }]  things that already stand (stores / gem vaults: circles, obstacles; the 'stores' are passed through as records)
//              sites: [{ id, kind, x, z, r }]  the production worksites of the valley (supply directions) }
// Every record is { id, kind, x, z, ry, r (bounding radius), w, d (footprint, ry turns the door side +z toward the street) }: the player will move them later (layout editor).
// Deterministic: rng() from noise.js only, fixed iteration orders, no Math.random, no Date in the logic.
// All numbers marked (ph) are PLACEHOLDERS: unlock levels, counts and footprint sizes belong to the economy / model packages (E1, B2, B3, C*).
import { rng } from './noise.js';
import { LEVEL_CAP } from './tiers.js';
import { HOME_KINDS } from './b2_homes.js';             // p41: the REAL lot footprints of the house families (B2) ...
import { CIVIC_KINDS } from './b3_civic.js';             // ... and of the civic buildings (B3) replace the (ph) numbers below

// ------------------------------------------------------------------------------------------------------------------ the kinds (ph)
// role: H home, C civic, P processing, T storage.  w x d = footprint in metres (ph, B2 / B3 / C* models decide); unlock = castle level (ph); n1 -> n30 = count at the unlock level -> level 30 (ph).
// spread = min centre distance between two of the same kind; rc = min distance from the river's centre line to the footprint (the stone quay stands at half + 0.5).
export const KINDS = {
  cottage:   { fa: 'کلبه',            role: 'H', w: HOME_KINDS.cottage.w, d: HOME_KINDS.cottage.d, unlock: 1,  n1: 14, n30: 60 },
  craftsman: { fa: 'خانه‌ی پیشه‌ور',   role: 'H', w: HOME_KINDS.craftsman.w, d: HOME_KINDS.craftsman.d, unlock: 6,  n1: 4,  n30: 24 },
  merchant:  { fa: 'خانه‌ی تاجر',      role: 'H', w: HOME_KINDS.merchant.w, d: HOME_KINDS.merchant.d, unlock: 12, n1: 4,  n30: 28 },
  noble:     { fa: 'خانه‌ی اشراف',     role: 'H', w: HOME_KINDS.noble.w, d: HOME_KINDS.noble.d, unlock: 20, n1: 2,  n30: 20 },
  market:    { fa: 'بازار',            role: 'C', w: CIVIC_KINDS.market.w, d: CIVIC_KINDS.market.d, unlock: 3,  n1: 1,  n30: 1 },
  tavern:    { fa: 'میخانه',           role: 'C', w: CIVIC_KINDS.tavern.w, d: CIVIC_KINDS.tavern.d, unlock: 6,  n1: 1,  n30: 2,  spread: 34 },      // (p41: 3 -> 2: the real inn is 22 x 20 m, a third one does not fit on every layout)
  townhall:  { fa: 'تالار شهر (مالیات)', role: 'C', w: CIVIC_KINDS.townhall.w, d: CIVIC_KINDS.townhall.d, unlock: 2,  n1: 1,  n30: 1 },
  chapel:    { fa: 'کلیسا',            role: 'C', w: CIVIC_KINDS.chapel.w, d: CIVIC_KINDS.chapel.d, unlock: 1,  n1: 1,  n30: 1,  spread: 70 },      // (p41: the real chapel is 18 x 28 m, a second one does not fit on every layout; the old town had one church)
  well:      { fa: 'چاه',              role: 'C', w: CIVIC_KINDS.well.w, d: CIVIC_KINDS.well.d, unlock: 1,  n1: 2,  n30: 8 },
  sawmill:   { fa: 'اره‌کشی',          role: 'P', w: 14,  d: 16,   unlock: 4,  n1: 1,  n30: 2,  spread: 60 },
  masonry:   { fa: 'سنگ‌تراشی',        role: 'P', w: 13,  d: 15,   unlock: 5,  n1: 1,  n30: 2,  spread: 60 },
  smelter:   { fa: 'کوره‌ی ذوب',       role: 'P', w: 13,  d: 14,   unlock: 9,  n1: 1,  n30: 2,  spread: 60 },
  mint:      { fa: 'ضرابخانه',         role: 'P', w: 12,  d: 13,   unlock: 15, n1: 1,  n30: 1 },
  refinery:  { fa: 'پالایشگاه',        role: 'P', w: 17,  d: 17,   unlock: 18, n1: 1,  n30: 1 },
  mill:      { fa: 'آسیاب',            role: 'P', w: 10,  d: 12,   unlock: 4,  n1: 1,  n30: 2,  spread: 50, rc: 7.4 },
  bakery:    { fa: 'نانوایی',          role: 'P', w: 9,   d: 10,   unlock: 5,  n1: 1,  n30: 3,  spread: 30 },
  butcher:   { fa: 'قصابی',            role: 'P', w: 9,   d: 11,   unlock: 7,  n1: 1,  n30: 2,  spread: 40 },
  smokehouse:{ fa: 'دودخانه‌ی ماهی',   role: 'P', w: 9,   d: 11,   unlock: 8,  n1: 1,  n30: 2,  spread: 45, rc: 7.4 },
  jeweler:   { fa: 'جواهرساز',         role: 'P', w: 9,   d: 10,   unlock: 20, n1: 1,  n30: 1 },
  stores:    { fa: 'انبارها',          role: 'T', w: 30,  d: 30,   unlock: 1,  n1: 6,  n30: 6 },
};
export const KIND_ORDER = Object.keys(KINDS);
// how many of a kind stand at a castle level: n1 at the unlock level, growing in a straight line to nMax (the count the layout really had room for) at the top level (LEVEL_CAP, 30 today)
export const countAt = (kind, lv, nMax = KINDS[kind] && KINDS[kind].n30) => { const k = KINDS[kind]; if (!k || lv < k.unlock) return 0; const n1 = Math.min(k.n1, nMax); return Math.min(nMax, Math.round(n1 + (nMax - n1) * (lv - k.unlock) / Math.max(1, LEVEL_CAP - k.unlock))); };
const unlockOf = (kind, i, nMax) => { for (let lv = KINDS[kind].unlock; lv <= LEVEL_CAP; lv++) if (countAt(kind, lv, nMax) > i) return lv; return LEVEL_CAP; };

// ------------------------------------------------------------------------------------------------------------------ the affinity table (defaults — «هوشمندانه»)
// 'edge' = to the market square's EDGE; every other distance is centre to centre; water = the water's edge (river centre line - half width).  HARD = checked by the planner AND by dev/b1_town_test.js.
export const AFFINITY = {
  smokehouse: 'HARD: centre <= 10 m from the water (river bank, front toward the water). Soft: near the market. Two of them >= 45 m apart',
  mint:       'HARD: centre <= 60 m from the treasury (the gold store). Soft: as close as possible',
  refinery:   'HARD: no home (H) within 40 m (centre to centre). Soft: right at the town wall (edge of town), on the side facing the oil field, far from civic buildings',
  bakery:     'HARD: <= 30 m from a mill OR from the market square edge. Soft: next to the mill, then the market',
  butcher:    'HARD: <= 40 m from the market square edge. Soft: on the way between the market and the town gate toward the livestock site',
  mill:       'Soft: on a river bank (watermill) near the market',
  sawmill:    'Soft: on the side of town that faces its lumber camp (one per camp), near the gate that road uses',
  masonry:    'Soft: the side facing the quarry',
  smelter:    'Soft: the side facing the iron mine',
  jeweler:    'Soft: next to a gem vault / the treasury (noble side)',
  townhall:   'Soft: on the market square (rim)',
  tavern:     'Soft: round the market square, two >= 34 m apart',
  chapel:     'Soft: quiet — away from workshops, 35..80 m from the market, two >= 70 m apart',
  well:       'ONE PER QUARTER (8 sectors of 45 deg round the town centre), nearest the middle of the quarter',
  noble:      'nearest the keep first',
  merchant:   'round the market first',
  craftsman:  'nearest the workshops (P buildings) first',
  cottage:    'the outer lanes (nearest the town wall) first',
  EVERY_LOT:  'frontage on a street (door toward it), >= 0.6 m clear of every street, >= river clearance from the water, >= 6.5 m inside the town wall, outside the Blue Wall moat, clear of gates, the market and every fixed store / vault',
};

export const QUARTERS = 8;
const SEED = 20261006, WALL_M = 6.5, GATE_R = 14, GAP = 0.8, STREET_CLEAR = 0.9, SETBACK = 1.1, STREAM_CLEAR = 3;      // (p41: 0.6 -> 0.9: the perimeter samples are 3.2 m apart, near a street end / junction the real gap can be ~0.35 m smaller than the sampled one)
const DEG = Math.PI / 180, hyp = (a, b) => Math.sqrt(a * a + b * b);        // (Math.hypot is several times slower in V8)
let WHY = '';                                                   // why the last staticOK said no (the frontage walk steps 2 m after a street / overlap miss, 3.2 m after any other miss)

// ------------------------------------------------------------------------------------------------------------------ geometry
const corners = (x, z, ry, w, d) => { const c = Math.cos(ry), s = Math.sin(ry); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]); };
function satOverlap(a, b) {
  for (let t = 0; t < 2; t++) {
    const P = t ? b : a;
    for (let i = 0; i < 4; i++) {
      const p1 = P[i], p2 = P[(i + 1) & 3], ax = -(p2[1] - p1[1]), az = p2[0] - p1[0];
      let amin = 1e9, amax = -1e9, bmin = 1e9, bmax = -1e9;
      for (let k = 0; k < 4; k++) { const v = a[k][0] * ax + a[k][1] * az; if (v < amin) amin = v; if (v > amax) amax = v; const u = b[k][0] * ax + b[k][1] * az; if (u < bmin) bmin = u; if (u > bmax) bmax = u; }
      if (amax < bmin || bmax < amin) return false;
    }
  }
  return true;
}
function segD(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return hyp(px - ax - dx * t, pz - az - dz * t);
}
function sdPoly(poly, x, z) {
  let d = 1e9, c = false; const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    const v = segD(x, z, xj, zj, xi, zi); if (v < d) d = v;
  }
  return c ? -d : d;
}
// distance from a rectangle (centre, turn, w x d) to a circle's edge (negative = overlapping)
export function rectCircleGap(x, z, ry, w, d, cx, cz, cr) {
  const c = Math.cos(ry), s = Math.sin(ry), dx = cx - x, dz = cz - z, lx = dx * c - dz * s, lz = dx * s + dz * c;
  const qx = Math.max(-w / 2, Math.min(w / 2, lx)), qz = Math.max(-d / 2, Math.min(d / 2, lz));
  return hyp(lx - qx, lz - qz) - cr;
}
// a spatial hash of line segments: every segment is listed in all cells within `range` of it, so a query only reads one cell
function makeHash(S, range, cell = 24) {
  const map = new Map(), EMPTY = [], key = (i, j) => (i + 4096) * 8192 + (j + 4096);
  S.forEach((s, idx) => {
    const x0 = Math.floor((Math.min(s.ax, s.bx) - range) / cell), x1 = Math.floor((Math.max(s.ax, s.bx) + range) / cell), z0 = Math.floor((Math.min(s.az, s.bz) - range) / cell), z1 = Math.floor((Math.max(s.az, s.bz) + range) / cell);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = key(i, j); let a = map.get(k); if (!a) { a = []; map.set(k, a); } a.push(idx); }
  });
  return (x, z) => map.get(key(Math.floor(x / cell), Math.floor(z / cell))) || EMPTY;
}
const segsOf = (pts, w = 0) => { const o = []; for (let i = 0; i < pts.length - 1; i++) o.push({ ax: pts[i][0], az: pts[i][1], bx: pts[i + 1][0], bz: pts[i + 1][1], hw: w / 2 }); return o; };

// ------------------------------------------------------------------------------------------------------------------ the plan context (built once per layout object)
const CACHE = new WeakMap();
function makeCtx(Lo) {
  const town = Lo.town, outer = Lo.outer, M = Lo.market, keep = Lo.keep, fixed = Lo.fixed || [], sites = Lo.sites || [], half = Lo.river.half;
  const C = { x: town.reduce((a, p) => a + p[0], 0) / town.length, z: town.reduce((a, p) => a + p[1], 0) / town.length };
  const SS = []; for (const st of Lo.streets) for (const s of segsOf(st.pts, st.w)) SS.push(s);
  const RS = segsOf(Lo.river.pts);
  const ST = []; for (const S of Lo.streams || []) for (const sg of segsOf(S.pts)) { sg.hw = S.half; ST.push(sg); }          // p41: A2's mountain streams (half = water half width), obstacles only
  const sh = makeHash(SS, 14), rh = makeHash(RS, 30), th = makeHash(ST, 30);
  const streetD = (x, z) => { let d = 99; for (const i of sh(x, z)) { const s = SS[i], v = segD(x, z, s.ax, s.az, s.bx, s.bz) - s.hw; if (v < d) d = v; } return d; };
  const riverD = (x, z) => { let d = 99; for (const i of rh(x, z)) { const s = RS[i], v = segD(x, z, s.ax, s.az, s.bx, s.bz); if (v < d) d = v; } return d; };
  const streamD = (x, z) => { let d = 99; for (const i of th(x, z)) { const s = ST[i], v = segD(x, z, s.ax, s.az, s.bx, s.bz) - s.hw; if (v < d) d = v; } return d; };       // to the stream's WATER edge
  const sdT = (x, z) => sdPoly(town, x, z), sdO = (x, z) => sdPoly(outer, x, z);
  const moatOut = Lo.moat.off + Lo.moat.half + 4.5;
  const treas = fixed.find((f) => f.kind === 'stores' && f.res === 'gold') || fixed.find((f) => f.kind === 'stores') || { x: keep.x, z: keep.z, r: 15 };
  const vaults = fixed.filter((f) => f.kind === 'vault');
  const circles = [...fixed.map((f) => ({ x: f.x, z: f.z, r: f.r, gap: 3 })), { x: M.x, z: M.z, r: M.r, gap: 2 }];
  const gates = Lo.gates;
  const quarterOf = (x, z) => Math.floor((((Math.atan2(z - C.z, x - C.x) / DEG) % 360) + 360) % 360 / (360 / QUARTERS));
  const dir = (x, z) => { const l = hyp(x - C.x, z - C.z) || 1; return [(x - C.x) / l, (z - C.z) / l]; };
  // the town gate nearest to a point (the citadel gate, the last one, is not a town gate)
  const gateNear = (x, z) => { let b = null, bd = 1e9; for (let i = 0; i < Math.max(1, gates.length - 1); i++) { const g = gates[i], d = hyp(g.x - x, g.z - z); if (d < bd) { bd = d; b = g; } } return b; };
  // yard poses (built on first use): a 5 m grid over the town, the door turned to the nearest street. P / C buildings use them only when no frontage pose works; homes fill the back yards with them
  let yardMemo = null;
  const yardPoses = () => {
    if (yardMemo) return yardMemo; yardMemo = [];
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of town) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    for (let gx = Math.ceil(x0 / 5) * 5; gx <= x1; gx += 5) for (let gz = Math.ceil(z0 / 5) * 5; gz <= z1; gz += 5) {
      if (sdT(gx, gz) > -(WALL_M + 5) || sdO(gx, gz) < moatOut + 3 || riverD(gx, gz) < 8) continue;
      let bad = false; for (const c of circles) if (hyp(gx - c.x, gz - c.z) < c.r + c.gap + 3) { bad = true; break; } if (bad) continue;
      let bd = 1e9, bx = 0, bz = 0;
      for (const sg of SS) { const dx = sg.bx - sg.ax, dz = sg.bz - sg.az, l2 = dx * dx + dz * dz || 1; let t = ((gx - sg.ax) * dx + (gz - sg.az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = sg.ax + dx * t, qz = sg.az + dz * t, dd = hyp(gx - qx, gz - qz) - sg.hw; if (dd < bd) { bd = dd; bx = qx; bz = qz; } }
      if (bd > 34 || bd < 4) continue;
      yardMemo.push({ x: gx, z: gz, ry: Math.atan2(bx - gx, bz - gz), coarse: (gx / 5 + gz / 5) % 2 === 0 });
    }
    return yardMemo;
  };
  // frontage anchors: every ~2.4 m along every street, both sides
  const anchors = [];
  for (const st of Lo.streets) {
    const P = st.pts;
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i], [bx, bz] = P[i + 1], len = hyp(bx - ax, bz - az); if (len < 1e-6) continue;
      const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux;
      for (let s = 0; s < len; s += 2.4) { const x = ax + ux * s, z = az + uz * s, rd = riverD(x, z); for (const side of [-1, 1]) anchors.push({ x, z, ux, uz, nx, nz, side, hw: st.w / 2, st: st.name, rd }); }
    }
  }
  return { Lo, town, outer, M, keep, fixed, sites, half, C, streetD, riverD, streamD, hasStreams: ST.length > 0, sdT, sdO, moatOut, treas, vaults, circles, gates, quarterOf, dir, gateNear, anchors, yardPoses, poseCache: new Map() };
}

// ------------------------------------------------------------------------------------------------------------------ perimeter samples of a footprint (scratch buffers, no allocation)
const SX = new Float64Array(160), SZ = new Float64Array(160);
function samples(x, z, ry, w, d) {
  const c = Math.cos(ry), s = Math.sin(ry), hw = w / 2, hd = d / 2, nx = Math.max(1, Math.ceil(w / 3.2)), nz = Math.max(1, Math.ceil(d / 3.2));
  let n = 0; SX[0] = x; SZ[0] = z; n = 1;
  for (let i = 0; i <= nx; i++) { const lx = -hw + w * i / nx; SX[n] = x + lx * c - hd * s; SZ[n] = z - lx * s - hd * c; n++; SX[n] = x + lx * c + hd * s; SZ[n] = z - lx * s + hd * c; n++; }
  for (let j = 1; j < nz; j++) { const lz = -hd + d * j / nz; SX[n] = x - hw * c + lz * s; SZ[n] = z + hw * s + lz * c; n++; SX[n] = x + hw * c + lz * s; SZ[n] = z - hw * s + lz * c; n++; }
  return n;
}

// ------------------------------------------------------------------------------------------------------------------ the planner
function* plan(ctx) {
  const now = () => (typeof performance !== 'undefined' ? performance.now() : 0), T0 = now(), lap = {};
  const r = rng(SEED), warn = [], placed = [], hash = new Map();
  const { M, keep, C, streetD, riverD, sdT, sdO, half } = ctx;
  const cellK = (x, z) => Math.floor(x / 32) * 8192 + Math.floor(z / 32);

  // --- validity of a pose ---------------------------------------------------------------------------------------
  function staticOK(x, z, ry, w, d, rc = 8) {
    const st = sdT(x, z); if (st > -WALL_M) { WHY = 'wall0'; return false; }
    const hd = hyp(w, d) / 2;
    for (const g of ctx.gates) if (hyp(x - g.x, z - g.z) < GATE_R + hd) { WHY = 'gate'; return false; }
    for (const c of ctx.circles) if (rectCircleGap(x, z, ry, w, d, c.x, c.z, c.r) < c.gap) { WHY = 'fixed'; return false; }
    // the centre's distances bound every point of the footprint (1-Lipschitz): the per-sample checks only run when the footprint can be near the thing
    const sc = streetD(x, z); if (sc < 0) { WHY = 'street'; return false; }
    const rv = riverD(x, z); if (rv < rc) { WHY = 'river'; return false; }
    if (ctx.hasStreams) { const sv = ctx.streamD(x, z); if (sv < STREAM_CLEAR) { WHY = 'stream'; return false; } if (sv < STREAM_CLEAR + hd) { const n = samples(x, z, ry, w, d); for (let i = 1; i < n; i++) if (ctx.streamD(SX[i], SZ[i]) < STREAM_CLEAR) { WHY = 'stream'; return false; } } }
    const needS = sc < hd + STREET_CLEAR, needR = rv < rc + hd;
    if (needS || needR) {
      const n = samples(x, z, ry, w, d);
      for (let i = 1; i < n; i++) {
        if (needS && streetD(SX[i], SZ[i]) < STREET_CLEAR) { WHY = 'street'; return false; }
        if (needR && riverD(SX[i], SZ[i]) < rc) { WHY = 'river'; return false; }
      }
    }
    if (st > -(WALL_M + hd) || sdO(x, z) < ctx.moatOut + hd) {                         // near the wall or the moat: test the four corners
      const c = Math.cos(ry), s = Math.sin(ry), hw = w / 2, h2 = d / 2;
      for (let k = 0; k < 4; k++) { const lx = k & 1 ? hw : -hw, lz = k & 2 ? h2 : -h2, px = x + lx * c + lz * s, pz = z - lx * s + lz * c; if (sdT(px, pz) > -WALL_M) { WHY = 'wall'; return false; } if (sdO(px, pz) < ctx.moatOut) { WHY = 'moat'; return false; } }
    }
    return true;
  }
  function dynOK(x, z, ry, w, d, kind, noHomes) {
    const K = KINDS[kind], hd = hyp(w, d) / 2, cx = Math.floor(x / 32), cz = Math.floor(z / 32); let Cc = null;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const a = hash.get((cx + i) * 8192 + cz + j); if (!a) continue;
      for (let q = 0; q < a.length; q++) { const p = a[q]; if (hyp(p.x - x, p.z - z) < p.hd + hd + GAP) { if (!Cc) Cc = corners(x, z, ry, w + GAP, d + GAP); if (satOverlap(p.C, Cc)) { WHY = 'ov:' + p.kind; return false; } } }
    }
    if (K.spread) for (const p of placed) if (p.kind === kind && hyp(p.x - x, p.z - z) < K.spread) { WHY = 'spread'; return false; }
    if (noHomes && K.role === 'H') for (const p of placed) if (p.kind === 'refinery' && hyp(p.x - x, p.z - z) < 44) { WHY = 'refzone'; return false; }
    return true;
  }
  function add(kind, x, z, ry, w, d, extra = {}) {
    const rec = { kind, x, z, ry, w, d, hd: hyp(w, d) / 2, C: corners(x, z, ry, w + GAP, d + GAP), ...extra };
    placed.push(rec); const k = cellK(x, z); let a = hash.get(k); if (!a) { a = []; hash.set(k, a); } a.push(rec); return rec;
  }
  // door toward the street: pose at an anchor for a footprint
  const poseAt = (a, w, d, off = 0) => ({ x: a.x + a.ux * (off + w / 2) + a.nx * a.side * (a.hw + SETBACK + d / 2), z: a.z + a.uz * (off + w / 2) + a.nz * a.side * (a.hw + SETBACK + d / 2), ry: Math.atan2(-a.nx * a.side, -a.nz * a.side) });
  function poses(kind, yardSet) {
    const key = kind + (yardSet ? ':y' : ''); if (ctx.poseCache.has(key)) return ctx.poseCache.get(key);
    const K = KINDS[kind], X = [], Z = [], RY = [], push = (x, z, ry) => { X.push(x); Z.push(z); RY.push(ry); };
    if (yardSet) { for (const y of ctx.yardPoses()) if (y.coarse || K.d >= 20) push(y.x, y.z, y.ry); }      // (p41: the long lots - tavern, town hall, chapel - try every yard pose, they are the scarcest)
    else {
      const big = K.w >= 9 && K.d < 20;                                         // wide buildings: one pose every 7.2 m is plenty (p41: not the long civic lots, they need every pose)
      const bank = kind === 'smokehouse' || kind === 'mill';
      ctx.anchors.forEach((a, i) => { if ((!big || (i >> 1) % 3 === 0) && (!bank || a.rd < 34)) { const q = poseAt(a, K.w, K.d); push(q.x, q.z, q.ry); } });
      if (kind === 'smokehouse' || kind === 'mill') {         // river-bank poses: front toward the water, the back to the land
        const P = ctx.Lo.river.pts;
        for (let i = 0; i < P.length - 1; i++) {
          const [ax, az] = P[i], [bx, bz] = P[i + 1], len = hyp(bx - ax, bz - az); if (len < 1e-6) continue;
          const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux;
          for (let s = 0; s < len; s += 4) for (const side of [-1, 1]) for (const ex of [0.2, 1.0]) { const off = (K.rc || 8) + K.d / 2 + ex; push(ax + ux * s + nx * side * off, az + uz * s + nz * side * off, Math.atan2(-nx * side, -nz * side)); }
        }
      }
    }
    const out = { n: X.length, x: Float64Array.from(X), z: Float64Array.from(Z), ry: Float64Array.from(RY) };
    ctx.poseCache.set(key, out); return out;
  }
  const idxSort = (sc) => { const idx = []; for (let i = 0; i < sc.length; i++) if (sc[i] > -1e8) idx.push(i); return idx.sort((a, b) => sc[b] - sc[a]); };

  // --- generic "best pose" search -------------------------------------------------------------------------------
  // hard(x,z) -> bool (cheap, centre only), score(x,z) -> number (higher is better).  Returns the record or null.
  function placeBest(kind, hard, score, extra = {}) {
    const K = KINDS[kind], canYard = K.role !== 'H' && kind !== 'well';
    for (const yardSet of canYard ? [false, true] : [false]) {
      const P = poses(kind, yardSet), sc = new Float64Array(P.n);
      for (let i = 0; i < P.n; i++) sc[i] = hard(P.x[i], P.z[i]) ? score(P.x[i], P.z[i]) + r() * 0.02 : -1e9;
      for (const i of idxSort(sc)) {
        const a = dynOK(P.x[i], P.z[i], P.ry[i], K.w, K.d, kind, false), b = a && staticOK(P.x[i], P.z[i], P.ry[i], K.w, K.d, K.rc || 8);
        if (b) return add(kind, P.x[i], P.z[i], P.ry[i], K.w, K.d, extra);
      }
    }
    return null;
  }
  const dM = (x, z) => hyp(x - M.x, z - M.z) - M.r;                    // to the market square's edge
  const dKeep = (x, z) => hyp(x - keep.x, z - keep.z);
  const wat = (x, z) => riverD(x, z) - half;                             // to the water's edge
  const nearest = (kinds, x, z) => { let d = 1e9; for (const p of placed) if (kinds.includes(p.kind)) d = Math.min(d, hyp(p.x - x, p.z - z)); return d; };
  const sitesOf = (k) => ctx.sites.filter((s) => s.kind === k).sort((a, b) => (a.id < b.id ? -1 : 1));
  // "the side of town facing a supply site" (+ near the gate its road enters by)
  const facing = (site) => { if (!site) return () => 0; const [dx, dz] = ctx.dir(site.x, site.z), g = ctx.gateNear(site.x, site.z); return (x, z) => { const [ux, uz] = ctx.dir(x, z); return ux * dx + uz * dz + (g ? 0.5 * (1 - Math.min(1, hyp(x - g.x, z - g.z) / 240)) : 0); }; };
  const depth = (x, z) => -sdT(x, z);
  const job = (kind, i, f) => { const t = now(), rec = f(i); lap['j_' + kind] = (lap['j_' + kind] || 0) + now() - t; if (!rec) warn.push(`no place for ${kind} #${i}`); return rec; };

  // ---------------------------------------------------------------- 0. the treasury side first (the room next to the treasury is scarce): mint, jeweler
  { const T = ctx.treas;
    for (let i = 0; i < KINDS.mint.n30; i++) yield job('mint', i, () => placeBest('mint', (x, z) => hyp(x - T.x, z - T.z) <= 58, (x, z) => -hyp(x - T.x, z - T.z) / 20));
    const V = ctx.vaults.length ? ctx.vaults : [T];
    for (let i = 0; i < KINDS.jeweler.n30; i++) yield job('jeweler', i, () => placeBest('jeweler', () => true, (x, z) => -Math.min(...V.map((v) => hyp(x - v.x, z - v.z))) / 25 - dKeep(x, z) / 200)); }
  // ---------------------------------------------------------------- 1. fire first: the refinery (homes will keep away from it)
  for (let i = 0; i < KINDS.refinery.n30; i++) yield job('refinery', i, () => {
    const F = facing(sitesOf('oil')[0]);
    return placeBest('refinery', () => true, (x, z) => 2.2 * F(x, z) - 0.09 * Math.max(0, depth(x, z) - 14) + 0.012 * Math.min(60, dM(x, z)) - 0.6 * (hyp(x - keep.x, z - keep.z) < 90 ? 1 : 0));
  });
  // ---------------------------------------------------------------- 1b. civic (p41: the big real footprints go first, the rest fits round them): townhall + taverns on the market rim, chapels in the quiet
  for (let i = 0; i < KINDS.chapel.n30; i++) yield job('chapel', i, () => placeBest('chapel', () => true, (x, z) => -Math.abs(dM(x, z) - 55) / 40 + 0.8 * Math.min(45, nearest(['sawmill', 'masonry', 'smelter', 'refinery', 'smokehouse', 'butcher'], x, z)) / 45));
  for (let i = 0; i < KINDS.townhall.n30; i++) yield job('townhall', i, () => placeBest('townhall', () => true, (x, z) => -dM(x, z) / 14));
  for (let i = 0; i < KINDS.tavern.n30; i++) yield job('tavern', i, () => placeBest('tavern', () => true, (x, z) => -dM(x, z) / 14 - 0.5 * (i > 0 ? 0 : 0)));
  // ---------------------------------------------------------------- 2. water and market: smokehouse (bank), mill (bank, near the market), bakery, butcher
  for (let i = 0; i < KINDS.smokehouse.n30; i++) yield job('smokehouse', i, () => placeBest('smokehouse', (x, z) => wat(x, z) <= 9.3, (x, z) => -dM(x, z) / 90 - Math.abs(wat(x, z) - 4) / 8));
  for (let i = 0; i < KINDS.mill.n30; i++) yield job('mill', i, () => placeBest('mill', () => true, (x, z) => -Math.min(wat(x, z), 30) / 10 - dM(x, z) / 70));
  { const Ls = sitesOf('livestock')[0] || sitesOf('slaughter')[0] || { x: C.x, z: C.z }, Gl = ctx.gateNear(Ls.x, Ls.z);
    const [gx, gz] = Gl ? [Gl.x - M.x, Gl.z - M.z] : [1, 0], gl = hyp(gx, gz) || 1, tx = M.x + gx / gl * (M.r + 22), tz = M.z + gz / gl * (M.r + 22);
    for (let i = 0; i < KINDS.butcher.n30; i++) yield job('butcher', i, () => placeBest('butcher', (x, z) => dM(x, z) <= 38, (x, z) => -hyp(x - tx, z - tz) / 30)); }
  for (let i = 0; i < KINDS.bakery.n30; i++) yield job('bakery', i, () => placeBest('bakery', (x, z) => dM(x, z) <= 28 || nearest(['mill'], x, z) <= 28, (x, z) => -Math.min(nearest(['mill'], x, z), dM(x, z) + 6) / 12));
  // ---------------------------------------------------------------- 4. industry on the side of the town that faces its supply
  for (const [kind, supply] of [['smelter', 'iron'], ['sawmill', 'lumber'], ['masonry', 'quarry']]) {
    const S = sitesOf(supply);
    for (let i = 0; i < KINDS[kind].n30; i++) yield job(kind, i, () => { const F = facing(S[i % Math.max(1, S.length)]); return placeBest(kind, () => true, (x, z) => 2 * F(x, z) - 0.02 * Math.max(0, depth(x, z) - 40) - (hyp(x - keep.x, z - keep.z) < 95 ? 1 : 0)); });
  }
  // ---------------------------------------------------------------- 6. wells: one per quarter, nearest the middle of the quarter
  { const R = Math.max(40, ctx.town.reduce((a, p) => a + hyp(p[0] - C.x, p[1] - C.z), 0) / ctx.town.length - 55), qs = [];
    const ma = ((Math.atan2(M.z - C.z, M.x - C.x) / DEG % 360) + 360) % 360;
    for (let q = 0; q < QUARTERS; q++) { const a = (q + 0.5) * (360 / QUARTERS); let dd = Math.abs(a - ma); dd = Math.min(dd, 360 - dd); qs.push({ q, a, dd }); }
    qs.sort((a, b) => a.dd - b.dd);
    for (let i = 0; i < Math.min(KINDS.well.n30, QUARTERS); i++) { const Q = qs[i], tx = C.x + Math.cos(Q.a * DEG) * R, tz = C.z + Math.sin(Q.a * DEG) * R;
      yield job('well', i, () => placeBest('well', (x, z) => ctx.quarterOf(x, z) === Q.q, (x, z) => -hyp(x - tx, z - tz))); } }

  lap.jobs = now() - T0;
  // ---------------------------------------------------------------- 7. homes: street lots in stages, each family takes the lots nearest its focus first, and only within its reach (so the rest stays for the others)
  const strips = [];
  for (const st of ctx.Lo.streets) for (let i = 0; i < st.pts.length - 1; i++) for (const side of [-1, 1]) strips.push({ st, i, side });
  // all free lots of one family on every street side where key(x, z) <= kMax: the frontage first, then up to two rows behind it (courtyard houses, as the old town had)
  function lotsFor(fam, key, kMax) {
    const K = KINDS[fam], lots = [];
    for (const { st, i, side } of strips) {
      const [ax, az] = st.pts[i], [bx, bz] = st.pts[i + 1], len = hyp(bx - ax, bz - az); if (len < 6) continue;
      const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux; let s = 1.5 + r() * 2;
      while (s < len - 2) {
        const w = K.w * (1 + r() * 0.2), d = K.d * (1 + r() * 0.2), set = st.w / 2 + SETBACK + r() * 0.7;     // (p41: a lot is never smaller than the real model footprint)
        const x = ax + ux * (s + w / 2) + nx * side * (set + d / 2), z = az + uz * (s + w / 2) + nz * side * (set + d / 2), ry = Math.atan2(-nx * side, -nz * side);
        const k0 = key(x, z);
        if (k0 > kMax) { s += 3; continue; }
        const ok1 = dynOK(x, z, ry, w, d, fam, true), ok2 = ok1 && staticOK(x, z, ry, w, d);
        if (ok2) {
          lots.push({ x, z, ry, w, d, k: k0 });
          let off = d / 2 + GAP + 0.5;
          for (let row = 1; row <= 2; row++) {
            const d2 = K.d * (1 + r() * 0.2), bx2 = x + nx * side * (off + d2 / 2), bz2 = z + nz * side * (off + d2 / 2), k2 = key(bx2, bz2);
            const okb = k2 <= kMax && dynOK(bx2, bz2, ry, w, d2, fam, true) && staticOK(bx2, bz2, ry, w, d2);
            if (!okb) break;
            lots.push({ x: bx2, z: bz2, ry, w, d: d2, k: k2 + row * 1000 }); off += d2 + GAP + 0.5;
          }
          s += w + 0.4 + r() * 1.2;
        } else s += WHY === 'street' || WHY.startsWith('ov:') ? 2 : 3.2;
      }
    }
    return lots;
  }
  const workshops = ['sawmill', 'masonry', 'smelter', 'mint', 'mill', 'bakery', 'butcher', 'smokehouse', 'jeweler'];
  // stage = { family, total count wanted after the stage, focus key (smaller = nearer the focus = first), reach (max key) }   (ph)
  const STAGES = [
    { fam: 'noble',     n: KINDS.noble.n30,    key: dKeep,                              max: 135 },     // nearest the keep
    { fam: 'merchant',  n: KINDS.merchant.n30, key: dM,                                 max: 130 },     // round the market (the square's own rim is full of taverns, bakeries ... so the merchants take the next streets out)
    { fam: 'cottage',   n: 40,                 key: (x, z) => depth(x, z),              max: 40 },      // the outer lanes (between the town wall and the first ring street) first
    { fam: 'craftsman', n: KINDS.craftsman.n30, key: (x, z) => nearest(workshops, x, z), max: 80 },     // beside the workshops
    { fam: 'cottage',   n: KINDS.cottage.n30,  key: (x, z) => depth(x, z),              max: 1e9 },     // then wherever room is left, outer first
  ];
  const have = {};
  for (const S of STAGES) {
    const fam = S.fam; let n = have[fam] || 0;
    const lots = lotsFor(fam, S.key, S.max); lots.sort((a, b) => a.k - b.k);
    for (const l of lots) { if (n >= S.n) break; if (dynOK(l.x, l.z, l.ry, l.w, l.d, fam, true)) { add(fam, l.x, l.z, l.ry, l.w, l.d); n++; } }
    if (n < S.n) {                                    // still room wanted: back-yard houses on the 5 m grid, door to the nearest street
      const ys = []; for (const y of ctx.yardPoses()) { const k = S.key(y.x, y.z); if (k <= S.max) ys.push({ y, k }); } ys.sort((a, b) => a.k - b.k);
      for (const { y } of ys) {
        if (n >= S.n) break;
        const w = KINDS[fam].w * (1 + r() * 0.2), d = KINDS[fam].d * (1 + r() * 0.2);
        if (dynOK(y.x, y.z, y.ry, w, d, fam, true) && staticOK(y.x, y.z, y.ry, w, d)) { add(fam, y.x, y.z, y.ry, w, d, { yardLot: true }); n++; }
      }
    }
    have[fam] = n;
    if (n < S.n) warn.push(`only ${n}/${S.n} ${fam} (the layout has no more room)`);
    yield;
  }

  lap.homes = now() - T0 - lap.jobs;
  // ---------------------------------------------------------------- records
  const out = [];
  const grow = { noble: (p) => dKeep(p.x, p.z), merchant: (p) => dM(p.x, p.z), craftsman: (p) => dM(p.x, p.z), cottage: (p) => dM(p.x, p.z) };
  for (const kind of KIND_ORDER) {
    if (kind === 'market' || kind === 'stores') continue;
    const list = placed.filter((p) => p.kind === kind);
    if (grow[kind]) list.sort((a, b) => grow[kind](a) - grow[kind](b));
    list.forEach((p, i) => out.push({ id: `${kind}_${String(i).padStart(2, '0')}`, kind, role: KINDS[kind].role, fa: KINDS[kind].fa, x: +p.x.toFixed(2), z: +p.z.toFixed(2), ry: +p.ry.toFixed(4), w: +p.w.toFixed(2), d: +p.d.toFixed(2), r: +p.hd.toFixed(2), inside: true, unlockLv: unlockOf(kind, i, list.length), quarter: ctx.quarterOf(p.x, p.z) }));
  }
  out.push({ id: 'market_00', kind: 'market', role: 'C', fa: KINDS.market.fa, x: M.x, z: M.z, ry: M.ry || 0, w: M.w || M.r * 2, d: M.d || M.r * 2, r: M.r, inside: true, existing: true, unlockLv: KINDS.market.unlock, quarter: ctx.quarterOf(M.x, M.z) });
  ctx.fixed.filter((f) => f.kind === 'stores').forEach((f, i) => out.push({ id: 'stores_' + (f.res || String(i).padStart(2, '0')), kind: 'stores', role: 'T', fa: KINDS.stores.fa, res: f.res, x: f.x, z: f.z, ry: f.ry || 0, w: f.r * 2, d: f.r * 2, r: f.r, inside: true, existing: true, unlockLv: unlockOf('stores', i, 6), quarter: ctx.quarterOf(f.x, f.z) }));
  const ord = (k) => KIND_ORDER.indexOf(k);
  out.sort((a, b) => ord(a.kind) - ord(b.kind) || (a.id < b.id ? -1 : 1));
  return { list: out, warnings: warn, lap };
}

// ------------------------------------------------------------------------------------------------------------------ public API
const finish = (layout, res, t0, tCtx) => {
  const counts = {}; for (const p of res.list) counts[p.kind] = (counts[p.kind] || 0) + 1;
  const hit = { list: res.list, meta: { warnings: res.warnings, lap: { ...res.lap, ctx: tCtx - t0 }, counts, ms: typeof performance !== 'undefined' ? +(performance.now() - t0).toFixed(1) : 0, quarters: QUARTERS } };
  CACHE.set(layout, hit); return hit;
};
const clock = () => (typeof performance !== 'undefined' ? performance.now() : 0);
// the whole level-30 plan in one go (a few tens of ms warm; ~130 ms the very first time, while the JIT is cold)
export function planTownFull(layout) {
  const hit = CACHE.get(layout); if (hit) return hit;
  const t0 = clock(), ctx = makeCtx(layout), tCtx = clock(), g = plan(ctx); let r;
  do { r = g.next(); } while (!r.done);
  return finish(layout, r.value, t0, tCtx);
}
// the same plan in slices (one building / one house family per step, every step a few ms): call step() once per frame (or idle callback) until it returns true, then result()
export function planTownSteps(layout) {
  const cached = CACHE.get(layout); if (cached) return { step: () => true, result: () => cached, done: true };
  const t0 = clock(), ctx = makeCtx(layout), tCtx = clock(), g = plan(ctx); let out = null;
  const o = { done: false, step() { if (out) return true; const r = g.next(); if (r.done) { out = finish(layout, r.value, t0, tCtx); o.done = true; return true; } return false; }, result: () => out };
  return o;
}
export function planTown(layout, castleLevel = LEVEL_CAP) {
  const full = planTownFull(layout), lv = Math.max(1, Math.min(LEVEL_CAP, Math.round(castleLevel))), seen = {};
  const out = full.list.filter((p) => { const i = (seen[p.kind] = (seen[p.kind] || 0) + 1) - 1; return i < countAt(p.kind, lv, full.meta.counts[p.kind]); });
  out.meta = full.meta; return out;
}
