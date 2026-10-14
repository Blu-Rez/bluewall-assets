// C4 — the food family (owner 6 Oct 2026: «برا غذا ماهی گیری، گندم که البته هست، گوشت» · «خونه‌ای که بره غذا جمع کنه» · «بزرگ تر یعنی … دام ها بیشتر»).
//   farm → wheat → MILL → flour → BAKERY → bread        livestock → SLAUGHTER → carcasses → BUTCHER → meat        greenhouse → vegetables
// Data only (no scene): worksites.js merges KINDS / BUILD / SOLID_R / counts, wsbuild.js draws the pieces from kit_c4.glb (+ kit_ws.glb) and the procedural parts (PROC).
//   KINDS                -> { kind: { fa, unlock, paint, role, in, out, inTown?, place?, variants?, r? } }   (unlock levels are placeholders (ph): the server owner decides, package E1)
//   BUILD                -> { kind: (lv, R, site) => [{ n, x, z, ry, s }] }   kit pieces local to the site (x right, z toward the road / water, metres); 'c4_*' = kit_c4.glb, 'ws_*' = kit_ws.glb
//   counts(kind, lv, site)-> { workers, carts, animals, ... }   MORE of everything with the level
//   PROC                 -> { kind: (M, lv, R, site) }   the procedural parts that no kit has (oven, bread racks, meat racks), drawn by wsbuild's maker M
//   smokers(kind, lv, site) -> [{ x, y, z, heavy }]   chimney points (site-local) for the existing smoke fx (world.js smokeAt)
//   placeRule(site)      -> 'free' | 'water'   (the water mill must touch the shore)
// Nothing here is hard-wired to a spot: every thing is relative to the site record { id, kind, x, z, ry, r, variant? } so the layout editor can move it.
import * as THREE from 'three';
import { LEVEL_CAP } from './tiers.js';   // TR2-S4b: the level cap (30 today, 50 when the server says so)

export const N = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1));                  // a at level 1 -> b at level 30
export const tierOf = (lv) => (lv <= 0 ? 0 : 1 + Math.min(4, Math.floor(((lv - 1) * 5) / LEVEL_CAP)));              // 1..5 (same steps as worksites.js)
const kS = (lv, a = 0.84, b = 1.1) => a + (b - a) * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1);                       // the main building grows a little (the rest is MORE of everything)

// ---------------------------------------------------------------------------------------------------- the kinds
export const KINDS = {
  farm:       { fa: 'مزرعه',     unlock: 3,  paint: '108,86,52',   role: 'S',   in: 'field',     out: 'wheat' },
  greenhouse: { fa: 'گلخانه',    unlock: 11, paint: '106,94,66',   role: 'S',   in: null,        out: 'vegetables' },
  livestock:  { fa: 'دامداری',   unlock: 5,  paint: '116,102,62',  role: 'S',   in: 'pens',      out: 'livestock' },
  slaughter:  { fa: 'کشتارگاه',  unlock: 9,  paint: '120,102,78',  role: 'S/P', in: 'livestock', out: 'carcasses' },
  mill:       { fa: 'آسیاب',     unlock: 4,  paint: '150,138,110', role: 'P',   in: 'wheat',     out: 'flour',  inTown: true, r: 16,
                variant: 'wind', variants: { wind: { place: 'free', needs: 'flat open ground' }, water: { place: 'water', needs: 'the shore of the river / lake (the wheel touches the water)' } } },
  bakery:     { fa: 'نانوایی',   unlock: 5,  paint: '142,122,96',  role: 'P',   in: 'flour',     out: 'bread',  inTown: true, r: 14 },
  butcher:    { fa: 'قصابی',     unlock: 7,  paint: '132,100,86',  role: 'P',   in: 'livestock', out: 'meat',   inTown: true, r: 14 },
};
export const placeRule = (site) => {
  const k = KINDS[site.kind]; if (!k) return null;
  const v = k.variants && k.variants[site.variant || k.variant];
  return (v && v.place) || k.place || 'free';
};

// ---------------------------------------------------------------------------------------------------- helpers
const Q = (n, x, z, ry = 0, s = 1) => ({ n: 'c4_' + n, x, z, ry, s });           // kit_c4.glb
const W = (n, x, z, ry = 0, s = 1) => ({ n: 'ws_' + n, x, z, ry, s });           // kit_ws.glb (the pieces p38 already ships)
function row(out, mk, n, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push(mk(x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s)); }
}
const piece = (name) => (x, z, ry, s) => (name.startsWith('c4_') ? Q(name.slice(3), x, z, ry, s) : W(name.replace(/^ws_/, ''), x, z, ry, s));
const PI = Math.PI;

