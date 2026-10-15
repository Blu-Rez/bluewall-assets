// ST1 — the Treasury Quarter: ONE place and ONE family look for every storage of the home map (wood / stone / iron / gold / oil / food storehouses of stores.js + the three gem vaults of vault.js).
//   planQuarter()                 -> { stores: [{ id, kind: 'store', x, z, ry, r }], vaults: [{ id, kind: 'vault', ... }] } | null     (pure, deterministic; null = the layout changed and the old planners decide)
// The home map has room for nine yards in only one place: the band between the inner street and the south ring road.  The nine slots below were solved offline (dev/st1_solve.mjs: an oriented 16 x 16 m
// footprint with >= 1.5 m to every road edge, >= 7 m to the river, >= 17 m outside the wall + moat, clear of the market and the gates) and are RE-CHECKED here at load (fitsYard): if any slot no longer fits
// (another map, a moved road) the whole plan is dropped and stores.js / vault.js plan as before.  Door side: the south row faces the ring road (the street the carts come on), the bank (gold) faces the castle.
import * as THREE from 'three';
import * as L from './layout.js';
import { roadDist } from './roads.js';
import { marketSpot } from './terrain.js';
import { mat4, gableRoof, Batcher } from './util.js';
import { patchDestruct } from './destruct.js';                          // TR2-S5
import { uLv } from './skin.js';
import { gemGeometry, gemMaterial } from './gemgeo.js';
// (tr2lib / tr2atlas / village are imported lazily in warmYards: they need the browser (assets.js), and the plan half of this file must stay importable by the node tests)

export const YARD = { w: 16, d: 16, r: 13 };             // footprint of one yard (door side = local +z) and the radius the town / B1 plan reserves around it
// id -> [x, z, ry]   (ry: yaw so that local +z (the door) points at the street; local x = right)
const SLOTS = {            // solved offline (dev/st1_sa4.mjs): simulated annealing over the feasible cells (fitsYard) with the REAL plan as oracle: the B1 engine on the base layout + the 8 perturbed ones of b1_town_test + the p41 solid check
  wood:    ['store', -66, 51, -1.047],      // (the ORDER of this table is part of the solution: the plan engine is order sensitive)
  stone:   ['store', -51, 66, 0],
  iron:    ['store', -60, 93, 1.571],
  gold:    ['store', -15, 105, 0],           // the bank stands in the middle of the vault row: ruby | gold | emerald, turquoise behind it
  oil:     ['store', -84, 90, 0],
  food:    ['store', -9, -81, -3.142],       // the one outlier: the south band cannot hold a ninth yard AND the civic lots; the grain reserve stands behind the citadel (north)
  ruby:    ['vault', -36, 102, 0.262],
  emerald: ['vault', 6, 105, -2.88],
  turq:    ['vault', 12, 78, 0],
};

export function fitsYard(x, z, ry, { w = YARD.w, d = YARD.d, road = 1.0 } = {}) {
  const c = Math.cos(ry), s = Math.sin(ry), MK = marketSpot(), gates = [...L.TGATES, { x: L.GATE.x + L.GATE.nx * 20, z: L.GATE.z + L.GATE.nz * 20 }];
  for (let a = -w / 2; a <= w / 2 + 0.01; a += 2) for (let b = -d / 2; b <= d / 2 + 0.01; b += 2) {
    const px = x + a * c + b * s, pz = z - a * s + b * c;
    if (L.sdPoly(L.OUTER, px, pz) < L.MOAT.off + L.MOAT.half + 2.5) return false;
    if (roadDist(px, pz) < road) return false;
    if (L.distPolyline(L.RIVER, px, pz) < 6) return false;
    if (L.sdTown(px, pz) > -20) return false;
    if (MK && Math.hypot(px - MK.x, pz - MK.z) < MK.r + 4) return false;
    if (gates.some((g) => Math.hypot(px - g.x, pz - g.z) < 12)) return false;
  }
  return true;
}

// ?st1=0 (dev / comparison) = the old stores + vaults exactly as before ST1; 1 / 2 / 3 = the three looks of the contact sheet; no parameter = DEFAULT_LOOK
export const DEFAULT_LOOK = 1;
export function st1Param() {                                    // the look asked for by ?st1=N (or the node tests' __st1), null = none: the default decides
  try { const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('st1'); if (q != null && /^[0-3]$/.test(q)) return +q; } catch (e) { /* node */ }
  if (typeof globalThis !== 'undefined' && globalThis.__st1 != null) return +globalThis.__st1;
  return null;
}
// the central crystal has its own look (?st1c=1..3, default 1 = the library's crystal cluster in the tier colour), whatever the yards' look is
export function crystalLook() {
  try { const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '').get('st1c'); if (q != null && /^[1-3]$/.test(q)) return +q; } catch (e) { /* node */ }
  return 1;
}
export function st1Look() { const q = st1Param(); return q == null ? DEFAULT_LOOK : q; }

let QUARTER;
export function planQuarter() {
  if (QUARTER !== undefined) return QUARTER;
  QUARTER = null;
  if (st1Look() === 0) return QUARTER;
  if (!L.TOWN || L.MAP !== 'night') return QUARTER;
  const ids = Object.keys(SLOTS), recs = ids.map((id) => { const [kind, x, z, ry] = SLOTS[id]; return { id, kind, x, z, ry, r: YARD.r }; });
  for (const q of recs) if (!fitsYard(q.x, q.z, q.ry)) { if (typeof console !== 'undefined') console.warn('ST1: slot ' + q.id + ' no longer fits: the old store plan stays'); return QUARTER; }
  for (let i = 0; i < recs.length; i++) for (let j = i + 1; j < recs.length; j++) if (Math.hypot(recs[i].x - recs[j].x, recs[i].z - recs[j].z) < 19) return QUARTER;
  QUARTER = { stores: recs.filter((q) => q.kind === 'store'), vaults: recs.filter((q) => q.kind === 'vault') };
  return QUARTER;
}


