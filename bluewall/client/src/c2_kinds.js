// C2 — timber, stone and metal (owner 6 Oct 2026: «از درخت‌ها چوب / از کوه سنگ … سازه‌ای برای چوب آوردن و سازه‌ای برای چوب بریدن، سنگ هم همین‌طور … همه ساختمون‌ها واقعاً کار کنن»).
// Data only (no THREE), same shapes as worksites.js:
//   KINDS   kind -> { fa, unlock (ph), paint, place, role, in, out, inTown?, r }      role: S supply · P processing · T storage · H home · C civic
//   BUILD   kind -> (lv, R, site) => [{ n, x, z, ry, s }]   kit pieces, local to the site (x right, z toward the road, metres).  n = 'c2_*' (kit_c2.glb) or 'ws_*' (kit_ws.glb)
//   EXTRA   kind -> (lv, R, site) => [...]  pieces ADDED to an existing kind (lumber / quarry / iron) — worksites.pieces() appends them
//   counts(kind | site, lv) -> { workers, carts, ... }   MORE of everything with the level
//   FX(kind, lv) -> [{ k: 'smoke' | 'flame', x, y, z, heavy? }]   site-local points for the existing fx (smoke / flames): wsbuild.js turns them into world points in `flames`
//   TRADES / CART_OF   where the workers stand and what the carts carry (wslife.js merges them: see REPORT_C2 "what the mother must wire")
//   SOLID_R / MINOR    nav radii of the big pieces · the small pieces that only appear near the camera
// Every number that is a game rule (unlock levels, in / out ids) is a placeholder `(ph)` — the economy package decides.
import { LEVEL_CAP } from './tiers.js';   // TR2-S4b: the level cap (30 today, 50 when the server says so)

export const KINDS = {
  // the three that exist already: only the economy fields are added (their unlock / paint stay those of worksites.js)
  lumber:   { fa: 'چوب‌بری',     unlock: 1, paint: '124,100,64',  place: 'forest', role: 'S', in: 'trees', out: 'wood' },
  quarry:   { fa: 'معدن سنگ',    unlock: 2, paint: '132,128,120', place: 'mount',  role: 'S', in: 'rock',  out: 'stone' },
  iron:     { fa: 'معدن آهن',    unlock: 8, paint: '92,86,82',    place: 'mount',  role: 'S', in: 'ore',   out: 'ironore' },
  // NEW — processing buildings inside the town (movable by the player later; front side = local +z, footprint radius r <= 18 m)
  sawmill:  { fa: 'اره‌کشی',      unlock: 4, paint: '150,112,70',  place: 'free', role: 'P', in: 'wood',    out: 'planks',   inTown: true, r: 17 },
  masonry:  { fa: 'سنگ‌تراشی',    unlock: 5, paint: '150,154,160', place: 'free', role: 'P', in: 'stone',   out: 'cutstone', inTown: true, r: 17 },
  smelter:  { fa: 'کوره‌ی ذوب',   unlock: 9, paint: '140,76,60',   place: 'free', role: 'P', in: 'ironore', out: 'ironbars', inTown: true, r: 17 },
};

const N = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1));            // a at level 1 -> b at level 30
const tierOf = (lv) => (lv <= 0 ? 0 : 1 + Math.min(4, Math.floor(((lv - 1) * 5) / LEVEL_CAP)));         // 1..5 (same steps as worksites.js)
const kS = (lv, a = 0.8) => a + (1 - a) * (Math.max(1, lv) - 1) / (LEVEL_CAP - 1);                       // the main building grows a little (the rest is MORE of everything)
const P = (n, x, z, ry = 0, s = 1) => ({ n, x, z, ry, s });
function row(out, name, n, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push(P(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s)); }
}
function block(out, name, n, x0, z0, cols, dx, dz, ry = 0, s = 1) { for (let i = 0; i < n; i++) out.push(P(name, x0 + (i % cols) * dx, z0 + Math.floor(i / cols) * dz, ry, s)); }
function scatter(out, name, n, R, r0, r1, a0, a1, gap = 2, s0 = 1, s1 = 1, avoid = []) {
  const got = [];
  for (let k = 0; k < n * 14 && got.length < n; k++) {
    const rr = r0 + (r1 - r0) * Math.sqrt(R()), a = a0 + (a1 - a0) * R(), x = Math.sin(a) * rr, z = Math.cos(a) * rr;
    if (got.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) || avoid.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2])) continue;
    got.push([x, z]); out.push(P(name, x, z, R() * 6.283, s0 + (s1 - s0) * R()));
  }
}
const DEG = Math.PI / 180, HP = Math.PI / 2;

