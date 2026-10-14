# REPORT B3 — civic buildings (market · tavern · townhall · well · chapel)
Base = p38 (branch code-p38). Written 6 Oct 2026, 22:45 (Tehran). Patch: `/home/claude/patch_B3.tar.gz`.

## خلاصه برای وینگلس
پنج ساختمون شهری با شکل کاملاً متفاوت آماده‌ست (فقط مدل و ظاهر؛ جاشون رو B1 می‌ده): **بازار** (میدون با غرفه‌های مختلف، ستون بازار وسط، تالار سرپوشیده پشتش)، **میخانه** (بشکهٔ بزرگ روی ساختمون، میز و نیمکت، لیوان)، **تالار شهر** (برج مرکزی + دو بال، پله، میز شمارش با کیسهٔ سکه و دفتر)، **چاه** (کوچیک، زیاد)، **کلیسا** (برج ناقوس، با سطح بالا برج‌های کناری). از سطح ۱۸ سقف‌ها طلایی می‌شن. همه مدل واقعی CC0 (KayKit + Quaternius)، هیچ مدل دست‌ساز نیست. هنوز تو بازی وصل نشده — این کار مادر چته (پایین).
عکس: `work/b3_sheet_final.png` (۵ نوع × سطح ۱ / ۱۵ / ۳۰، شماره‌دار)، `work/b3_closeups_final.png`، `work/b3_top.png`.
جواب شیت رو نگرفتم (۱۵ دقیقه گذشت) → **پیش‌فرضم رو ساختم: همه چیز مثل شیت، سقف طلایی از سطح ۱۸.** اگه شمارهٔ خاصی رو نمی‌خوای بگو، عوضش می‌کنم.

## Definition of Done — only what I saw
- [x] ONE sheet, 5 kinds × lv 1 / 15 / 30, told apart at a glance → `/home/claude/work/b3_sheet_final.png` (15 numbered cells, rendered by the real `civicPieces → bakePieces` path with the real kit; looked at full size). Close-ups: `b3_closeups_final.png`; market top view: `b3_top.png`.
- [x] `bash dev/b3_civic_test.sh` → `47 checks`, `B3 OK` (piece names all exist in the kit, deterministic per seed, kit 397,264 B ≤ 400 KB, 1 material, 0 textures, no standing things on the same spot, pieces grow with level and never drop, credits shape).
- [x] measured cost ≤ the current market + church (numbers below); credits complete (`web/assets/credits_b3.json`, 3 packs, 40 models); `GATE_W: ALL OK` (/tmp/gate.out, run after the last code edit).

## Proven / not proven / not done
**Proven (seen / run):**
- Test + gate + sheet as above. The sheet shows each kind with a different silhouette: market = a ring of stalls round a stone cross + a covered hall; tavern = the big barrel-sign building + benches + mugs; townhall = tower with two wings, steps, counting table (coins, ledger); well = one small roofed well (many-friendly); chapel = bell-tower church (the two side towers join at lv 30).
- Programs 8 → 8 (+0): the kit is ONE vertex-colour material (`flat`), no textures; measured next to the game's own `kit_ws` in the same renderer (`dev/b3_sheet.py`, `COST=1`).
- Bundle: `b3_civic.js` minified + gzip = 2.2 KB (≤ 15 KB).
- Bake time (software GL, 2 cores, so a ceiling): a lot ≤ 10 ms (market lv30 9.6 ms); a whole lv-30 town (1 market + townhall + tavern + chapel + 10 wells, 177 pieces) in ONE `bakePieces` call = 42 ms (< 100 ms).
- Tier looks follow `skin.js` steps (test checks the `TIER_AT` numbers against skin.js): wood 1 · stone 6 · iron 12 · gold 18 · diamond 24 · crystal 30. Gold-roofed twin from lv 18; below that the blue-roofed one. More props / wings / stalls with the level, never fewer.

