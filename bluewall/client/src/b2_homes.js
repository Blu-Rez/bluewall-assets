// b2_homes.js — the four house families of the town: cottage (کلبه), craftsman (خانه‌ی پیشه‌ور), merchant (خانه‌ی تاجر), noble (خانه‌ی اشراف).
// The geometry is the kit web/assets/kit_homes.glb (real Quaternius / KayKit / Kenney CC0 modules, packed by dev/b2_recipe.mjs: ONE flat vertex-colour material, no textures);
// this file only says WHICH kit pieces make a house of a given kind / level / seed, and where they stand.  No THREE, no DOM: it also runs in node (dev/b2_homes_test.sh).
//
//   homePieces(kind, lv, seed) -> [{ n, x, z, ry, s }]   n = kit piece name, x / z in metres LOCAL TO THE LOT (x right, z toward the street, the lot centre = 0,0), ry in radians, s = 1.
//                                  Every piece stands on the ground (y = 0): the chimneys carry their roof height inside the piece.  Feed it to village.js bakePieces (matrix = lot * piece).
//   homeSmoke(kind, lv, seed)  -> [{ x, y, z }] the chimney tops (lot-local) for ctx.smokeAt
//   HOME_KINDS[kind]           -> { fa, w, d, floors, unlock }   w x d = the lot footprint the house + its yard needs (m)
//
// Deterministic per (kind, lv, seed): the same call always returns the same list. The seed picks: roof colour (2 per body), chimney side + type, which side the yard props sit on, a small
// jitter on every prop, and one extra bit of yard clutter.  Everything that depends on the level is stable when a house levels up (a prop never jumps, it only appears).
import { rng } from './noise.js';
import { LEGACY_TIER_AT } from './tiers.js';

// unlock levels are placeholders (ph): the game rules decide.
export const HOME_KINDS = {
  cottage:   { fa: 'کلبه',            w: 9,  d: 9,  floors: 1, unlock: 1 },      // (ph) unlock lv
  craftsman: { fa: 'خانه‌ی پیشه‌ور', w: 9,  d: 10, floors: 2, unlock: 6 },      // (ph)
  merchant:  { fa: 'خانه‌ی تاجر',    w: 8,  d: 11, floors: 3, unlock: 12 },     // (ph)
  noble:     { fa: 'خانه‌ی اشراف',   w: 12, d: 12, floors: 2, unlock: 20 },     // (ph)
};
export const HOME_ORDER = ['cottage', 'craftsman', 'merchant', 'noble'];

// the castle tiers (skin.js TIER_AT): wood / stone / iron / gold / diamond / crystal.  The BODY changes at tiers 2 and 4 (lv 12 / 24: roof colour + size + towers), the yard dressing at every tier.
export const TIER_AT = LEGACY_TIER_AT;                              // TR2-S2: the live array of tiers.js (same steps as skin.js, whatever the level cap)
export const homeTier = (lv) => { lv = +lv || 1; let t = 0; for (let i = 0; i < TIER_AT.length; i++) if (lv >= TIER_AT[i]) t = i; return t; };
export const homeStage = (lv) => { const t = homeTier(lv); return t >= 4 ? 2 : t >= 2 ? 1 : 0; };

