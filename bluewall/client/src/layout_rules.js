// layout_rules.js — TR2-S5: WHERE a movable thing may stand.  ONE pure function (checkPose) used by the editor, the tests and — as a table of rules + test vectors — by the server (docs/layout_api.md).
// No THREE, no DOM.  Everything geometric comes in through one plain object G (geomFromGame() builds it from the game; geomFromJson() reads the same numbers from docs/tr2_s5_geom.json on the server side).
//
//   RULES (each has a code; checkPose returns { ok, why: [codes] }):
//     WALL    every corner + the centre of the footprint is >= 6.5 m inside the town wall                          (b1_townplan.js WALL_M: the planner's own rule)
//     MOAT    every corner is >= moat.off + moat.half + 4.5 m outside the Blue Wall polygon (the citadel's moat)      (planner: moatOut)
//     GATE    the centre is >= 14 m + the footprint's half-diagonal from every gate                                    (planner: GATE_R)
//     MARKET  the footprint is >= 2 m from the market square's circle                                                  (planner: circles gap 2)
//     VAULT   the footprint is >= 3 m from every gem vault's circle (r = 9.5 m: the vaults stay where they are)        (planner: circles gap 3)
//     STREET  the centre and every perimeter sample are >= 0.9 m from every street edge                                (planner: STREET_CLEAR)
//     RIVER   the centre and every perimeter sample are >= rc (8 m; 7.4 mill / smokehouse; 10 storehouse) from the river's centre line
//     WATER   (smokehouse only) the centre is <= river.half + 10 m from the river's centre line: it works on the water  (planner AFFINITY.smokehouse, HARD)
//     STREAM  the centre and every perimeter sample are >= 3 m from the mountain streams' water edge                    (planner: STREAM_CLEAR)
//     DRY     every sample stands on ground >= 0.1 m above the water line
//     SLOPE   the footprint's samples differ by <= 1.0 m in height (the town is flat: the biggest plan lot spreads 0.49 m)
//     OVERLAP no overlap (0.8 m clear) with another movable thing, the market square (circle) or a vault (circle).  GEN (client only, only while the Tripo town is not loaded): no thing may overlap a generic fill house
//   The footprint of a thing is a rectangle { w, d, ox, oz } in its own frame (x right, z = the door side): its centre is the record's x, z moved by (ox, oz) turned by ry.  World = (x + lx*cos + lz*sin, z - lx*sin + lz*cos).
import * as LS from './layout_store.js';

export const R = { WALL_M: 6.5, GATE_R: 14, STREET_CLEAR: 0.9, STREAM_CLEAR: 3, GAP: 0.8, MOAT_PAD: 4.5, RC: 8, MARKET_GAP: 2, VAULT_GAP: 3, MIN_H: 0.1, MAX_SPREAD: 1.0, WATER_NEAR: 10, GEN_PAD: 1.2 };
export const SNAP = 1, ROT_STEP = Math.PI / 12;                      // the editor snaps x, z to 1 m and the turn to 15 degrees
const hyp = Math.hypot;
// a storehouse yard (ST1): the 16 x 16 m square the planner calls a yard (storeyards.js YARD: the hall, its steps, the heap and the lamps in front of the door, door = local +z).  Its ground rules are the ones the planner
// kept for the yards (storeyards.js fitsYard): 2.5 m of moat pad, 1 m to a street's edge, 6 m to the river's centre line.  The six storehouses can be moved; the three gem vaults and the crystal stay where they are.
export const STORE_FP = { w: 16, d: 16, ox: 0, oz: 0, rc: 6, streetClear: 1.0, moatPad: 2.5 };
// a gem vault is a circle for the rules (the yard's built part: hall, basin, banners stay inside 9.5 m of its centre; the planner reserves 13 m around it, the rules only need the built part)
export const VAULT_R = 9.5;