// ================================================================================================================================================================================================
// THE YARDS.  One builder per look; all of them draw into the game's static batch (B) with the town's own materials (+0 programs), the tier skin of skin.js gives each resource its own stuff
// (wood = planks, stone, riveted iron, gilded marble) and the heaps follow the fill through the skin shader's min-level clip (no extra draw call, no instancing, no new shader).
// The Tripo pieces (props, ore, barrels, tanks ... and, in look 3, the halls) are packed into ONE atlas material => +1 draw call for the whole quarter.
// ================================================================================================================================================================================================
export const STORE_IDS = ['wood', 'stone', 'iron', 'gold', 'oil', 'food'];
export const STORE_FA = { wood: 'انبار چوب', stone: 'انبار سنگ', iron: 'انبار آهن', gold: 'خزانهٔ طلا', oil: 'انبار نفت', food: 'انبار غذا' };
const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const SPH = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
// skin ids of this file (skin.js ENT uses 0..16; uLv has 32 slots): the hall of a store keeps ONE tier look, its heap has its own "level" = how full it is
export const TIER_ENT = [17, 18, 19, 20, 21, 22], TIER_LV = [2, 5, 9, 13, 17, 20];      // six FIXED tier looks: 0 timber, 1 grey stone, 2 black iron, 3 sand + gold, 4 pale diamond, 5 blue crystal
export const HEAP_ENT = { wood: 23, stone: 24, iron: 25, gold: 26, oil: 27, food: 28 };
// tier look of each hall (skin.js, internal level 1..20): 1-3 brown timber-brick, 4-7 grey stone, 8-11 black iron, 12-15 sand + gold, 16-19 pale diamond, 20 dark blue crystal
const HEAP_BASE = { wood: 1, stone: 16, iron: 8, gold: 12, oil: 8, food: 1 }, HEAP_STAGES = { wood: 3, stone: 4, iron: 4, gold: 4, oil: 4, food: 3 };
// the identity of each resource: colour (banners, trim), emblem silhouette, Tripo dressing
export const RES = {          // wm: wall material ('stone' = skinned, the tier above decides; 'plaster' = flat colour), wall / roof: tints, col: banner + sign colour, trim: cornice + ridge
  wood:  { col: 0xc97a3a, wm: 'stone',   wall: 0xffffff, roof: 0xe0aa72, trim: 0xe3b36c, wt: 0, pt: 0, rt: 0 },      // wt / pt / rt: the tier look of the walls / plinth / roof (TIER_ENT index)
  stone: { col: 0xe8e2d4, wm: 'stone',   wall: 0xf4efe6, roof: 0xffffff, trim: 0xc9c4b8, wt: 4, pt: 4, rt: 1 },
  iron:  { col: 0x6f8fc4, wm: 'stone',   wall: 0x9db0d0, roof: 0xb4c0d8, trim: 0x93a0b4, wt: 4, pt: 4, rt: 2 },
  gold:  { col: 0xffc533, wm: 'stone',   wall: 0xffffff, roof: 0xffffff, trim: 0xffd25c, wt: 3, pt: 3, rt: 3 },
  oil:   { col: 0xe0642c, wm: 'plaster', wall: 0xe0a070, roof: 0x8a6a58, trim: 0x2d1f18, wt: 3, pt: 3, rt: 0 },
  food:  { col: 0x7cb04a, wm: 'plaster', wall: 0xf4ead3, roof: 0xb8d19a, trim: 0x8a6a46, wt: 0, pt: 0, rt: 0 },
  // the gem vaults: pale diamond-tier marble walls, the roof in the colour of the gem, gold trim
  ruby:    { col: 0xe0334f, wm: 'stone', wall: 0xf6f0f2, roof: 0xd8506a, trim: 0xf2d27a, wt: 4, pt: 4, rt: 4 },
  emerald: { col: 0x2fbf72, wm: 'stone', wall: 0xf0f6f2, roof: 0x4fc487, trim: 0xf2d27a, wt: 4, pt: 4, rt: 4 },
  turq:    { col: 0x3aa6e8, wm: 'stone', wall: 0xf0f4f8, roof: 0x58b4ec, trim: 0xf2d27a, wt: 4, pt: 4, rt: 4 },
};
export function setHeapFill(id, f) {            // f 0..1 -> the heap's "level": stage k shows from level base + k
  const b = HEAP_BASE[id], S = HEAP_STAGES[id]; uLv.value[HEAP_ENT[id]] = b + Math.round(Math.max(0, Math.min(1, f)) * (S - 1));
}
export function initYardLevels() { TIER_ENT.forEach((e, i) => { uLv.value[e] = TIER_LV[i]; }); for (const id of STORE_IDS) setHeapFill(id, 0.6); }