**Not proven:**
- Nothing is wired into the game (I may not touch `town.js`), so there is no in-game picture and no in-game perf number "after". `python3 dev/p38_perf.py perf 30` was NOT run: it only toggles the worksite buckets, B3 adds no hook for it, and the result would be identical before and after. The "before" numbers below come from the live-scene probe `dev/b3_today.py` (instanced meshes near the market, counted by position) + reading `town.js`; the church number is read from the code, not measured live.
- Look of the pieces on real terrain / next to B1's layout; the shadow cost on a phone GPU (only software GL here).
- Tier look at 4 / 5 (diamond, crystal): colours are the same as gold on the building (the kit has only blue and yellow roofs, no real crystal / diamond variant) — the difference there is more things, not a new colour. If he wants distinct diamond / crystal colours that needs another real model pack (or a tint in the mother's shader), not a hand recolour.

**Not done (on purpose or out of scope):**
- No fountain: a market CROSS (stone plinth + pillar, Quaternius) stands in the middle — no real fountain model was in the three packs I could use. A well stands there at lv 1–5.
- No working clock face on the town hall (the hall has the central tower + a bell-tower roof; the packs have no clock model). No tax-rate UI (later; the lot has room: the counting table at the front is the place).
- Seed only varies the small jitters (stall angle ±3°, crate / barrel spin), not the layout — one market per town, so it does not matter. If many wells should look different, add a mirror by seed (5 lines).
- No `y` in the pieces (ground = 0 local): the mother puts the lot at terrain height.
- No sound, no people (loyalty / tax numbers are the server's).

## Perf: before / after (budget: net zero vs. today's market square + church)
| | today (town.js) | B3 lv 1 | B3 lv 15 | B3 lv 30 |
|---|---|---|---|---|
| market tris | ≈ 27.2 k (4 instanced prop kinds, 6 + 5 + 2 + 3 instances round the market centre) | 4.8 k | 12.3 k | 19.7 k |
| church / chapel tris | ≈ 0.45 k (≈ 25 boxes + roof + cone + sphere, static batch) | 0.9 k | 2.7 k | 5.6 k |
| **market + church** | **≈ 28.3 k** (+ the hex well ≈ 0.2 k) | 5.8 k | 15.0 k | **25.3 k** |
| draw calls | ≈ 10 instanced meshes near the market (shared with hamlet props, so removing the market square would not remove them all) + church in the town batch | **1** (+1 shadow) per bake call, any number of lots | 1 | 1 |
| shader programs | — | +0 | +0 | +0 (8 → 8) |
| textures | 0 for these props (shared kit materials) | 0 | 0 | 0 |
| kit size | — | 397,264 B (≤ 400 KB) | | |
| bake (sw GL) | static / instanced at load | 6 ms | 7 ms | 10 ms |
So market + chapel at lv 30 = 25.3 k vs ≈ 28.3 k today (−11 %), 1 draw vs ≈ 10: ✔ within budget. **The NEW kinds are extra on top** (they did not exist, so the "net zero" rule does not cover them): tavern lv30 9.2 k, townhall lv30 8.1 k, well 0.7 / 1.3 / 2.2 k each (lv 1/15/30). Worst case all five lv 30 with 10 wells = 64.7 k tris / 1 draw call. All piece counts are (ph); the mother can cap them with the existing quality setting (e.g. `min(lv, 15)` on low quality: the market drops from 19.7 k to 12.3 k).
How I counted "today": `dev/b3_today.py` lists the live scene's instanced meshes; the market ring of `town.js` (9 slots, some skipped by the gate street) shows up as 6 + 5 + 2 + 3 instances around the market centre; tris = instance count × geometry tris.

## SHARED edits
**None.** Only OWNED files / new files (`client/src/b3_civic.js`, `web/assets/kit_civic.glb`, `web/assets/kit_civic.report.json`, `web/assets/credits_b3.json`, `dev/b3_*`). `town.js`, `layout.js`, server files, gates, `web/app/*` untouched (`web/app/wall.js` shows as modified in the work dir only because the gate rebuilds it; it is NOT in the patch).

## What the mother must wire
1. **Copy** `owned/` of the patch (the 4 files above). Add the line `web/assets/credits_b3.json` to wherever credits files are merged (the gate's "credits.json lists every shipped asset folder" check passes without it, because it is not wired yet).
2. **Load the kit**: add `'kit_civic'` to the `LATE` list in `assets.js` (next to `'kit_ws', 'kit_def'`; the loader reads `assets/<name>.glb`) → it is then `A.models.kit_civic`. One material, no textures. (This is the only SHARED line the mother adds; I did not make it.)
3. **Per lot** (B1's record `{ id, kind, x, z, ry, r }`, kind ∈ market · tavern · townhall · chapel · well):
   ```js
   import { CIVIC_KINDS, civicLevel, civicPieces, civicSolids } from './b3_civic.js';
   const lv = civicLevel(kind, castleLevel);                 // 0 = locked → build nothing
   for (const p of civicPieces(kind, lv, lot.seed ?? hash(lot.id)))
     list.push({ name: p.n, matrix: compose(lot.x + p.x·cos(lot.ry) + p.z·sin(lot.ry), groundY, lot.z − p.x·sin(lot.ry) + p.z·cos(lot.ry), lot.ry + p.ry, p.s) });
   bakePieces(bucket, A.models.kit_civic, list, { shadows: !!Q.shadows, tag: 'civic' });   // `village.js` — ONE call for ALL civic lots → 1 draw call
   ```
   Lot-local frame: x right, z toward the street (the front = +z), y = 0 = ground, `ry` about +y (local +z → world (sin ry, cos ry)). B1 must give each lot `CIVIC_KINDS[kind].w × .d` metres (footprint; centred on the lot origin) and turn the front to the street.
4. **Navigation / overlap**: `civicSolids(kind, lv)` = lot-local circles `[x, z, r]` for the standing buildings (feed `nav` and the layout editor's overlap check).
5. **Re-bake only when the level changes** (a lot's `lv` or kind); pieces are deterministic per `(kind, lv, seed)` so a saved layout keeps its look. Stalls never move when the market levels up (fixed ring slots).
6. Build it like `buildDefField` / `buildWorksites` in `world.js` (own bucket, `ctx.levelHooks.push(() => rebuild(level))`). **Replace** today's `town.js` market block (well + ring of stalls/carts) and `church()` with these lots; the church becomes `chapel` (footprint 18 × 28 — the old church was 13 × 24, B1 should reserve the bigger lot).
7. Server owner: unlock levels (`CIVIC_KINDS[k].unlock`) are placeholders (ph) — E1 decides; `civicLevel` takes the castle level for now. Names / Persian labels are in `CIVIC_KINDS[k].fa` (no «bot / ربات»).

## Placeholders (ph) — all game numbers
- Unlock levels: market 3 · tavern 6 · townhall 2 · chapel 1 · well 1.
- Footprints `{w,d}` (m): market 32×32 · tavern 22×20 · townhall 28×22 · chapel 18×28 · well 6×6.
- Tier thresholds 1 / 6 / 12 / 18 / 24 / 30 (copied from `skin.js`, the real owner of those steps), gold roof from lv 18.
- How many things appear per level (stalls 4 → 12, props, wings, towers) and the `kScale` growth (0.8 → 1.0).

## Notes / gaps found
- Setup gap: the devkit's `setup_lite.sh` does not create `dev/three` and `dev/blu-rez` symlinks that `dev/modelsheet.py` needs — I added them in the work dir (not in the patch).
- Kit pipeline: `dev/b3_mkkit.mjs` + `dev/b3_recipe_gen.py` (→ `b3_recipe.json`) rebuild the kit from the three source packs (all CC0); `dev/b3_credits_gen.py` regenerates the credits. Pitfall noted in the script: strip attributes + weld by position before simplifying, recompute crease normals.
- Sheet tool: `bash dev/b3_sheet_build.sh && python3 -I dev/b3_sheet.py OUT.png [cells.json]` (needs the dev server on :8777 serving `/home/claude/dev`).