export const corners = (cx, cz, ry, w, d) => { const c = Math.cos(ry), s = Math.sin(ry); return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => [cx + lx * c + lz * s, cz - lx * s + lz * c]); };
export const centreOf = (x, z, ry, fp) => { const c = Math.cos(ry), s = Math.sin(ry), ox = fp.ox || 0, oz = fp.oz || 0; return [x + ox * c + oz * s, z - ox * s + oz * c]; };
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
const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1; let t = ((px - ax) * dx + (pz - az) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t; return hyp(px - ax - dx * t, pz - az - dz * t); };
const polyD = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const v = segD(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]); if (v < d) d = v; } return d; };
function sdPoly(poly, x, z) {
  let d = 1e9, c = false; const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c;
    const v = segD(x, z, xj, zj, xi, zi); if (v < d) d = v;
  }
  return c ? -d : d;
}
// A spatial index over the polylines (streets, river, mountain streams): a distance query only looks at the segments near the point (the same numbers as looking at all of them, ~15x faster).  near(fam, x, z, T)
// = the smallest (distance to the polyline - its half width) IF that is < T, else Infinity — exactly what the rules compare against.  G._noIx = true uses the plain loops (the test checks both agree).
const CELL = 16, IX = new WeakMap();
function ixBuild(G) {
  const fam = { street: [], river: [], stream: [] };
  const add = (f, pts, h) => { for (let i = 0; i < pts.length - 1; i++) fam[f].push({ ax: pts[i][0], az: pts[i][1], bx: pts[i + 1][0], bz: pts[i + 1][1], h }); };
  for (const s of G.streets) add('street', s.pts, s.w / 2); add('river', G.river.pts, 0); for (const s of G.streams) add('stream', s.pts, s.half);
  const out = {}; for (const f of Object.keys(fam)) {
    const cells = new Map(), hmax = fam[f].reduce((m, q) => Math.max(m, q.h), 0);
    for (const q of fam[f]) { const x0 = Math.floor(Math.min(q.ax, q.bx) / CELL), x1 = Math.floor(Math.max(q.ax, q.bx) / CELL), z0 = Math.floor(Math.min(q.az, q.bz) / CELL), z1 = Math.floor(Math.max(q.az, q.bz) / CELL); for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const k = i + ',' + j; let l = cells.get(k); if (!l) cells.set(k, l = []); l.push(q); } }
    out[f] = { cells, hmax };
  }
  return out;
}
function near(G, f, x, z, T) {
  if (G._noIx) { let d = 1e9; const src = f === 'street' ? G.streets : f === 'stream' ? G.streams : [{ pts: G.river.pts, w: 0, half: 0 }]; for (const s of src) { const v = polyD(s.pts, x, z) - (f === 'street' ? s.w / 2 : f === 'stream' ? s.half : 0); if (v < d) d = v; } return d < T ? d : Infinity; }
  let ix = IX.get(G.streets); if (!ix) IX.set(G.streets, ix = ixBuild(G));
  const F = ix[f], Rq = T + F.hmax, x0 = Math.floor((x - Rq) / CELL), x1 = Math.floor((x + Rq) / CELL), z0 = Math.floor((z - Rq) / CELL), z1 = Math.floor((z + Rq) / CELL); let d = Infinity;
  for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) { const l = F.cells.get(i + ',' + j); if (!l) continue; for (const q of l) { const v = segD(x, z, q.ax, q.az, q.bx, q.bz) - q.h; if (v < d) d = v; } }
  return d < T ? d : Infinity;
}
// the perimeter samples (every <= 3.2 m) + the four corners + the centre of a footprint rectangle
function samples(cx, cz, ry, w, d) {
  const c = Math.cos(ry), s = Math.sin(ry), hw = w / 2, hd = d / 2, nx = Math.max(1, Math.ceil(w / 3.2)), nz = Math.max(1, Math.ceil(d / 3.2)), out = [[cx, cz]];
  for (let i = 0; i <= nx; i++) { const lx = -hw + w * i / nx; out.push([cx + lx * c - hd * s, cz - lx * s - hd * c], [cx + lx * c + hd * s, cz - lx * s + hd * c]); }
  for (let j = 1; j < nz; j++) { const lz = -hd + d * j / nz; out.push([cx - hw * c + lz * s, cz + hw * s + lz * c], [cx + hw * c + lz * s, cz - hw * s + lz * c]); }
  return out;
}
export function rectCircleGap(cx, cz, ry, w, d, px, pz, pr) {
  const c = Math.cos(ry), s = Math.sin(ry), dx = px - cx, dz = pz - cz, lx = dx * c - dz * s, lz = dx * s + dz * c;
  return hyp(lx - Math.max(-w / 2, Math.min(w / 2, lx)), lz - Math.max(-d / 2, Math.min(d / 2, lz))) - pr;
}