// the mill buildings of a site (BUILD and movers() read the same list): body piece (without sails / wheel), place, and the moving part it carries
const WIND_SPIN = -0.7, WHEEL_SPIN = 0.9;                                           // rad / s (the sails: as the p37 windmill, world.js)
function millParts(lv, site) {
  const k = kS(lv), out = [];
  if (site && site.variant === 'water') out.push({ body: 'watermill_nw', part: 'c4_wheel', x: 0, z: -3.2, ry: PI, s: k, spin: WHEEL_SPIN });   // the wheel (it sticks out of the piece's -z wall) turned to the water at local +z
  else {
    out.push({ body: 'windmill_nf', part: 'c4_windmill_fan', x: 0, z: -4, ry: 0, s: k, spin: WIND_SPIN });
    if (lv >= 11) out.push({ body: 'windmill_nf', part: 'c4_windmill_fan', x: -15.5, z: -7, ry: 0.35, s: k * 0.8, spin: WIND_SPIN * 0.85 });
    if (lv >= 22) out.push({ body: 'windmill_nf', part: 'c4_windmill_fan', x: 15.5, z: -8, ry: -0.35, s: k * 0.74, spin: WIND_SPIN * 1.1 });
  }
  return out;
}
// the turning parts (c4_anim.js): site-local placement + spin speed; wsbuild turns it into world coordinates
export function movers(kind, lv, site) { return kind === 'mill' && lv > 0 ? millParts(lv, site).map((m) => ({ n: m.part, x: m.x, z: m.z, ry: m.ry, s: m.s, spin: m.spin })) : []; }

