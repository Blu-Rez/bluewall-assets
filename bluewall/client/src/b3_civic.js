// B3 — the CIVIC buildings of the town (owner 6 Oct 2026: «ساختمون ها باید با هم فرق داشته باشن» · «جریان مالیات» · «شهر روح دار و واقعی»):
//   بازار market · میخانه tavern · تالار شهر townhall (the tax house) · کلیسا chapel · چاه well.
// Data only (no THREE): what stands on a lot is a pure function of (kind, level, seed) — kit pieces of web/assets/kit_civic.glb (real KayKit Medieval Hexagon + Quaternius Fantasy Props /
// Medieval Village MegaKit models, all CC0; one vertex-colour material), local to the lot: x right, z toward the street (the front), y = ground, ry about +y (three.js: local +z maps to
// world (sin ry, cos ry)).  Nothing here is hard-wired to a map spot: the town planner (B1) gives every lot { id, kind, x, z, ry, r } and the player may move it later.
//   CIVIC_KINDS                     { kind: { fa, role, place, unlock (ph), w, d } }        footprint { w, d } in metres (x by z), lot-local, centred on the origin
//   civicLevel(kind, castle)        0 = locked, 1..CAP (tiers.js LEVEL_CAP, 30 today)
//   civicTier(lv)                   0..5 = wood stone iron gold diamond crystal (skin.js TIER_AT steps)
//   civicPieces(kind, lv, seed)     [{ n: 'cv_tavern_b', x, z, ry, s }]  deterministic per seed, bakePieces(scene, kit, list) places them as they are
//   civicSolids(kind, lv)           [[x, z, r], ...] lot-local circles nothing may walk into (nav)
//   civicNames()                    every piece name this module can ask for (the test checks them against the kit)
import { rng } from './noise.js';
import { LEGACY_TIER_AT, LEVEL_CAP } from './tiers.js';
import { FLAG_S } from './b2_homes.js';                                              // TR2-S4a-R2: the pennants at 60 %

// unlock levels are placeholders (ph): the economy design (package E1) / the server owner decides
export const CIVIC_KINDS = {
  chapel:   { fa: 'کلیسا',               role: 'C', place: 'free', unlock: 1, w: 18, d: 28 },     // loyalty
  well:     { fa: 'چاه',                 role: 'C', place: 'free', unlock: 1, w: 6,  d: 6 },      // water for the town (small, many)
  townhall: { fa: 'تالار شهر (مالیات)',  role: 'C', place: 'free', unlock: 2, w: 28, d: 22 },     // collects tax; its panel holds the tax-rate slider later
  market:   { fa: 'بازار',               role: 'C', place: 'free', unlock: 3, w: 32, d: 32 },     // trade -> tax bonus
  tavern:   { fa: 'میخانه',              role: 'C', place: 'free', unlock: 6, w: 22, d: 20 },     // loyalty
};
export const civicLevel = (kind, castle) => (CIVIC_KINDS[kind] && castle >= CIVIC_KINDS[kind].unlock ? Math.max(1, Math.min(LEVEL_CAP, Math.round(castle))) : 0);

// the same steps as the structure looks (skin.js TIER_AT, player-facing 1..30): 1 wood · 6 stone · 12 iron · 18 gold · 24 diamond · 30 crystal
export const TIER_AT = LEGACY_TIER_AT;                              // TR2-S2: the live array of tiers.js
export const civicTier = (lv) => { let t = 0; for (let i = 0; i < TIER_AT.length; i++) if (lv >= TIER_AT[i]) t = i; return t; };
const N = (lv, a, b) => Math.round(a + (b - a) * (Math.max(1, Math.min(LEVEL_CAP, lv)) - 1) / (LEVEL_CAP - 1));     // a at level 1 -> b at the top level (cap)
const kScale = (lv) => 0.8 + 0.2 * (Math.max(1, Math.min(LEVEL_CAP, lv)) - 1) / (LEVEL_CAP - 1);                    // the main building grows a little with the level (the rest is MORE of everything)
const DEG = Math.PI / 180, r3 = (v) => Math.round(v * 1000) / 1000;
const P = (n, x, z, ry = 0, s = 1) => ({ n: 'cv_' + n, x: r3(x), z: r3(z), ry: r3(ry), s: r3(s) });
const gold = (t) => (t >= 3 ? 'y' : 'b');                                                          // the gold-roofed twin from the gold tier on (lv 18+)
const face = (x, z) => Math.atan2(-x, -z);                                                         // ry that turns a piece's front (+z) toward the lot centre