// G = { town, outer, moat:{off,half}, gates:[{x,z}], streets:[{w,pts}], river:{pts,half}, streams:[{pts,half}], market:{x,z,r}, vaults:[{x,z,r}], gens:[{x,z,ry,w,d}], height(x,z) }
// self = { id, kind, fp:{w,d,ox,oz,rc?} }   pose = { x, z, ry }   others = [{ id, x, z, ry, fp }] (the other movable things at their CURRENT places)
// opt.first = true: stop at the first broken rule (the cheap ones are asked first, the ground heights last): for searches (the editor's green dots, the tests).  Without it every broken rule is listed (sorted),
// opt.height = a faster height(x, z) for hover feedback (the commit asks with the exact one).  opt.hTol = slack (m) for DRY / SLOPE (0 in the game; the server's grid ground uses TOL_H = 0.12).
export function checkPose(G, self, pose, others = [], opt = {}) {
  const fp = self.fp, core = fp.core || fp, [cx, cz] = centreOf(pose.x, pose.z, pose.ry, fp), [kx, kz] = centreOf(pose.x, pose.z, pose.ry, core), why = [], first = !!opt.first, add = (c) => { if (!why.includes(c)) why.push(c); };
  const done = () => ({ ok: why.length === 0, why: first ? why : why.sort() }), hd = hyp(fp.w, fp.d) / 2, K = corners(kx, kz, pose.ry, core.w, core.d), rc = fp.rc || (self.kind === 'mill' || self.kind === 'smokehouse' ? 7.4 : R.RC);
  const moatOut = G.moat.off + G.moat.half + (fp.moatPad != null ? fp.moatPad : R.MOAT_PAD), sClear = fp.streetClear != null ? fp.streetClear : R.STREET_CLEAR, height = opt.height || G.height;
  for (const [x, z] of [[kx, kz], ...K]) { if (sdPoly(G.town, x, z) > -R.WALL_M) add('WALL'); if (sdPoly(G.outer, x, z) < moatOut) add('MOAT'); }
  if (first && why.length) return done();
  for (const g of G.gates) if (hyp(cx - g.x, cz - g.z) < R.GATE_R + hd) add('GATE');
  if (G.market && rectCircleGap(cx, cz, pose.ry, fp.w, fp.d, G.market.x, G.market.z, G.market.r) < R.MARKET_GAP) add('MARKET');
  for (const v of G.vaults || []) if (rectCircleGap(cx, cz, pose.ry, fp.w, fp.d, v.x, v.z, v.r) < R.VAULT_GAP) add('VAULT');
  if (first && why.length) return done();
  const me = corners(cx, cz, pose.ry, fp.w + R.GAP, fp.d + R.GAP);
  for (const o of others) {
    if (o.id === self.id) continue;
    const [ox, oz] = centreOf(o.x, o.z, o.ry, o.fp); if (hyp(ox - cx, oz - cz) > hd + hyp(o.fp.w, o.fp.d) / 2 + 3) continue;
    if (satOverlap(me, corners(ox, oz, o.ry, o.fp.w + R.GAP, o.fp.d + R.GAP))) { add('OVERLAP'); break; }
  }
  // the generic fill houses are scenery (town.js: they fill what the plan leaves free, and their number depends on the quality level): a PLANNED lot that is moved onto one simply takes its place (the house is
  // not drawn any more: town_build.js, genYield) — so for homes / civic / production lots AND storehouses (town_build.js clears the houses under a moved store the same way) they are no rule (and the server does not know them).
  // When the Tripo houses are not loaded (G.genYield false) the generic houses are baked into the static batch and cannot yield: then no thing may overlap one (GEN, client-only).
  if (!G.genYield && !why.includes('OVERLAP')) for (const g of G.gens || []) {
    if (hyp(g.x - cx, g.z - cz) > hd + hyp(g.w, g.d) / 2 + 3) continue;
    if (satOverlap(me, corners(g.x, g.z, g.ry, g.w + R.GEN_PAD, g.d + R.GEN_PAD))) { add('GEN'); break; }
  }
  if (first && why.length) return done();
  const S = samples(kx, kz, pose.ry, core.w, core.d);
  for (const [x, z] of S) {
    if (near(G, 'street', x, z, sClear) < sClear) add('STREET');
    if (near(G, 'river', x, z, rc) < rc) add('RIVER');
    if (G.streams.length && near(G, 'stream', x, z, R.STREAM_CLEAR) < R.STREAM_CLEAR) add('STREAM');
    if (first && why.length) return done();
  }
  if (self.kind === 'smokehouse' && !(near(G, 'river', kx, kz, G.river.half + R.WATER_NEAR + 1e-9) <= G.river.half + R.WATER_NEAR)) add('WATER');
  if (first && why.length) return done();
  // the ground: the 4 corners, the 4 edge middles and the centre of the footprint (9 heights)
  let hmin = 1e9, hmax = -1e9; for (let i = 0; i < 4; i++) for (const [x, z] of [K[i], [(K[i][0] + K[(i + 1) & 3][0]) / 2, (K[i][1] + K[(i + 1) & 3][1]) / 2]]) { const h = height(x, z); if (h < hmin) hmin = h; if (h > hmax) hmax = h; }
  { const h = height(kx, kz); if (h < hmin) hmin = h; if (h > hmax) hmax = h; }
  const hTol = opt.hTol || 0;                                            // (server: its ground is a 2 m grid, not the exact function: the two height rules get hTol of slack, in the accepting direction)
  if (hmin < R.MIN_H - hTol) add('DRY'); if (hmax - hmin > R.MAX_SPREAD + hTol) add('SLOPE');
  return done();
}