// ---------------------------------------------------------------------------------------------------- what stands on each site
export const BUILD = {
  // MILL (wheat -> flour).  variant 'wind': the sail tower (more towers with the level); variant 'water': the mill house with its wheel turned toward the water (local +z).
  // Around it: flour sacks stacked in rows, grain carts waiting, barrels, a grain barn / silo at the high tiers.
  mill(lv, R, s) {
    const o = [], t = tierOf(lv), water = !!(s && s.variant === 'water'), sacks = N(lv, 3, 18);
    for (const m of millParts(lv, s)) o.push(Q(m.body, m.x, m.z, m.ry, m.s));
    if (!water) {
      row(o, piece('c4_sack'), Math.ceil(sacks / 2), -9, 5.5, 0, 5.8, 0.2, 1, R, 0.5);
      row(o, piece('c4_sack'), Math.floor(sacks / 2), -8, 7.2, -1, 7.6, 0.6, 1, R, 0.5);
      row(o, piece('c4_cart1'), N(lv, 1, 3), 8, 6, 8, 6 + 5 * (N(lv, 1, 3) - 1), PI / 2 + 0.2, 1, R, 0.4);
      o.push(Q('workbench', 5, 3, -0.3), Q('barrel', 11, 2.6, 0), Q('barrel', 12.2, 3.2, 0.4), Q('crate', 3.8, 7.2, 0.3));
      if (t >= 3) o.push(Q('smallbarn', -18, 2, 0.5, 0.85));
      if (t >= 5) o.push(Q('silo', 19, 3, 0, 0.9));
    } else {
      row(o, piece('c4_sack'), Math.ceil(sacks / 2), -14, -4, -9, 0.5, 0.2, 1, R, 0.5);
      row(o, piece('c4_sack'), Math.floor(sacks / 2), -12.5, 0, -9.5, 3, 0.5, 1, R, 0.5);
      row(o, piece('c4_cart1'), N(lv, 1, 3), 11, -3, 11, -3 + 5 * (N(lv, 1, 3) - 1), PI / 2, 1, R, 0.4);
      o.push(Q('workbench', -7, -2, 0.3), Q('barrel', 8, -0.5, 0), Q('barrel', 9.2, 0.1, 0.4), Q('crate', -10, -7, 0.3));
      if (t >= 3) o.push(Q('smallbarn', 17, -11, -0.4, 0.85));
      if (t >= 5) o.push(Q('silo', -18, -10, 0, 0.9));
    }
    if (t >= 2) o.push(Q('hut', water ? -16 : 0, water ? -10 : -17, water ? 0.4 : 0, 0.85));          // the miller's house
    return o;
  },
  // BAKERY (flour -> bread): the two-storey bakehouse with its chimney, a domed brick oven with a flue (PROC), bread racks that multiply, flour sacks, a bread cart
  bakery(lv, R, s) {
    const o = [], t = tierOf(lv), k = kS(lv, 0.86, 1.08), sacks = N(lv, 3, 16);
    o.push(Q('bakery', 0, -5, 0, k));
    row(o, piece('c4_sack'), Math.ceil(sacks / 2), -11, -1, -11, 1 + 1.0 * Math.ceil(sacks / 2), 0.3, 1, R, 0.4);
    row(o, piece('c4_sack'), Math.floor(sacks / 2), -9.2, 0.6, -9.2, 2.6 + 0.9 * Math.floor(sacks / 2), 0.7, 1, R, 0.4);
    o.push(Q('workbench', -5.2, 3.4, 0.1), Q('barrel', 6.5, -2.5, 0), Q('bucket', 5.4, -1.5, 0.5));
    row(o, piece('c4_stallcart'), N(lv, 1, 3), 6, 8, 6 + 5 * (N(lv, 1, 3) - 1), 8, 0.2, 1, R, 0.4);    // bread carts (loaves on top: PROC)
    row(o, piece('c4_cart1'), N(lv, 1, 2), 14, 3, 14, 3 + 5 * (N(lv, 1, 2) - 1), PI / 2, 1, R, 0.4);
    if (t >= 3) o.push(Q('hut', 17, -13, -0.7, 0.85));                                   // the bakers' quarters
    if (t >= 4) o.push(Q('smallbarn', -15, -9, 0.4, 0.8));                               // the flour store
    return o;
  },
  // BUTCHER (livestock -> meat): the butcher's stall-house with its awning, hook racks with hanging meat (PROC), a chopping block, more stalls and cages with the level
  butcher(lv, R, s) {
    const o = [], t = tierOf(lv), k = kS(lv, 1.12, 1.45);
    o.push(Q('butchershop', 0, -5.5, 0, k));
    o.push(Q('workbench', -6.5, 2.5, 0.2), Q('barrel', 8.5, -1, 0), Q('crate', 7.5, 1.2, 0.3), Q('bucket', -2.6, 4.2, 0.9));
    for (let i = 0; i < N(lv, 2, 9); i++) o.push(Q('crate', -11 + (i % 2) * 1.3, 0 + Math.floor(i / 2) * 1.3, 0.1 * i, 1));
    if (lv >= 10) o.push(Q('stall', 9, 6, 0.05));
    if (lv >= 20) o.push(Q('stall', 13.5, 6, -0.1));
    row(o, piece('c4_cart3'), N(lv, 1, 2), 14, -2, 14, -2 + 5 * (N(lv, 1, 2) - 1), PI / 2, 1, R, 0.4);
    if (t >= 3) o.push(Q('hut', -14, -9, 0.6, 0.85));
    if (t >= 5) o.push(Q('smallbarn', 16, -10, -0.3, 0.8));
    return o;
  },
  // SLAUGHTER (improved): a big dark hall instead of the small stall, the stall as its cutting shed, hook racks (PROC) in place of the fish racks
  slaughter(lv, R, s) {
    const o = [], t = tierOf(lv), k = kS(lv, 0.72, 0.9);
    o.push(Q('slaughterhall', 0, -8.5, 0, k));
    o.push(W('butcher', 13.5, -3.5, -0.5, 1.15 + 0.15 * (lv / LEVEL_CAP)));
    row(o, piece('ws_cage_small'), N(lv, 1, 4), -12, 4, 2, 4.5, 0.1, 1, R, 0.5);
    row(o, piece('ws_workbench'), N(lv, 1, 3), 8, 1.5, 14, 1.5, 1.57, 1, R, 0.3);
    row(o, piece('ws_barrel'), N(lv, 2, 6), -5, 9, 8, 9.5, 0.1, 1, R, 0.8);
    o.push(W('cauldron', 6, 3.5, 0), W('cart3', 12, 9, 0.9), W('crate_wooden', 10.5, 5, 0.3));
    for (let i = 0; i < 5; i++) o.push(W('fence', -10.5 + i * 4.2, 13, 0));
    if (t >= 3) o.push(W('stall_empty', -4, 12, 0.1));
    if (t >= 4) o.push(W('hut', -15, -6, 0.6, 0.9));
    return o;
  },
  // FARM (improved): the p38 farm + scarecrows standing in the crop plots (they multiply with the plots)
  farm(lv, R, s) {
    const o = [], t = tierOf(lv), k = (0.76 + 0.24 * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1));
    o.push(W('barn', 0, -9, 0, 0.82 * k + 0.1));
    row(o, piece('ws_silo'), N(lv, 1, 2), 11, -9, 11, -9 + 5 * (N(lv, 1, 2) - 1), 0, 1, R, 0.2);
    row(o, piece('ws_coop'), N(lv, 1, 3), -12, -3, -12, -3 + 4.5 * (N(lv, 1, 3) - 1), 1.57, 1, R, 0.2);
    if (t >= 3) o.push(W('smallbarn', -14, -14, 0.3, 0.9));
    if (t >= 5) o.push(W('openbarn', 15, 8, -0.4, 0.9));
    for (let i = 0; i < 6; i++) { o.push(W('fence', -12.6 + i * 4.2, 6, 0)); if (i < 5) o.push(W('fence', 12.6 - i * 4.2, 6, 0)); }
    o.push(W('cart1', 3, 2.5, 1.0), W('farmcrate_apple', 6, 3.5, 0.2), W('farmcrate_apple', 6.2, 4.4, 0.6), W('barrel_apples', 8, 3.5, 0), W('sack', -6, 3, 0.4), W('bucket_wooden_1', -7, 2.2, 0.9), W('wheelbarrow', -4, 4.5, 0.5));
    const slots = [[-20, -2], [20, -2], [-20, 7], [20, 7], [-20, -11], [20, -11], [-6, -22], [8, -22]];                // the crop plots (wsbuild PROC.farm)
    const plots = N(lv, 2, 8), n = Math.min(plots, N(lv, 1, 5));
    for (let i = 0; i < n; i++) o.push(Q('scarecrow', slots[i][0] + (i & 1 ? -2.2 : 2.2), slots[i][1] + 0.3, 0.4 + i, 1.35));
    return o;
  },
};
// (greenhouse / livestock keep their p38 builders: the sheet shows no weak spot there)