const RING = 11.5, RING_SLOTS = (() => {                                                            // the market's stall slots: 15 round the ring, minus the back (market hall)
  const out = [], a0 = 30 * DEG, span = 300 * DEG;
  for (let i = 0; i < 15; i++) { const a = a0 + (span * (i + 0.5)) / 15, x = Math.sin(a) * RING, z = Math.cos(a) * RING; if (Math.abs(x) < 7.5 && z < -6) continue; out.push({ a, x, z }); }
  return out;
})();

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const RING_STEP = (() => { for (let st = Math.round(RING_SLOTS.length * 0.4); st < RING_SLOTS.length; st++) if (gcd(st, RING_SLOTS.length) === 1) return st; return 1; })();   // coprime with the slot count: the first stalls spread round the ring, every slot used once

const BUILD = {
  // ---------------------------------------------------------------- well: one small stone well; richer ones get a bucket, jars, lamps
  well(lv, R) {
    const o = [], t = civicTier(lv), g = gold(t);
    o.push(P('well_' + g, 0, 0, 0, 0.9 + 0.2 * (lv / LEVEL_CAP)));
    o.push(P('bucket', 1.9, 1.2, R() * 6, 1));
    if (t >= 1) o.push(P('barrel', -2.0, 1.6, R() * 6, 0.9));
    if (t >= 2) { o.push(P('amphora', -2.2, -1.1, R() * 6, 1)); o.push(P('amphora', 2.2, -1.3, R() * 6, 0.9)); }
    if (t >= 3) o.push(P('lamp', 2.4, 2.2, 0, 1));
    if (t >= 4) { o.push(P('lamp', -2.4, 2.2, 0, 1)); o.push(P('crate', 0.4, 2.6, 0.3, 1)); }
    if (t >= 5) o.push(P('banner', 0, -2.7, 0, 0.7));
    return o;
  },

  // ---------------------------------------------------------------- chapel: the nave with its bell tower; richer ones get lamps, banners, benches, a vestry and (crystal) two flanking towers
  chapel(lv, R) {
    const o = [], t = civicTier(lv), g = gold(t), ks = kScale(lv);
    o.push(P('church_' + g, 0, -5, 0, ks * 1.05));
    if (t >= 1) { o.push(P('lamp', -3.2, 6.5, 0, 1)); o.push(P('lamp', 3.2, 6.5, 0, 1)); }
    if (t >= 2) { o.push(P('banner', -6, 4.5, 0, 0.8)); o.push(P('banner', 6, 4.5, 0, 0.8)); o.push(P('bench', -4.5, 10, 90 * DEG, 1)); o.push(P('bench', 4.5, 10, 90 * DEG, 1)); }
    if (t >= 2) o.push(P('hall_' + g, 5.2, -11.2, 0, 0.8));                                       // the vestry behind the nave
    if (t >= 3) { o.push(P('amphora', -1.6, 9, R() * 6, 1)); o.push(P('amphora', 1.6, 9, R() * 6, 1)); o.push(P('barrel', -6.6, 8.4, R() * 6, 1)); }
    if (t >= 4) { o.push(P('lamp', -3.2, 11, 0, 1)); o.push(P('lamp', 3.2, 11, 0, 1)); }
    if (t >= 5) { o.push(P('tower_y', -7.2, -2, 0, 0.55)); o.push(P('tower_y', 7.2, -2, 0, 0.55)); }
    return o;
  },

  // ---------------------------------------------------------------- town hall: the tax house.  A hall, then a tower hall (the bell / clock tower in the middle, a wing each side),
  // steps up to the porch with the counting table (ledger, scroll, coins, a strong box), banners; gold roofs + chests + more banners / lamps at the top
  townhall(lv, R) {
    const o = [], t = civicTier(lv), g = gold(t), ks = kScale(lv);
    if (t === 0) o.push(P('hall_b', 0, -5, 0, ks * 1.15));
    else if (t === 1) { o.push(P('wing_' + g, -3.6, -5, 0, ks * 1.05)); o.push(P('tower_' + g, 3.4, -5, 0, ks * 0.85)); }
    else { o.push(P('tower_' + g, 0, -5, 0, ks)); o.push(P('wing_' + g, -6.7, -5, 0, ks * 0.95)); o.push(P('wing_' + g, 6.7, -5, 0, ks * 0.95)); }
    o.push(P('stairs', 0, 0.6, 0, 1));
    o.push(P('counting', -1.0, 5.4, 0, 1));
    if (t >= 1) { o.push(P('banner', -4.2, 3.4, 0, 0.8)); o.push(P('banner', 4.2, 3.4, 0, 0.8)); }
    if (t >= 2) { o.push(P('lamp', -2.6, 2.2, 0, 1)); o.push(P('lamp', 2.6, 2.2, 0, 1)); o.push(P('chest', 4.5, 6.2, -0.3, 1)); }
    if (t >= 3) { o.push(P('bag', 3.0, 6.4, R() * 6, 1)); o.push(P('bag', 3.8, 7.2, R() * 6, 0.9)); o.push(P('barrel', 10.5, 3.5, R() * 6, 1)); o.push(P('crate', -10.5, 3.6, R() * 6, 1)); }
    if (t >= 4) { o.push(P('lamp', -9.2, 3.4, 0, 1)); o.push(P('lamp', 9.2, 3.4, 0, 1)); o.push(P('banner', -8.6, 6.2, 0, 0.8)); o.push(P('banner', 8.6, 6.2, 0, 0.8)); }
    if (t >= 5) { o.push(P('chest', 6.1, 5.4, 0.4, 1.1)); o.push(P('lamp', -12, 6, 0, 1)); o.push(P('lamp', 12, 6, 0, 1)); o.push(P('amphora', -2.4, 8.4, 0, 1.2)); o.push(P('amphora', 3.8, 8.6, 0, 1.2)); }
    return o;
  },

  // ---------------------------------------------------------------- tavern: the big barrel-fronted inn, a yard of benches with mugs, kegs and lamps; richer ones get an annex wing and more tables
  tavern(lv, R) {
    const o = [], t = civicTier(lv), g = gold(t), ks = kScale(lv);
    o.push(P('tavern_' + g, -2.6, -4, 0, ks * 1.05));
    o.push(P('tableset', -3.6, 6.2, R() * 0.2 - 0.1, 1));
    o.push(P('barrel', 4.0, 1.6, R() * 6, 1)); o.push(P('barrel', 5.2, 1.0, R() * 6, 1));
    if (t >= 1) { o.push(P('lamp', 1.4, 3.6, 0, 1)); o.push(P('tableset', 2.8, 7.6, R() * 0.2 - 0.1, 1)); }
    if (t >= 2) { o.push(P('wing_' + g, 6.6, -5, 0, ks * 0.9)); o.push(P('banner', -7.2, 3.0, 0, 0.8)); o.push(P('barrel', 5.0, 2.8, R() * 6, 1)); }
    if (t >= 3) { o.push(P('tableset', 8.4, 6.6, 90 * DEG, 1)); o.push(P('lamp', -7.6, 6.6, 0, 1)); }
    if (t >= 4) { o.push(P('lamp', 5.6, 5.0, 0, 1)); o.push(P('barrel', 9.6, 1.2, R() * 6, 1)); o.push(P('barrel', 10.2, 2.3, R() * 6, 1)); o.push(P('banner', 9.2, 3.4, 0, 0.8)); }
    if (t >= 5) { o.push(P('tableset', -8.4, 8.6, 90 * DEG, 1)); o.push(P('lamp', -9.6, 2.4, 0, 1)); o.push(P('chest', 9.6, -0.2, 0.2, 0.9)); }
    return o;
  },

  // ---------------------------------------------------------------- market: a square — stalls in a ring facing the centre (every stall sells something else), a well, then a market cross; a covered market hall at the back
  market(lv, R) {
    const o = [], t = civicTier(lv), g = gold(t), ks = kScale(lv);
    const hall = t >= 2;
    // the middle: a well, then the market cross (a pillar on a stone plinth)
    if (t < 2) o.push(P('well_b', 0, 0, 0, 1.2 * ks));
    else { o.push(P('cross', 0, 0, 0, 0.9 + 0.1 * (lv / LEVEL_CAP))); }
    if (hall) o.push(P('markethall_' + g, 0, -11.4, 0, 0.95 + 0.05 * (lv / LEVEL_CAP)));
    // the ring of stalls: fixed slots (a stall never moves when the market levels up), the main street comes in at +z so that bit of the ring stays open and the back is kept for the market hall
    const n = N(lv, 4, RING_SLOTS.length), kinds = t >= 3 ? ['veg', 'wine', 'rich', 'pots'] : ['veg', 'wine', 'pots'];
    for (let r = 0; r < n; r++) {
      const j = (r * RING_STEP) % RING_SLOTS.length, sl = RING_SLOTS[j], a = sl.a, x = sl.x, z = sl.z;
      const kind = kinds[j % kinds.length], ry = face(x, z) + (R() - 0.5) * 0.12;
      o.push(P(t === 0 && j % 2 ? 'stall' : 'stall_' + kind, x, z, ry, 1.05));
      // goods lying about the stall (more of them with the level)
      const tx = Math.cos(a), tz = -Math.sin(a);                                                      // the tangent along the ring
      if (j % 2 === 0) o.push(P(kind === 'wine' ? 'barrel' : 'crate', x + tx * 2.6 + Math.sin(a) * 0.4, z + tz * 2.6 + Math.cos(a) * 0.4, R() * 6, 1));
      if (t >= 1 && j % 3 === 0) o.push(P('bag', x - tx * 2.5 + Math.sin(a) * 0.3, z - tz * 2.5 + Math.cos(a) * 0.3, R() * 6, 1));
    }
    if (t >= 1) for (const a of [60, 120, 240, 300]) o.push(P('lamp', Math.sin(a * DEG) * 14.2, Math.cos(a * DEG) * 14.2, 0, 1));
    if (t >= 2) for (const a of [35, 325]) o.push(P('banner', Math.sin(a * DEG) * 14.4, Math.cos(a * DEG) * 14.4, face(Math.sin(a * DEG), Math.cos(a * DEG)), 0.9));
    if (t >= 3) for (const [x, z] of [[-5.8, 2.4], [5.8, 2.4]]) o.push(P('tableset', x, z, 90 * DEG, 0.9));
    if (t >= 4) for (const a of [90, 270]) o.push(P('banner', Math.sin(a * DEG) * 14.4, Math.cos(a * DEG) * 14.4, face(Math.sin(a * DEG), Math.cos(a * DEG)), 0.9));
    return o;
  },
};