// the helper every builder gets: the yard's local frame (x right, z toward the street / the door) -> world, and the three ways to put something in
function frame(env, S, y0f) {
  const { B, M, height } = env, c = Math.cos(S.ry), s = Math.sin(S.ry);
  const P = (lx, lz) => [S.x + lx * c + lz * s, S.z - lx * s + lz * c];
  let lo = 1e9, hi = -1e9;
  for (const [a, b] of [[0, 0], [-8, -8], [8, -8], [-8, 8], [8, 8], [0, 8], [0, -8]]) { const [x, z] = P(a, b), h = height(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); }
  const y0 = y0f != null ? y0f : Math.max(0.3, hi), drop = Math.max(0, hi - lo) + 0.8;                // the yard stands on a pad at the highest corner; the foundations reach down to the lowest
  const Y = { S, P, y0, drop, B, M, env,
    box(mat, lx, y, lz, sx, sy, sz, o = {}, ry = 0) { const [x, z] = P(lx, lz); B.add(BOX, M[mat], mat4(x, y0 + y + (Y.yOff || 0), z, S.ry + ry, sx, sy, sz), o); },
    cyl(mat, lx, y, lz, rt, rb, h, o = {}, n = 10, rx = 0, rz = 0, ry = 0) { const [x, z] = P(lx, lz); B.add(CYL(rt, rb, h, n), M[mat], mat4(x, y0 + y + (Y.yOff || 0), z, S.ry + ry, 1, 1, 1, rx, rz), o); },
    geo(mat, g, lx, y, lz, o = {}, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) { const [x, z] = P(lx, lz); B.add(g, M[mat], mat4(x, y0 + y, z, S.ry + ry, sx, sy, sz, rx, rz), o); },
    tp(spec, lx, lz, ry = 0, y = 0, k = 1) { const [x, z] = P(lx, lz); env.tri.push({ n: spec, matrix: mat4(x, y0 + y, z, S.ry + ry, k, k, k), bid: env.bid || 0 }); },
    tag(ent, min = 1) { B.tag(ent, min); },
  };
  return Y;
}
const T_ST = { worldUV: 0.1 };

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- emblems
// big silhouettes on the ridge (4-5 m): wood = a pyramid of logs, stone = stacked hewn blocks, iron = an anvil, gold = a pyramid of bars, oil = a drop on a barrel, food = a sheaf of wheat on a sack
const EMBLEM = {
  wood(Y, y) { for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - r; i++) Y.cyl('woodLight', (i - (3 - r) / 2) * 0.98, y + 0.5 + r * 0.86, 0, 0.5, 0.5, 2.2, { tint: (r + i) % 2 ? 0xc99658 : 0xdcae72 }, 9, 0, Math.PI / 2, Y.S.ry * 0); },
  stone(Y, y) { Y.box('stoneLight', 0, y + 0.7, 0, 3.4, 1.4, 2.0, { ...T_ST, tint: 0xe8e6e0 }); Y.box('stoneLight', 0.3, y + 1.95, 0, 2.5, 1.1, 1.6, { ...T_ST, tint: 0xd6d4ce }); Y.box('stoneLight', -0.2, y + 3.0, 0, 1.5, 1.0, 1.2, { ...T_ST, tint: 0xf0eee8 }); },
  iron(Y, y) { Y.box('metal', 0, y + 0.45, 0, 2.4, 0.9, 1.5, { tint: 0x6f7a8a }); Y.box('metal', 0, y + 1.25, 0, 1.2, 0.8, 1.1, { tint: 0x838fa0 }); Y.box('metal', 0, y + 2.0, 0, 3.4, 0.8, 1.6, { tint: 0x9aa6b8 }); Y.geo('metal', new THREE.ConeGeometry(0.7, 1.8, 8).rotateZ(-Math.PI / 2), 2.5, y + 2.0, 0, { tint: 0xa9b4c4 }); },
  gold(Y, y) { for (let r = 0; r < 3; r++) for (let i = 0; i < 3 - r; i++) Y.box('gold', (i - (2 - r) / 2) * 1.6, y + 0.4 + r * 0.78, 0, 1.5, 0.72, 1.0); Y.geo('gold', CYL(0.9, 0.9, 0.16, 16), 0, y + 2.9, 0, {}, 0, 1, 1, 1, Math.PI / 2, 0); },
  oil(Y, y) { Y.cyl('metal', 0, y + 0.7, 0, 0.95, 1.0, 1.4, { tint: 0x3a2e28 }, 12); Y.geo('plaster', SPH(1.15, 14, 10), 0, y + 2.2, 0, { tint: 0x2b211c }, 0, 1, 1.35, 1); Y.cyl('metal', 0, y + 3.8, 0, 0.0, 0.7, 1.7, { tint: 0x2b211c }, 12); },
  food(Y, y) { for (let i = -3; i <= 3; i++) Y.geo('woodLight', new THREE.ConeGeometry(0.2, 2.6, 6), i * 0.42, y + 1.9, 0, { tint: 0xe5c363 }, 0, 1, 1, 1, 0, i * 0.22); Y.geo('cloth', SPH(0.9, 10, 8), 0, y + 0.6, 0, { tint: 0xa5432f }, 0, 1.15, 0.85, 0.9); },
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- heaps
// stage k of a heap is drawn with B.tag(HEAP_ENT, min = base + k): the skin shader hides it while the heap's level is lower.  The body material is a SKINNED one so the clip works.
const HEAP = {
  wood(Y, side, st) { const e = HEAP_ENT.wood, b = HEAP_BASE.wood; const rows = [[4, 0], [3, 1], [2, 2]][st]; if (!rows) return; Y.tag(e, b + st); const [n, r] = rows;
    for (let i = 0; i < n; i++) Y.cyl('stone', side * (Y.heapX || 4.6) + (i - (n - 1) / 2) * 0.86, 0.5 + r * 0.74, (Y.heapZ ?? 6.6), 0.4, 0.4, 3.6, { tint: (i + r) % 2 ? 0xc99658 : 0xdcae72 }, 9, 0, Math.PI / 2); },
  stone(Y, side, st) { const e = HEAP_ENT.stone, b = HEAP_BASE.stone; Y.tag(e, b + st); const n = [3, 2, 2, 1][st], r = st;
    for (let i = 0; i < n; i++) Y.box('stone', side * (Y.heapX || 4.6) + (i - (n - 1) / 2) * 1.75, 0.5 + r * 0.92, (Y.heapZ ?? 6.6), 1.65, 0.88, 1.25, { ...T_ST, tint: (i + r) % 2 ? 0xd0d2d8 : 0xe6e3dc }, (i - 1) * 0.06); },
  iron(Y, side, st) { const e = HEAP_ENT.iron, b = HEAP_BASE.iron; Y.tag(e, b + st); const n = [5, 4, 3, 2][st], r = st;
    for (let i = 0; i < n; i++) Y.box('stone', side * (Y.heapX || 4.6) + (i - (n - 1) / 2) * 1.0, 0.3 + r * 0.42, (Y.heapZ ?? 6.6), 0.94, 0.38, 0.55, { ...T_ST, tint: (i + r) % 2 ? 0x9aa6b6 : 0x7e8a9a }); },
  gold(Y, side, st) { const e = HEAP_ENT.gold, b = HEAP_BASE.gold; Y.tag(e, b + st); const n = [5, 4, 3, 2][st], r = st;
    for (let i = 0; i < n; i++) Y.box('gold', side * (Y.heapX || 4.6) + (i - (n - 1) / 2) * 1.0, 0.3 + r * 0.42, (Y.heapZ ?? 6.6), 0.94, 0.38, 0.55); },
  oil(Y, side, st) { const e = HEAP_ENT.oil, b = HEAP_BASE.oil; Y.tag(e, b + st); const n = [3, 2, 2, 1][st], r = st;
    for (let i = 0; i < n; i++) Y.cyl('stone', side * (Y.heapX || 4.6) + (i - (n - 1) / 2) * 1.15, 0.6 + r * 1.05, (Y.heapZ ?? 6.6), 0.5, 0.5, 1.1, { tint: (i + r) % 2 ? 0x4a3a30 : 0x3a2d26 }, 12); },
  food(Y, side, st) { const e = HEAP_ENT.food, b = HEAP_BASE.food; Y.tag(e, b + st); const n = [4, 3, 2][st], r = st;
    for (let i = 0; i < n; i++) Y.box('stone', side * (Y.heapX || 4.6) + (i - (n - 1) / 2) * 1.2, 0.45 + r * 0.8, (Y.heapZ ?? 6.6), 1.1, 0.78, 0.9, { tint: (i + r) % 2 ? 0xd8b46a : 0xe6c98a }); },
};

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- shared parts
const WALLUV = { uvScale: [3, 1.6] };
const wallOpts = (K, extra = {}) => (K.wm === 'plaster' ? { tint: K.wall, ...WALLUV, ...extra } : { ...T_ST, tint: K.wall, ...extra });
const TE = TIER_ENT;
function plinth(Y, id, w = 14.6, dz = 11.0, steps = true) {
  Y.tag(TE[RES[id].pt]);            // foundation + court slab + steps: ONE stone family for all looks (tier-skinned with the hall)
  Y.box('stoneDark', 0, -Y.drop / 2 + 0.45, -2.2, w, Y.drop + 0.9, dz, { ...T_ST, tint: 0xc2c7d2 });
  Y.box('stoneDark', 0, -Y.drop / 2 + 0.12, 5.9, 15.6, Y.drop + 0.24, 5.4, { ...T_ST, tint: 0xaeb4c2 });
  Y.box('stoneLight', 0, 0.3, 5.9, 15.0, 0.12, 4.8, { ...T_ST, tint: 0xd9dbe2 });                                   // paving (unskinned light stone: the court always reads bright)
  if (steps) for (let k = 0; k < 3; k++) Y.box('stoneLight', 0, 0.2 + k * 0.24, 3.7 - k * 0.5, 5.0 - k * 0.5, 0.26, 1.0, { ...T_ST, tint: 0xdcdde4 });
}
function lamps(Y, env, x = 3.4, z = 3.6) { for (const e of [-1, 1]) { const [lx, lz] = Y.P(e * x, z); env.ctx.torch(lx, Y.y0 + 3.4, lz, { post: true, pool: true }); } }
function banners(Y, K, x = 6.7, z = 2.3, y = 0.9) {       // two tall pennants in the resource colour on the front corners
  for (const e of [-1, 1]) { Y.cyl('wood', e * x, y + 4.6, z, 0.07, 0.08, 7.6, { tint: 0x4a3524 }, 6); Y.box('cloth', e * x - e * 0.65, y + 7.0, z, 1.2, 2.6, 0.05, { tint: K.col }); Y.box('cloth', e * x - e * 0.65, y + 5.55, z, 1.2, 0.35, 0.06, { tint: K.trim }); }
}
function hoist(Y, x = 4.2) {                                // a beam, strut, rope and hook out of the front wall: the storehouse's signature
  Y.box('wood', x, 0.9 + 5.4, 3.3, 0.28, 0.28, 3.4, { tint: 0x5a3a22 }); Y.box('wood', x, 0.9 + 4.5, 3.0, 0.2, 0.2, 2.4, { tint: 0x5a3a22 });
  Y.cyl('wood', x, 0.9 + 4.0, 4.7, 0.025, 0.025, 2.4, { tint: 0xc9b08a }, 4); Y.box('metal', x, 0.9 + 2.75, 4.7, 0.3, 0.22, 0.3, { tint: 0x555e6c });
}
function door(Y, id, h = 4.0) {
  Y.box('stoneDark', 0, 0.9 + h / 2, 1.9, 4.4, h, 0.7, { ...T_ST, tint: 0xaeb3bf });
  Y.box('dark', 0, 0.9 + h / 2 - 0.2, 2.28, 3.1, h - 0.5, 0.2);
  for (let k = -1.2; k <= 1.21; k += 0.8) Y.box(id === 'gold' ? 'gold' : 'metal', k, 0.9 + h / 2 - 0.2, 2.42, 0.1, h - 0.5, 0.08);
}
function emblemAt(Y, id, y) { Y.tag(TE[RES[id].wt]); EMBLEM[id](Y, y); }

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- look 1: the family hall
function hall1(Y, id, env) {
  const K = RES[id], { M } = Y, S = Y.S;
  Y.tag(TE[K.wt]);
  plinth(Y, id);
  Y.box(K.wm, 0, 0.9 + 2.3, -2.6, 12.4, 4.6, 8.6, wallOpts(K));
  Y.box('stoneDark', 0, 0.9 + 0.3, -2.6, 12.9, 0.6, 9.1, { ...T_ST, tint: 0xc2c7d2 });                           // base course
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) Y.box('stoneDark', sx * 6.2, 0.9 + 2.5, -2.6 + sz * 4.3, 0.8, 5.0, 0.8, { ...T_ST, tint: 0xb4bac7 });   // corner pilasters
  Y.box('stoneDark', 0, 0.9 + 4.85, -2.6, 13.4, 0.45, 9.6, { ...T_ST, tint: K.trim });                          // cornice in the resource's trim colour
  { const [rx, rz] = Y.P(0, -2.6); env.B.add(gableRoof(12.8, 9.6, 3.6, 0.7), M.roof, mat4(rx, Y.y0 + 0.9 + 5.05, rz, S.ry), { tint: K.roof, uvScale: [1, 1], ent: TE[K.rt], min: 1 }); }
  Y.box('stoneDark', 0, 0.9 + 5.05 + 3.6, -2.6, 13.4, 0.3, 0.55, { ...T_ST, tint: K.trim });                    // ridge cap
  door(Y, id);
  for (const e of [-1, 1]) Y.box('window', e * 4.2, 0.9 + 2.9, 1.74, 1.2, 1.5, 0.12);
  hoist(Y);
  lamps(Y, env); banners(Y, K);
  emblemAt(Y, id, 0.9 + 5.05 + 3.9);
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- look 2: the pavilion
// an open pillared hall: a deep roof on twelve posts over a half-height back wall; the heap stands INSIDE, in plain sight; the court in front carries the Tripo dressing.
function pavilion2(Y, id, env) {
  const K = RES[id], { M } = Y, S = Y.S;
  Y.tag(TE[K.wt]);
  plinth(Y, id);
  Y.box('stoneDark', 0, 0.9 + 0.12, -2.6, 12.4, 0.24, 8.6, { ...T_ST, tint: 0xd0d4de });                         // inner floor
  Y.heapZ = -2.2; Y.heapX = 3.6; Y.heapY = 0.75;                                                                                     // the heaps stand inside, between the posts
  Y.box(K.wm, 0, 0.9 + 1.5, -6.6, 12.4, 3.0, 0.7, wallOpts(K));                                                    // back wall (3 m)
  for (const sx of [-1, 1]) Y.box(K.wm, sx * 6.0, 0.9 + 1.0, -2.6, 0.7, 2.0, 8.6, wallOpts(K));                      // low side walls
  for (const px of [-6, -3, 0, 3, 6]) for (const pz of [1.5, -6.6]) { if (pz < 0 && Math.abs(px) === 6) continue; Y.box('stoneDark', px, 0.9 + 2.55, pz, 0.8, 5.1, 0.8, { ...T_ST, tint: 0xc9cdd8 }); Y.box('stoneDark', px, 0.9 + 0.3, pz, 1.1, 0.6, 1.1, { ...T_ST, tint: 0xb4bac7 }); }
  Y.box('wood', 0, 0.9 + 5.2, 1.5, 12.6, 0.5, 0.6, { tint: 0x6b4a2f });                                              // front beam
  Y.box('wood', 0, 0.9 + 5.2, -6.6, 12.6, 0.5, 0.6, { tint: 0x6b4a2f });
  for (const px of [-6, -3, 0, 3, 6]) Y.box('wood', px, 0.9 + 5.2, -2.6, 0.4, 0.45, 8.6, { tint: 0x6b4a2f });          // tie beams
  { const [rx, rz] = Y.P(0, -2.6); env.B.add(gableRoof(13.6, 10.6, 3.9, 1.1), M.roof, mat4(rx, Y.y0 + 0.9 + 5.45, rz, S.ry), { tint: K.roof, uvScale: [1, 1], ent: TE[K.rt], min: 1 }); }
  Y.box('stoneDark', 0, 0.9 + 5.45 + 3.9, -2.6, 14.2, 0.3, 0.6, { ...T_ST, tint: K.trim });
  // a big sign board in the resource colour across the front beam
  Y.box('cloth', 0, 0.9 + 4.3, 1.62, 6.4, 1.3, 0.06, { tint: K.col }); Y.box('stoneDark', 0, 0.9 + 4.3, 1.58, 6.8, 1.5, 0.06, { ...T_ST, tint: K.trim });
  lamps(Y, env, 6.6, 2.9); banners(Y, K, 7.3, 3.2, 0.9);
  emblemAt(Y, id, 0.9 + 5.45 + 4.2);
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- look 3: the Tripo hall
// the hall itself is a library model (packed into the quarter's atlas: +0 draw calls for the six of them); plinth, court, heap, emblem and banners are the family's.
const HALLH = {};                                                       // piece name -> height in metres (measured from the loaded model by warmYards: the emblem / the crown sit on the real roof)
export function setPieceHeights(h) { Object.assign(HALLH, h); }
// the library's own storehouse family (storage_<tier>.glb: ONE shape in several materials).  Look 3 uses it as soon as the files are in the library (swap.json has the entry and the file loads); until then (or
// for a missing one) the older library halls below stand in.  storage_blue (deep blue crystal) has no store of its own yet: a level-20 skin, not used by the quarter.
export const STORAGE = { wood: 'storage_wood', stone: 'storage_stone', iron: 'storage_iron', gold: 'storage_gold', oil: 'storage_black', turq: 'storage_ice', ruby: 'storage_red', emerald: 'storage_green' };
export const VAULT_IDS = ['ruby', 'emerald', 'turq'];
const HAVE = {};                                                        // id -> piece name of the storage model that really loaded (set by warmYards)
export function setStorageHave(h) { for (const k of Object.keys(HAVE)) delete HAVE[k]; Object.assign(HAVE, h); }
// the model stands with its gable (the double door) to the street (swap.json ry -90: front -> +z): `w` = its depth (the longest side): 12 m for a storehouse, 9.5 m for a vault hall (the basin is in front of it)
export const storageSpec = (id) => STORAGE[id] + '|w' + (VAULT_IDS.includes(id) ? 9.5 : 12);
const ST_Z = -3.4, STV_Z = -2.7;                              // local z of the storage hall's centre (storehouse / vault)
// the emblem of a storage hall: its wide axis runs ALONG the ridge (the ridge runs front to back), on the ridge's front third
function ridgeFrame(Y, env, lz) { const [x, z] = Y.P(0, lz); return frame(env, { ...Y.S, x, z, ry: Y.S.ry + Math.PI / 2 }, Y.y0); }
// the same emblem bigger (k) about its base height yb: a dark Tripo hall needs a bolder silhouette to read from the strategic camera
function scaledFrame(F, k, yb) {
  const Y2 = Object.create(F), h = (y) => yb + (y - yb) * k;
  Y2.box = (m, lx, y, lz, sx, sy, sz, o, ry) => F.box(m, lx * k, h(y), lz * k, sx * k, sy * k, sz * k, o, ry);
  Y2.cyl = (m, lx, y, lz, rt, rb, hh, o, n, rx, rz, ry) => F.cyl(m, lx * k, h(y), lz * k, rt * k, rb * k, hh * k, o, n, rx, rz, ry);
  Y2.geo = (m, g, lx, y, lz, o, ry, sx = 1, sy = 1, sz = 1, rx, rz) => F.geo(m, g, lx * k, h(y), lz * k, o, ry, sx * k, sy * k, sz * k, rx, rz);
  return Y2;
}
const HALL3 = { wood: 'lumber_mill_2|w13', stone: 'masonry_0|w12.4', iron: 'armory_1|w13.4', gold: 'treasury_0|w11', oil: 'oil_refinery_1|w13', food: 'granary_0|w11.8' };
function library3(Y, id, env) {
  const K = RES[id];
  plinth(Y, id, 14.6, HAVE[id] ? 14.4 : 11.0);                          // (a storage hall is 12 m deep: the foundation reaches back under it)
  const hall = HAVE[id] || HALL3[id];
  Y.tp(hall, 0, HAVE[id] ? ST_Z : -2.6, 0, 0.9);
  Y.tag(TE[K.wt]);
  lamps(Y, env); banners(Y, K, 7.0, 3.0, 0.9);
  const eh = 0.9 + (HALLH[hall] || { wood: 4.0, stone: 7.5, iron: 5.7, gold: 10.3, oil: 9.3, food: 8.1 }[id]) + 0.05;      // on the model's own roof
  emblemAt(HAVE[id] ? scaledFrame(ridgeFrame(Y, env, ST_Z + 3.0), 1.35, eh) : Y, id, eh);
}

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- the gem vaults
// vault.js keeps the LIVE parts (the cut-gem crown on the roof, the floating gem, its glow, the pile in the basin: they follow the wallet and the vault level) and asks for the STATIC hall here.  Same yard
// frame as the storehouses (door side = +z): the hall stands at the back, the basin with the pile in the court.  A builder returns where the live parts go: { crownY, heroY, basin: [lx, lz], pileR }.
const BASIN_Z = 4.9;
function vbasin(Y, id, env) {
  const K = RES[id];
  Y.tag(TE[K.pt]);
  Y.cyl('stoneDark', 0, 0.5, BASIN_Z, 3.0, 3.3, 1.0, { ...T_ST, tint: 0xc2c7d2 }, 20);
  Y.geo('gold', new THREE.TorusGeometry(3.0, 0.24, 6, 24).rotateX(Math.PI / 2), 0, 1.03, BASIN_Z);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5; Y.cyl('gold', Math.cos(a) * 3.55, 0.8, BASIN_Z + Math.sin(a) * 3.55, 0.17, 0.17, 1.6, {}, 6); Y.geo('gold', SPH(0.26, 8, 6), Math.cos(a) * 3.55, 1.7, BASIN_Z + Math.sin(a) * 3.55); }
  const [px, pz] = Y.P(0, BASIN_Z), c = K.col;
  env.ctx.pool(px, Y.y0 + 0.06, pz, 9, [(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255], 0.28);
}
function vdoor(Y, id, z) {                                    // gold-barred door in a marble frame, on the hall's front face (z)
  Y.box('stoneDark', 0, 0.9 + 2.2, z + 0.15, 4.2, 4.4, 0.6, { ...T_ST, tint: 0xd7dae2 });
  Y.box('dark', 0, 0.9 + 2.0, z + 0.48, 3.0, 3.8, 0.2);
  for (let k = -1.2; k <= 1.21; k += 0.6) Y.box('gold', k, 0.9 + 2.0, z + 0.62, 0.1, 3.8, 0.08);
}
function vault1(Y, id, env) {                                   // look 1: the marble hall with four gem-roofed turrets
  const K = RES[id], { M } = Y, S = Y.S, zc = -3.6;
  Y.tag(TE[K.wt]);
  plinth(Y, id, 14.6, 11.0, false);
  Y.box(K.wm, 0, 0.9 + 2.5, zc, 12.0, 5.0, 7.6, wallOpts(K));
  Y.box('stoneDark', 0, 0.9 + 0.3, zc, 12.5, 0.6, 8.1, { ...T_ST, tint: 0xc9cdd8 });
  Y.box('stoneDark', 0, 0.9 + 5.2, zc, 12.9, 0.45, 8.5, { ...T_ST, tint: K.trim });
  for (const e of [-1, 1]) Y.box('rune', e * 6.04, 0.9 + 3.0, zc, 0.1, 1.0, 6.2, { uvScale: [0.8, 1] });
  Y.box('rune', 0, 0.9 + 3.6, zc + 3.82, 9.2, 0.7, 0.1, { uvScale: [0.9, 1] });
  { const [rx, rz] = Y.P(0, zc); env.B.add(gableRoof(12.4, 8.6, 3.0, 0.6), M.roof, mat4(rx, Y.y0 + 0.9 + 5.4, rz, S.ry), { tint: K.roof, uvScale: [1, 1], ent: TE[K.rt], min: 1 }); }
  Y.box('stoneDark', 0, 0.9 + 5.4 + 3.0, zc, 12.9, 0.28, 0.5, { ...T_ST, tint: K.trim });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                      // four turrets with gem-coloured spires
    const lx = sx * 6.3, lz = zc + sz * 3.9;
    Y.cyl('stone', lx, 0.9 + 3.4, lz, 1.05, 1.2, 6.8, { ...T_ST, tint: K.wall }, 10);
    Y.cyl('stoneDark', lx, 0.9 + 6.9, lz, 1.3, 1.25, 0.4, { ...T_ST, tint: K.trim }, 10);
    { const [x, z] = Y.P(lx, lz); env.B.add(new THREE.ConeGeometry(1.5, 2.8, 10, 1, true), M.roof, mat4(x, Y.y0 + 0.9 + 8.5, z), { tint: K.roof, uvScale: [3, 2], ent: TE[K.rt], min: 1 }); }
    Y.geo('gold', SPH(0.24, 8, 6), lx, 0.9 + 10.0, lz);
  }
  vdoor(Y, id, zc + 3.8);
  for (const e of [-1, 1]) Y.box('window', e * 4.4, 0.9 + 3.2, zc + 3.82, 1.1, 1.5, 0.1);
  lamps(Y, env, 4.2, 2.6); banners(Y, K, 7.2, 2.2, 0.9);
  return { crownY: 0.9 + 5.4 + 3.2 + 1.7, ridge: 0.9 + 5.4 + 3.0 };
}
function vault2(Y, id, env) {                                   // look 2: the rotunda — an eight-sided marble drum under a tall gem-coloured cone
  const K = RES[id], { M } = Y, S = Y.S, zc = -3.0;
  Y.tag(TE[K.wt]);
  plinth(Y, id, 14.6, 11.0, false);
  Y.cyl('stoneDark', 0, 0.9 + 0.35, zc, 6.7, 6.9, 0.7, { ...T_ST, tint: 0xc9cdd8 }, 8, 0, 0, Math.PI / 8);
  Y.cyl('stone', 0, 0.9 + 3.6, zc, 5.6, 5.9, 5.8, wallOpts(K), 8, 0, 0, Math.PI / 8);
  Y.cyl('stoneDark', 0, 0.9 + 6.7, zc, 6.2, 6.0, 0.6, { ...T_ST, tint: K.trim }, 8, 0, 0, Math.PI / 8);
  Y.cyl('rune', 0, 0.9 + 4.4, zc, 5.96, 5.96, 0.8, { uvScale: [4, 1] }, 8, 0, 0, Math.PI / 8);
  { const [x, z] = Y.P(0, zc); env.B.add(new THREE.ConeGeometry(6.6, 5.6, 8, 1, true).rotateY(Math.PI / 8), M.roof, mat4(x, Y.y0 + 0.9 + 6.9 + 2.8, z, S.ry), { tint: K.roof, uvScale: [4, 2], ent: TE[K.rt], min: 1 }); }
  Y.geo('gold', SPH(0.4, 8, 6), 0, 0.9 + 12.7, zc);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; if (Math.sin(a) > 0.6) continue;        // eight arched windows round the drum (the door side stays clear)
    Y.box('window', Math.cos(a) * 5.7, 0.9 + 3.4, zc + Math.sin(a) * 5.7, 0.1, 2.2, 1.5, {}, -a); }
  for (const e of [-1, 1]) { Y.cyl('stone', e * 2.6, 0.9 + 2.5, zc + 5.4, 0.45, 0.5, 5.0, { ...T_ST, tint: K.wall }, 10); Y.geo('gold', SPH(0.34, 8, 6), e * 2.6, 0.9 + 5.2, zc + 5.4); }      // porch columns
  Y.box('stoneDark', 0, 0.9 + 5.3, zc + 5.4, 6.4, 0.5, 1.0, { ...T_ST, tint: K.trim });
  Y.box('dark', 0, 0.9 + 2.0, zc + 5.52, 3.0, 3.8, 0.2);
  for (let k = -1.2; k <= 1.21; k += 0.6) Y.box('gold', k, 0.9 + 2.0, zc + 5.64, 0.1, 3.8, 0.08);
  lamps(Y, env, 4.2, 2.6); banners(Y, K, 7.2, 2.2, 0.9);
  return { crownY: 0.9 + 12.7 + 2.6, ridge: 0.9 + 12.7 };
}
const VHALL3 = 'treasury_1|w11';
function vault3(Y, id, env) {                                   // look 3: the library's own treasury hall (Tripo model), the family's basin + banners + gem crown
  const K = RES[id];
  plinth(Y, id, 14.6, 11.0, false);
  const hall = HAVE[id] || VHALL3;
  Y.tp(hall, 0, HAVE[id] ? STV_Z : -2.9, 0, 0.9);
  Y.tag(TE[K.wt]);
  lamps(Y, env, 4.2, 2.6); banners(Y, K, 7.2, 2.2, 0.9);
  const top = 0.9 + (HALLH[hall] || 8.8);
  return { crownY: top + (HAVE[id] ? 2.9 : 1.5), ridge: top };                // (over a Tripo hall the gem floats clear of the roof: the model stays readable)
}
const VLOOKS = { 1: vault1, 2: vault2, 3: vault3 };
// the static hall of one vault -> the numbers vault.js needs for its live parts (null: the old hall of vault.js stays)
function vaultHall(env, V, look) {
  const Y = frame(env, V), R = (VLOOKS[look] || vault1)(Y, V.id, env);
  vbasin(Y, V.id, env);
  env.B.tag(0, 1);
  return { y0: Y.y0, P: Y.P, crownY: R.crownY, heroY: R.crownY + 6.0, basin: [0, BASIN_Z], pileR: 2.5, look };
}
export function buildVaultHall(ctx, { M, height }, V, look) {
  const W = WARM && WARM.r; if (!W || !planQuarter()) return null;
  initYardLevels();
  return vaultHall({ B: ctx.B, M, height, tri: QTRI, ctx, bid: ctx.B.tagB || 0 }, V, look || W.look);      // mother (ST1 x BT1): the target id the caller registered (vault.js) goes onto the baked Tripo pieces
}
export const labBuildVault = (env, look, V) => { initYardLevels(); return vaultHall(env, V, look); };

// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- the central crystal
// The Blue Crystal stands on the plaza in the middle of the keep's court (buildings.js keeps its low plinth and the six gem pillars; ctx.crystal in world.js adds the beam, the glow, the light, the sparks).
// ST1 gives it a monument: a stepped dais round the old plinth and a new LIVE crystal that floats and turns above it.  Three looks:
//   1  the library's blue crystal cluster (Tripo model, packed in the quarter's atlas) with four small clusters on the dais
//   2  one big cut sapphire (the game's own gem geometry + gem material: +0 programs) over a gold-trimmed dais with four gem posts
//   3  a rune obelisk in blue-crystal tier stone with a big octahedron floating over its tip
const CRY1 = 'rocks_ore/crystal_blue|w10.5', CRY1S = 'rocks_ore/crystal_blue|w3.4';
const CHEIGHT = 5.4;                                          // buildings.js: the crystal's centre stands 5.4 m over the plaza
function cdais(B, M, x, y0, z, tier, trim = 0xf2d27a) {
  B.tag(TE[tier]);
  const T = { worldUV: 0.1 };
  B.add(CYL(6.0, 6.3, 0.4, 28), M.stoneDark, mat4(x, y0 + 0.2, z), { ...T, tint: 0xc9cdd8 });
  B.add(CYL(4.9, 5.2, 0.4, 28), M.stone, mat4(x, y0 + 0.6, z), { ...T, tint: 0xe3e5ec });
  B.add(CYL(3.9, 4.2, 0.4, 24), M.stoneDark, mat4(x, y0 + 1.0, z), { ...T, tint: 0xd6d9e2 });
  B.add(new THREE.TorusGeometry(5.5, 0.14, 6, 40).rotateX(Math.PI / 2), M.gold, mat4(x, y0 + 0.43, z), { tint: trim });
  B.add(new THREE.CylinderGeometry(5.0, 5.0, 0.12, 36, 1, true), M.rune, mat4(x, y0 + 0.66, z), { uvScale: [6, 1] });
}
function crystal1(ctx, M, x, y, z, y0, W) {
  const B = ctx.B; cdais(B, M, x, y0, z, 4);
  const grp = new THREE.Group(), tri = [];
  for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * Math.PI * 2; tri.push({ n: CRY1S, matrix: mat4(x + Math.cos(a) * 4.5, y0 + 1.15, z + Math.sin(a) * 4.5, a * 2.3), bid: 0 }); }
  (ctx.tri || QTRI).push(...tri);                             // (baked with the rest of the quarter: no extra draw call)
  const r = TR.bakeTr2(grp, W.atlas, [{ n: CRY1, matrix: mat4(0, -(CHEIGHT - 2.05), 0), bid: 0 }], { shadows: false, tag: 'st1crystal' });
  for (const m of r.meshes) { m.castShadow = false; m.receiveShadow = false; }
  return { mesh: grp };
}
function crystal2(ctx, M, x, y, z, y0, W) {
  const B = ctx.B; cdais(B, M, x, y0, z, 3);
  B.tag(TE[3]);
  for (let k = 0; k < 4; k++) { const a = (k + 0.5) / 4 * Math.PI * 2, px = x + Math.cos(a) * 4.6, pz = z + Math.sin(a) * 4.6;
    B.add(CYL(0.16, 0.22, 2.2, 6), M.gold, mat4(px, y0 + 2.3, pz));
    B.add(new THREE.OctahedronGeometry(0.5), M.crystal, mat4(px, y0 + 3.7, pz, a, 1, 1.5, 1)); }
  B.tag(0, 1);
  const g = gemGeometry('sap'), m = new THREE.Mesh(g, gemMaterial('sap', { envMapIntensity: 1.6, glow: 0.6 }));
  m.scale.setScalar(3.4); m.castShadow = false;
  return { mesh: m };
}
function crystal3(ctx, M, x, y, z, y0, W) {
  const B = ctx.B; cdais(B, M, x, y0, z, 4);
  B.tag(TE[5]);
  const T = { worldUV: 0.1 };
  B.add(CYL(1.9, 2.3, 0.8, 4).rotateY(Math.PI / 4), M.stone, mat4(x, y0 + 1.8, z), T);
  B.add(CYL(0.95, 1.5, 6.0, 4).rotateY(Math.PI / 4), M.stone, mat4(x, y0 + 5.2, z), T);
  for (const h of [3.4, 5.4]) B.add(CYL(1.26 - (h - 3.4) * 0.12, 1.26 - (h - 3.4) * 0.12, 0.35, 4, 1, true).rotateY(Math.PI / 4), M.rune, mat4(x, y0 + h, z), { uvScale: [4, 1] });
  B.tag(TE[3]); B.add(new THREE.ConeGeometry(0.95, 1.4, 4).rotateY(Math.PI / 4), M.gold, mat4(x, y0 + 8.6, z));
  B.tag(0, 1);
  const g = new THREE.OctahedronGeometry(1.5, 0); g.scale(1, 1.9, 1);
  const grp = new THREE.Group(), m = new THREE.Mesh(g, M.crystal); m.position.y = 1.4; grp.add(m);
  const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0).scale(1, 1.9, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 2.6, 4.2), toneMapped: false })); inner.position.y = 1.4; grp.add(inner);
  return { mesh: grp, lift: 4.0 };
}
const CLOOKS = { 1: crystal1, 2: crystal2, 3: crystal3 };
// -> { mesh } (the live crystal; world.js positions it at (x, y, z) = the plaza + 5.4 m and animates it) or null (the old octahedron stays)
function crystalAt(ctx, M, x, y, z, look, W) { initYardLevels(); const C = (CLOOKS[look] || crystal1)(ctx, M, x, y, z, y - CHEIGHT, W); ctx.B.tag(0, 1); return C; }
export function buildCrystal(ctx, M, x, y, z, look) {
  const W = WARM && WARM.r; if (!W || !planQuarter()) return null;
  return crystalAt(ctx, M, x, y, z, look || crystalLook(), W);
}
export function labBuildCrystal(ctx, M, x, y, z, look, W, bakeTr2) { TR = { bakeTr2 }; return crystalAt(ctx, M, x, y, z, look, W); }