const DEG = Math.PI / 180;
// per kind: oz = shift that centres the body + roof + yard on the lot centre; chimney = [x, z, storeys n (the piece carries y = 2.8 + 3 (n - 1))]; stack = from this stage on a second chimney piece is stacked on the first (9 = never).
// dress(stage) = [tier, piece, x, z, ryDeg, side]   side != 0: x flips with the seed's mirror (a wood pile and the fence opposite it stay opposite), 0 = fixed
// clutter = the yard extras one seed picks from (from tier 1 on): { slots: [[x, z]], pool: [piece] }
const K = {
  cottage: {
    oz: 0, chim: (st) => [st === 2 ? 2.1 : 1.1, -1.6, 1], stack: 9,
    dress: (st) => { const sx = st === 2 ? 3.7 : 3.1, fx = st === 2 ? 3.4 : 2.8; return [
      [0, 'p_wood', sx, -0.8, 90, 1],                                   // t0 wood: a wood pile at the side
      [1, 'p_barrel', -2.2, 3.85, 0, 0],                                // t1 stone: a barrel by the door
      [2, 'p_barrow', 1.7, 4.0, 18, 0],                                 // t2 iron: a wheelbarrow
      [3, 'p_sack', fx, 3.9, 20, 0], [3, 'p_bucket', -3.0, 3.7, 0, 0],  // t3 gold: sacks, a bucket
      [4, 'p_fence', -sx, -2.0, 90, -1], [4, 'p_fence', -sx, 0.06, 90, -1],   // t4 diamond: a fence on the other side
      [5, 'p_flag', -fx + 0.4, 3.7, 0, 0],                              // t5 crystal: the blue pennant
    ]; },
    clutter: { slots: [[-2.4, -4.1], [2.4, -4.1]], pool: ['p_sack', 'p_bucket', 'p_barrel', 'p_stone'] },
  },
  craftsman: {
    oz: -0.5, chim: () => [2.1, -1.4, 2], stack: 9,
    dress: () => [
      [0, 'p_bench', -1.4, 4.65, 0, 0], [0, 'p_barrel', -3.7, 4.2, 0, 0],   // the workshop: a workbench in front of the shop window, a barrel
      [0, 'p_sign', 3.05, 3.15, 0, 0],                                        // the hanging shop sign
      [1, 'p_anvil', 0.35, 4.7, 0, 0],                                      // the anvil
      [2, 'p_crates', 3.5, 4.4, -10, 0],                                    // crates beside the door
      [3, 'p_wood', 4.25, -0.5, 90, 1],                                     // timber
      [4, 'p_barrow', -4.2, 1.5, 90, -1],
      [5, 'p_flag', 4.2, 4.7, 0, 0], [5, 'p_torch', 0.9, 3.9, 0, 0],
    ],
    clutter: { slots: [[-3.0, -4.0], [3.0, -4.0]], pool: ['p_sack', 'p_barrel', 'p_stone', 'p_bucket'] },
  },
  merchant: {
    oz: -0.3, chim: () => [1.1, -1.5, 3], stack: 9,
    dress: () => [
      [0, 'p_stall', 0.9, 5.0, 0, 0],                                       // the shop front: a canopied stall in front of the shop window
      [0, 'p_crates', 2.9, 4.1, -20, 0], [0, 'p_sack', -2.6, 3.8, 15, 0],
      [1, 'p_barrel', -3.3, 3.0, 0, 0],
      [3, 'p_barrow', -3.2, 1.2, 90, 0],
      [4, 'p_wagon', 3.15, -0.8, 0, 1],                                     // a cart at the side
      [5, 'p_flag', -2.9, 4.5, 0, 0],
    ],
    clutter: { slots: [[-1.8, -4.3], [1.8, -4.3]], pool: ['p_sack', 'p_barrel', 'p_bucket', 'p_stone'] },
  },
  noble: {
    oz: 0.75, chim: () => [2.1, -4.1, 2], stack: 9,
    dress: () => [
      [0, 'p_torch', -1.75, 4.6, 0, 0], [0, 'p_torch', 1.75, 4.6, 0, 0],    // the gate torches
      [1, 'p_rack', -4.0, 2.2, 0, 0], [1, 'p_barrel', 4.3, 3.4, 0, 0],      // a weapon rack, a barrel
      [2, 'p_flag', -2.4, 4.2, 0, 0],
      [3, 'p_stone', 4.1, 1.7, 90, 0], [3, 'p_sack', 3.5, 3.7, 25, 0],
      [4, 'p_flag', 2.4, 4.2, 0, 0], [4, 'p_barrow', -3.8, 3.8, 30, 0],
      [5, 'p_flag', -4.7, 1.4, 0, 0], [5, 'p_flag', 4.7, 1.2, 0, 0],
    ],
    clutter: null,
  },
};

const hashSeed = (s) => { if (typeof s === 'number' && isFinite(s)) return s | 0; s = String(s); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; };
const KIND_SALT = { cottage: 0x1f3d, craftsman: 0x2a77, merchant: 0x39c1, noble: 0x4b05 };

