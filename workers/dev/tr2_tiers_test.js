// TR2-S2: levels -> tiers.  Bundled by dev/tr2_tiers_test.sh (esbuild, node).  Last line: "TR2 TIERS OK"
import * as T from '/home/claude/bot/bluebot_v2/bluewall/client/src/tiers.js';
import * as SK from '/home/claude/bot/bluebot_v2/bluewall/client/src/skin.js';
import { wallLevel } from '/home/claude/bot/bluebot_v2/bluewall/client/src/a1_rings.js';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import * as H from '/home/claude/bot/bluebot_v2/bluewall/client/src/b2_homes.js';
import * as C from '/home/claude/bot/bluebot_v2/bluewall/client/src/b3_civic.js';
import * as TP from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
import { castleLevel } from '/home/claude/bot/bluebot_v2/bluewall/client/src/town_plan.js';
import fs from 'node:fs';
// upgradeui.js pulls in the DOM (assets.js uses window): it cannot load in node, so its tierOf is checked by text (it must BE tiers.js legacyTier) and by value
const UI = { tierOf: T.legacyTier, src: fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/upgradeui.js', 'utf8') };

let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const CAPS = [9, 10, 12, 20, 25, 30, 40, 50, 64, 99, 100, 150];
const SPEC50 = { pure: [1, 7, 13, 19, 26, 32, 38, 44, 50], mid: [4, 10, 16, 23, 29, 35, 41, 47] };

// ---- 1. the table
console.log('== 1. TIER_TABLE');
ok(eq(T.TIER_TABLE[50], SPEC50), 'cap 50: pure 1 7 13 19 26 32 38 44 50 / half from 4 10 16 23 29 35 41 47 (the owner\'s numbers, explicit entry)');
ok(eq(T.computeTable(50), SPEC50), 'the FORMULA gives the same numbers for 50 (L_k = round(1 + k (CAP-1) / 8), mid = ceil of the middle)');
console.log('     cap 30 (formula): pure ' + T.tableFor(30).pure.join(' ') + ' | half from ' + T.tableFor(30).mid.join(' '));
for (const cap of CAPS) {
  const t = T.tableFor(cap), p = t.pure, m = t.mid;
  const inc = p.every((v, i) => i === 0 || v > p[i - 1]), ends = p[0] === 1 && p[8] === cap && m.length === 8;
  const midOk = m.every((v, i) => v >= p[i] && v <= p[i + 1]);
  ok(inc && ends && midOk, 'cap ' + cap + ': pure levels strictly increasing, 1 .. cap, mid inside each step');
}
ok(eq(T.TIER_KEYS, ['wood', 'stone', 'iron', 'gold', 'diamond_ice', 'diamond_green', 'diamond_red', 'diamond_black', 'diamond_blue']), 'the 9 tier keys are the library\'s (castle_wall_<key> ...)');

// ---- 2. every level 1..CAP valid, monotone, pure at the table levels, half alternates, stable
console.log('== 2. tierState / pieceTier / singleTier');
for (const cap of CAPS) {
  const t = T.tableFor(cap); let bad = [], prevLo = 0, prevHi = 0, mono = true, slots = new Array(12).fill(0), slotMono = true, halfSeen = 0, halfBad = 0, pureBad = 0, singleBad = 0, stable = true;
  for (let lv = 1; lv <= cap; lv++) {
    const s = T.tierState(lv, cap);
    if (!(s.level === lv && s.lo >= 0 && s.lo <= 8 && (s.hi === s.lo || (s.half && s.hi === s.lo + 1)) && (s.half ? lv >= s.mid && lv < s.nextPure : true))) bad.push(lv);
    if (s.lo < prevLo || s.hi < prevHi) mono = false; prevLo = s.lo; prevHi = s.hi;
    const k = t.pure.indexOf(lv); if (k >= 0 && !(s.lo === k && s.hi === k && !s.half && s.atPure)) pureBad++;       // pure at the table levels
    if (k < 0 && s.atPure) pureBad++;
    if (T.singleTier(lv, cap) !== s.lo) singleBad++;                                                                // single pieces: no half state
    for (let i = 0; i < slots.length; i++) {
      const pt = T.pieceTier(lv, i, cap);
      if (pt < slots[i]) slotMono = false; slots[i] = pt;                                                           // a slot never goes back down
      if (T.pieceTier(lv, i, cap) !== pt) stable = false;                                                           // depends on (level, slot) only
      const want = s.half && (i & 1) ? s.hi : s.lo; if (pt !== want) halfBad++;
    }
    if (s.half) { halfSeen++; if (T.pieceTier(lv, 0, cap) !== s.lo || T.pieceTier(lv, 1, cap) !== s.hi || T.pieceTier(lv, 2, cap) !== s.lo || T.pieceTier(lv, 3, cap) !== s.hi) halfBad++; }
  }
  ok(!bad.length, 'cap ' + cap + ': every level 1..' + cap + ' gives a valid state' + (bad.length ? ' BAD ' + bad.slice(0, 8) : ''));
  ok(mono && slotMono, 'cap ' + cap + ': monotone (single tier, upper tier and every slot never go back down)');
  ok(!pureBad && T.tierState(1, cap).lo === 0 && T.tierState(cap, cap).lo === 8 && T.tierState(cap, cap).atPure, 'cap ' + cap + ': pure at every table level (wood at 1, diamond_blue at the cap)');
  ok(!halfBad && !singleBad && stable, 'cap ' + cap + ': half/half alternates by slot (even = lower, odd = upper), single pieces never half, stable (' + halfSeen + ' half levels)');
}
{ // stable on move: the tier is a function of the slot index only — the position of the piece is not an input
  ok(T.pieceTier.length <= 3, 'pieceTier takes (level, slotIndex[, cap]) — no position, so a moved piece keeps its look');
  const s = T.tierState(29, 50); ok(s.half && s.lo === 4 && s.hi === 5 && T.pieceTier(29, 4, 50) === 4 && T.pieceTier(29, 5, 50) === 5, 'cap 50 level 29 = half diamond_ice / diamond_green (slot 4 ice, slot 5 green)');
  ok(T.tierState(28, 50).lo === 4 && !T.tierState(28, 50).half && T.tierState(26, 50).lo === 4 && T.tierState(25, 50).lo === 3 && T.tierState(25, 50).half, 'cap 50: level 25 = half gold / diamond_ice, 26..28 pure diamond_ice, 29 half ice / green');
}
{ // the half zone starts exactly at the owner's numbers (cap 50)
  const halves = []; for (let lv = 1; lv <= 50; lv++) { const s = T.tierState(lv, 50); if (s.half && (lv === 1 || !T.tierState(lv - 1, 50).half)) halves.push(lv); }
  ok(eq(halves, SPEC50.mid), 'cap 50: the half/half zones start at ' + halves.join(' '));
  const pures = []; let prev = -1; for (let lv = 1; lv <= 50; lv++) { const s = T.tierState(lv, 50); if (s.atPure) pures.push(lv); }
  ok(eq(pures, SPEC50.pure), 'cap 50: a new pure tier starts at ' + pures.join(' '));
  const out = T.tierState(0, 50), hi = T.tierState(999, 50); ok(out.level === 1 && hi.level === 50 && T.tierState(NaN, 50).level === 1, 'out-of-range levels are clamped (0 -> 1, 999 -> 50, NaN -> 1)');
}
{ // lazy loading helper: only what is on screen (+ the upper tier one level before its half zone)
  const a = T.tiersNeeded(1, 50), b = T.tiersNeeded(3, 50), c = T.tiersNeeded(5, 50), d = T.tiersNeeded(50, 50);
  ok(eq(a, { now: [0], soon: [] }) && eq(b, { now: [0], soon: [1] }) && eq(c, { now: [0, 1], soon: [] }) && eq(d, { now: [8], soon: [] }), 'tiersNeeded: lv1 {wood}, lv3 {wood + stone soon}, lv5 {wood, stone}, cap {diamond_blue}');
  let maxNow = 0; for (let lv = 1; lv <= 50; lv++) { const n = T.tiersNeeded(lv, 50); maxNow = Math.max(maxNow, n.now.length + n.soon.length); }
  ok(maxNow <= 2, 'never more than 2 tiers resident at any level (' + maxNow + ')');
}

// ---- 3. legacy 6-tier steps (skin.js, homes, civic, upgradeui) follow the cap, and are the old numbers at 30
console.log('== 3. legacy 6 tiers');
ok(/const tierOf = \(lv\) => legacyTier\(lv\);/.test(UI.src) && /LEGACY_TIER_AT\[i\]/.test(UI.src), 'upgradeui.js: tierOf = tiers.js legacyTier and the look list reads LEGACY_TIER_AT (no hard-coded 6 / 12 / 18 / 24 / 30)');
{
  const old20 = (lv) => { lv = Math.max(0, Math.min(30, Math.round(+lv) || 0)); return lv <= 1 ? lv : 1 + (lv - 1) * 19 / 29; };
  const oldBack = (v) => { v = +v; if (!(v > 0)) return 30; return Math.max(1, Math.min(30, Math.round(v <= 1 ? v : 1 + (v - 1) * 29 / 19))); };
  const oldTier = (lv) => (lv >= 30 ? 5 : lv >= 24 ? 4 : lv >= 18 ? 3 : lv >= 12 ? 2 : lv >= 6 ? 1 : 0);
  T.setLevelCap(30);
  ok(eq(T.LEGACY_TIER_AT, [1, 6, 12, 18, 24, 30]) && eq(C.TIER_AT, [1, 6, 12, 18, 24, 30]) && eq(H.TIER_AT, [1, 6, 12, 18, 24, 30]) && eq(SK.TIER_AT, [1, 6, 12, 18, 24, 30]), 'cap 30: LEGACY_TIER_AT = TIER_AT of skin / homes / civic = 1 6 12 18 24 30');
  ok(C.TIER_AT === T.LEGACY_TIER_AT && H.TIER_AT === T.LEGACY_TIER_AT && SK.TIER_AT === T.LEGACY_TIER_AT, 'skin / homes / civic export the SAME live array');
  let b1 = 0, b2 = 0, b3 = 0; for (let lv = -2; lv <= 40; lv++) { if (!Object.is(T.toInternal20(lv), old20(lv))) b1++; } for (let v = -1; v <= 21; v += 0.25) if (T.fromInternal20(v) !== oldBack(v)) b2++;
  for (let lv = 1; lv <= 30; lv++) { if (C.civicTier(lv) !== oldTier(lv) || H.homeTier(lv) !== oldTier(lv) || UI.tierOf(lv) !== oldTier(lv) || T.legacyTier(lv) !== oldTier(lv)) b3++; }
  ok(!b1 && !b2 && !b3, 'cap 30: toInternal20 / fromInternal20 / civicTier / homeTier / upgradeui tierOf = the old formulas for every level (' + b1 + ' / ' + b2 + ' / ' + b3 + ' differences)');
  for (const cap of [30, 50, 64, 100]) {
    T.setLevelCap(cap); const A = T.LEGACY_TIER_AT.slice();
    ok(A[0] === 1 && A[5] === cap && A.every((v, i) => i === 0 || v > A[i - 1]), 'cap ' + cap + ': legacy steps ' + A.join(' ') + ' (1 .. cap, increasing)');
    ok(eq(C.TIER_AT, A) && eq(H.TIER_AT, A) && eq(SK.TIER_AT, A), 'cap ' + cap + ': the exported TIER_AT arrays follow (live)');
    let rt = 0, sk = 0, wl = 0, cl = 0;
    for (let lv = 1; lv <= cap; lv++) {
      if (T.fromInternal20(T.toInternal20(lv)) !== lv) rt++;
      SK.setEntityLevel('keep', lv); SK.setEntityLevel('wall', lv);
      // the GLSL tier (skin.js tierOf on 1..20) must agree with the steps of homes / civic / upgradeui at every level
      const t = SK.tierOf(SK.levelOf('keep'));
      if (t !== C.civicTier(lv) || t !== H.homeTier(lv) || t !== UI.tierOf(lv)) sk++;
      if (wallLevel() !== lv) wl++;
      if (castleLevel(SK.levelOf('keep')) !== lv) cl++;
    }
    ok(!rt && !sk && !wl && !cl, 'cap ' + cap + ': levels 1..' + cap + ': to20/back round-trip, skin.js tier = homes = civic = upgradeui tier, wallLevel() and castleLevel() give the level back (' + [rt, sk, wl, cl] + ')');
  }
  T.setLevelCap(30);
}

// ---- 4. structure modules at other caps
console.log('== 4. structure modules at cap 50');
{
  T.setLevelCap(50);
  ok(L.ringsAt(10).length === 1 && L.ringsAt(11).length === 2 && L.ringsAt(20).length === 2 && L.ringsAt(21).length === 3 && L.ringsAt(50).length === 3 && L.ringsAt(99).length === 3, 'D3 at cap 50: rows 1-10 / 11-20 / 21+ = 1 / 2 / 3 (same thresholds)');
  let nest = true; for (let lv = 2; lv <= 50; lv++) { const a = L.ringsAt(lv - 1), b = L.ringsAt(lv); if (!a.every((r) => b.includes(r))) nest = false; } ok(nest, 'a ring never disappears when the level goes up (1..50)');
  ok(C.civicLevel('chapel', 50) === 50 && C.civicLevel('chapel', 99) === 50 && C.civicLevel('market', 2) === 0 && C.civicLevel('market', 3) === 3, 'civicLevel clamps to the cap (50), unlock levels unchanged');
  let cnt = true, atTop = true; for (const k of TP.KIND_ORDER) { let prev = 0; for (let lv = 1; lv <= 50; lv++) { const n = TP.countAt(k, lv); if (n < prev) cnt = false; prev = n; } if (TP.countAt(k, 50) !== TP.KINDS[k].n30) atTop = false; }
  ok(cnt && atTop, 'town counts never decrease up to 50 and reach the full plan at the cap (' + TP.KIND_ORDER.length + ' kinds)');
  const names30 = (() => { T.setLevelCap(30); const s = new Set(); for (const k of Object.keys(C.CIVIC_KINDS)) for (let lv = 1; lv <= 30; lv++) for (const p of C.civicPieces(k, lv, 1)) s.add(p.n); T.setLevelCap(50); return s; })();
  let wf = true, known = true, throws = 0;
  for (const k of Object.keys(C.CIVIC_KINDS)) {
    for (let lv = 1; lv <= 50; lv++) {
      let ps; try { ps = C.civicPieces(k, lv, 1); C.civicSolids(k, lv, 1); } catch (e) { throws++; continue; }
      for (const p of ps) { if (!(Number.isFinite(p.x) && Number.isFinite(p.z) && Number.isFinite(p.ry) && p.s > 0)) wf = false; if (!names30.has(p.n)) known = false; }
    }
  }
  ok(!throws && wf && known, 'civicPieces at every level 1..50: no throw, finite, only pieces of the existing kit (' + throws + ' throws)');
  let hth = 0, hk = true; for (const k of Object.keys(H.HOME_KINDS)) for (let lv = 1; lv <= 50; lv++) { try { const ps = H.homePieces(k, lv, 1); if (!ps.length) hk = false; } catch (e) { hth++; } }
  ok(!hth && hk, 'homePieces at every level 1..50: no throw, never empty');
  ok(eq(H.TIER_AT, [1, 9, 20, 30, 40, 50]) && H.homeTier(50) === 5 && H.homeTier(9) === 1 && H.homeTier(8) === 0 && C.civicTier(49) === 4 && C.civicTier(50) === 5, 'cap 50: house / civic tiers start at 1 / 9 / 20 / 30 / 40 / 50');
  T.setLevelCap(30);
}
ok(T.LEVEL_CAP === 30 && eq(C.TIER_AT, [1, 6, 12, 18, 24, 30]), 'cap restored to 30');

console.log(fails ? 'TR2 TIERS FAIL ' + fails : 'TR2 TIERS OK');
process.exit(fails ? 1 : 0);
