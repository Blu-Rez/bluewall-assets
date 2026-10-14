// c1_kinds.js — package C1 "the water family" (owner 6 Oct 2026: «شهری که مردم از آب ماهی میگیرن … از آب و کوه طلا» · «ماهی گیری … کنار دریاچه» · «بزرگ تر یعنی مثلا ماهی گیر ها بیشتر بشن»).
// DATA ONLY (no THREE): what stands on a fishery (extras), a river gold-panning claim and a fish smokehouse at every level, how many people / carts / racks they bring, where the workers
// stand, where the smoke comes out.  The procedural parts (nets, sluice boxes, smoke stack, drying sheds, fish baskets) are drawn by c1_proc.js with the same site-local numbers.
//
// SITE FRAME (the same as worksites.js): x = right, z = toward the WATER (the planner passes the water point in site.water; local +z must point at it), metres.
//   The pad is flat inside 0.72 r of the water sites (r = 22 -> 15.8 m); the shore lies at about z = 14 +- 2: everything that must stay dry stands at z < 12 (and inside 15 m of the middle),
//   only the wading workers and the sluice outlets go beyond.  Units: lv 1..30, every number grows with the level ("MORE of everything", not only a bigger model).
//   Levels, costs, unlocks are placeholders (ph): the economy package (E1) / the server owner decide them.

const N = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / 29);            // a at level 1 -> b at level 30 (same as worksites.js countAt)
const tierOf = (lv) => (lv <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv - 1) / 6)));        // 1..5
const P = (n, x, z, ry = 0, s = 1) => ({ n, x, z, ry, s });
const DEG = Math.PI / 180;

// ----------------------------------------------------------------------------------------------------------------------------- kinds
export const KINDS = {
  fishery:    { fa: 'ماهیگیری',          unlock: 6,  paint: '134,120,90', place: 'water', role: 'S', in: ['water'], out: ['fish'] },                        // exists (lake + river); C1 only adds nets + a cleaning table
  panning:    { fa: 'طلاشویی رود',       unlock: 12, paint: '120,112,92', place: 'water', role: 'S', in: ['river'], out: ['gold_dust'] },                   // (ph) unlock 12
  smokehouse: { fa: 'دودخانه‌ی ماهی',    unlock: 8,  paint: '104,86,70',  place: 'water', role: 'P', in: ['fish'],  out: ['dried_fish'], inTown: true },      // (ph) unlock 8
};
// what the planner needs: footprint radius + where the water is (site.water = a point IN the water the site faces; local +z points at it; the shore is ~14 m in front of the middle)
export const FOOTPRINT = { panning: { r: 22 }, smokehouse: { r: 22 } };      // (like the fisheries: the pad is flat inside 0.72 r = 15.8 m, the shore at its edge)
export const WATER_FACING = 'local +z points at site.water; the shore lies 12..16 m in front of the middle (pad edge); dry things stay at z < 12';
// the store each product goes to (stores.js ids) and the cart each site sends (wslife.js CART_OF: [cart piece, load piece, loads on the bed])
export const STORE_OF = { panning: 'gold', smokehouse: 'food' };
export const CART_OF = { panning: ['ws_cart3', 'ws_goldbars', 3], smokehouse: ['ws_cart3', 'ws_farmcrate_empty', 3] };
// small props only drawn near the camera (wsbuild MINOR bucket)
export const MINOR = /^c1_(pan|table|chest|bench|bucketm)$/;
// solid buildings (nav keep-clear circles: [radius] by piece name, see worksites.js SOLID_R)
export const SOLID = { c1_house: 4.4 };

