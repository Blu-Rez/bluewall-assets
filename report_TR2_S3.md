# report_TR2_S3 — the castle from the Tripo library (12 % stage)
TR2 · 14 Oct 2026 · started from kit **p45 + TR2_S2 merged** · `GATE_W: ALL OK` (noRoute **667** / limit 700) · `bash dev/tr2_tiers_test.sh` → `TR2 TIERS OK` · `A1 OK` · `bash dev/tr2_s3_test.sh` → `TR2 S3 OK` (25 check lines).
Software GL (SwiftShader) in headless Chromium — **not phone numbers**.

## What the player SEES now
The whole castle is Tripo models in the 9 tiers (wood → stone → iron → gold → diamond ice → green → red → black → blue; half / half zones alternate piece by piece):
- **walls** on the three A1 rings (`castle_wall_<tier>`), walk-way exactly at the old wall height (archers, towers and weapons keep their heights);
- **towers** `castle_tower_medium_<tier>` in all three rings (flat crenellated top: ballista / cannon / wizard / frost / flame stand on it as before);
- **gatehouses** `castle_gate_<tier>` (outer + town rings) with the realm plaque and the two torches; closed facade, no tunnel (the hero clips through like through the old doors);
- **keep** `castle_keep_stone_2` (D7), 27 m wide / 23.7 m high, beacon on the dome.
Frames (looked at full size, `photos_TR2_S3.tar.gz`): cap 50 levels **1 / 7 / 13 / 19 / 26 / 32 / 38 / 44 / 50** (overview + gate each, keep at 26 and 50); cap 30 half / half levels **3 (wood / stone) · 14 (gold / ice) · 21 (green / red) · 28 (black / blue) · 30**; a **destroyed-wall battle frame** (`bat30_*`: intact → right tower collapsing + wall pieces sunk and burnt; shader collapse, nothing special for Tripo); two contact sheets of towers / gates / keep per tier; hi-vs-lo LOD comparison.

## What is in the patch
1. **`client/src/castle_tr2.js`** (new): registers the pieces while `castle.js` builds, bakes them when the level is known and again only when the LOOK changes (tier boundary / half zone / the set of standing rings). Every baked vertex carries `aB` = the battle target id → `destruct.js` and `a1_rings.js` work on it unchanged. Hi / lo LOD cells (below). `ctx.tr2c.anchors()` for S4c.
2. **`castle.js`**: T3 paths in `wallRun`, `tower`, `townGate`, the main gatehouse and `keep`; **all `ctx.tgt` calls, weapon sites, picks, torches, banners are kept** → noRoute 667, targets / ids identical. With `ctx.tr2c == null` (models missing, load failure, `window.__tr2Off`) the OLD procedural castle is built — the game starts without any Tripo file.
3. **`tr2lib.js`**: `tr2.rec`, `TBatcher` (indexed merge, ≈ 5× less geometry memory than `util.js Batcher`).
4. **`a1_rings.js`**: `rescan(added, removed)` (vertex runs of meshes built later), `visible()`, `onChange(fn)`.
5. **`world.js`**: preload before `buildCastle`, install + level hook after the ring tracker, throttled `lod(camera)`, `world.tr2c` exposed. 
6. **`swap.json`**: `fl` (walk-way / platform floor ÷ model height) for the 9 wall and 9 tower tiers, 28 `_lo` entries; **56 GLBs, 5.3 MB** (28 hi at 512 px, keep 1K, 28 lo with an 8 × 8 dummy texture). Tools `lod_geo.mjs` (makes `_lo`), `tr2_retex.mjs`.
7. Tests / dev: `tr2_s3_test.js/.sh`, `tr2_s3_frames.py` (levels in one session), `tr2_s3_battle.py`, `tr2_budget.py` (counts frustum-visible draws per mesh-name group; the tool S4–S6 must use).

Shared-file lines: `castle.js`, `world.js`, `a1_rings.js`, `tr2lib.js` (all in `patch.diff`; `castle_tr2.js` + GLBs are new files). Nothing in `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`.

