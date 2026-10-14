// C3 — gold and oil: the improved gold mine / oil field + two NEW worksites that stand INSIDE the town: the MINT (ضرابخانه) and the REFINERY (پالایشگاه).
// Same shapes as worksites.js: KINDS (like WS_KINDS), BUILD (kind -> (lv, R, site) => kit pieces, local to the site: x right, z toward the road / front, metres),
// counts(kind, lv) (MORE of everything with the level), EXTRA (≤ 2 extra pieces for the old gold / oil sites), FX (flames + smoke, local), SOLIDS, MINOR.
// This file is data only (no THREE, no imports): the pieces come from web/assets/kit_c3.glb (names c3_*) or, for the two old kinds, from the existing kit_ws.glb (ws_*);
// the procedural parts (tanks, pipes, column, flare stack) are in c3_proc.js.  Numbers (unlock levels, counts) are placeholders (ph) — the economy design (E1) decides later.
//   chain:  gold mine (ore) -> mint (coins) -> treasury   ·   oil field (crude) -> refinery (oil) -> oil store
import { LEVEL_CAP } from './tiers.js';   // TR2-S4b: the level cap (30 today, 50 when the server says so)

export const KINDS = {
  gold:     { fa: 'معدن طلا',   unlock: 14, paint: '124,110,72', place: 'mount', role: 'S', in: ['ore'],              out: ['goldore'] },
  oil:      { fa: 'میدان نفت',  unlock: 17, paint: '52,46,42',   place: 'free',  role: 'S', in: ['ground'],           out: ['crude'] },
  mint:     { fa: 'ضرابخانه',   unlock: 15, paint: '118,122,134', place: 'free', role: 'P', in: ['goldore', 'golddust'], out: ['coins'],  inTown: true, r: 17, front: '+z', next: 'treasury' },
  refinery: { fa: 'پالایشگاه',  unlock: 18, paint: '46,52,66',   place: 'free',  role: 'P', in: ['crude'],            out: ['oil'],    inTown: true, r: 18, front: '+z', edge: true },
};

const NN = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1));                 // a at level 1 -> b at level 30 (same as worksites.countAt)
const tier = (lv) => (lv <= 0 ? 0 : 1 + Math.min(4, Math.floor(((lv - 1) * 5) / LEVEL_CAP)));                  // 1..5
const P = (n, x, z, ry = 0, s = 1) => ({ n: (/^(ws|c3)_/.test(n) ? '' : 'c3_') + n, x, z, ry, s });
function row(o, name, n, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); o.push(P(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.25 : 0), s)); }
}
function grid(o, name, n, x0, z0, cols, dx, dz, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n; i++) o.push(P(name, x0 + (i % cols) * dx + (R ? (R() - 0.5) * jit : 0), z0 + Math.floor(i / cols) * dz + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.4 : 0), s));
}

// the compound wall of the mint: 5 segments per side (pitch 4.2 m), the gate in the middle of the front, towers in the corners.  X / Z = half sizes of the yard.
export const MINT_YARD = { X: 9.5, Z: 11.5 };
// the coin chests of the mint (procedural, c3_proc.js): rows in the yard, more with the level; `open` ones show a heap of gold.  Deterministic from R.
export function CHESTS(lv, R) {
  const n = NN(lv, 2, 10), out = [];
  for (let i = 0; i < n; i++) out.push({ x: 2.7 + (i % 4) * 1.95 + (R() - 0.5) * 0.3, z: 4.9 + Math.floor(i / 4) * 1.9 + (R() - 0.5) * 0.3, ry: (R() - 0.5) * 0.3, open: i % 3 === 0 });
  return out;
}

