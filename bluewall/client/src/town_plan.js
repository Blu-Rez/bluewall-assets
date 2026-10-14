// town_plan.js — p41: the game-side handle on B1's town plan.  Pure data (no THREE, no DOM): it also runs in node (dev/p41_town_test.sh).
//   startTownPlan()          the sliced planner (planTownSteps): call .step() once per frame until it returns true (the first cold plan is ~130 ms in one go, the longest slice ~30 ms)
//   townPlan()               the whole level-30 plan at once (tests, solids.js: cached, so the game never plans twice)
//   homeLots(level)          the home records that stand at a castle level  { id, kind, x, z, ry, w, d, r, seed, quarter, unlockLv }
//   civicLots(level)         the civic records (market, chapel, townhall, tavern, well) that stand at a castle level  { ..., lv (civic level) }
//   civicBuild(lot)          [{ n, x, z, ry, s }] WORLD pieces of one civic lot (lot x piece, y added by the builder): pieces that would stand on a street are left out
//   townSolids(level)        [[x, z, r]] what nav keeps ground units out of (the standing civic pieces)
//   planLots()               every lot of the level-30 plan as { x, z, ry, w, d } (the old town's generic houses keep clear of them)
//   castleLevel(lv20)        skin.js stores the castle level stretched to 1..20 (levelOf): back to the player's 1..30
// Same layout => same plan => same town (b1_townplan.js is deterministic; seeds are hashes of the record ids).
import { layoutFromGame } from './b1_layout.js';
import { planTownSteps } from './b1_townplan.js';
import { CIVIC_KINDS, civicLevel, civicPieces, civicSolids } from './b3_civic.js';
import { HOME_KINDS } from './b2_homes.js';
import { setTownSiteProvider, WS_KINDS } from './worksites.js';

let LAY = null, RES = null, STEPS = null, STREET = null;
export const resetTownPlan = () => { LAY = null; RES = null; STEPS = null; STREET = null; PROD = null; setTownSiteProvider(prodSites); };
export const townLayout = () => LAY || (LAY = layoutFromGame());
export function startTownPlan() {
  if (RES) return { step: () => true, result: () => RES, get done() { return true; } };
  if (!STEPS) STEPS = planTownSteps(townLayout());
  const st = STEPS;
  return { step() { const d = st.step(); if (d && !RES) RES = st.result(); return d; }, result: () => RES, get done() { return !!RES; } };
}
export function townPlan() { if (!RES) { const st = startTownPlan(); while (!st.step()); } return RES; }

export const castleLevel = (lv20) => { const v = +lv20; if (!(v > 0)) return 30; return Math.max(1, Math.min(30, Math.round(v <= 1 ? v : 1 + (v - 1) * 29 / 19))); };
export const hashId = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

const lvl = (level) => Math.max(1, Math.min(30, Math.round(+level || 30)));
const HOME = new Set(Object.keys(HOME_KINDS));
const rec = (p) => ({ id: p.id, kind: p.kind, fa: p.fa, x: p.x, z: p.z, ry: p.ry, w: p.w, d: p.d, r: p.r, quarter: p.quarter, unlockLv: p.unlockLv, seed: hashId(p.id), existing: !!p.existing });

export function homeLots(level) {
  const lv = lvl(level);
  return townPlan().list.filter((p) => HOME.has(p.kind) && p.unlockLv <= lv).map(rec);
}
// the civic lots at a castle level (civicLevel(kind, castle): 0 = locked => not listed); the market is the plan's `existing` market square
export function civicLots(level) {
  const lv = lvl(level), out = [];
  for (const p of townPlan().list) {
    if (!CIVIC_KINDS[p.kind]) continue;
    const cl = civicLevel(p.kind, lv); if (!cl || p.unlockLv > lv) continue;
    out.push({ ...rec(p), lv: cl });
  }
  return out;
}
// the lots of what the town BUILDS now (homes + civic); the production lots (role P: sawmill, bakery, mint ... — worksite kinds C1-C4, not wired yet) stay free for the generic houses until they are wired
// P1: the production lots (role P) are built now — as worksite sites (prodSites() below: wsbuild draws them, wslife gives them people and carts).  `jeweler` has no model yet: its lot stays free.
export const BUILT_ROLES = new Set(['H', 'C', 'P']);
const NO_MODEL = new Set(['jeweler']);
const isBuilt = (p) => BUILT_ROLES.has(p.role) && !NO_MODEL.has(p.kind);
export const planLots = () => townPlan().list.filter(isBuilt).map((p) => ({ id: p.id, kind: p.kind, x: p.x, z: p.z, ry: p.ry, w: p.w, d: p.d, r: p.r }));

