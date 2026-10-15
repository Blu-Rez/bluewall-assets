# report_TR2_S4a_R2 — houses + civic: triangle budget, the rest of the houses, pennants, smoke, missing frames
Worker TR2 S4a · round 2 · 15 Oct 2026 · base = branch `kit` @ 19bfbf8 (rebased from 8ce26f5; includes S4c, S3-R2, p50) · only the jobs of section TR2-S4a-R2

## What the player sees now (home map, software GL, Q=low)
- **Far / strategic views: the town costs what the old town cost.** Houses are `_lo` bodies (≈ 40 % of the triangles, same UVs, same atlas texture) when a cell is farther than ~100 m: ONE merged mesh (`homes-far`, 1 draw call, 128,808 tris for ALL 78 planned + 40 generic/hamlet + 9 village homes). Near the hero (< 80 m) the cells switch to the full house bodies + flag / lantern; 4 Hz, one cell per tick, the far mesh stays on screen until everything that is wanted exists (no hole while a cell bakes).
- **Every house of the town is Tripo now**: the 78 planned homes (R1) + the generic fill houses of `town.js` (12) + the hamlet houses (28 in 8 hamlets) + the plain `house` homes of `village.js` (9) — models `house_generic_a..d` (a/d for 1 floor, b/c for 2+, fitted to the lot). Same fallback as R1: models not there in 8 s ⇒ `ctx.tr2town = false` ⇒ the procedural / kit houses are built exactly as before (forced in a browser with `window.__tr2TownOff`, frames/log looked at).
- **Pennants/flags** (`props_street/flag`) are 60 % (`FLAG_S` in b2_homes.js, same anchors; houses and civic lots).
- **Chimney smoke** for the Tripo houses: anchors come from the models' own chimney geometry (6 of the 16 house models have a chimney; `HOUSE_SMOKE`, body frame, metres) — 31 plumes at lv 30 (cap 18 planned + 20 generic/village, spread evenly over the town, `ctx.smokeAt` unchanged).
- **Destroyed blocks** work on generic / hamlet / village houses too (each has its `tid`; the same `aB` + `patchDestruct` path). Half and full collapse looked at.
- Shipped models: 16 new `house_*_lo.glb` = **0.61 MB** (R1 4.0 MB ⇒ 4.6 MB). Same shader program, same two atlases — the lo pieces reuse the full model's atlas tile, no second texture.

## Numbers — `dev/tr2_budget_s4a.py` (strategic cams top/ctr/town/fields/lake + 4 ground cams + 4 street cams; lv 30, software GL, Q=low; calls / tris)
**Measured on the rebased tree = kit 19bfbf8 (S4c nature + lamps, S3-R2, p50 merged) + S4a R2.** "old town" = the same build with `window.__tr2TownOff = true` (kit houses / civic / generic / hamlet houses = the pre-S4a town). The R1 column is the round-1 build measured on the OLD kit (8ce26f5) — only the last column compares like with like.
| view | old town (kit 19bfbf8) | S4a R1 (old kit) | **S4a R2 (kit 19bfbf8)** | R2 vs old town |
|---|---|---|---|---|
| top | 482 / 3,647,258 | 502 / 3,925,681 | **466 / 3,605,895** | **−1.1 %** (−16 calls) |
| ctr | 452 / 3,219,899 | 471 / 3,534,065 | **445 / 3,247,288** | **+0.9 %** |
| town | 455 / 3,101,895 | 477 / 3,401,085 | **449 / 3,119,796** | **+0.6 %** |
| fields | 495 / 3,909,660 | 536 / 4,250,020 | **481 / 3,914,827** | **+0.1 %** |
| lake | 245 / 1,719,251 | 252 / 1,884,059 | **237 / 1,684,778** | **−2.0 %** |
| gate_out (ground) | 380 / 2,645,636 | 392 / 2,932,918 | 378 / 2,622,133 | −0.9 % |
| gate_in (ground) | 376 / 3,278,965 | 391 / 3,544,432 | 356 / 3,249,125 | −0.9 % |
| wall_out (ground) | 395 / 3,790,973 | 421 / 4,105,102 | 388 / 3,799,871 | +0.2 % |
| keep_yard (ground) | 342 / 2,642,814 | 348 / 2,924,036 | 337 / 2,619,985 | −0.9 % |
**The +5 % rule on the strategic cameras is met (+0.9 … −2.0 %; R1 was +8.8 … +9.8 %), and draw calls are lower than the old town on every camera.** (On the pre-rebase kit 8ce26f5 I measured +1.7 / +0.6 / +0.5 / −0.3 / −1.6 % — same picture.)
Town group at the top view: old homes 52,518 tris (2 calls) + civic 37,537 (1 call) → now ONE far mesh `homes-far` 128,808 tris (all 78 planned + 40 generic / hamlet + 9 village homes as `_lo`) + civic-tr2 81,824 (1 call). The kit village houses (`village:MI_*` meshes, −81 k tris at the top view) and the procedural generic houses of town.js (`static`, −26 k) are replaced by the Tripo ones and are gone from the frame — that pays for the extra houses.
**Worst case = the hero inside the town** (`STREET=1`: 4 free cameras at terrain + 1.7 m in the streets / plaza, the hi cells < 80 m forced on screen — in software GL the lazy bake needs a forced `lod`, in the game it runs by itself):
| cam | old town | R2 | delta |
|---|---|---|---|
| street_w | 245 / 1,857,472 | 238 / 1,785,437 | -7 calls, -3.9 % |
| street_e | 283 / 2,289,205 | 281 / 2,254,154 | -2 calls, -1.5 % |
| plaza | 296 / 2,418,991 | 284 / 2,377,524 | -12 calls, -1.7 % |
| street_s | 236 / 1,678,155 | 227 / 1,536,254 | -9 calls, -8.5 % |
Hi cells on screen: `homes-tr2` 25–110 k tris in 1–4 calls plus the lo cells around them (3–8 k); a full hi cell is 25–50 k tris vs 4–15 k as lo.