// ---- the game side: the geometry object and the list of movable things --------------------------------------------------------------------------------------------------------------------------------
// (imports are lazy-free: these modules do not import this one)
import * as L from './layout.js';
import { townLayout, townPlan, townPlan0, isMovableLot, planId } from './town_plan.js';
import { planStores, planStoresDefault, storesMovable, STORE_IDS, STORE_FA } from './stores.js';
import { planVaults } from './vault.js';
import { KINDS } from './b1_townplan.js';

let GC = null;
// gens = the generic fill houses of town.js (ctx.town.gen: { x, z, ry, w, d }); pass them in the game, leave [] in node tests that have none
export function geomFromGame(gens = [], genYield = false) {
  const lay = townLayout();
  const G = { town: lay.town, outer: lay.outer, moat: { off: lay.moat.off, half: lay.moat.half }, gates: lay.gates.map((g) => ({ x: g.x, z: g.z })), streets: lay.streets.map((s) => ({ w: s.w, pts: s.pts })),
    river: lay.river, streams: lay.streams.map((s) => ({ pts: s.pts, half: s.half })), market: { x: lay.market.x, z: lay.market.z, r: lay.market.r }, vaults: planVaults().map((v) => ({ id: v.id, x: v.x, z: v.z, r: Math.min(v.r, VAULT_R) })),
    gens: gens.map((g) => ({ x: g.x, z: g.z, ry: g.ry, w: g.w, d: g.d })), genYield: !!genYield, height: L.height };
  return G;
}
export const geomForServer = () => { const G = geomFromGame(); const { height, gens, genYield, ...rest } = G; return { ...rest, R }; };       // the numbers the Python port needs (height: it samples the same L.height table: see docs)