// ----------------------------------------------------------------------------------------------------------------------------- layouts shared with c1_proc.js and the work spots
// panning: sluice boxes in a row along the bank (x), head (high end, the hopper) at z = 2.6, tail (low end) at z = 9.6, the water beyond
const SLUICE_X = [0, -4.0, 4.0, -8.0, 8.0, 12.0];                                    // order they appear: from the middle outward
export const sluiceXs = (lv) => SLUICE_X.slice(0, N(lv, 1, 6));
export const SLUICE = { z0: 2.6, z1: 9.6, hi: 1.55, lo: 0.55 };
// smokehouse
export const SMOKE_STACK = { x: 6.0, z: -6.5, h: 9.6 };                                // main stack: kiln base + brick shaft (c1_proc.js); the smoke leaves at the top
export const SMOKE_STACK2 = { x: -10.5, z: -9.5, h: 7.4 };                             // lv >= 15
export const SHEDS = [{ x: 3.4, z: 2.6, ry: 0 }, { x: 12.2, z: 2.0, ry: 0 }];          // open drying sheds (hanging fish): 0 / 1 / 2 by level
export const shedsAt = (lv) => (lv < 10 ? 0 : lv < 20 ? 1 : 2);
export const RACKS = [[-9, 8.0], [-4.5, 8.0], [0, 8.0], [4.5, 8.0], [9, 8.0], [-6.8, 11.8], [-2.3, 11.8], [2.3, 11.8], [6.8, 11.8], [0, 15.2]];       // ws_fishrack, in this order
export const RACK_KIT = 4;                                                                                                                   // racks 0..3 = kit model, 4..9 = procedural (same size, ~0.5k tris)
export const BASKETS = [[-10, 5.7], [-8, 5.7], [-6, 5.7], [-4, 5.7], [-2, 5.7], [0, 5.7], [2, 5.7], [4, 5.7], [6, 5.7], [8, 5.7], [10, 5.7], [-12, 3.6]];
const LOGS = [[10.5, -6.8], [13, -4.2], [9.6, -10.4], [13.2, -8.6], [6.8, -11.6]];
const BARRELS = [[-9.0, 2.2], [-10.3, 2.9], [-8.2, 3.5], [-11.5, 3.7], [-9.8, 4.3], [-12.2, 2.1]];