export function civicPieces(kind, lv, seed = 1) {
  if (tr2On()) return civicTr2(kind, lv, seed);
  const f = BUILD[kind]; if (!f || lv <= 0) return [];
  const R = rng(((seed | 0) * 2654435761 ^ (kind.length * 40503 + lv * 97)) >>> 0 || 7);
  return f(Math.max(1, Math.min(LEVEL_CAP, Math.round(lv))), R);
}

// circles [x, z, r] (lot-local) of the standing buildings, at the given level (nav / the layout editor's overlap check)
const SOLID_R = { church_b: 6.4, church_y: 6.4, tavern_b: 5.4, tavern_y: 5.4, hall_b: 4.2, hall_y: 4.2, wing_b: 4.4, wing_y: 4.4, tower_b: 3.6, tower_y: 3.6, markethall_b: 6.2, markethall_y: 6.2, well_b: 2.0, well_y: 2.0, cross: 1.7, stall: 1.6, stall_veg: 1.6, stall_wine: 1.6, stall_pots: 1.6, stall_rich: 2.4 };
export function civicSolids(kind, lv, seed = 1) {
  if (tr2On()) return civicTr2Solids(kind, lv, seed);
  const out = [];
  for (const p of civicPieces(kind, lv, seed)) { const r = SOLID_R[p.n.replace(/^cv_/, '')]; if (r) out.push([p.x, p.z, r3(r * p.s)]); }
  return out;
}
export function civicNames() {
  const set = new Set();
  for (const k of Object.keys(BUILD)) for (const lv of LEGACY_TIER_AT.slice()) for (const seed of [1, 2, 3]) for (const p of civicPieces(k, lv, seed)) set.add(p.n);
  return [...set].sort();
}