// ---- P1: B1's role-P lots as worksite sites ------------------------------------------------------------------------------------------------------------------------------------------------------
// A site's local frame has its building at the BACK (z < 0) and the yard in front (z > 0); a lot's x, z is the middle of its rectangle.  TOWN_ANCHOR[kind] = the local point of the kit layout that
// goes to the lot's middle (so the main building stands inside the rectangle); the site's origin is moved so.  `clip` = the rectangle (+ M) in the site's local frame: pieces / soup / chimneys
// outside it are not drawn, workers do not stand outside it.  Unlock level = E1's count step for the i-th lot of a kind (docs/economy_table.json `kinds[].count_steps`), else the plan's (ph) level.
const TOWN_ANCHOR = { sawmill: [0, -2], masonry: [0, -3.5], smelter: [0, -4], mint: [0.3, -1.5], refinery: [1.5, -4], mill: [0, -4], millw: [0, -3.2], bakery: [0, -5], butcher: [0, -5.5], smokehouse: [-3, -1.5] };
const E1_STEPS = { sawmill: [4, 18], masonry: [5, 18], smelter: [9, 22], mint: [15, 25], refinery: [18, 27], mill: [4, 16], bakery: [5, 16, 26], butcher: [7, 18], smokehouse: [8, 20] };
const CLIP_M = 0;
const riverD = (lay, x, z) => { let b = null; const P = lay.river.pts; for (let i = 0; i < P.length - 1; i++) { const a = P[i], c = P[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l2)), qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz); if (!b || d < b.d) b = { d, x: qx, z: qz }; } return b; };
let PROD = null;
export function prodSites() {
  if (PROD) return PROD;
  const lay = townLayout(), count = {}, out = [];
  for (const p of townPlan().list) {
    if (p.role !== 'P' || NO_MODEL.has(p.kind) || !WS_KINDS[p.kind]) continue;
    const i = count[p.kind] = (count[p.kind] || 0) + 1, idx = i - 1;
    let variant;
    if (p.kind === 'mill') {          // the lot that faces the river is the WATER mill (the town canal turns the wheel), the other one a wind mill
      const rv = riverD(lay, p.x, p.z), toR = Math.atan2(rv.x - p.x, rv.z - p.z), dr = ((toR - p.ry + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      variant = rv.d - lay.river.half < 12 && Math.abs(dr) < 0.5 ? 'water' : 'wind';
    }
    const [ax, az] = TOWN_ANCHOR[p.kind === 'mill' && variant === 'water' ? 'millw' : p.kind], c = Math.cos(p.ry), s = Math.sin(p.ry);
    const unlock = (E1_STEPS[p.kind] && E1_STEPS[p.kind][idx] != null) ? E1_STEPS[p.kind][idx] : p.unlockLv;
    out.push({
      id: p.id, kind: p.kind, variant, town: true, x: +(p.x - (ax * c + az * s)).toFixed(2), z: +(p.z - (-ax * s + az * c)).toFixed(2), ry: p.ry, r: Math.max(p.w, p.d) / 2, unlock,
      link: [+(p.x + s * (p.d / 2 + 3)).toFixed(2), +(p.z + c * (p.d / 2 + 3)).toFixed(2)], lot: { x: p.x, z: p.z, w: p.w, d: p.d },
      clip: { x0: ax - p.w / 2 - CLIP_M, x1: ax + p.w / 2 + CLIP_M, z0: az - p.d / 2 - CLIP_M, z1: az + p.d / 2 + CLIP_M },
    });
    if (!variant) delete out[out.length - 1].variant;
  }
  return (PROD = out);
}
setTownSiteProvider(prodSites);
export function prodLots(level) { const lv = lvl(level); return prodSites().filter((s) => s.unlock <= lv).map((s) => ({ id: s.id, kind: s.kind, x: s.lot.x, z: s.lot.z, ry: s.ry, w: s.lot.w, d: s.lot.d, r: s.r })); }

// ---- streets: "no civic piece stands on a street" (the old market skipped its stalls on the main street the same way)
function streetSegs() {
  if (STREET) return STREET;
  const S = []; for (const st of townLayout().streets) for (let i = 0; i < st.pts.length - 1; i++) S.push({ ax: st.pts[i][0], az: st.pts[i][1], bx: st.pts[i + 1][0], bz: st.pts[i + 1][1], hw: st.w / 2 });
  return (STREET = S);
}
const streetEdge = (x, z) => { let d = 99; for (const s of streetSegs()) { const dx = s.bx - s.ax, dz = s.bz - s.az, l2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / l2)); const e = Math.hypot(x - s.ax - dx * t, z - s.az - dz * t) - s.hw; if (e < d) d = e; } return d; };
export const toWorld = (lot, p) => { const c = Math.cos(lot.ry), s = Math.sin(lot.ry); return { n: p.n, x: lot.x + p.x * c + p.z * s, z: lot.z - p.x * s + p.z * c, ry: lot.ry + p.ry, s: p.s }; };
const MID = 3.2;                                                          // pieces this close to the lot's middle (a market's well / cross) are the lot's heart: they stay where the plan put the lot
const onStreet = (lot, p, wx, wz, r = 0) => !(Math.hypot(p.x, p.z) < MID) && streetEdge(wx, wz) < Math.max(0.2, r * 0.5);

