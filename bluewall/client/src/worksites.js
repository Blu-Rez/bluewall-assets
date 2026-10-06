// Worksites (p38, owner 6 Oct 2026: «روح بده به بازی»): the production places of the valley — lumber camps, quarry, iron and gold mines, farm, livestock,
// fisheries, slaughterhouse, greenhouse and the oil field.  A SITE is a fixed spot of the map (layout.js WS_SITES, found by the offline search dev/p38/wsplan.mjs, each on its own
// level pad); what stands on it is a pure function of the site's LEVEL:  pieces(site, lv) -> the kit pieces (local to the site: x right, z toward the road / water, metres),
// counts(site, lv) -> how many workers / animals / boats the level brings.  «بزرگ‌تر یعنی ماهی‌گیرها بیشتر بشن، دام‌ها بیشتر» (owner 6 Oct 18:25): the numbers GROW with the level, the
// model is not just scaled.  This file is data only (no THREE): wsbuild.js turns it into meshes, wslife.js into people and animals; worksites can be moved later (the layout editor,
// p40) because everything is relative to the site's x, z, ry.
//   WS_KINDS                      -> { kind: { fa, unlock, ... } }   (unlock = the castle level at which the kind opens: placeholders, the real rule is the server's — progress.py STRUCTS)
//   sites()                       -> the sites of this map [{ id, kind, x, z, ry, r, link, water? }]
//   wsLevel(site, castle)         -> 0 = locked, 1..30
//   pieces(site, lv)              -> [{ n: 'ws_barn', x, z, ry, s }]   (kit pieces: kit_ws.glb)
//   counts(site, lv)              -> { workers, animals, boats, carts ... }
//   wsD(x, z)                     -> metres from the nearest site's footprint (for the forest / rock / bush keep-clear rules)
//   spur(site)                    -> the haul road [[x,z], ...] from the nearest country road to the site's front
import * as L from './layout.js';
import { rng } from './noise.js';

export const WS_KINDS = {
  lumber:     { fa: 'چوب‌بری',      unlock: 1,  paint: '124,100,64' },
  quarry:     { fa: 'معدن سنگ',    unlock: 2,  paint: '132,128,120' },
  farm:       { fa: 'مزرعه',        unlock: 3,  paint: '108,86,52' },
  livestock:  { fa: 'دامداری',      unlock: 5,  paint: '116,102,62' },
  fishery:    { fa: 'ماهیگیری',     unlock: 6,  paint: '134,120,90', place: 'water' },
  iron:       { fa: 'معدن آهن',     unlock: 8,  paint: '92,86,82' },
  slaughter:  { fa: 'کشتارگاه',     unlock: 9,  paint: '120,102,78' },
  greenhouse: { fa: 'گلخانه',       unlock: 11, paint: '106,94,66' },
  gold:       { fa: 'معدن طلا',     unlock: 14, paint: '124,110,72' },
  oil:        { fa: 'میدان نفت',    unlock: 17, paint: '52,46,42' },
};

// where a player may put a site (owner 6 Oct 19:44: everything is movable, each player arranges his own map; only the gem mines on the mountain are fixed and the fisheries must keep near water):
//   'free' = anywhere flat enough; 'water' = the site's `water` point must stay on the shore.  (The layout editor of the next round reads this; nothing here assumes a fixed spot — every module reads sites().)
export const placeRule = (site) => (WS_KINDS[site.kind] && WS_KINDS[site.kind].place) || 'free';
export const sites = () => L.SITES || [];
export const siteById = (id) => sites().find((s) => s.id === id);
export const wsLevel = (site, castle) => (castle >= WS_KINDS[site.kind].unlock ? Math.max(1, Math.min(30, Math.round(castle))) : 0);
const N = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, lv) - 1) / 29);            // a at level 1 -> b at level 30
export const tierOf = (lv) => (lv <= 0 ? 0 : 1 + Math.min(4, Math.floor((lv - 1) / 6)));  // 1..5 (same steps as the structure looks, skin.js)
const kScale = (lv) => 0.76 + 0.24 * (Math.max(1, lv) - 1) / 29;                           // the main building grows a little with the level (the rest is MORE of everything)