// ----------------------------------------------------------------------------------------------------------------------------- what stands on a site (kit pieces only; the procedural parts are in c1_proc.js)
//   piece names: 'ws_*' live in kit_ws.glb (worksites), 'c1_*' in kit_c1.glb (this package); wsbuild merges both kits into one so they share the materials (+0 draw calls)
export const BUILD = {
  // C1 only ADDS to the existing fishery (worksites.js): a table where the catch is cleaned, with its bucket (2 pieces).  The nets between the poles are drawn by c1_proc.js.
  fishery(lv, R, s) {
    return [P('c1_table', -12.6, 3.0, 0.12, 1), P('c1_bucketm', -10.9, 3.9, 0.4, 1)];
  },
  panning(lv, R, s) {
    const o = [], t = tierOf(lv), xs = sluiceXs(lv);
    o.push(P('ws_hut', -12.5, -7.5, 0.35, 0.9));                                         // the claim hut
    if (t >= 3) o.push(P('ws_hut', 12.5, -8.5, -0.4, 0.88));
    if (t >= 5) o.push(P('ws_hut', 0.5, -12.5, 0, 0.9));
    if (t >= 2) o.push(P('ws_stall_empty', 7.5, -9.5, 0.15, 1));                          // the gold weigher's counter
    // pans on the bank beside every sluice + a few more at the washing bench
    xs.forEach((x, i) => o.push(P('c1_pan', x + 1.55, 4.6 + (i % 2) * 0.5, i * 0.9, 1)));
    for (let i = 0; i < N(lv, 0, 4); i++) o.push(P('c1_pan', -4 + i * 1.3, -2.1, i * 1.3, 1));
    // the sorting tables + the strongbox
    for (let i = 0; i < N(lv, 1, 3); i++) o.push(P('c1_table', -6.5 + i * 6.5, -4.6, 0.04 * i, 1));
    o.push(P('c1_chest', -4.7, -2.6, 0.2, 1));
    if (t >= 3) o.push(P('c1_chest', 4.6, -2.6, -0.2, 1));
    row(o, 'ws_nugget', N(lv, 2, 9), -7.6, -4.7, 3.4, -4.4, R, 0.5);
    row(o, 'ws_goldbars', N(lv, 0, 4), -2.5, -6.2, 3.5, -6.3, R, 0.3);
    row(o, 'ws_bucket_wooden_1', N(lv, 2, 7), -13, 2.2, 13, 2.4, R, 1.0);
    row(o, 'ws_barrel', N(lv, 1, 5), 9, -2.5, 15, -3.5, R, 0.6);
    row(o, 'ws_sack', N(lv, 1, 6), 10.5, -4.6, 14.2, -5.4, R, 0.6);
    o.push(P('ws_cauldron', -9, -3, 0, 1.15));                                           // the prospectors' kettle
    if (lv >= 4) o.push(P('c1_bench', -9.8, -0.8, 0.3, 1));
    if (lv >= 9) o.push(P('c1_bench', 9.4, -0.6, -0.2, 1));
    // the claim stakes: a fence along the back (lv >= 5)
    if (lv >= 5) { const n = N(lv, 2, 5); for (let i = 0; i < n; i++) o.push(P('ws_fence', (i - (n - 1) / 2) * 4.2, -12.6 + Math.abs(i - (n - 1) / 2) * 0.15, 0)); }
    if (t >= 4) o.push(P('ws_watchtower2', -14.6, -2.4, 0, 0.7));                           // a lookout over the claims
    return o;
  },
  smokehouse(lv, R, s) {
    const o = [], t = tierOf(lv);
    o.push(P('c1_house', -5, -3.5, 0, 0.9));                                              // the smokehouse proper (door toward the water)
    if (t >= 4) o.push(P('ws_hut', -13.3, -2.4, 0.5, 0.88));                                // the smokers' lodging
    // drying racks full of fish (the model has the fish on it)
    RACKS.slice(0, Math.min(RACK_KIT, N(lv, 2, 10))).forEach(([x, z], i) => o.push(P('ws_fishrack', x, z, (i % 3 - 1) * 0.04, 1)));     // the first RACK_KIT are the real model (2.7k tris each); the rest are drawn light in c1_proc.js
    // fuel for the fire: log piles + split logs beside the kiln
    LOGS.slice(0, N(lv, 1, 5)).forEach(([x, z], i) => o.push(P('ws_logpile', x, z, 0.3 + i * 0.7, 1)));
    // salt barrels, cutting tables, a stool of crates
    BARRELS.slice(0, N(lv, 2, 6)).forEach(([x, z], i) => o.push(P('ws_barrel', x, z, i * 1.3, 1)));
    for (let i = 0; i < N(lv, 1, 3); i++) o.push(P('ws_workbench', [0.2, 9.8, 12.8][i], [-2.9, -1.4, -9.4][i], [0.15, 1.57, 0.4][i], 1));
    row(o, 'ws_fishset', N(lv, 1, 5), -3.2, 5.0, 3.2, 5.0, R, 0.6);                      // crates of smoked fish waiting for the cart
    row(o, 'ws_farmcrate_empty', N(lv, 2, 8), 8, 6.6, 13.5, 6.8, R, 0.5);
    return o;
  },
};
function row(out, name, n, x0, z0, x1, z1, R, jit = 0.5) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push(P(name, x0 + (x1 - x0) * t + (R() - 0.5) * jit, z0 + (z1 - z0) * t + (R() - 0.5) * jit, R() * 6.283, 1)); }
}