Programs: +0 (the lo / far / cell meshes use the shared Tripo atlas material; the probe read 158 programs at lv 30). Texture memory: no new texture (atlases homes + civic from R1, ≤ ~50 MB estimate, the generic models only add tiles to the homes atlas; the lo files have an 8 × 8 dummy that is never drawn) — estimate, NOT measured. Geometry: far mesh + lo + hi sets of every cell are kept (hi and lo are built lazily, only for cells the camera has visited); a full set is ≈ 10 MB, estimate.

## Gate / tests (final code)
All run on the rebased tree (kit 19bfbf8 + S4a R2): `GATE_W: ALL OK` · noRoute **667** (< 700; nav is not touched) · `TR2 S4A OK` (1391 checks: lo files, generic houses, smoke anchors inside the chimney, flag scale, LOD helpers, village homes, determinism, words) · `TR2 TIERS OK` · `B2 OK` · `B3 OK` · `P41 OK` · `B1 OK`. No «bot / ربات» in any new string. assets.js not touched.

## Shared-file lines (hand-merge) — all marked `// TR2-S4a-R2`
`world.js` (7 lines: 5 changed, 1 removed, 1 added):
1. (new, before `buildTown`) `const warmTr2Town = L.TOWN ? warmTown().then(() => true, () => false) : Promise.resolve(false);` — the town models start loading early (overlap with the castle's).
2. (new) `ctx.tr2town = !!tplan && await Promise.race([warmTr2Town, new Promise((r) => setTimeout(() => r(false), 8000))]);` — decided BEFORE `buildTown`, so town.js / village.js know whether to draw their own houses.
3. (removed) R1's `if (tplan) warmTown().catch(() => {});`
4. `bakeVillage(…, { shadows: !!Q.shadows, tr2: !!ctx.tr2town })`
5. `createPlannedTown({…, gen: (ctx.town && ctx.town.gen) || [], …})`
6. update loop: `if (camera && planned) planned.lod(camera, t);`
`buildings.js` (1 line): the `ctx.houses` record gets `id: opts.id` (village.js tells the plain `house` homes from barracks / treasury with it).
The rest of the change is in files S4a owns (b2_homes, b3_civic, town_build, town, village) + `tr2atlas.js` (R1 file of S4a; lo-aware `get()`).

## Missing frames (job 5)
- **Street close-up of ONE house at hero eye height (terrain + 1.7 m, never under it):** `street_cottage_lv1` (fr1k) and `street_cottage_lv20` (fr20k), plus `street_chimney_lv20` / `street_noble_lv20` (a lantern stands in front of the noble in that one — poor frame, the cottage is the proof). Looked at full size: door, window frames, painted trim, tiled roof read well at 1.7 m, no holes, no stretched UVs; the white chips on the cottage wall are in the model's own texture. Taken on the rebased kit 19bfbf8; the lv 20 / lv 30 set on the old kit 8ce26f5 is in `kit_8ce26f5/` (street ×3, civic ×4–5, gen fill / hamlet, destroyed, flag, smoke).
- **Destroyed block (battle frame):** `destroyed_half_street / oblique` and `destroyed_street / oblique` (lv 20): the middle merchant house of the street first loses its roof / wall (dark, broken, half) and then is gone; the neighbours are untouched. Generic / hamlet / village houses use the same path (`tid` per house; unit-tested, not framed one by one).
- **Grey sack-like blobs near chapel / tavern = `props_town/barrels` of the tavern lot, built by `client/src/b3_civic.js`** (the two `Q('props_town/barrels', …)` lines of the tavern dressing, ≈ l.191 / 193; they are baked into the `civic-tr2` mesh). Proof: `hide_0_all_lv30` vs `hide_1_nocivic_lv30` (same camera, civic mesh hidden → the blobs are gone). b3_civic.js is S4a's own file, so removing / moving those two lines is an owner choice — I did NOT change them (not asked).
- Separate thing, not mine: after a block has collapsed, grey fractured blocks lie on the street (left of `destroyed_*`, beside the horse in `gen_fill_lv30`). They only appear in a session where the destruct system has run — it looks like the battle debris, not like town houses. Not investigated.

## NOT done / left on purpose
- `kit_homes / kit_civic / kit_village` NOT removed from `assets.js` (rule). MB they would save: kit_homes 0.199 + kit_civic 0.397 + kit_village 1.474 = **2.07 MB** at most. Today it is **0 MB**: `kit_village` is still used by barracks, treasury, props and tower roofs, and `kit_homes` / `kit_civic` are the fallback of the Tripo town. Dropping only kit_homes + kit_civic (0.6 MB) means dropping the fallback — not recommended before QA.
- Pennants at 60 % are still the dark navy, ragged, sail-like shape of the model (`smokemark_*`, `flag_townhall_lv30`); `FLAG_S` is ONE number for houses and civic — shrink it further if it still reads big. I did not recolour or edit the model. Street lanterns (≈ 3.4 m) also read large next to the houses — not in this job.

## NOT proven
- Phone fps, shader compile time on a phone, real GPU memory (all numbers = software GL / estimates).
- **Chimney smoke in motion**: software GL runs ~1 fps, so the emitter (dt-based, ~2.2 puffs/s per plume) emits almost nothing; `smoke_*` frames show no smoke. What I can show: `smokemark_*` (green markers at the plume positions sit on the chimney tops of the merchant / craftsman houses) and the test that every anchor lies inside its model's chimney (1391 checks). Smoke from the generic houses: only `house_generic_a` has a chimney anchor.
- **Hi ↔ lo switch at game fps**: lazy bake = one cell per tick, 4 Hz decision; in software GL a fast camera jump shows lo (or far) houses for several seconds — in the game I expect ~1–2 s (reasoned, not timed on a device). The street budget cameras needed a forced `lod` for the same reason.
- Slow network: the 8 s timeout path is the same code path as `__tr2TownOff` (forced, looked at: the kit town is built + the fallback warning is logged), not tested with a throttled network. A failure AFTER `tr2town` became true (e.g. a lo file missing while the full models are there) is try/caught (falls back to hi houses only) — reasoned, not forced.
- Houses on slopes: a hamlet house in `gen_ham_lv30` is partly sunk into the slope (ground = lowest lot corner); in `destroyed_oblique_lv20` the blue house at the right edge looks like it hovers — at Q=low there are no shadows, so contact is hard to judge; not measured. Facing of the village homes (front = +z of the lot) not checked house by house. Plaza homes keep the stone plinth of buildings.js under the Tripo house.
- A dark wedge at the top right of `civic_townhall_lv30` and a dark navy slab at the right edge of street frames look like pennants seen edge-on — not investigated further.

## Frames (photos_TR2_S4a_R2.tar.gz) — what I looked at, full size
- `kit_19bfbf8/` (rebased kit, the final code): `street_cottage_lv1`; lv 20: `street_cottage / chimney / noble`, `destroyed_half_street / oblique`, `destroyed_street / oblique`, `far_top`, `far_town`; lv 30: `smokemark_0..2`.
- `kit_8ce26f5/` (same S4a R2 code before the rebase, old kit): lv 1 `street_cottage`; lv 20 street ×3, civic (market, tavern ×3, townhall, chapel), gen (fill, hamlet), destroyed ×2, far ×2; lv 30 street ×3, civic ×4, gen ×2, destroyed ×4, `flag_townhall`, `smoke_0/1/close` (no smoke visible, see above), `hide_0/1` (blob proof).
Tools in `dev/`: `tr2_s4a_r2_test.sh` (data test, 1391 checks), `tr2_s4a_r2_budget.py` (budget; `STREET=1` = hero-eye cams inside the town, `INIT=…` / `OFF=1` baselines), `tr2_s4a_r2_budget_table.py OLD R1 NEW`, `tr2_s4a_r2_frames.py LV OUTDIR [sets]` + `tr2_s4a_r2_cams.mjs`.