export function civicBuild(lot) {
  const out = [], R = new Map(); for (const [x, z, r] of civicSolids(lot.kind, lot.lv, lot.seed)) R.set(x + '|' + z, r);       // the standing pieces carry their radius (a stall 3 m wide must not reach into the street)
  for (const p of civicPieces(lot.kind, lot.lv, lot.seed)) { const w = toWorld(lot, p); if (!onStreet(lot, p, w.x, w.z, R.get(p.x + '|' + p.z) || 0)) out.push(w); }
  return out;
}
export function civicLotSolids(lot) {
  const out = [], c = Math.cos(lot.ry), s = Math.sin(lot.ry);
  for (const [lx, lz, r] of civicSolids(lot.kind, lot.lv, lot.seed)) { const wx = lot.x + lx * c + lz * s, wz = lot.z - lx * s + lz * c; if (!onStreet(lot, { x: lx, z: lz }, wx, wz, r)) out.push([+wx.toFixed(2), +wz.toFixed(2), r]); }
  return out;
}
export function townSolids(level = 30) { const out = []; for (const lot of civicLots(level)) for (const q of civicLotSolids(lot)) out.push(q); return out; }

// the destructible battle targets of the plan's lots at a castle level (the same rule the old town used: one 'house' target per ~26 m block, the chapel stands alone as the 'church'):
// [{ ids: [lot ids], t: { type, x, z, w, d, h, rot, n, share } }]  — town_build.js registers them with ctx.tgt before initDestruct
const CELL = 40;                                                        // (a bigger cell than the old town's 26 m: the plan's lots are fewer and bigger, so a block has about as many lots as an old block had houses, and the battle value of the town stays what it was)
export function townTargetSpecs(level) {
  const out = [], cells = new Map(), floorsOf = (l) => (HOME_KINDS[l.kind] ? HOME_KINDS[l.kind].floors : 3);
  for (const l of [...homeLots(level), ...civicLots(level), ...prodLots(level)]) {
    if (l.kind === 'chapel') { out.push({ ids: [l.id], t: { type: 'church', x: l.x, z: l.z, w: l.w, d: l.d, h: 28, rot: 0, n: 1, share: 2.4 } }); continue; }
    const k = Math.floor(l.x / CELL) + ',' + Math.floor(l.z / CELL); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(l);
  }
  for (const arr of cells.values()) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, hy = 0;
    for (const l of arr) { const e = Math.max(l.w, l.d) / 2; x0 = Math.min(x0, l.x - e); x1 = Math.max(x1, l.x + e); z0 = Math.min(z0, l.z - e); z1 = Math.max(z1, l.z + e); hy = Math.max(hy, floorsOf(l)); }
    out.push({ ids: arr.map((l) => l.id), t: { type: 'house', x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, h: 4 + hy * 3.2, rot: 0, n: arr.length, share: +(0.5 + 0.16 * arr.length).toFixed(2) } });
  }
  return out;
}