// ================================================================================================================================================================================================
// TR2-S4a — the Tripo civic buildings.  While the TR2 mode is on (town_build.js switches it on when the game loads; node tests set globalThis.__BW_CIVIC_TR2 = 1) civicPieces / civicSolids return these
// instead of the kit pieces — nothing else changes for the callers (town_plan.js civicBuild / civicLotSolids / townSolids, nav, town_build.js):
//   piece name n = tr2 spec ('civic_hall_0|w20' = model + largest horizontal side in m, 'props_street/lantern' = pack node), x / z lot-local (front = +z), ry in radians, s = 1.
// D8: one model per kind at every level (the library has no tier variants of civic buildings): what grows with the level is the number of market stalls and the yard dressing, as before.
// Models: chapel = shrine_0 (the imamzadeh with the turquoise cone) · townhall = civic_hall_0 · tavern = tavern_0 · market = market_hall at the back + stalls (market_stalls pack) round a stone well ·
// well = well_stone / well_qanat / well_abanbar by seed.  Footprints of the lots stay CIVIC_KINDS w x d (the planner is untouched).
let TR2_ON = false;
export const setCivicTr2 = (on) => { TR2_ON = !!on; };
export const tr2On = () => TR2_ON || !!globalThis.__BW_CIVIC_TR2;
const STALLS = ['stall_spice', 'stall_pottery', 'stall_cloth', 'stall_produce'];
const Q = (n, x, z, ry = 0) => ({ n, x: r3(x), z: r3(z), ry: r3(ry), s: /\/flag$/.test(n) ? FLAG_S : 1 });      // TR2-S4a-R2: pennant 60 % (same anchor: the pivot is the foot)
// nav circles [dx, dz, r] in the piece's own frame (before its ry): from the model sizes at the target scale (hall 13.5 x 20, shrine 10.8 x 12, tavern 12 x 9.8, market hall 18 x 7.3, wells 4.2 / 5, stall 3.2)
const SOL = { civic_hall_0: [[0, -6, 5], [0, 0, 5], [0, 6, 5]], shrine_0: [[0, 0, 6]], tavern_0: [[-3.2, 0, 4.8], [3.2, 0, 4.8]], market_hall: [[-4.8, 0, 4], [4.8, 0, 4]], well_stone: [[0, 0, 2.2]], well_qanat: [[0, 0, 2.2]], well_abanbar: [[0, 0, 2.6]],
  stall_spice: [[0, 0, 1.8]], stall_pottery: [[0, 0, 1.8]], stall_cloth: [[0, 0, 1.8]], stall_produce: [[0, 0, 1.8]] };