// every movable thing, at its CURRENT place (the player's overrides applied) and its default place
export function records() {
  const out = [], def = new Map(townPlan0().list.map((p) => [p.id, p]));
  for (const p of townPlan().list) {
    if (!isMovableLot(p)) continue; const d = def.get(p.id), K = KINDS[p.kind] || {};
    out.push({ id: p.id, kind: p.kind, role: p.role, fa: p.fa, x: p.x, z: p.z, ry: p.ry, dx: d.x, dz: d.z, dry: d.ry, fp: { w: p.w, d: p.d, ox: 0, oz: 0, rc: K.rc }, moved: !!LS.ovr(p.id) });
  }
  if (!storesMovable()) return out;                                      // (ST1 yards drawn: the six storehouses are movable; the old p38 stores stay where they are)
  const sd = new Map(planStoresDefault().map((s) => [s.id, s]));
  for (const s of planStores()) { const d = sd.get(s.id); out.push({ id: 'store_' + s.id, kind: 'store', role: 'T', fa: STORE_FA[s.id], x: s.x, z: s.z, ry: s.ry, dx: d.x, dz: d.z, dry: d.ry, fp: STORE_FP, moved: !!LS.ovr('store_' + s.id), res: s.id }); }
  return out;
}
export const recordById = (id) => records().find((r) => r.id === id) || null;
export const snapPose = (x, z, ry) => ({ x: Math.round(x / SNAP) * SNAP, z: Math.round(z / SNAP) * SNAP, ry: Math.round(ry / ROT_STEP) * ROT_STEP });
// the one entry point of the editor: may `id` stand at pose?  (G built once per session: geomFromGame(gens))
export function checkMove(G, id, pose, recs = null, opt = {}) {
  const rs = recs || records(), me = rs.find((r) => r.id === id); if (!me) return { ok: false, why: ['UNKNOWN'] };
  return checkPose(G, me, pose, rs, opt);
}
// two things trade places (and turns): each takes the other's x, z, ry.  { ok, why, a: pose of idA after, b: pose of idB after }
export function checkSwap(G, idA, idB, recs = null) {
  const rs = (recs || records()).map((r) => ({ ...r })), a = rs.find((r) => r.id === idA), b = rs.find((r) => r.id === idB);
  if (!a || !b || a === b) return { ok: false, why: ['UNKNOWN'] };
  const pa = { x: a.x, z: a.z, ry: a.ry }, pb = { x: b.x, z: b.z, ry: b.ry };      // (both are stored numbers already: rounded)
  Object.assign(a, pb); Object.assign(b, pa);
  const ca = checkPose(G, a, a, rs), cb = checkPose(G, b, b, rs);
  return { ok: ca.ok && cb.ok, why: [...new Set([...ca.why, ...cb.why])], a: pb, b: pa };
}
// the whole current layout must be valid (the server runs this on load; the client on a loaded record): returns the ids that are not
export function invalidIds(G, recs = null) {
  const rs = recs || records(), bad = []; for (const r of rs) if (r.moved && !checkPose(G, r, r, rs).ok) bad.push(r.id); return bad;
}
export { planId };

// the generic fill houses a moved planned lot covers: [true = still drawn] per gen (town_build.js drops the others).  lots = the plan's lots that the player moved ({ x, z, ry, w, d }).
export function genKeep(gens, lots) {
  if (!lots.length) return gens.map(() => true);
  const rects = lots.map((l) => ({ l, c: corners(l.x, l.z, l.ry, l.w + R.GEN_PAD, l.d + R.GEN_PAD), hd: hyp(l.w, l.d) / 2 }));
  return gens.map((g) => { const hg = hyp(g.w, g.d) / 2, C = corners(g.x, g.z, g.ry, g.w + R.GEN_PAD, g.d + R.GEN_PAD); for (const r of rects) { if (hyp(g.x - r.l.x, g.z - r.l.z) > hg + r.hd + 3) continue; if (satOverlap(r.c, C)) return false; } return true; });
}