// ---------------------------------------------------------------------------------------------------- counts
export function counts(kind, lv) {
  if (kind && kind.kind) kind = kind.kind;
  if (lv <= 0) return {};
  switch (kind) {
    case 'sawmill': return { workers: N(lv, 2, 12), carts: N(lv, 1, 3), frames: N(lv, 1, 3), stacks: N(lv, 1, 8), logs: N(lv, 2, 8), trestles: N(lv, 1, 3) };
    case 'masonry': return { workers: N(lv, 2, 12), carts: N(lv, 1, 3), tables: N(lv, 1, 4), stacks: N(lv, 1, 8), rough: N(lv, 2, 8), arches: lv >= 20 ? 2 : lv >= 6 ? 1 : 0 };
    case 'smelter': return { workers: N(lv, 2, 10), carts: N(lv, 1, 3), furnaces: N(lv, 1, 3), moulds: N(lv, 1, 3), cold: N(lv, 0, 3), bars: N(lv, 1, 6), ore: N(lv, 1, 3) };
    default: return {};
  }
}

// ---------------------------------------------------------------------------------------------------- what stands on each new site
const FURN = [[9.2, -5.2], [-9.2, -5.2], [12.4, 3.4]];          // furnace spots (smelter), in the order they appear
export const BUILD = {
  // wood → planks: the open saw shed at the back with frame saws (1 → 3), a log ramp feeding it from the left, board stacks drying on the right, trestles and a sharpening wheel
  sawmill(lv, R, site) {
    const o = [], c = counts('sawmill', lv), t = tierOf(lv), k = kS(lv);
    o.push(P('c2_sawdust', 0, 2.0, 0, 1));
    o.push(P('c2_sawshed', 0, -6.2, 0, k));
    const fx = c.frames === 1 ? [0] : c.frames === 2 ? [-2.4, 2.4] : [-4.1, 0, 4.1];
    for (const x of fx) o.push(P('c2_sawframe', x * k, -4.7 * k - 0.3, 0, 0.9 * k));
    o.push(P('c2_logramp', -10.8, -5.6, -HP, 1));
    row(o, 'ws_logpile', c.logs, -15.4, 3.0, -3.2, 3.0, 0.1, 1, R, 0.8);
    block(o, 'c2_plankstack', c.stacks, 6.8, 1.6, 3, 3.5, 2.9, 0.05, 1);
    row(o, 'c2_sawtrestle', c.trestles, -12.5, 8.8, -4.5, 9.4, 0.2, 1, R, 0.8);
    row(o, 'ws_wheelbarrow', N(lv, 1, 3), -1.6, 5.6, 4.0, 6.1, 0.4, 1, R, 0.5);
    o.push(P('c2_grindwheel', -8.4, 0.6, 0.5, 1));
    if (t >= 2) o.push(P('ws_waterwheel', 6.2 * k + 2.2, -6.0, HP, 0.95));
    if (t >= 3) o.push(P('c2_sawshed', 11.8, -8.6, -0.9, 0.38));                // the board store
    if (t >= 4) row(o, 'ws_logs', 3, -9.2, -10.6, -3.8, -10.6, 0, 1, R, 0.4);
    return o;
  },
  // stone → cut stone: the lodge at the back, saw tables (1 → 4) in front of it, rough blocks left, dressed stacks right, a derrick, an arch under construction
  masonry(lv, R, site) {
    const o = [], c = counts('masonry', lv), t = tierOf(lv), k = kS(lv);
    o.push(P('c2_masonlodge', 0, -6.6, 0, k));
    row(o, 'c2_stonesaw', c.tables, -8.2, 3.0, 8.2, 3.0, 0, 1, R, 0.5);
    block(o, 'ws_stoneblocks', c.rough, -12.6, -8.2, 2, 3.8, 3.0, 0.1, 1);
    block(o, 'c2_blockstack', c.stacks, 8.4, -7.6, 2, 4.2, 2.1, 0, 0.85);
    if (lv >= 10) o.push(P('c2_hoist', 12.6, 3.4, -0.5, 0.8));
    if (c.arches >= 1) o.push(P('c2_arch', -10.8, 8.8, 0.35, 0.9));
    if (c.arches >= 2) o.push(P('c2_arch', 8.4, 9.6, -0.3, 0.9));
    row(o, 'c2_drums', N(lv, 0, 3), -4.8, 7.6, 4.2, 12.8, 0.3, 1, R, 0.6);
    o.push(P('c2_grindwheel', -5.2, 0.4, -0.4, 1.1));
    row(o, 'ws_wheelbarrow', N(lv, 1, 3), -2.0, 8.8, 2.0, 9.4, 0.4, 1, R, 0.5);
    scatter(o, 'ws_boulderC', N(lv, 1, 4), R, 10, 13.5, -150 * DEG, -60 * DEG, 5, 0.7, 1.0);
    if (t >= 3) o.push(P('c2_masonlodge', 7.0, -13.2, 0.2, 0.45));              // the dressed-stone store
    return o;
  },
  // iron ore → iron bars: the smeltery hall, tall brick furnaces with their bellows and coal (1 → 3), ingot moulds glowing / cooling, bar stacks, ore heaps
  smelter(lv, R, site) {
    const o = [], c = counts('smelter', lv), t = tierOf(lv), k = kS(lv, 0.85);
    o.push(P('c2_smeltery', 0, -7.6, 0, k));
    for (let i = 0; i < c.furnaces; i++) {
      const [fx, fz] = FURN[i];
      o.push(P('c2_furnace', fx, fz, 0, 1.1), P('c2_bellows', fx - 0.4, fz + 3.9, Math.PI, 1), P('c2_coalheap', fx + (fx > 0 ? 3.0 : -3.0), fz + 0.6, 0, 0.9));
    }
    row(o, 'c2_mouldhot', c.moulds, 5.0, 8.4, 11.8, 8.4, 0.05, 1, R, 0.3);
    row(o, 'c2_mouldcold', c.cold, -10.0, 8.0, -3.8, 8.0, -0.05, 1, R, 0.3);
    block(o, 'c2_barstack', c.bars, -14.2, 1.8, 2, 3.4, 2.5, 0.05, 1);
    const ore = [[-13.6, -3.0], [-13.6, -7.2], [-9.8, -11.2]];
    for (let i = 0; i < c.ore; i++) o.push(P('c2_oreheap', ore[i][0], ore[i][1], i * 1.7, 1));
    row(o, 'ws_minecart', N(lv, 1, 3), -7.0, 5.0, -4.0, 5.0, 0.1, 1, R, 0.3);
    if (t >= 3) o.push(P('c2_smeltery', 0.0, -15.0, 0, 0.4));                 // the ore store
    return o;
  },
};