function plan(kind, lv, seed) {
  const k = K[kind]; if (!k) throw new Error('b2_homes: unknown kind ' + kind);
  const tier = homeTier(lv), st = homeStage(lv), R = rng((hashSeed(seed) ^ Math.imul(KIND_SALT[kind], 0x9e3779b1)) >>> 0);
  const roof = R() < 0.5 ? 'a' : 'b', mir = R() < 0.5 ? -1 : 1, cside = R() < 0.5 ? -1 : 1, ctype = R() < 0.5 ? 'a' : 'b';
  const dress = k.dress(st), jit = dress.map(() => [(R() - 0.5) * 0.3, (R() - 0.5) * 0.3, (R() - 0.5) * 16]);        // drawn for EVERY entry, shown or not: a house that levels up keeps its props where they were
  const cl = k.clutter, cPick = R(), cSlot = R(), cRot = R() * 360;
  const oz = k.oz, P = [], body = kind + '_' + st;
  P.push({ n: body, x: 0, z: oz, ry: 0, s: 1 }, { n: body + '_r' + roof, x: 0, z: oz, ry: 0, s: 1 });
  const [cx, cz, cn] = k.chim(st), x = cside * cx, smoke = [];
  P.push({ n: `chim_${ctype}_${cn}`, x, z: cz + oz, ry: 0, s: 1 });
  let top = 2.8 + 3 * (cn - 1);
  if (st >= k.stack) { P.push({ n: `chim_${ctype}_${cn + 1}`, x, z: cz + oz, ry: 0, s: 1 }); top += 3; }        // (a tall stack, unused for now: every kind has one chimney)
  smoke.push({ x, y: top + 3.1, z: cz + oz });
  dress.forEach(([t, n, dx, dz, ry, side], i) => {                                                      // side != 0: the x of the entry flips with the seed's mirror (so a wood pile and the fence opposite it stay opposite)
    if (t > tier) return;
    const q = jit[i];
    P.push({ n, x: dx * (side ? mir : 1) + q[0], z: dz + oz + q[1], ry: (ry + q[2]) * DEG, s: 1 });
  });
  if (cl && tier >= 1) { const sl = cl.slots[cSlot < 0.5 ? 0 : 1]; P.push({ n: cl.pool[Math.min(cl.pool.length - 1, Math.floor(cPick * cl.pool.length))], x: sl[0], z: sl[1] + oz, ry: cRot * DEG, s: 1 }); }
  return { pieces: P, smoke };
}
export const homePieces = (kind, lv, seed = 0) => plan(kind, lv, seed).pieces;
export const homeSmoke = (kind, lv, seed = 0) => plan(kind, lv, seed).smoke;