// solid radius (m) of the new standing buildings (worksites.wsSolids: closed to ground units); scarecrows are walk-through
export const SOLID_R = { c4_windmill: 4.2, c4_watermill: 4.6, c4_bakery: 4.0, c4_butchershop: 4.2, c4_slaughterhall: 6.2, c4_hut: 3.6, c4_smallbarn: 3.8, c4_silo: 2.4 };      // (c4_hut / smallbarn / silo: the same radii as the ws_ pieces they copy)
// small props: baked into the near-only group (like worksites MINOR); the buildings are seen from far
export const MINOR = /^c4_(scarecrow|sack|workbench|stallcart|stall|crate|barrel|bucket|cart1|cart3)$/;

// ---------------------------------------------------------------------------------------------------- the life each level brings (workers / carts / ... : wslife.js, the mother wires the trades)
export function counts(kind, lv, site) {
  if (lv <= 0) return {};
  switch (kind) {
    case 'farm': return { workers: N(lv, 2, 10), animals: N(lv, 2, 8), plots: N(lv, 2, 8), carts: N(lv, 1, 2), scarecrows: Math.min(N(lv, 2, 8), N(lv, 1, 5)) };
    case 'livestock': return { workers: N(lv, 1, 6), animals: N(lv, 4, 40), pens: N(lv, 1, 4), carts: N(lv, 1, 2) };
    case 'slaughter': return { workers: N(lv, 2, 8), animals: N(lv, 1, 6), carts: N(lv, 1, 2), racks: N(lv, 1, 3) };
    case 'greenhouse': return { workers: N(lv, 1, 6), houses: N(lv, 1, 5), carts: N(lv, 1, 2) };
    case 'mill': return { workers: N(lv, 2, 9), carts: N(lv, 1, 3), sacks: N(lv, 3, 18), mills: (site && site.variant === 'water') ? 1 : lv >= 22 ? 3 : lv >= 11 ? 2 : 1 };
    case 'bakery': return { workers: N(lv, 2, 9), carts: N(lv, 1, 3), sacks: N(lv, 3, 16), ovens: lv >= 20 ? 3 : lv >= 10 ? 2 : 1, racks: N(lv, 1, 6) };
    case 'butcher': return { workers: N(lv, 2, 7), carts: N(lv, 1, 2), racks: N(lv, 1, 5), stalls: lv >= 20 ? 3 : lv >= 10 ? 2 : 1, crates: N(lv, 2, 9) };
    default: return {};
  }
}

