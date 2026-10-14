# report_TR2_S3_R2 — the castle, what was left (round 2)
TR2 · 15 Oct 2026 · kit `8ce26f5` (branch `kit`) · `GATE_W: ALL OK` (noRoute 667 / limit 700) · `bash dev/tr2_tiers_test.sh` → `TR2 TIERS OK` · `bash dev/tr2_s3_test.sh` → `TR2 S3 OK` (34 check lines, 9 new: the stairs anchors).
Software GL (SwiftShader) in headless Chromium — **not phone numbers**. Nothing in `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`; `castle.js` / `world.js` untouched this round.

## The four jobs in one table
| job | result |
|---|---|
| 1 `lib-tripo` rows | **nothing to send**: the 11 gaps1 rows are already in `MANIFEST.json` and `LIB_INDEX.md` at `lib-tripo` `c186bbe` (11 of 11 in both files, their GLBs are in the tree). No `patch_TR2_S3_lib.tar.gz`. |
| 2 hi ↔ lo pop | **No shape pop; a small texture-level change at a flip that I measured, not zero** — numbers below. |
| 3 keep | the library has only two keeps; `_2` (in use) is already the taller. **No bigger keep exists; ring unchanged.** A taller keep would have to be a new model (spec line in `TR2_gaps_S3.md` §4). |
| 4 stairs | **spec + anchor list done**, no model (none exists, none built). `TR2_gaps_S3.md`; `anchors('stairs')` in `castle_tr2.js`, 9 test lines, real-map dump with terrain heights. |

## Job 2 — does the switch at 80 / 100 m pop on a moving camera?
**How:** one game session (lv 30), the castle drawn ALONE on a flat background (every other object hidden at draw time: dragon, birds, water, flags move between two frames, the castle does not — two frames of the same pose are pixel-identical: render noise **mad 0.0**, so every difference between two frames of one pose is the LOD). Two camera paths:
- **Z zoom** — the home-map orbit camera (pitch 35°, looking at the castle) dollies 70 → 190 m in 13 poses (10 m per step), forward and BACK (hysteresis), natural LOD;
- **A arc** — a ground camera (3 m above the terrain, 45 m outside the town wall, 55° fov) moves in 9 poses along the town wall through two quadrants (the walking-along-the-wall case).
In every pose also: all cells forced full, all cells forced lo (`window.__tr2Lod`), so each flip can be compared with the best case and the worst case at the same pose.
**Flips that happened** (the four town quadrants `tWN/tEN/…` and the core cell are the LOD cells):
| path | step | flip | picture change (mean abs diff of 255 · % of pixels changed by > 16 levels) | one camera step of that path |
|---|---|---|---|---|
| Z forward | 3 → 4 | tWN → hi | 1.63 · 4.7 % | mad 34 (median; 17 … 42) |
| Z forward | 8 → 9 | core → lo | 1.07 · 4.5 % | |
| Z back | 7 → 6 | core → hi | 3.20 · 9.3 % | |
| A arc | 1 → 2 | tEN → hi | 0.028 · 0.08 % | mad 18.6 (median; 12.5 … 26.4) |
| A arc | 6 → 7 | tWN → lo | 0.023 · 0.07 % | |
**Reading:**
- **Shape**: all-full vs all-lo, the castle's silhouette differs by **≤ 0.024 %** of its pixels (Z) / **≤ 0.009 %** (A). No piece appears, vanishes or moves between hi and lo. Measured on the models: the lo vertices stay within **0.16 % (mean) of the longest side**, the worst single vertex per family: gates 4.5 % (gold; 1.2 m on a 26 m gate), towers 1.8 % (0.3 m), keep 2.1 % (0.6 m), walls 0.9 … 4.5 % — except `castle_wall_diamond_blue` **11 %** (≈ 1.5 m; two stray vertices of the hi model that the lo drops).
- **Detail**: a flip of the big core cell changes the picture by mad **3.2 of 255** (9 % of the pixels by > 16 levels) — thin speckle along stone edges and merlons, no area changes (frames `pair_*.png`, heat map right). That is **about 3 … 9 % of what one 10 m camera step already changes** in the zoom, and ≈ 0.2 % of one step on the arc, where the flipping cell is a far quadrant. A quadrant flip on the zoom is ≈ 5 % of a step.
- **Hysteresis**: the core cell went lo between camera distances 150 → 160 m and came back hi between 140 → 130 m (the 20 m band = `LOD_FAR − LOD_NEAR`); no flip repeats on the way back at the same pose.
- Where it happens for the hero: a cell flips when the distance from the hero to its NEAREST piece (minus 12 m, height above 10 m counts) crosses the 80 / 100 m band; standing in the middle of the town she sees the four town quadrants lo and the core cell hi, and a quadrant turns hi when she walks to about 80 m from its nearest wall. The arc is that case.
**NOT proven:** (a) a continuous 30 / 60 fps motion — the strips are stepped (10 m dolly, ≈ 11° arc steps); (b) whether the 3 / 255 speckle is visible on a phone screen — on the PC-size frames it is not; (c) the lo → hi change of the core cell is the largest (9 % of the pixels); if it shows on a phone the cure is a short cross-fade or dither between the two cells (both drawn for ≈ 0.3 s) — **not built**; moving `LOD_NEAR` (the RP1C hook) changes WHERE it happens, not whether. Real-scene frames of the same poses exist (`sheet_fullscene_zf.png`: 13 poses with the dragon, houses, water); three of them show scene objects in front of the lens (a flat beige polygon at zf_10, a tree at af_01, a haze plane at af_03) — they are not castle frames and are not used for any number.
Frames (full size, looked at; `photos_TR2_S3_R2.tar.gz`): `lod_sheet_zf / lod_sheet_zb / lod_sheet_af.png` (the strips with the flips marked; zb is laid out by pose number, shot from far to near), `lod_pair_zf_03_04`, `lod_pair_zf_08_09`, `lod_pair_zb_07_06`, `lod_pair_af_01_02`, `lod_pair_af_06_07` (before | after | |after − all-full| × 6), `lod_diff_z.png`, `lod_diff_a.png` (full model | lo model | difference at the worst pose), `lod_sheet_fullscene_zf.png`, `lodstrip_report.md / .json`, `lod_geo_deviation.json`, `silhouette_hi_lo.json`.