const WELLS = ['well_stone|w4.2', 'well_qanat|w4.2', 'well_abanbar|w5'];
const BUILD2 = {
  well(lv, R) {
    const o = [], t = civicTier(lv);
    o.push(Q(WELLS[Math.min(2, Math.floor(R() * 3))], 0, 0, 0));
    if (t >= 3) o.push(Q('props_street/lantern', 2.5, 2.2, 0));
    if (t >= 5) o.push(Q('props_street/flag', -2.6, 1.8, 0));
    return o;
  },
  chapel(lv) {
    const o = [Q('shrine_0|h15', 0, -6, 0)], t = civicTier(lv);
    if (t >= 1) { o.push(Q('props_street/lantern', -3.4, 6.5, 0)); o.push(Q('props_street/lantern', 3.4, 6.5, 0)); }
    if (t >= 2) { o.push(Q('props_street/bench', -4.8, 9.5, Math.PI)); o.push(Q('props_street/bench', 4.8, 9.5, Math.PI)); }
    if (t >= 3) { o.push(Q('props_street/flag', -6.8, 4, 0)); o.push(Q('props_street/flag', 6.8, 4, 0)); }
    if (t >= 4) { o.push(Q('props_street/lantern', -3.4, 12, 0)); o.push(Q('props_street/lantern', 3.4, 12, 0)); }
    return o;
  },
  townhall(lv) {
    const o = [Q('civic_hall_0|w20', 0, -0.5, 0)], t = civicTier(lv);
    if (t >= 1) { o.push(Q('props_street/flag', -8.6, 10.2, 0)); o.push(Q('props_street/flag', 8.6, 10.2, 0)); }
    if (t >= 2) { o.push(Q('props_street/lantern', -5.4, 10.4, 0)); o.push(Q('props_street/lantern', 5.4, 10.4, 0)); }
    if (t >= 3) { o.push(Q('props_town/chest', 7.2, 10.2, 0)); }
    return o;
  },
  tavern(lv) {
    const o = [Q('tavern_0|w12', -3.4, -4.4, 0), Q('props_street/table_stool', -3.6, 5.8, 0), Q('props_town/barrels', 6.4, -3.4, 0)], t = civicTier(lv);
    if (t >= 1) { o.push(Q('props_street/lantern', 2.0, 2.8, 0)); o.push(Q('props_street/table_stool', 3.4, 7.4, 0)); }
    if (t >= 2) { o.push(Q('props_street/flag', -8.8, 3.2, 0)); o.push(Q('props_town/barrels', 7.4, 1.2, 0.5)); }
    if (t >= 3) o.push(Q('props_street/table_stool', 8.6, 6.8, Math.PI / 2));
    if (t >= 4) o.push(Q('props_street/lantern', 6.2, 5.0, 0));
    if (t >= 5) o.push(Q('props_street/flag', 9.4, 3.6, 0));
    return o;
  },
  market(lv, R) {
    const o = [Q('well_stone|w5', 0, 0, 0), Q('market_hall|w18', 0, -11.4, 0)], t = civicTier(lv);
    const n = N(lv, 4, RING_SLOTS.length);
    for (let r = 0; r < n; r++) {                                                                      // fixed slots (a stall never moves when the market levels up), the main street stays open at +z, the back is the hall's
      const j = (r * RING_STEP) % RING_SLOTS.length, sl = RING_SLOTS[j];
      o.push(Q('market_stalls/' + STALLS[j % STALLS.length], sl.x, sl.z, face(sl.x, sl.z) + (R() - 0.5) * 0.12));
    }
    if (t >= 1) for (const a of [60, 120, 240, 300]) o.push(Q('props_street/lantern', Math.sin(a * DEG) * 14.2, Math.cos(a * DEG) * 14.2, 0));
    if (t >= 2) for (const a of [35, 325]) o.push(Q('props_street/flag', Math.sin(a * DEG) * 14.4, Math.cos(a * DEG) * 14.4, face(Math.sin(a * DEG), Math.cos(a * DEG))));
    if (t >= 3) for (const [x, z] of [[-5.8, 2.4], [5.8, 2.4]]) o.push(Q('props_street/table_stool', x, z, Math.PI / 2));
    if (t >= 4) for (const a of [90, 270]) o.push(Q('props_street/flag', Math.sin(a * DEG) * 14.4, Math.cos(a * DEG) * 14.4, face(Math.sin(a * DEG), Math.cos(a * DEG))));
    return o;
  },
};
export function civicTr2(kind, lv, seed = 1) {
  const f = BUILD2[kind]; if (!f || lv <= 0) return [];
  const R = rng(((seed | 0) * 2654435761 ^ (kind.length * 40503 + lv * 97 + 31)) >>> 0 || 7);
  return f(Math.max(1, Math.min(LEVEL_CAP, Math.round(lv))), R);
}
export function civicTr2Solids(kind, lv, seed = 1) {
  const out = [];
  for (const p of civicTr2(kind, lv, seed)) {
    const key = p.n.split('|')[0].split('/').pop(), c = Math.cos(p.ry), sn = Math.sin(p.ry);
    for (const [dx, dz, r] of SOL[key] || []) out.push([r3(p.x + dx * c + dz * sn), r3(p.z - dx * sn + dz * c), r3(r)]);
  }
  return out;
}
export const civicTr2Files = () => {
  const set = new Set();
  for (const k of Object.keys(BUILD2)) for (const lv of [1, 6, 12, 18, 24, 30]) for (const seed of [1, 2, 3, 4, 5, 6]) for (const p of civicTr2(k, lv, seed)) set.add(p.n);
  return [...set].sort();
};