// ---------------------------------------------------------------------------------------------------- smoke (the existing world.js smokeAt): local points
const OVENS = [[8.2, 2.2], [-8.4, 2.4], [13.8, -4.2]];
export function smokers(kind, lv, site) {
  const out = [];
  if (kind === 'bakery') {
    const k = kS(lv, 0.86, 1.08);
    out.push({ x: 1.45 * k, y: 9.7 * k, z: -5.6 * k + 0.1, heavy: false });                          // the bakehouse chimney (tuned on the sheet)
    const n = counts('bakery', lv).ovens; for (let i = 0; i < n; i++) out.push({ x: OVENS[i][0], y: 5.3, z: OVENS[i][1] - 1.45, heavy: lv >= 20 });
  } else if (kind === 'slaughter' && lv >= 12) out.push({ x: 13.5, y: 5.2, z: -3.5, heavy: false });
  return out;
}

// ---------------------------------------------------------------------------------------------------- the procedural parts (wsbuild's maker M: box / cyl / disc / gquad over the site's soup)
const col = (h) => new THREE.Color(h);
const C = { clay: col('#a85a3c'), clay2: col('#8f4a31'), brick: col('#b8694a'), stoneS: col('#8d96a4'), dark: col('#2a2220'), glow: col('#ff9a35'), glow2: col('#ffd070'), wood: col('#7a5a3a'), wood2: col('#6b4e32'),
  crust: col('#dfa04a'), crust2: col('#c98536'), crumb: col('#f0d9a0'), meat: col('#b9605a'), meat2: col('#d98f82'), fat: col('#ecd3c2'), steel: col('#9aa3b0'), flour: col('#d9d2bd'), flour2: col('#cbc3ab'), hook: col('#4b4f58') };