// ---------------------------------------------------------------------------------------------------- additions to the three supply kinds (≤ 2 new pieces each, only where the sheet shows weakness)
export const EXTRA = {
  lumber(lv, R) { const o = []; if (lv >= 4) o.push(P('c2_sawtrestle', -6.5, 15.0, 0.3, 1)); return o; },
  quarry(lv, R) { const o = []; return o; },
  iron(lv, R) { const o = []; if (lv >= 6) o.push(P('c2_oreheap', 12.5, 12.8, 0.8, 1)); if (lv >= 14) o.push(P('c2_coalheap', -12.8, 13.6, 0.3, 0.9)); return o; },
};

// ---------------------------------------------------------------------------------------------------- fx: smoke from the chimneys, flames at the furnace mouths (site-local metres; wsbuild.js -> world points in `flames`)
export function FX(kind, lv) {
  const out = [];
  if (kind === 'smelter') {
    const k = kS(lv, 0.85), c = counts('smelter', lv);
    out.push({ k: 'smoke', x: -2.8 * k, y: 7.8 * k, z: -7.6 - 1.5 * k, heavy: false });
    for (let i = 0; i < c.furnaces; i++) { const [fx, fz] = FURN[i]; out.push({ k: 'smoke', x: fx, y: 8.4, z: fz, heavy: true }, { k: 'flame', x: fx, y: 1.7, z: fz + 2.1 }); }
    out.push({ k: 'flame', x: 0, y: 0.5, z: -7.6 + 3.7 * k + 0.2 });
  }
  if (kind === 'masonry') out.push({ k: 'smoke', x: 2.2 * kS(lv), y: 7.2 * kS(lv), z: -6.6 - 2.2 * kS(lv), heavy: false });
  return out;
}