// the court: the heaps (follow the fill) + Tripo dressing
const DRESS = {
  wood:  [['props_town/wagon|w4.2', -6.1, 9.0, 0.5], ['props_town/crates|w1.9', 6.2, 4.4, 0.4]],
  stone: [['props_mining/cart|w3.0', -6.2, 9.0, 0.3], ['rocks_boulder/slab|w2.6', 6.3, 4.4, 0.6]],
  iron:  [['props_mining/cart|w3.0', -6.2, 9.0, -0.3], ['rocks_ore/iron|w2.4', 6.3, 4.4, 0.4]],
  gold:  [['props_town/chest|w2.6', -6.0, 9.0, 0.2], ['rocks_ore/gold|w2.2', 6.3, 4.4, 0.3]],
  oil:   [['oil_tanks_pack/tank_brick|w3.6', -6.0, 9.0, 0], ['props_town/barrels|w2.2', 6.2, 4.4, 0.3]],
  food:  [['props_town/handcart|w3.0', -6.2, 9.0, 0.3], ['props_town/sacks|w2.1', 6.3, 4.4, 0.2]],
};
function court(Y, id) {
  Y.yOff = Y.heapY || 0;
  for (const side of [-1, 1]) { const n = HEAP_STAGES[id]; for (let st = 0; st < n; st++) HEAP[id](Y, side, st); }
  Y.yOff = 0; Y.tag(0, 1);
  for (const [n, x, z, ry] of DRESS[id]) Y.tp(n, x, z, ry);
}