function oven(M, ox, oz) {                                                       // a domed brick oven; the mouth looks to local +z
  M.cyl(M.S, ox, oz, 0, 2.2, 1.0, 12, C.clay2, 2.1);
  M.cyl(M.S, ox, oz, 1.0, 2.05, 0.85, 12, C.clay, 1.55);
  M.cyl(M.S, ox, oz, 1.85, 1.5, 0.7, 12, C.brick, 0.85);
  M.cyl(M.S, ox, oz, 2.55, 0.8, 0.45, 10, C.clay, 0.12);
  M.box(M.S, ox, oz + 1.85, 0.25, 1.5, 1.05, 0.5, 0, C.stoneS);               // arch frame
  M.box(M.S, ox, oz + 2.02, 0.35, 1.0, 0.8, 0.3, 0, C.dark);                  // the mouth
  M.box(M.S, ox, oz + 2.08, 0.4, 0.7, 0.35, 0.22, 0, C.glow); M.box(M.S, ox, oz + 2.1, 0.5, 0.4, 0.18, 0.2, 0, C.glow2);   // the fire inside
  M.box(M.S, ox, oz - 1.45, 0, 1.15, 5.3, 1.15, 0, C.stoneS);                 // the flue behind the dome
  M.box(M.S, ox, oz - 1.45, 5.3, 1.5, 0.3, 1.5, 0, C.clay2);
}
function breadRack(M, rx, rz, ry, R) {                                           // a bread rack: two posts, three shelves, loaves
  const c = Math.cos(ry), s = Math.sin(ry), L = (u, v) => [rx + u * c + v * s, rz - u * s + v * c];
  for (const sd of [-1, 1]) { const [px, pz] = L(sd * 1.15, 0); M.box(M.S, px, pz, 0, 0.14, 2.3, 0.7, ry, C.wood2); }
  for (let sh = 0; sh < 3; sh++) {
    const y = 0.55 + sh * 0.75; M.box(M.S, rx, rz, y, 2.5, 0.08, 0.72, ry, C.wood);
    for (let i = 0; i < 5; i++) { const [px, pz] = L(-0.95 + i * 0.48, (R() - 0.5) * 0.1); M.box(M.S, px, pz, y + 0.08, 0.44, 0.34, 0.58, ry + (R() - 0.5) * 0.2, R() < 0.5 ? C.crust : C.crust2); M.box(M.S, px, pz, y + 0.34, 0.34, 0.12, 0.46, ry, C.crumb); }
  }
}
function meatRack(M, rx, rz, ry, R) {                                            // two posts, a beam, hooks with hanging sides of meat (stylised, no gore)
  const c = Math.cos(ry), s = Math.sin(ry), L = (u, v) => [rx + u * c + v * s, rz - u * s + v * c];
  for (const sd of [-1, 1]) { const [px, pz] = L(sd * 2.0, 0); M.box(M.S, px, pz, 0, 0.2, 2.9, 0.2, ry, C.wood2); }
  M.box(M.S, rx, rz, 2.75, 4.4, 0.2, 0.22, ry, C.wood);
  for (let i = 0; i < 5; i++) {
    const [px, pz] = L(-1.6 + i * 0.8, 0), h = 0.75 + R() * 0.2;
    M.box(M.S, px, pz, 2.2, 0.04, 0.55, 0.04, ry, C.hook);
    M.cyl(M.S, px, pz, 2.2 - h, 0.27, h, 6, i & 1 ? C.meat : C.meat2, 0.1);
    M.box(M.S, px + 0.04, pz + 0.2, 2.2 - h * 0.7, 0.1, h * 0.55, 0.08, ry, C.fat);
  }
}
export const PROC = {
  bakery(M, lv, R) {
    const n = counts('bakery', lv).ovens; for (let i = 0; i < n; i++) oven(M, OVENS[i][0], OVENS[i][1]);
    const racks = counts('bakery', lv).racks; for (let i = 0; i < racks; i++) breadRack(M, -4.5 + i * 3.3 - (i > 3 ? 13.2 : 0), 10.2 + (i > 3 ? 2.6 : 0), 0, R);
    M.disc(M.S, 0, 3.4, 4.6, C.flour, 0.13, 14, 2);                               // the floury yard in front of the door
    for (let c = 0; c < N(lv, 1, 3); c++) for (let i = 0; i < 6; i++) M.box(M.S, 6 + c * 0.0 - 0.9 + (i % 3) * 0.6, 8 + 5 * c - 0.2 + Math.floor(i / 3) * 0.5, 1.15, 0.4, 0.22, 0.45, R() * 0.4, C.crust);   // loaves on the bread carts
  },
  butcher(M, lv, R) {
    const racks = counts('butcher', lv).racks; for (let i = 0; i < racks; i++) meatRack(M, -3 + i * 5.2 - (i > 2 ? 15.6 : 0), 9 + (i > 2 ? 3.4 : 0), 0, R);
    M.cyl(M.S, 4, 3.2, 0, 0.55, 0.78, 8, C.wood, 0.5); M.box(M.S, 4, 3.2, 0.78, 0.6, 0.05, 0.12, 0.6, C.steel);        // chopping block + cleaver
    M.disc(M.S, 0, 2.4, 4.8, C.flour2.clone().multiplyScalar(0.85), 0.13, 14, 2);
  },
  slaughter(M, lv, R) {
    const racks = counts('slaughter', lv).racks; for (let i = 0; i < racks; i++) meatRack(M, 1 + i * 6 + (i > 0 ? 3 : 0), 5.4 + (i & 1) * 0.0, 0, R);
  },
  mill(M, lv, R, site) {
    const water = site && site.variant === 'water';
    if (!water) { M.disc(M.S, -4, 6, 5.2, C.flour, 0.13, 14, 2); return; }                       // the flour yard
    M.disc(M.S, -10, -1.5, 4.6, C.flour, 0.13, 14, 2);
    // the mill race: a wooden trough that carries the river to the wheel (the wheel hangs over its end), planks along both sides
    const z0 = -1.2, z1 = 12.5, wl = col('#4f86b8'), wd = col('#6fa3d2');
    M.gquad(M.S, -1.3, z0, 1.3, z1, wl, 0.16, 2, 6); M.gquad(M.S, -0.8, z0 + 0.5, 0.8, z1 - 0.3, wd, 0.2, 1, 5);
    for (const sd of [-1, 1]) M.box(M.S, sd * 1.45, (z0 + z1) / 2, 0, 0.22, 0.55, z1 - z0, 0, C.wood);
    for (let z = z0 + 1; z < z1; z += 2.6) M.box(M.S, 0, z, 0.55, 3.4, 0.14, 0.34, 0, C.wood2);       // cross planks
  },
};
