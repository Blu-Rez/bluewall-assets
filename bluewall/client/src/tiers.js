// TR2-S2 — ONE place for «which level looks like what».  Pure data + functions (no THREE, runs in node).
//
// Two systems live here, on purpose:
//   1. the NEW 9-tier table for the Tripo models (castle walls, towers, gates; later keep / houses when 9-tier variants exist):
//        wood, stone, iron, gold, diamond_ice, diamond_green, diamond_red, diamond_black, diamond_blue
//      TIER_TABLE[cap] = { pure: [L0..L8], mid: [m0..m7] }.  Pure tier k from level pure[k]; between two pure levels the first half stays pure k,
//      from mid[k] until pure[k+1] it is HALF / HALF: repeated pieces (wall pieces, towers, a row of houses) show the upper tier on every second
//      SLOT (odd slot index — the slot index is part of the piece, not of its position, so a moved piece keeps its look); single pieces (gate, keep)
//      have no half state: the lower tier stays until the next pure level.
//      For CAP = 50: pure 1, 7, 13, 19, 26, 32, 38, 44, 50 (L_k = round(1 + k (CAP - 1) / 8)); mid 4, 10, 16, 23, 29, 35, 41, 47 (ceil of the middle).
//      The owner changes the look steps by editing TIER_TABLE (an explicit entry wins over the formula).
//   2. the LEGACY 6-tier steps of the procedural structure looks (skin.js shader, b2_homes, b3_civic, upgradeui): wood stone iron gold diamond crystal.
//      Authored on 1..20 inside skin.js (tiers at 1/4/8/12/16/20): the player-facing level is stretched to 1..20 by toInternal20.  At CAP 30 the steps are
//      1 / 6 / 12 / 18 / 24 / 30 (exactly as before TR2); at CAP 50: 1 / 9 / 20 / 30 / 40 / 50.  LEGACY_TIER_AT is ONE live array (mutated in place by setLevelCap),
//      so every module that exports it keeps seeing the current steps.
// The cap comes from balance.json (max_level, generated from the server's progress.py): econ.js, which already imports it, calls setLevelCap(BAL.max_level) when it loads —
// this file stays free of JSON / THREE imports so the raw-node dev tests (b2_homes_test, b3_civic_test ...) can import the structure modules unbundled.  Tests may call setLevelCap(n).

export const TIER_KEYS = ['wood', 'stone', 'iron', 'gold', 'diamond_ice', 'diamond_green', 'diamond_red', 'diamond_black', 'diamond_blue'];
export const TIER_COUNT = TIER_KEYS.length;
export const LEGACY_KEYS = ['wood', 'stone', 'iron', 'gold', 'diamond', 'crystal'];
export const MIN_CAP = 9;                                        // below 9 levels the 9 pure tiers cannot all exist (the table is computed for 9)

// explicit entries win over the formula (the owner's numbers for the cap he named)
export const TIER_TABLE = {
  50: { pure: [1, 7, 13, 19, 26, 32, 38, 44, 50], mid: [4, 10, 16, 23, 29, 35, 41, 47] },
};

const clampCap = (n) => Math.max(MIN_CAP, Math.min(200, Math.round(+n) || 30));
// the formula: pure_k = round(1 + k (CAP - 1) / 8); mid_k = ceil((pure_k + pure_k+1) / 2)
export function computeTable(cap) {
  cap = clampCap(cap);
  const pure = [];
  for (let k = 0; k < TIER_COUNT; k++) pure.push(k === TIER_COUNT - 1 ? cap : Math.round(1 + k * (cap - 1) / (TIER_COUNT - 1)));
  const mid = [];
  for (let k = 0; k < TIER_COUNT - 1; k++) mid.push(Math.ceil((pure[k] + pure[k + 1]) / 2));
  return { pure, mid };
}
const CACHE = {};
export function tableFor(cap) {
  cap = clampCap(cap);
  if (TIER_TABLE[cap]) return TIER_TABLE[cap];
  return CACHE[cap] || (CACHE[cap] = computeTable(cap));
}