export const LOOKS = { 1: { name: 'hall', hall: hall1 }, 2: { name: 'pavilion', hall: pavilion2 }, 3: { name: 'library', hall: library3 } };
export function buildYard(env, look, S) {
  const Y = frame(env, S), L1 = LOOKS[look] || LOOKS[1];
  L1.hall(Y, S.id, env); court(Y, S.id);
  Y.tag(0, 1);
  return Y;
}
// every Tripo piece the yards use (the atlas is built from these names)
export function yardPieceNames(look = 0) { const s = new Set(); for (const id of STORE_IDS) { for (const d of DRESS[id]) s.add(d[0]); if (look === 3 || look === 0) s.add(HAVE[id] || HALL3[id]); } if (look === 3 || look === 0) { if (VAULT_IDS.some((id) => !HAVE[id])) s.add(VHALL3); for (const id of VAULT_IDS) if (HAVE[id]) s.add(HAVE[id]); } if (crystalLook() === 1 || look === 0) { s.add(CRY1); s.add(CRY1S); } return [...s]; }
export { buildYard as labBuildYard };

// ---------------------------------------------------------------- game side
// warmYards(look): fetch + parse the Tripo pieces of the quarter and pack them into ONE atlas (one material = one draw call).  Resolves false when something is missing (the old stores stay).
let WARM = null, TR = null, LAMP = null;
/* global __BUILD__ */
// the swap.json models table (tr2lib keeps it private, and a model with ry 0 has an empty record: only the table itself tells "no entry" from "entry"; the same URL as tr2.init's, so the browser has it already)
async function swapModels(tr2) { try { const r = await fetch(tr2.base + 'swap.json' + (typeof __BUILD__ !== 'undefined' ? '?v=' + __BUILD__ : '')); return r.ok ? (await r.json()).models || {} : {}; } catch (e) { return {}; } }
const QTRI = [];                      // the Tripo pieces of the whole quarter (stores + vaults): ONE list, ONE bake, ONE draw call
export function warmYards(look = st1Param()) {                 // look: 0..3 as asked (?st1=N), null = the default: look 3 when the whole storage_* family is in the library, else DEFAULT_LOOK
  if (!planQuarter()) return Promise.resolve(false);
  const key = look == null ? 'auto' : look; if (WARM && WARM.key === key) return WARM.p;
  const p = (async () => {
    const [{ tr2 }, { buildAtlas, fileOfSpec, specOf }, { bakeTr2 }, s4c] = await Promise.all([import('./tr2lib.js'), import('./tr2atlas.js'), import('./village.js'), import('./tr2_s4c.js').catch(() => ({}))]);      // TR2-S5: + tr2_s4c (the lamp posts of a moved yard)
    TR = { bakeTr2 }; LAMP = s4c.S4C || null;
    await tr2.init();
    setStorageHave({});
    if (look == null || look === 3) {                                // the storage family: try only the files the library has an entry for (swap.json), keep the ones that load
      const sw = await swapModels(tr2), want = Object.keys(STORAGE).filter((id) => sw[STORAGE[id]]);
      if (want.length) {
        await tr2.load(want.map((id) => STORAGE[id]));
        const have = {}; for (const id of want) if (tr2.has(STORAGE[id])) have[id] = storageSpec(id);
        setStorageHave(have);
      }
      if (look == null) look = Object.keys(HAVE).length === Object.keys(STORAGE).length ? 3 : DEFAULT_LOOK;
      if (look !== 3) setStorageHave({});
    }
    if (look == null) look = DEFAULT_LOOK;
    const names = yardPieceNames(look), files = [...new Set(names.map((n) => fileOfSpec(specOf(n).spec)))];
    await tr2.load(files);
    const bad = files.filter((f) => !tr2.has(f)); if (bad.length) throw new Error('ST1: not loaded: ' + bad.join(','));
    const H = {}; for (const n of names) { try { const { spec, o } = specOf(n); H[n] = tr2.info(spec, o).size[1]; } catch (e) { /* no size */ } } setPieceHeights(H);
    return { atlas: buildAtlas(tr2, names, { name: 'st1', width: 2112 }), look };
  })().then((r) => { WARM.r = r; return true; }, (e) => { console.warn('ST1: the quarter keeps the old stores', e); return false; });
  WARM = { key, p };
  return p;
}
export const yardsReady = () => !!(WARM && WARM.r);