export const BUILD = {
  // MINT: a walled compound.  Back left the striking hall (forge + chimney), back right the stone strong-room (the vault, door to the front); in the yard the coin presses (screw presses),
  // anvils, rows of coin chests, gold-bar stacks, braziers at the vault door and at the gate.  The wall, the gate and the guard towers grow with the level.
  mint(lv, R) {
    const o = [], t = tier(lv), k = 0.9 + 0.1 * (lv - 1) / (LEVEL_CAP - 1), { X, Z } = MINT_YARD;
    o.push(P('vault', 4.9, -6.2, 0, k), P('hall', -4.3, -6.1, 0, 0.84 * k));
    o.push(P('brazier', 4.9, -0.9, 0, 0.75));                                                            // the pair of flame posts at the vault door
    row(o, 'press', NN(lv, 1, 4), -6.6, 3.0, 3.6, 3.0, 0, 1, R, 0.3);
    row(o, 'anvil', NN(lv, 1, 4), -7.2, 6.4, 0.6, 6.4, 0.2, 1, R, 0.4);
    row(o, 'goldbars', NN(lv, 1, 6), 7.4, 1.2, 7.4, 1.2 + 1.3 * Math.max(0, NN(lv, 1, 6) - 1), 0.1, 1, R, 0.3);
    row(o, 'coins', NN(lv, 1, 4), -7.4, 8.4, -1.0, 8.9, 0, 1, R, 0.8);
    row(o, 'barrel', NN(lv, 1, 5), -8.0, 0.2, -4.4, 0.2, 0, 1, R, 0.5);
    if (lv >= 10) row(o, 'crate', NN(lv, 0, 6), -2.2, 9.6, 3.6, 9.6, 0.1, 1, R, 0.5);
    if (t >= 2) { o.push(P('gate', 0, Z, 0, 1), P('brazier', 0, Z + 1.6, 0, 0.75)); for (const sx of [-1, 1]) for (let i = 1; i <= 2; i++) o.push(P('wall', sx * i * 4.2, Z, 0, 1)); }    // the front with the gate
    if (t >= 3) for (const sx of [-1, 1]) for (let i = -2; i <= 2; i++) o.push(P('wall', sx * X, i * 4.2, Math.PI / 2, 1));                                          // the sides
    if (t >= 4) for (let i = -2; i <= 2; i++) o.push(P('wall', i * 4.2, -Z, 0, 1));                                                                                 // the back
    if (t >= 3) o.push(P('gtower', -X, Z, 0, 1), P('gtower', X, Z, 0, 1));                                                                                          // guard towers at the gate
    if (t >= 5) o.push(P('gtower', -X, -Z, 0, 1), P('gtower', X, -Z, 0, 1));
    return o;
  },
  // REFINERY: an industrial yard — the distillation column and the tank farm at the back (procedural, c3_proc.js), horizontal tanks left, the pump house + the elevated crude tank
  // at the right, rows of barrels at the front, a flare stack with a flame.  More tanks, barrels, pipes and a second stack with the level.
  refinery(lv, R) {
    const o = [], t = tier(lv);
    o.push(P('pump', 9.4, 8.8, -0.15, 0.95));
    if (lv >= 12) o.push(P('watertower', 14.2, 0.6, 0, 1.0));
    grid(o, 'barrel', NN(lv, 4, 24), -6.0, 11.2, 8, 1.15, 1.15, 0, 1, R, 0.25);
    if (lv >= 8) row(o, 'crate', NN(lv, 0, 4), 1.2, 3.4, 5.4, 3.4, 0.1, 0.9, R, 0.4);
    return o;
  },
};

// gold / oil: at most TWO extra pieces each, where the sheet showed weakness (names from kit_ws.glb or kit_c3.glb)
export const EXTRA = {
  gold(lv) { const o = []; if (lv >= 8) o.push(P('ws_waterwheel', -17.5, 2.0, 1.2, 0.9)); return o; },   // ore-washing wheel («از آب و کوه»); the locked chest of the day's gold is drawn by c3_proc (gold)
  oil(lv) { const o = []; if (lv >= 4) o.push(P('brazier', 3.8, -9.2, 0.4, 0.8)); return o; },                                                                       // the burning-gas posts of the pits (flame via FX)
};