export function wsD(x, z) {
  let d = 1e9;
  for (const s of L.SITES || []) d = Math.min(d, Math.hypot(x - s.x, z - s.z) - s.r);
  return d;
}
export function spur(s) {
  const fx = Math.sin(s.ry), fz = Math.cos(s.ry), a = [s.x + fx * s.r * 0.55, s.z + fz * s.r * 0.55], b = s.link;
  if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 4) return [b, a];
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.05, mz = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.05;
  return [b, [mx, mz], a];
}

// ---------------------------------------------------------------------------------------------------- piece helpers
const P = (n, x, z, ry = 0, s = 1) => ({ n: 'ws_' + n, x, z, ry, s });
const rot = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
// n copies of a piece on a row from (x0,z0) to (x1,z1)
function row(out, name, n, x0, z0, x1, z1, ry = 0, s = 1, R = null, jit = 0) {
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push(P(name, x0 + (x1 - x0) * t + (R ? (R() - 0.5) * jit : 0), z0 + (z1 - z0) * t + (R ? (R() - 0.5) * jit : 0), ry + (R ? (R() - 0.5) * jit * 0.2 : 0), s)); }
}
// n copies in a block of `cols` columns (pitch dx, dz) starting at (x0,z0)
function block(out, name, n, x0, z0, cols, dx, dz, ry = 0, s = 1) { for (let i = 0; i < n; i++) out.push(P(name, x0 + (i % cols) * dx, z0 + Math.floor(i / cols) * dz, ry, s)); }
// n copies scattered in a ring r0..r1 between angles a0..a1 (angle 0 = +z, front), never closer than `gap` to each other
function scatter(out, name, n, R, r0, r1, a0, a1, gap = 2, s0 = 1, s1 = 1, avoid = []) {
  const got = [];
  for (let k = 0; k < n * 14 && got.length < n; k++) {
    const rr = r0 + (r1 - r0) * Math.sqrt(R()), a = a0 + (a1 - a0) * R(), x = Math.sin(a) * rr, z = Math.cos(a) * rr;
    if (got.some((q) => Math.hypot(q[0] - x, q[1] - z) < gap) || avoid.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2])) continue;
    got.push([x, z]); out.push(P(name, x, z, R() * 6.283, s0 + (s1 - s0) * R()));
  }
}
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------------------------------- what stands on each kind of site
const BUILD = {
  // wood: the sawmill at the back, log stacks and carts in the yard, a stump field behind, lumberjacks' huts at the sides
  lumber(lv, R, s) {
    const o = [], k = kScale(lv), t = tierOf(lv);
    o.push(P('lumbermill', 0, -6, 0, 0.78 * k));
    row(o, 'logpile', N(lv, 2, 9), -15, 9, 3, 9, 0.05, 1, R, 0.6);
    if (lv >= 8) row(o, 'logpile', N(lv, 0, 6), -15, 13.5, -2, 13.5, 0.05, 1, R, 0.6);
    row(o, 'logs', N(lv, 1, 6), 8, 8, 16, 14, 0.5, 1, R, 1);
    o.push(P('stumpsA', -12, -17, 0.3, 1), P('stumpsB', 13, -18, 1.2, 1));
    scatter(o, 'stump', N(lv, 5, 22), R, 10, 24, 150 * DEG, 210 * DEG, 2.4, 0.8, 1.3);
    o.push(P('workbench', 9.5, 3, -0.4), P('ladder', 8.2, -6, 1.57), P('cratelong', 11.5, 1, 0.5), P('pallet', 12.5, 4.5, 0.1), P('sack', 12.2, 4.4, 0));
    row(o, 'cart1', N(lv, 1, 2), 2, 17, 2, 17 + 5 * (N(lv, 1, 2) - 1), Math.PI / 2, 1, R, 0.5);
    row(o, 'wheelbarrow', N(lv, 1, 3), -4, 5, 3, 5.5, 0.4, 1, R, 0.5);
    if (t >= 2) o.push(P('hut', -17, -2, 1.2, 0.95));
    if (t >= 4) o.push(P('hut', 18, -5, -1.2, 0.95));
    if (t >= 3) o.push(P('stall_cart_empty', 14.5, 8, -0.8));
    return o;
  },
  // stone: a cut rock face behind, block stacks, cranes and scaffolding, masons' benches
  quarry(lv, R, s) {
    const o = [], t = tierOf(lv);
    o.push(P('rockA', -8, -15, 0.4, 1.0), P('rockB', 9, -17, 2.2, 1.0));
    if (t >= 3) o.push(P('rockC', 0, -20, 1.0, 1.0));
    block(o, 'stoneblocks', N(lv, 3, 16), -14, 3, 4, 3.9, 3.7, 0.15, 1);
    scatter(o, 'boulderC', N(lv, 2, 7), R, 8, 22, 100 * DEG, 260 * DEG, 5, 0.8, 1.3);
    scatter(o, 'boulderD', N(lv, 2, 6), R, 8, 22, -150 * DEG, 150 * DEG, 4, 0.8, 1.2);
    o.push(P('stageB', 10, 0, -0.3, 1.0));
    if (lv >= 7) o.push(P('scaffold', 17, -2, 0, 0.95));
    if (lv >= 15) o.push(P('stageC', -16, -7, 0.5, 1.0));
    row(o, 'ladder', N(lv, 1, 4), -3, -9, 6, -9, 0.0, 1);
    row(o, 'wheelbarrow', N(lv, 1, 4), -4, 8, 6, 8.5, 0.3, 1, R, 0.6);
    row(o, 'cart2', N(lv, 1, 2), 14, 12, 14, 12 + 5 * (N(lv, 1, 2) - 1), Math.PI / 2, 1, R, 0.5);
    o.push(P('workbench', 6, 5, 0.2), P('whetstone', 8, 6.5, 0.4), P('pickaxe_bronze', 7.4, 5.2, 0.8), P('hut', -3, 13, 0, 0.9));
    return o;
  },
  // iron: the mine mouth at the back, rails + ore carts, the smelter (smithy) beside it
  iron(lv, R, s) {
    const o = [], t = tierOf(lv);
    o.push(P('mine', 0, -10, 0, 0.9 + 0.1 * (lv / 30)));
    row(o, 'minecart', N(lv, 1, 4), -3, 1, -3, 14, 0.0, 1, R, 0.3);
    row(o, 'orecart', N(lv, 1, 4), 3, 1, 3, 12, 0.1, 1, R, 0.3);
    if (lv >= 5) o.push(P('smithy', -15, 0, 0.5, 1.0));
    if (lv >= 12) o.push(P('smithy', 16, -2, -0.5, 0.9));
    o.push(P('anvil_log', -9, 6, 0.2), P('cauldron', -10.5, 8, 0), P('chain_coil', 6, 7, 0.4), P('barrel_holder', 9, 9, 0.2), P('workbench', 9, 3, -0.2));
    scatter(o, 'boulderA', N(lv, 2, 6), R, 12, 22, 70 * DEG, 290 * DEG, 5, 0.9, 1.3);
    scatter(o, 'boulderE', N(lv, 2, 6), R, 10, 22, -160 * DEG, 160 * DEG, 4, 0.9, 1.2);
    row(o, 'crate_wooden', N(lv, 2, 8), -7, 12, 8, 12.5, 0.1, 1, R, 0.6);
    if (t >= 3) o.push(P('hut', 17, 8, -1.2, 0.9));
    if (t >= 4) o.push(P('watchtower2', -18, 10, 0, 1.0));
    return o;
  },
  // gold: like the iron mine, but with panned nuggets, bars and a counting house under guard
  gold(lv, R, s) {
    const o = [], t = tierOf(lv);
    o.push(P('mine', 0, -10, 0, 0.9 + 0.1 * (lv / 30)));
    row(o, 'minecart', N(lv, 1, 4), -3, 1, -3, 13, 0.0, 1, R, 0.3);
    row(o, 'orecart', N(lv, 1, 3), 3, 2, 3, 11, 0.1, 1, R, 0.3);
    o.push(P('stageC', -15, 2, 0.5, 1.0), P('workbench', 9, 3, -0.2), P('cage_small', 8, 8, 0.4), P('barrel_holder', 11, 7, 0.3));
    row(o, 'nugget', N(lv, 2, 10), 4, 8, 13, 15, 0.0, 1, R, 1.5);
    row(o, 'nugget2', N(lv, 1, 7), -9, 9, -1, 15, 0.0, 1, R, 1.5);
    row(o, 'goldbars', N(lv, 1, 7), -8, 6, -14, 8, 0.2, 1, R, 0.5);
    row(o, 'coin_pile', N(lv, 1, 3), -6, 12, 2, 13, 0.0, 1, R, 0.5);
    scatter(o, 'boulderA', N(lv, 2, 6), R, 12, 22, 70 * DEG, 290 * DEG, 5, 0.9, 1.3);
    if (t >= 3) o.push(P('watchtower2', 17, 8, 0, 1.0));
    if (t >= 4) o.push(P('hut', -17, 12, 0.6, 0.9));
    if (t >= 5) o.push(P('market', 16, -3, -0.6, 0.9));
    return o;
  },
  // farm: barn + silos + coop, a fenced yard, crop plots that multiply (drawn by wsbuild), scarecrows
  farm(lv, R, s) {
    const o = [], t = tierOf(lv), k = kScale(lv);
    o.push(P('barn', 0, -9, 0, 0.82 * k + 0.1));
    row(o, 'silo', N(lv, 1, 2), 11, -9, 11, -9 + 5 * (N(lv, 1, 2) - 1), 0, 1, R, 0.2);
    row(o, 'coop', N(lv, 1, 3), -12, -3, -12, -3 + 4.5 * (N(lv, 1, 3) - 1), 1.57, 1, R, 0.2);
    if (t >= 3) o.push(P('smallbarn', -14, -14, 0.3, 0.9));
    if (t >= 5) o.push(P('openbarn', 15, 8, -0.4, 0.9));
    // the yard fence: a rectangle in front of the barn, open on the road side
    for (let i = 0; i < 6; i++) { o.push(P('fence', -12.6 + i * 4.2, 6, 0)); if (i < 5) o.push(P('fence', 12.6 - i * 4.2, 6, 0)); }
    o.push(P('cart1', 3, 2.5, 1.0), P('farmcrate_apple', 6, 3.5, 0.2), P('farmcrate_apple', 6.2, 4.4, 0.6), P('barrel_apples', 8, 3.5, 0), P('sack', -6, 3, 0.4), P('bucket_wooden_1', -7, 2.2, 0.9), P('wheelbarrow', -4, 4.5, 0.5));
    return o;
  },
  // livestock: barns at the back, pens that multiply with the level (fenced squares with a trough), a cage + hay
  livestock(lv, R, s) {
    const o = [], t = tierOf(lv), pens = N(lv, 1, 4);
    o.push(P('openbarn', -10, -11, 0.15, 0.9), P('smallbarn', 10, -12, -0.1, 0.9));
    if (t >= 4) o.push(P('barn', 0, -19, 0, 0.8));
    const cells = [[-9, 4], [9, 4], [-9, 16], [9, 16]];
    for (let p = 0; p < pens; p++) {
      const [cx, cz] = cells[p], w = 12.6, d = 8.4;
      for (let i = 0; i < 3; i++) { o.push(P('fence', cx - w / 2 + 2.1 + i * 4.2, cz - d / 2, 0), P('fence', cx - w / 2 + 2.1 + i * 4.2, cz + d / 2, 0)); }
      for (let i = 0; i < 2; i++) { o.push(P('fence', cx - w / 2, cz - d / 2 + 2.1 + i * 4.2, Math.PI / 2), P('fence', cx + w / 2, cz - d / 2 + 2.1 + i * 4.2, Math.PI / 2)); }
      o.push(P('barrel', cx - 1.4, cz + d / 2 - 1.2, 0.3), P('sack', cx + 1.2, cz + d / 2 - 1.2, 0.6));
    }
    o.push(P('cage_small', 0, 9, 0.3), P('cratelong', 1.5, 2.5, 0.3), P('sack', -1.5, 2.2, 0.3));
    return o;
  },
  // fishery (lake or river): jetty running out to the water (local +z), rowboats along it, drying racks and nets on the shore, huts + a fish stall
  fishery(lv, R, s) {
    const o = [], t = tierOf(lv), boats = Math.ceil(N(lv, 1, 9) / 2), jet = lv >= 22 ? 2 : lv >= 11 ? 1 : 0;
    o.push(P('jetty', 0, s.variant === 'river' ? 11 : 15, 0, s.variant === 'river' ? 0.62 : 0.9));
    for (let i = 0; i < boats; i++) { const side = i % 2 ? 1 : -1, j = Math.floor(i / 2); o.push(P('rowboat', side * (5.6 + (j % 2) * 3.2), (s.variant === 'river' ? 13 : 18) + j * 3.4, 1.57 + side * 0.08 + (R() - 0.5) * 0.2, 1)); }
    if (jet >= 1) o.push(P('jetty', 14, s.variant === 'river' ? 9 : 12, 0.35, 0.5));
    if (jet >= 2) o.push(P('jetty', -14, s.variant === 'river' ? 9 : 12, -0.35, 0.5));
    row(o, 'fishrack', N(lv, 1, 4), -14, -4, 14, -4, 0, 1, R, 0.8);
    row(o, 'fishset', N(lv, 2, 6), -9, 5.5, 9, 6.5, 0.0, 1, R, 1.5);
    o.push(P('hut', -15, -12, 0.4, 0.95), P('barrel', 6, -9, 0), P('barrel', 7.2, -9.4, 0), P('bucket_wooden_1', 4.6, -8.4, 0.5));
    if (t >= 2) o.push(P('stall_empty', 10, -9, 0.1));
    if (t >= 3) o.push(P('hut', 16, -12, -0.3, 0.9));
    if (t >= 4) o.push(P('brewhouse', 0, -14, 0, 0.9));
    row(o, 'barrelold', N(lv, 0, 6), -6, -10, 4, -10.5, 0, 1, R, 0.5);
    return o;
  },
  // slaughterhouse (clean, no gore): the butcher's hall, holding cages, meat racks, cart + barrels, a fenced yard
  slaughter(lv, R, s) {
    const o = [], t = tierOf(lv);
    o.push(P('butcher', 0, -6, 0, 1.4 + 0.2 * (lv / 30)));
    o.push(P('smallbarn', -13, -6, 0.2, 0.85));
    row(o, 'cage_small', N(lv, 1, 4), -12, 4, 2, 4.5, 0.1, 1, R, 0.5);
    row(o, 'fishrack', N(lv, 1, 3), 4, 4, 14, 4, 0, 0.95, R, 0.6);
    row(o, 'workbench', N(lv, 1, 3), 8, -4, 14, -4, 1.57, 1, R, 0.3);
    row(o, 'barrel', N(lv, 2, 6), -5, 9, 8, 9.5, 0.1, 1, R, 0.8);
    o.push(P('cauldron', 6, 0, 0), P('cart3', 12, 9, 0.9), P('crate_wooden', 10.5, 1.5, 0.3));
    for (let i = 0; i < 5; i++) o.push(P('fence', -10.5 + i * 4.2, 13, 0));
    if (t >= 3) o.push(P('stall_empty', -4, 12, 0.1));
    if (t >= 4) o.push(P('hut', 15, -8, -0.6, 0.9));
    return o;
  },
  // greenhouse: glass houses (wsbuild draws them: frame, panes, plant rows) — here only the sheds, tubs and crates around them
  greenhouse(lv, R, s) {
    const o = [], t = tierOf(lv);
    o.push(P('hut', -14, -10, 0.3, 0.85));
    row(o, 'barrel', N(lv, 2, 6), -9, 11, 10, 11.5, 0, 1, R, 0.8);
    row(o, 'farmcrate_empty', N(lv, 3, 12), -10, 8.5, 10, 8.8, 0.1, 1, R, 0.8);
    o.push(P('bucket_wooden_1', 3, 9, 0.2), P('wheelbarrow', 6, 9, 0.5), P('sack', 12, 9.5, 0), P('workbench', 14, -8, 1.57));
    if (t >= 3) o.push(P('cart1', 15, 5, 1.2));
    if (t >= 4) o.push(P('stageA', 16, -12, 0.2, 1.0));
    return o;
  },
  // oil (naphtha pits): pools and windlass derricks are drawn by wsbuild; here the jars, barrels, carts and the camel caravan
  oil(lv, R, s) {
    const o = [], t = tierOf(lv);
    row(o, 'barrelold', N(lv, 4, 16), -14, 9, 14, 9.5, 0.0, 1, R, 1.4);
    row(o, 'barrel_holder', N(lv, 1, 3), -13, 13, 13, 13.5, 0.1, 1, R, 0.8);
    scatter(o, 'amphora', N(lv, 4, 22), R, 3, 13, 20 * DEG, 340 * DEG, 1.6, 0.9, 1.25, [[0, 0, 0]]);
    row(o, 'camel', N(lv, 1, 9), -15, 20, 15, 22, 1.57, 1, R, 1.8);
    row(o, 'cart2', N(lv, 1, 2), -10, 16, 10, 17, 0.2, 1, R, 1.0);
    o.push(P('hut', -16, -9, 0.5, 0.9));
    if (t >= 3) o.push(P('stageC', 16, -9, -0.4, 0.95));
    if (t >= 4) o.push(P('watchtower2', 19, 4, 0, 1.0));
    if (t >= 5) o.push(P('smithy', -3, -15, 0, 0.9));
    return o;
  },
};