// ---------------------------------------------------------------------------------------------------- life: who stands where (wslife.js TRADES shape: { k: 'axe'|'pick'|'man', w, tasks: [K] }) and what the carts carry
const K = (x, z, fx, fz, clip, a = 6, b = 12) => ({ x, z, fx, fz, clip, a, b });
export const TRADES = {
  sawmill: (lv) => {
    const c = counts('sawmill', lv), k = kS(lv), fx = c.frames === 1 ? [0] : c.frames === 2 ? [-2.4, 2.4] : [-4.1, 0, 4.1];
    return [
      { k: 'man', w: 3, tasks: [...fx.map((x) => K(x * k, -2.4, x * k, -6, 'Interact', 8, 14)), K(8.2, 4.2, 8.2, 2.6, 'Fixing_Kneeling', 5, 9), K(-8.4, 2.3, -8.4, 0.6, 'Interact', 5, 8)] },
      { k: 'axe', w: 2, tasks: [K(-12.4, 7.4, -12.4, 9, 'Sword_Attack', 7, 12), K(-9.2, 5.2, -9, 3.4, 'Sword_Attack', 7, 12), K(-9.0, -2.0, -10.8, -4, 'Fixing_Kneeling', 5, 9)] },
      { k: 'man', w: 1, tasks: [K(10.5, 0.2, 10.5, 1.6, 'Idle_Talking_Loop', 5, 9), K(3, 7.4, 3, 5.6, 'Interact', 5, 9)] },
    ];
  },
  masonry: (lv) => {
    const c = counts('masonry', lv), xs = c.tables === 1 ? [0] : Array.from({ length: c.tables }, (_, i) => -8.2 + (16.4 * i) / (c.tables - 1));
    return [
      { k: 'pick', w: 3, tasks: [...xs.map((x) => K(x, 4.7, x, 3, 'Sword_Attack', 8, 14)), K(-10.4, -5.4, -12.6, -8, 'Sword_Attack', 7, 12)] },
      { k: 'man', w: 2, tasks: [K(10.4, 1.2, 10.4, -1.0, 'Interact', 6, 10), K(-5.2, 1.9, -5.2, 0.4, 'Interact', 5, 8), K(10.8, 5.6, 12.6, 3.4, 'Interact', 5, 9)] },
    ];
  },
  smelter: (lv) => {
    const c = counts('smelter', lv), F = FURN.slice(0, c.furnaces);
    return [
      { k: 'man', w: 3, tasks: [...F.map(([fx, fz]) => K(fx - 0.4, fz + 5.3, fx - 0.4, fz + 3.9, 'Interact', 7, 12)), K(8.4, 9.9, 8.4, 8.4, 'Fixing_Kneeling', 6, 10)] },
      { k: 'pick', w: 2, tasks: [K(-3.4, 2.8, -3.4, 1.2, 'Sword_Attack', 8, 14), ...F.map(([fx, fz]) => K(fx, fz + 5.6, fx, fz + 3, 'Sword_Attack', 8, 14))] },
      { k: 'man', w: 1, tasks: [K(-12.0, 4.4, -14.2, 1.8, 'Interact', 5, 9), K(-12.6, -4.6, -14.2, -6.6, 'Fixing_Kneeling', 5, 9)] },
    ];
  },
};
export const CART_OF = { sawmill: ['ws_cart1', 'ws_logs', 3], masonry: ['ws_cart2', 'ws_stoneblocks', 2], smelter: ['ws_cart2', 'ws_boulderA', 2] };
export const SOLID_R = { c2_sawshed: 6.2, c2_masonlodge: 4.6, c2_smeltery: 5.4, c2_furnace: 2.2 };
export const MINOR = /^c2_(sawframe|sawtrestle|sawdust|plankstack|stonesaw|blockstack|drums|mouldhot|mouldcold|barstack|bellows|oreheap|coalheap|grindwheel|logramp)$/;
export const STORES = { sawmill: ['wood', 'planks'], masonry: ['stone', 'cutstone'], smelter: ['iron', 'ironbars'] };      // (ph) store ids read / written (the mother wires stores.js)