// workers / carts / guards / animals ... that the level brings (wslife.js reads the keys it knows; the rest is for the HUD / economy)
export function counts(kind, lv) {
  if (lv <= 0) return {};
  switch (kind) {
    case 'gold': return { workers: NN(lv, 2, 12), carts: NN(lv, 1, 4), heaps: NN(lv, 1, 4), bars: NN(lv, 1, 7) };
    case 'oil': return { workers: NN(lv, 2, 12), camels: NN(lv, 1, 9), wells: NN(lv, 1, 7), carts: NN(lv, 1, 4) };
    case 'mint': return { workers: NN(lv, 2, 12), guards: NN(lv, 2, 8), carts: NN(lv, 1, 3), presses: NN(lv, 1, 4), chests: NN(lv, 2, 10) };
    case 'refinery': return { workers: NN(lv, 2, 12), carts: NN(lv, 1, 4), tanks: NN(lv, 1, 6), bullets: NN(lv, 0, 3), barrels: NN(lv, 4, 24), stacks: lv >= 20 ? 2 : 1 };
    default: return {};
  }
}

// flames / smoke (local x, z, y above the pad) — the mother hands them to the world's Flames / smoke (fx.js); nothing new is drawn by this file
export function FX(kind, lv) {
  const f = [], s = [];
  if (kind === 'mint') {
    f.push({ x: 4.9, y: 1.75, z: -0.9, size: 1.4, col: [1, 0.62, 0.25] }, { x: 4.9 + 2.6, y: 1.75, z: -0.9, size: 1.4, col: [1, 0.62, 0.25] });
    if (tier(lv) >= 2) f.push({ x: 0, y: 1.9, z: MINT_YARD.Z + 1.6, size: 1.4, col: [1, 0.62, 0.25] });
    s.push({ x: -4.3 + 3.2, y: 8.4, z: -6.1 - 2.4 });
  } else if (kind === 'refinery') {
    f.push({ x: -13.4, y: 11.9, z: -9.2, size: 3.0, col: [1, 0.5, 0.14] });
    if (lv >= 20) f.push({ x: -13.4, y: 8.9, z: -4.6, size: 2.3, col: [1, 0.55, 0.16] });
    s.push({ x: -2.6, y: 13.4, z: -8.4 });
  } else if (kind === 'oil') {
    if (lv >= 4) f.push({ x: 3.8, y: 1.7, z: -9.2, size: 1.5, col: [1, 0.5, 0.15] });
  }
  return { flames: f, smoke: s };
}

// the standing buildings no soldier may walk into: [x, z, radius] local (the mother's wsSolids() adds the same transform as for the worksites)
export const SOLID_R = { c3_vault: 4.4, c3_hall: 5.6, c3_gtower: 1.9, c3_pump: 3.9, c3_watertower: 1.5, c3_press: 1.4 };
export const SOLIDS_PROC = { refinery: (lv) => { const q = [[-2.2, -8.2, 2.0], [-13.4, -9.2, 0.8]]; for (let i = 0; i < NN(lv, 1, 6); i++) q.push([TANKS[i][0], TANKS[i][1], TANK_R]); return q; } };

// pieces that only show from near (small props) — worksites' LOD splits the bake in two (wsbuild.update)
export const MINOR = /^c3_(barrel|goldbars|coins|crate|anvil)$/;

// shared with c3_proc.js (kept here so the data has one home): the tank farm slots, in the order they fill up with the level
export const TANK_R = 2.6;
export const TANKS = [[6.4, -3.8], [11.6, -3.8], [6.4, -9.2], [11.6, -9.2], [-8.6, -3.8], [-8.6, -9.4]];
export const BULLETS = [[-9.0, 5.6], [-9.0, 9.0], [-9.0, 2.2]];