// TR2-S5: the six storehouse yards can be moved by the player (layout_live.js -> rebuildSteps()).  NOTHING moved = exactly ST1: every yard is drawn into the static batch ctx.B and into the quarter's ONE Tripo bake (+0 draw calls).
// We remember where each yard's vertices live (per material a range of the merged static mesh, and a range of the Tripo atlas mesh) and put a moved yard away the way a1_rings.js puts a wall ring away (its positions
// collapsed to 0, only that range uploaded; the saved numbers come back when the yard returns to its default place).  A moved yard is drawn again at its new place in a small group of its own (its own Batcher + its
// own Tripo bake: draw calls only while something is moved).  Its door lamps are NOT drawn again: the flame sprite and the glow pool they took stay in the world's lists and are moved in place.
export function buildStoreYards(ctx, { M, height, scene, onMeshes, plan }) {
  const Q = planQuarter(), W = WARM && WARM.r; if (!Q || !W) return null;
  const look = W.look, tri = QTRI, list = [], B = ctx.B, fx = ctx.fx || {}, lampLog = [];
  const ctxL = Object.create(ctx);                                                                 // the door lamps: remember the flame / pool slots they take (and where they stood)
  ctxL.torch = (x, y, z, o = {}) => {
    const fl = fx.flames, po = fx.pools, fi = fl ? fl.s.length : -1, pi = o.pool && po ? po.items.length : -1;
    ctx.torch(x, y, z, o);
    lampLog.push({ fi, pi, home: { f: fi >= 0 && fl.s.length > fi ? [fl.p[fi * 3], fl.p[fi * 3 + 1], fl.p[fi * 3 + 2]] : null, p: pi >= 0 && po.items.length > pi ? { x: po.items[pi].x, y: po.items[pi].y, z: po.items[pi].z } : null } });
  };
  const env = { B, M, height, tri, ctx: ctxL, bid: 0 };
  initYardLevels();
  const vcount = (b) => { const m = new Map(); for (const [mat, g] of b.groups) { let n = 0; for (const geo of g.geos) n += geo.attributes.position.count; m.set(mat, n); } return m; };
  const rec = new Map();
  for (const S of Q.stores) {
    const c0 = vcount(B), t0 = tri.length, l0 = lampLog.length, Y = buildYard(env, look, S), c1 = vcount(B), ranges = [];
    for (const [mat, n] of c1) { const a = c0.get(mat) || 0; if (n > a) ranges.push({ mat, a, b: n }); }
    list.push({ id: S.id, x: S.x, y: Y.y0, z: S.z, ry: S.ry });
    rec.set(S.id, { S, ranges, tri: tri.slice(t0), lamps: lampLog.slice(l0), y0: Y.y0 });
  }
  ctx.B.tag(0, 1); ctx.B.bid(0);
  const quarter = bakeYardTr2(scene, W.atlas, tri);
  // where each store's Tripo pieces sit in the atlas mesh: the same accounting as bakeTr2 (one merged mesh per material, pieces in list order)
  const runs = new Map(); for (const id of rec.keys()) runs.set(id, []);
  { const off = new Map(), ent = new Map();
    for (const e of tri) { let parts; try { parts = W.atlas.get(e.n); } catch (er) { continue; } const rr = []; for (const { geometry, material } of parts) { const a = off.get(material) || 0, n = geometry.attributes.position.count; off.set(material, a + n); rr.push({ mat: material, a, b: a + n }); } ent.set(e, rr); }
    for (const [id, r] of rec) for (const e of r.tri) for (const g of ent.get(e) || []) {
      const m = quarter.meshes.find((q) => q.material === g.mat), L0 = runs.get(id), last = L0[L0.length - 1];
      if (!m) continue; if (last && last.attr === m.geometry.attributes.position && last.b === g.a) last.b = g.b; else L0.push({ attr: m.geometry.attributes.position, a: g.a, b: g.b, saved: null });
    }
  }
  let attached = false, broken = false;
  const setRun = (r, show) => {
    const arr = r.attr.array, o = r.a * 3, len = (r.b - r.a) * 3;
    if (!show) { if (!r.saved) r.saved = arr.slice(o, o + len); arr.fill(0, o, o + len); } else if (r.saved) arr.set(r.saved, o); else return;
    r.attr.addUpdateRange(o, len); r.attr.needsUpdate = true;
  };
  const shown = new Map([...rec.keys()].map((id) => [id, true]));
  const setShown = (id, show) => { if (shown.get(id) === show) return; shown.set(id, show); for (const r of runs.get(id)) setRun(r, show); };
  const moveFlame = (i, a) => {
    const fl = fx.flames; if (!fl || i < 0 || !a || i >= fl.s.length) return;
    fl.p[i * 3] = a[0]; fl.p[i * 3 + 1] = a[1]; fl.p[i * 3 + 2] = a[2];
    if (fl.points) { const at = fl.points.geometry.attributes.position; at.setXYZ(i, a[0], a[1], a[2]); at.needsUpdate = true; }
  };
  const movePool = (i, q) => {
    const po = fx.pools; if (!po || i < 0 || !q || i >= po.items.length) return;
    const it = po.items[i]; it.x = q.x; it.y = q.y; it.z = q.z;
    if (po.mesh) { const at = po.mesh.geometry.attributes.position; [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([u, w], k) => at.setXYZ(i * 4 + k, it.x + (u - 0.5) * 2 * it.r, it.y, it.z + (w - 0.5) * 2 * it.r)); at.needsUpdate = true; }
  };
  const isDef = (S) => { const d = rec.get(S.id).S; return Math.hypot(S.x - d.x, S.z - d.z) < 0.01 && Math.abs(S.ry - d.ry) < 0.001; };
  const key = (S) => S.x + ',' + S.z + ',' + S.ry;
  // a yard at a moved place, drawn into a Batcher of its own (cached by pose): its lamp posts are drawn here, its flames / pools are only COMPUTED (apply1 moves them)
  const cache = new Map();
  function drawMoved(S) {
    const Bm = new Batcher(), tm = [], lamps = [];
    const ctxM = { torch(x, y, z, o = {}) {
      const T4 = LAMP && LAMP.on && (o.post || o.sconce) ? LAMP.lamp(Bm, height(x, z), x, y, z, o, []) : null;
      if (o.post && !T4) { const gy = height(x, z); Bm.add(new THREE.CylinderGeometry(0.1, 0.14, y - gy, 6), M.wood, mat4(x, gy + (y - gy) / 2, z), { tint: 0x5a3a22 }); Bm.add(new THREE.CylinderGeometry(0.28, 0.14, 0.35, 8), M.metal, mat4(x, y, z)); }
      lamps.push({ f: T4 ? [T4.x, T4.y, T4.z] : [x, y + 0.35, z], p: o.pool ? { x, y: height(x, z) + 0.06, z } : null });
    }, pool() {} };
    const Y = buildYard({ B: Bm, M, height, tri: tm, ctx: ctxM, bid: 0 }, look, S);
    return { key: key(S), groups: Bm.groups, tri: tm, lamps, y0: Y.y0 };
  }
  let group = null, gKey = '', gMeshes = [];
  const dropGroup = () => { if (!group) return; group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); group.parent && group.parent.remove(group); group = null; gMeshes = []; };
  function apply1(pl) {                                                   // put the default pictures away / back, carry the lamps
    for (const S of pl) {
      const r = rec.get(S.id); if (!r) continue; const def = isDef(S), c = def ? null : cache.get(S.id); if (!def && !c) continue;
      setShown(S.id, def);
      r.lamps.forEach((l, i) => { const w = def ? l.home : c.lamps[i]; if (w) { moveFlame(l.fi, w.f); movePool(l.pi, w.p); } });
      const e = list.find((q) => q.id === S.id); if (e) { e.x = S.x; e.z = S.z; e.ry = S.ry; e.y = def ? r.y0 : c.y0; }
    }
  }
  const movedNow = (pl) => pl.filter((S) => rec.has(S.id) && !isDef(S) && cache.has(S.id));
  function apply2(pl) {                                                   // the moved yards' own Batcher group
    const mv = movedNow(pl), k = mv.map((S) => cache.get(S.id).key + '@' + S.id).join('|');
    if (k === gKey) return; gKey = k; dropGroup(); if (!mv.length) return;
    group = new THREE.Group(); group.name = 'stores-moved'; scene.add(group);
    const Bg = new Batcher();
    for (const S of mv) for (const [mat, g] of cache.get(S.id).groups) { let t = Bg.groups.get(mat); if (!t) Bg.groups.set(mat, t = { geos: [], opts: {} }); t.geos.push(...g.geos); }
    gMeshes = Bg.build(group, { name: 'stores-moved' }); for (const m of gMeshes) patchDestruct(m.material);
    if (onMeshes) onMeshes(gMeshes);
  }
  function apply3(pl) {                                                   // ... and their Tripo pieces (one more mesh)
    const mv = movedNow(pl); if (!group || !mv.length) return;
    const ent = []; for (const S of mv) ent.push(...cache.get(S.id).tri);
    if (ent.length) { const r = TR.bakeTr2(group, W.atlas, ent, { shadows: true, tag: 'st1mv' }); gMeshes = gMeshes.concat(r.meshes); }
  }
  const api = {
    list, meshes: () => gMeshes, onMeshes: null, get moved() { return gKey; },
    get movable() { return attached && !broken; },
    // world.js hands over the static meshes once the batch is built: from now on a yard can be put away
    attach(ms) {
      for (const r of rec.values()) for (const g of r.ranges) {
        const m = ms.find((q) => q.material === g.mat), at = m && m.geometry.attributes.position;
        if (!at || at.isInterleavedBufferAttribute) { broken = true; if (typeof console !== 'undefined') console.warn('ST1 / TR2-S5: no static mesh for a yard range: the storehouses cannot be moved'); continue; }
        runs.get(r.S.id).push({ attr: at, a: g.a, b: g.b, saved: null });
      }
      attached = true;
    },
    setFill(w) { for (const id of STORE_IDS) { const q = w && w[id]; if (q && q.cap > 0) setHeapFill(id, q.n / q.cap); } },
    // rebuildSteps() = the work of showing planStores() (the player's places), in slices of a few ms: one step per yard that moved to a new place (drawn into its own cache), then put away / back + lamps, then
    // the group's meshes, then its Tripo bake.  The live layer runs one step per frame; rebuild() runs them all (start-up, tests).  Every step compares and applies: running them again changes nothing.
    rebuildSteps() {
      if (!attached || broken) return [];
      const pl = (plan ? plan() : Q.stores) || [], out = [];
      for (const S of pl) { if (!rec.has(S.id) || isDef(S)) continue; const c = cache.get(S.id); if (!c || c.key !== key(S)) out.push(() => { cache.set(S.id, drawMoved(S)); }); }
      out.push(() => apply1(pl), () => apply2(pl), () => apply3(pl));
      out.push(() => { for (const id of [...cache.keys()]) { const S = pl.find((q) => q.id === id); if (!S || isDef(S)) cache.delete(id); } });
      return out;
    },
    rebuild() { const st = api.rebuildSteps(); for (const f of st) f(); return st.length; },
  };
  return api;
}
// TR2-S5: end of the movable-yard part of buildStoreYards (everything from its header comment to here is TR2-S5's; the rest of the file is ST1's, untouched)
export function bakeYardTr2(scene, atlas, tri) { return TR.bakeTr2(scene, atlas, tri, { shadows: true, tag: 'st1' }); }