## Job 3 — the keep in the inner ring
- Library: `castle_keep_stone_1` (4 conical towers, 18,175 tris, height / width 0.79) and `castle_keep_stone_2` (dome + square towers, 17,946 tris, 0.88). `grep` of the whole `MANIFEST.json` (237 entries) finds no other keep / citadel / palace model. `_2` at the widest size the inner ring allows (27 m, 0.4 m clear of the 16 m wall slabs) is **23.7 m high; `_1` would be ≈ 21 m.** Nothing bigger → left as is, ring untouched.
- Frames: `keep_a` (from above the yard), `keep_b` (from outside the ring, 22 m up), `keep_over` (over the castle). Looked at: the keep reads as a large building in a walled yard; its roof is 7.7 m above the inner wall-walk and only ≈ 5 m above the inner towers' platforms (18.3 m), so it does not dominate the inner ring. The only fix is a taller NEW model (`castle_keep_tall`, same footprint ≤ 27 m, 32 … 36 m high) — owner's call, written in `TR2_gaps_S3.md` §4.

## Job 4 — stairs to the wall-walk (spec + anchors; no model, nothing drawn)
`TR2_gaps_S3.md` = the model spec (9.0 m rise, 41 steps 0.22 × 0.30, 2.0 m wide, 2.0 m landing, footprint 2.0 × 14.3 m, pivot / orientation / skirt / ≤ 3 k tris), the ring table, the anchor format, the 6-step wiring list.
- **Anchors** `ctx.tr2c.anchors('stairs', { rings, ends, spacing })` → one flight per wall-run end beside a tower or gate, on the inner face: `centre, ry, foot, top, join, dir, inward, rise, scale {y = H / 9.0}, rect (keep-out)`. `anchors()` without an argument is unchanged. Real map (lv 30): **outer 10 sites, town 27**; spacing 60 → **4 + 12**; spacing 80 → 3 + 10; inner ring 0 (its H 16 m would make the risers 0.39 m: the code refuses a site whose scaled riser leaves 0.19 … 0.25).
- On the real terrain every site's riser = (ground at the wall + H − ground at the foot) / 41 = 0.231 … 0.233 (outer), 0.193 … 0.206 (town): **0 of 37 sites outside 0.19 … 0.25**.
- 7 of the 37 sites touch a (coarse) house-cluster box (2 of the 16 at spacing 60) → the planner must treat `rect` as keep-out.
- Frames `stairs_site_*` (a ramp line from the foot at the ground to the top at the wall-walk, the 2.0 × 14.3 m footprint outline and the join pole drawn in magenta over the real castle — debug lines, not a model): **outer ring × 3** (`stairs_site_outer_0..2`, seen from above the inner side), **town ring × 2** (beside a tower, beside a gate). Looked at: in every frame the footprint lies on the inner side of the wall, starts clear of the tower (or gate) and ends on open ground; the ramp climbs from the foot to the wall-walk beside the tower. One more finding: in `stairs_site_outer_0` a small **pavilion / hut stands on the footprint** (it is not a battle target, so my overlap list does not know it) and `stairs_site_town_tower` has a big house roof right at the foot — the planner must keep `rect` free of props and houses, or the wiring drops that site. (The first outer-ring frames of the first dump were hidden behind the 16 m inner wall — the camera was inside the inner ring — and were re-taken from above; the two keep frames from the ground, `keep_hero_a / b`, ended up inside geometry and are not used.)
- **A bug found and fixed before shipping:** my first version matched the tower at the run end with a 2.5 m radius; the real `castle.js` starts a run 0.6 R from the tower centre (2.76 m on the outer ring), so on the outer ring the flight would have started inside the tower body (my test registered full-length runs and missed it). Now the clearance is found numerically (separating-axis test between the flight rectangle and the tower's W × W footprint turned by `face`, ≥ 0.3 m), and the test registers runs the way `castle.js` does and checks the clearance with an independent sampled distance (nearest flight 0.31 m from a tower) and that no two flights overlap.

## What is in the patch (`patch_TR2_S3_R2.tar.gz`, `patch.diff` against the kit)
1. `bluewall/client/src/castle_tr2.js` — `STAIRS` constant, `stairsAt()`, `anchors('stairs', opts)` (nothing else changed; nothing draws stairs).
2. `workers/dev/tr2_s3_test.js` (+9 check lines), `tr2_s3_lodstrip.py` + `tr2_s3_lodstrip_post.py` (the LOD strip and its numbers; `ISO=1` castle-only), `tr2_s3_stairs_dump.py` (anchors on the real map + keep / site frames).
3. `workers/tools/lod_dev.mjs` (hi → lo geometric deviation of the shipped `_lo` pairs).
Photos in `photos_TR2_S3_R2.tar.gz`; the docs `TR2_gaps_S3.md`, `report_TR2_S3_R2.md`, `TR2_progress.md` (round appended) are pushed as plain files.
Shared files: none. `noRoute` unchanged (667): the anchors add no targets.

## NOT proven / not done
- Phone fps and the real-time feel of the LOD switch (stepped frames only); the 9 % pixel change of the core cell's lo → hi is small in mad but is the number to look at on a phone.
- The stairs model does not exist ⇒ **no flight is drawn, the hero cannot climb**; wiring (≈ 1 h) waits for the file. Clear walkway width of the wall-walk was NOT measured (the spec assumes ≥ 1.6 m for the stairs only); the stairs do not lead to the tower platforms.
- Inner ring: no stairs (needs a second, 16 m switchback model if wanted).
- The keep: only the library's two models exist; "looks small" is not solvable without a new model (or a bigger ring — forbidden this round).

## Pitfalls (new)
- `pkill -f` with a pattern that also occurs in your own command line (even `[s]tairs_dump.py` when the command line contains `stairs_dump.py` elsewhere, e.g. a heredoc) kills your own shell (exit 144) — kill by PID.
- A full-scene browser frame takes 40 … 70 s in software GL and shows moving objects; for LOD questions use the castle-only mode (`ISO=1`, wraps `renderer.render`), where two frames of one pose are pixel-identical.
- `workers/dev/*` is copied into `/home/claude/dev` by `setup_kit.sh`: edit the copy you run, ship it back under `workers/dev/`.