export function pieces(site, lv) {
  if (lv <= 0) return [];
  const f = BUILD[site.kind]; if (!f) return [];
  const R = rng(((site.x * 73856093) ^ (site.z * 19349663)) >>> 0 || 7);
  return f(lv, R, site);
}
// what the level brings alive: people, animals, boats, carts (wslife.js)
export function counts(site, lv) {
  if (lv <= 0) return {};
  switch (site.kind) {
    case 'lumber': return { workers: N(lv, 2, 14), carts: N(lv, 1, 3) };
    case 'quarry': return { workers: N(lv, 2, 14), carts: N(lv, 1, 3) };
    case 'iron': return { workers: N(lv, 2, 12), carts: N(lv, 1, 4) };
    case 'gold': return { workers: N(lv, 2, 12), carts: N(lv, 1, 4) };
    case 'farm': return { workers: N(lv, 2, 10), animals: N(lv, 2, 8), plots: N(lv, 2, 8), carts: N(lv, 1, 2) };
    case 'livestock': return { workers: N(lv, 1, 6), animals: N(lv, 4, 40), pens: N(lv, 1, 4), carts: N(lv, 1, 2) };
    case 'fishery': return { workers: N(lv, 1, 9) + N(lv, 1, 5), boats: N(lv, 1, 9), fishermen: N(lv, 1, 9), carts: N(lv, 1, 3) };
    case 'slaughter': return { workers: N(lv, 2, 8), animals: N(lv, 1, 6), carts: N(lv, 1, 2) };
    case 'greenhouse': return { workers: N(lv, 1, 6), houses: N(lv, 1, 5), carts: N(lv, 1, 2) };
    case 'oil': return { workers: N(lv, 2, 12), camels: N(lv, 1, 9), wells: N(lv, 1, 7), carts: N(lv, 1, 4) };
    default: return {};
  }
}
// the standing buildings of the worksites that no soldier may walk into: [[x, z, radius], ...] in world metres (nav.js / solids.js).  Max level (all buildings that can ever stand).
const SOLID_R = { lumbermill: 6.8, mine: 6.4, smithy: 4.6, hut: 3.6, market: 4.4, brewhouse: 3.8, barn: 5.4, smallbarn: 3.8, openbarn: 3.6, silo: 2.4, coop: 2.2, watchtower2: 2.2, stageA: 0, butcher: 2.6, waterwheel: 3.2, rockA: 5.6, rockB: 4.8, rockC: 3.4 };
export function wsSolids() {
  const out = [];
  for (const s of sites()) {
    const c = Math.cos(s.ry), sn = Math.sin(s.ry);
    for (const p of pieces(s, 30)) { const r = SOLID_R[p.n.replace(/^ws_/, '')]; if (r) out.push([s.x + p.x * c + p.z * sn, s.z - p.x * sn + p.z * c, r * p.s]); }
  }
  return out;
}
export { N as countAt, kScale };