// ---------------------------------------------------------------- the live cap
export let LEVEL_CAP = clampCap(30);                            // default until econ.js says otherwise (the server's MAX_LEVEL is 30 today)
export const LEGACY_TIER_AT = [1, 6, 12, 18, 24, 30];            // live (see legacyTierAt / setLevelCap)
// the smallest integer level whose internal 1..20 value reaches x (integer arithmetic: no float edge cases):  (lv - 1) * 19 >= (x - 1) * (cap - 1)
export function legacyTierAt(cap) {
  cap = Math.max(2, Math.round(+cap) || 30);
  const out = [1];
  for (const x of [4, 8, 12, 16, 20]) out.push(1 + Math.ceil(((x - 1) * (cap - 1)) / 19));
  return out;
}
export function setLevelCap(n) {
  LEVEL_CAP = clampCap(n);
  const t = legacyTierAt(LEVEL_CAP);
  for (let i = 0; i < t.length; i++) LEGACY_TIER_AT[i] = t[i];
  return LEVEL_CAP;
}
setLevelCap(LEVEL_CAP);

export const clampLevel = (lv, cap = LEVEL_CAP) => Math.max(1, Math.min(cap, Math.round(+lv) || 1));
// position of a level inside the whole range: 0 at level 1, 1 at the cap (replaces the old (lv - 1) / 29 of the n1 -> n30 interpolations)
export const levelFrac = (lv, cap = LEVEL_CAP) => (clampLevel(lv, cap) - 1) / (cap - 1);

// ---------------------------------------------------------------- legacy 6-tier looks (skin.js 1..20 scale)
// player-facing 1..CAP -> skin.js 1..20 and back.  0 stays 0 (untagged / unknown); at CAP 30 these are the old formulas bit for bit.
export const toInternal20 = (lv) => { lv = Math.max(0, Math.min(LEVEL_CAP, Math.round(+lv) || 0)); return lv <= 1 ? lv : 1 + (lv - 1) * 19 / (LEVEL_CAP - 1); };
export const fromInternal20 = (v) => { v = +v; if (!(v > 0)) return LEVEL_CAP; return Math.max(1, Math.min(LEVEL_CAP, Math.round(v <= 1 ? v : 1 + (v - 1) * (LEVEL_CAP - 1) / 19))); };
// 0..5 = wood stone iron gold diamond crystal, from a player-facing level
export const legacyTier = (lv) => { lv = +lv || 1; let t = 0; for (let i = 0; i < LEGACY_TIER_AT.length; i++) if (lv >= LEGACY_TIER_AT[i]) t = i; return t; };

// ---------------------------------------------------------------- the 9-tier state
// -> { level, cap, lo, hi, half, atPure, nextPure, mid }
//   lo      the tier a SINGLE piece shows (and the lower tier of a half/half pair)
//   hi      the upper tier shown by the odd slots while `half` (== lo otherwise)
//   half    true from mid_k until the next pure level
//   atPure  the level is exactly a pure level (a new material starts here)
//   nextPure the next pure level (null at the top);  mid = start of the half zone below it (null at the top)
export function tierState(level, cap = LEVEL_CAP) {
  const T = tableFor(cap), lv = clampLevel(level, T.pure[TIER_COUNT - 1]);
  let k = 0; while (k < TIER_COUNT - 1 && lv >= T.pure[k + 1]) k++;
  const top = k === TIER_COUNT - 1;
  const mid = top ? null : T.mid[k], nextPure = top ? null : T.pure[k + 1];
  const half = !top && lv >= mid && lv < nextPure;
  return { level: lv, cap: T.pure[TIER_COUNT - 1], lo: k, hi: half ? k + 1 : k, half, atPure: lv === T.pure[k], nextPure, mid };
}
// repeated pieces: the tier of the piece with this slot index at this level (odd slots go up first; stable: depends on the slot only)
export function pieceTier(level, slotIndex, cap = LEVEL_CAP) {
  const s = tierState(level, cap);
  return s.half && (Math.abs(Math.trunc(+slotIndex) || 0) & 1) ? s.hi : s.lo;
}
// single pieces (gate, keep, one-off): no half state
export const singleTier = (level, cap = LEVEL_CAP) => tierState(level, cap).lo;
export const tierKey = (i) => TIER_KEYS[Math.max(0, Math.min(TIER_COUNT - 1, i | 0))];
// which tiers must be resident: `now` = the ones on screen, `soon` = the upper tier one level before its half zone starts (the loader fetches it when idle).
// Nothing else is ever kept: when the level moves on, the tiers outside now + soon are dropped.
export function tiersNeeded(level, cap = LEVEL_CAP, ahead = 1) {
  const s = tierState(level, cap), now = s.half ? [s.lo, s.hi] : [s.lo];
  const soon = !s.half && s.mid != null && s.level >= s.mid - ahead ? [s.lo + 1] : [];
  return { now, soon };
}