## Budget (the owner's rule: hero view ≤ 150 calls; TR2_SPLIT §3) — measured with `dev/tr2_budget.py`, old castle = `window.__tr2Off`
Strategic cameras at lv 30 (old → new; the castle group is the only difference):
| view | calls | tris |
|---|---|---|
| top | 510 → 522 (+2.4 %) | 3.489 M → 3.607 M (**+3.4 %**) |
| ctr | 475 → 483 (+1.7 %) | 2.989 M → 3.051 M (+2.1 %) |
| town | 488 → 496 (+1.6 %) | 2.965 M → 3.050 M (+2.9 %) |
| fields | 516 → 524 (+1.6 %) | 3.723 M → 3.813 M (+2.4 %) |
| lake | 282 → 283 (+0.4 %) | 1.759 M → 1.756 M (−0.2 %) |
Programs **166 → 164** in this harness (batched Tripo +0, and the old castle's tower-roof / rune materials are gone); textures +4…+8 (512 px). Castle on screen: 14 calls / 152 k tris on the strategic cameras (lo cells).

**Real game, Q=high, lv 30 (`dev/p39_progs.py 30`, baseline in brackets):** programs **201** (203) · materials 552 (551) · meshes 1111 (1091) · shadow casters 472 (452) · customDepth 146 (126). So **programs −2**; meshes / casters / customDepth **+20** = the castle's 28 cell meshes (hi + lo) replacing its share of the old `static` batches. Only one of a cell's hi / lo is visible, so the shadow pass draws about as many castle meshes as the frame does; the number of *flagged* casters is what rose, the shadow-pass draw count of the castle was **not measured separately** (listed below).
**Ground-level views** (hero-height proxy cameras, same harness, NOT the RP1B hero diet):
| view | calls | tris | castle on screen |
|---|---|---|---|
| gate_out | 397 → 404 (+7) | 2.47 M → 2.68 M (**+8.3 %**) | 13 calls / 278 k |
| gate_in | 402 → 410 (+8) | 3.22 M → 3.37 M (+4.6 %) | 7 / 177 k |
| wall_out | 414 → 420 (+6) | 3.37 M → 3.61 M (+7.3 %) | 13 / 309 k |
| keep_yard | 344 → 351 (+7) | 2.50 M → 2.74 M (**+9.7 %**) | 10 / 295 k |
**Honest reading:** the castle costs **+6…+8 draw calls** (one per cell × texture; the old castle was merged into the town's `static` batches, a Tripo texture cannot be) — the TR2_SPLIT net rule «delta ≤ 0» is **NOT met** by ≈ 7 calls, and in the hero view the castle is 7–13 calls of the total; the absolute total (344–420 in this proxy, 271 after RP1B per the report) is RP1C's job (≤ 150 total), not reachable by S3. Ground-level tris are +5…+10 % because a Tripo wall is ≈ 2 k tris per 12 m (the old one was ≈ 0.7 k): near cells are the full model (< 80 m), the rest `_lo` (≈ 40 %). If the owner wants it tighter: lower `LOD_NEAR` (80 → 50 m, one constant), or the hero view hides the town ring's far side (RP1C).
Half / half zones double the castle's calls (two tiers = 2 × 3 textures): top view at lv 21 / 28 = 48 meshes before culling.

## Proofs
- Frames above, every one looked at (tier colours right at each level, plaque and torches on the gate, towers carry the war machines, keep and beacon, rings appear at the A1 levels 11 / 21, half / half alternate).
- Destruct on Tripo meshes: `bat30_*` (collapse 0.8 / 0.45, tower 0.6, damage + flash) — works through `aB` on the baked pieces; rings hidden by `a1_rings` stay hidden after a re-bake (`rescan`).
- `GATE_W: ALL OK` (battle sim 0 crossings, nav, noRoute 667), `TR2 TIERS OK`, `A1 OK`, `TR2 S3 OK`.
- Lazy tiers: level changes load the 2 needed tiers + keep and `tr2.drop` the old ones; `failed: []` in every step of the 9-level / 5-level runs.
- Resident castle textures (estimate: 1K = 5.33 MB, 512 = 1.33): pure level 3 × 1.33 + keep 5.33 = **9.3 MB**, half / half 6 × 1.33 + 5.33 = **13.3 MB**; lo textures 8 × 8 (0).

## Left procedural on purpose (reasons in `TR2_swap.md` §10)
Water gates (the 13 m river gap would need a 22 m high model), river quay (4.5 k tris per 3 m block × 700), moat / river bridges (flat roads, `bridge_*` are humped), the inner-ring gate (a gap, no model), `castle_wall_corner_*` (the rings are closed by towers). Dropped visually: rune bands, window slits, tower roofs, the old keep's corner towers, gate banners.

## NOT proven / not done
- Phone fps, shader compile / texture upload on a phone, real GPU memory (all numbers are SwiftShader); the hi ↔ lo switch at 80 / 100 m is invisible in frames but **popping on a moving hero is not proven**.
- Shadow-pass draw calls of the castle (the casters counter is +20, see above); the hero view total ≤ 150 calls (RP1C; see the budget reading).
- **Decision for the owner / mother:** the keep (23.7 m) looks small inside the 16 m high inner ring (the widest model that clears the wall is 27 m); a bigger keep needs a bigger inner ring or the other keep model; gate facades are closed (hero path through the gate = the old doors' behaviour). The realm plaque shows a glyph glitch in the «U» of «BLUE HEART» in headless Chromium (font fallback of `her_flags.js`, the old castle has the same plaque) — look at it on a phone.
- lib-tripo `MANIFEST.json` / `LIB_INDEX.md` still need the 11 gaps1 rows (mother / TR1).

## Pitfalls (new)
- A browser job on `dev_s35.html` / `dev_s50.html` takes 5–8 min to load; one at a time; `pkill -f "[t]r2_s3_frames.py"` (the bracket trick) or you kill your own shell.
- Cap 50 page: `dev_s50.html` loads `app_dbg50.js`, a bundle with `balance.json` `max_level` 50 — build it with `node dev/tr2_build_cap50.mjs` (shipped; paths inside are the worker's); `dev/app_s50/wall.js` → `../app_dbg50.js` symlink; the cap-30 page is `dev_s35.html`.
- `tr2.parts(spec)[0].material` is shared by hi and lo: never give a `_lo` its own texture or the call count doubles.