// ----------------------------------------------------------------------------------------------------------------------------- counts: people, carts, boats ... grow with the level
export function counts(kind, lv) {
  if (lv <= 0) return {};
  switch (kind) {
    case 'fishery': return { nets: lv >= 12 ? 2 : 1 };                                    // (the rest — workers, boats, fishermen, carts — is worksites.js)
    case 'panning': return { workers: N(lv, 2, 12), sluices: N(lv, 1, 6), pans: N(lv, 2, 10), huts: 1 + (lv >= 13 ? 1 : 0) + (lv >= 25 ? 1 : 0), carts: N(lv, 1, 3) };
    case 'smokehouse': return { workers: N(lv, 2, 10), racks: N(lv, 2, 10), baskets: N(lv, 2, 12), stacks: lv >= 15 ? 2 : 1, sheds: shedsAt(lv), carts: N(lv, 1, 3) };
    default: return {};
  }
}

// ----------------------------------------------------------------------------------------------------------------------------- smoke: where it comes out (site-local x, y above the pad, z) — wsbuild turns them into the world's smoker records
export function smokers(kind, lv) {
  if (kind !== 'smokehouse' || lv <= 0) return [];
  const o = [{ x: SMOKE_STACK.x, y: SMOKE_STACK.h + 0.7, z: SMOKE_STACK.z, heavy: true }];
  if (lv >= 15) o.push({ x: SMOKE_STACK2.x, y: SMOKE_STACK2.h + 0.6, z: SMOKE_STACK2.z, heavy: false });
  return o;
}

// ----------------------------------------------------------------------------------------------------------------------------- the workers (wslife.js TRADES format: { k: crowd kind, f: 1 = woman, w: weight, tasks: [[stand x, z, face x, z, clip, min s, max s]] })
const K = (x, z, fx, fz, clip, a = 6, b = 12) => ({ x, z, fx, fz, clip, a, b });
export const TRADES = {
  panning: (lv) => {
    const xs = sluiceXs(lv);
    const wash = xs.map((x) => K(x, 11.0, x, 8.0, 'Fixing_Kneeling', 8, 15));              // at the tail of the sluice, rinsing the riffles
    const wade = xs.map((x) => K(x + 2.7, 14.3, x + 2.7, 17.0, 'Fixing_Kneeling', 8, 15));   // standing in the shallows, swirling a pan
    const shovel = xs.map((x) => K(x - 1.6, 2.2, x - 2.6, 1.4, 'Interact', 6, 11));         // shovelling gravel into the hopper
    return [
      { k: 'man', w: 3, tasks: [...wash, ...wade] },
      { k: 'man', w: 2, tasks: [...shovel, K(-9.3, -1.2, -9, -3, 'Interact', 5, 9)] },
      { k: 'woman', f: 1, w: 2, tasks: [K(-6.5, -2.4, -6.5, -4.6, 'Interact', 6, 11), K(0, -2.4, 0, -4.6, 'Interact', 6, 11), K(6.5, -2.4, 6.5, -4.6, 'Interact', 6, 11), K(-3, -8.6, -3, -10, 'Idle_Talking_Loop', 5, 9)] },
    ];
  },
  smokehouse: (lv) => {
    const racks = RACKS.slice(0, N(lv, 2, 10)).map(([x, z]) => K(x, z - 2.2, x, z, 'Interact', 6, 11));
    return [
      { k: 'woman', f: 1, w: 3, tasks: [...racks, K(-6, 4.0, -6, 5.7, 'Fixing_Kneeling', 6, 10), K(2, 4.0, 2, 5.7, 'Fixing_Kneeling', 6, 10)] },
      { k: 'man', w: 3, tasks: [K(SMOKE_STACK.x - 2.6, SMOKE_STACK.z + 3.2, SMOKE_STACK.x, SMOKE_STACK.z + 1.6, 'Idle_Torch_Loop', 8, 14), K(8.3, -3.2, 10.4, -6, 'Interact', 6, 11), K(0.6, -1.0, 0.2, -2.6, 'Interact', 6, 11), K(-8.8, 3.8, -10.5, 1.2, 'Interact', 5, 9)] },
    ];
  },
};

export const tier = tierOf;
export { N as countAt };