// ================================================================================================================================================================================================
// TR2-S4a — the Tripo houses (library keys house_<kind>_0..2 in web/assets/tr2/): ONE model per kind and variant (D8: no tier variants exist), the variant picked by the lot's seed (a lot keeps its house when it
// levels up), the yard dressing from the Tripo prop packs (props_town / props_street) grows with the 6 legacy tiers exactly like the old p_* pieces did.  Piece names are tr2 specs: 'house_cottage_1|w6.6' =
// model + target size (the loader scales so the LARGEST horizontal side is 6.6 m); pack nodes 'props_town/barrels' use the node's own size (tr2/swap.json).  Pure data: runs in node (dev/tr2_s4a_test.sh).
//   homeTr2(kind, lv, seed) -> { pieces: [{ n, x, z, ry, s }] (lot-local: x right, z toward the street, ry in radians), variant, smoke: [{ x, y, z }] }
// HOME_TR2[kind].v[i] = [key, width, height, depth] in metres AFTER the target scale (measured with tr2.info; the test compares them with the lot); the body stands `0.5 m` inside the back edge of the lot so the
// front yard (z > 0) keeps room for the props.
export const HOME_TR2 = {
  cottage:   { w: 6.6,  v: [['house_cottage_0', 6.6, 4.9, 5.5], ['house_cottage_1', 4.8, 6.0, 6.6], ['house_cottage_2', 6.6, 5.4, 6.2]] },
  craftsman: { w: 7.8,  v: [['house_craftsman_0', 7.8, 8.9, 7.0], ['house_craftsman_1', 7.4, 7.3, 7.8], ['house_craftsman_2', 7.8, 7.8, 7.7]] },
  merchant:  { w: 7.4,  v: [['house_merchant_0', 5.8, 9.0, 7.4], ['house_merchant_1', 7.4, 7.8, 5.7], ['house_merchant_2', 7.1, 6.8, 7.4]] },
  noble:     { w: 10.5, v: [['house_noble_0', 10.5, 7.7, 4.4], ['house_noble_1', 10.5, 6.0, 5.2], ['house_noble_2', 10.5, 8.6, 8.6]] },
};
// yard dressing: [tier, pack node, x, z, ryDeg, side]  (side 1: x flips with the seed's mirror; 0 fixed).  A few cheap pieces only (each prop node is 1.2-3 k tris: the town budget decides, not taste).
const TR2_DRESS = {
  cottage:   [[2, 'props_town/barrels', -3.0, 3.3, 0, 1], [4, 'props_town/handcart', 3.1, 3.3, 20, 1], [5, 'props_street/flag', 3.9, 0.6, 0, 1]],
  craftsman: [[1, 'props_town/crates', -3.3, 3.9, -10, 1], [3, 'props_town/barrels', 3.4, 3.9, 0, 1], [5, 'props_street/flag', 4.0, 1.6, 0, 1]],
  merchant:  [[1, 'props_town/sacks', -2.4, 4.7, 15, 1], [3, 'props_town/handcart', 2.6, 4.7, 0, 1], [5, 'props_street/flag', 3.3, 2.6, 0, 1]],
  noble:     [[1, 'props_street/lantern', -3.4, 5.2, 0, 0], [1, 'props_street/lantern', 3.4, 5.2, 0, 0], [3, 'props_street/flag', -5.0, 4.4, 0, 0], [4, 'props_street/flag', 5.0, 4.4, 0, 0]],
};
const DRESS_OK = /^props_street\/(flag|lantern)$/, DRESS_CAP = 2;
export function homeTr2(kind, lv, seed = 0) {
  const k = HOME_TR2[kind]; if (!k) throw new Error('b2_homes: unknown kind ' + kind);
  const R = rng(((hashSeed(seed) ^ Math.imul(KIND_SALT[kind], 0x9e3779b1)) ^ 0x51ed27) >>> 0);
  const vi = Math.min(k.v.length - 1, Math.floor(R() * k.v.length)), mir = R() < 0.5 ? -1 : 1, tier = homeTier(lv), dress = TR2_DRESS[kind];
  const jit = dress.map(() => [(R() - 0.5) * 0.3, (R() - 0.5) * 0.3, (R() - 0.5) * 16]);              // drawn for EVERY entry, shown or not: a house that levels up keeps its props where they were
  const [key, , , depth] = k.v[vi], d = HOME_KINDS[kind].d, zc = -d / 2 + 0.5 + depth / 2, r3 = (v) => Math.round(v * 1000) / 1000;
  const P = [{ n: key + '|w' + k.w, x: 0, z: r3(zc), ry: 0, s: 1 }];
  let shown = 0;                                                                                          // budget (measured, TR2_progress): a barrel / crate / sack / cart costs 1.9-3 k tris = a whole cottage; only the flag (1.25 k) and the lantern (1.56 k) are drawn, at most DRESS_CAP per lot
  dress.forEach(([t, n, dx, dz, ry, side], i) => { if (t > tier || !DRESS_OK.test(n) || shown >= DRESS_CAP) return; shown++; const q = jit[i]; P.push({ n, x: r3(dx * (side ? mir : 1) + q[0]), z: r3(dz + q[1]), ry: r3((ry + q[2]) * DEG), s: 1 }); });
  return { pieces: P, variant: key, smoke: [] };
}
export const homeTr2Files = () => { const s = new Set(); for (const k of Object.keys(HOME_TR2)) for (const v of HOME_TR2[k].v) s.add(v[0]); for (const d of Object.values(TR2_DRESS)) for (const e of d) if (DRESS_OK.test(e[1])) s.add(e[1]); return [...s].sort(); };
