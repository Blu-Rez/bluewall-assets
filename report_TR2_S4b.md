# report_TR2_S4b — production lots, worksites, mines, mills, farms, fisheries → Tripo models
TR2 · 14 Oct 2026 · kit **p47** (branch `kit`, incl. TR2-S2) + models from `lib-tripo` · `GATE_W: ALL OK` (noRoute **667**, limit 700) · `TR2 TIERS OK` · `S4B OK` (my test).
Software GL (SwiftShader) in headless Chromium — **not phone numbers**.

## خلاصه برای وینگلس
- کارگاه‌ها و معادن حالا با مدل‌های Tripo ساخته می‌شن: چوب‌بری (۲ نوع)، معدن آهن و طلا، سنگ‌بری، مزرعه (۸ کرت + انبار + سیلو + مرغدونی)، گلخونه، دامداری، کشتارگاه، ماهیگیری (کلبه + اسکله)، آبکشی طلا، آسیاب آبی و بادی، چاه نفت، آهنگری/ذوب، سنگ‌تراشی، ضرابخونه، نونوایی، قصابی، دودخونه، کلبه‌ها.
- اگه فایل مدلی هنوز نرسیده باشه (یا شبکه قطع باشه) همون مدل قدیمی کشیده می‌شه؛ بعد که فایل رسید، خودش عوض می‌شه. سطح ۱ فقط ۲ فایل می‌گیره؛ همه‌ی ۳۰ فایل = ۴٫۸ مگ.
- دور از دوربین (بیش از ۱۲۰ متر) هر کارگاه یه مش ساده‌ی رنگی می‌شه تا draw call و مثلث بالا نره؛ نزدیک که شدی مدل کامل با بافت میاد.
- سقف سطح از ۳۰ به `LEVEL_CAP` رسید (۳۰ یا ۵۰): همه‌ی clamp‌های ۳۰ در کارگاه‌ها / دفاع عوض شد.
- **نشد:** معدن‌های جواهر (فیروزه / الماس قرمز و سبز)، پالایشگاه، چرخیدن پره‌ی آسیاب و چرخ آب، قایق‌ها. در `TR2_gaps_S4b.md`.

## What the player SEES now
At level cap 30 (today) every worksite / town production lot keeps its place, footprint, workers, carts, solids and targets (`counts`, `SOLID_R`, `wsSolids`, `sites()` unchanged: noRoute still 667). The building / machine pieces are replaced by Tripo models when their file is loaded:
| old piece(s) | Tripo model |
|---|---|
| lumber mill, sawshed | `lumber_mill_1`, `lumber_mill_0` |
| iron / gold mine | `iron_mine_0`, `gold_mine_0` |
| quarry (hut aside: rocks + crane dropped) | `stone_quarry_1` (one composite) |
| farm fields ×8, barns, silos, coop, hut | `farm_field_1/2` on the 8 plots, `barn_0/1`, `silo`, `coop_0`, `house_cottage_1` |
| livestock pens (floor, fence, shelter) | `livestock_pen_0` ×pens |
| greenhouses | `greenhouse_0` (yaw ±90) |
| oil pits + windlass | `oil_well_0` / `oil_well_1` on the pit spots (flare stack, tanks and the refinery stay procedural) |
| butcher, slaughter hall | `butcher`, (`c4_slaughterhall` → `butcher` large) |
| brewhouse, smithy, smeltery | `brewhouse`, `smelter_0` |
| masonry lodge | `masonry_0` |
| mint hall (vault dropped) | `mint` |
| bakery, smokehouse | `bakery`, `smokehouse` |
| fishing hut / panning hut | `fishing_hut_2` + `fishing_hut_1` / `gold_panning_0` |
| jetty | `jetty` |
| wind mill / water mill | `windmill_asbad_1/2` / `watermill` |
Chimney smoke now rises from the top of the Tripo chimneys (`smelter_0`, `smokehouse`, `bakery`, `fishing_hut_1`); old chimney points inside a replaced piece are dropped.
Frames looked at at full size (50 JPGs in `photos_TR2_S4b.tar.gz`): every kind at level 30; low / mid levels (lumber 3, quarry 5, farm 6 / 18, livestock 9, iron 10, fishery 12, greenhouse 14, gold 16, oil 18; bakery / masonry 8, smokehouse 10, smelter / slaughter 12, panning 14, mint 18, water mill 6, wind mill 10); **cap 50** (farm, oil, fishery at level 50 — same look as at 30, nothing breaks); near vs far LOD pairs (`near_*` / `farlod_*`). The old kit is cartoon, Tripo is realistic: that is the intended swap, but the two styles meet inside a site (old props — barrels, carts, fences, workers — stay cartoon until S4c/S4d).

## What is in the patch
1. **`client/src/ws_tr2.js` (NEW)** — `plan(site, lv, pieces)` → `{ keep, tr2:[{spec,x,z,ry,k}], noProc, noMovers, smoke, gone }`: which old pieces are replaced by which model (RULES table, scales `k` fixed by frames), composites (quarry / farm / livestock / greenhouse / oil need ALL their files, else the old pieces stay), `bake()` (near textured meshes through the S2 `tr2.bake` into a Batcher + `patchDestruct` with per-vertex `aB`, and one far mesh per site), `preload(castle)` / `neededFiles` / `missing`.
   *Far mesh:* each Tripo part is welded by position, vertex-coloured from its texture (sRGB→linear), simplified with `MeshoptSimplifier` (keep 0.2, err 0.1 → **≈ 19–20 % of the tris**), drawn flat-shaded as ONE `MAT.soup` mesh per site (+0 programs, no extra texture). Switched at 120 m in `wsbuild.update()`.
2. **`wsbuild.js`** (OWN): `buildSite` draws `T2.keep` + `WT.bake`; procedural parts the Tripo model replaces are gated by `T2.noProc`; smoke / movers remapped; lazy preload (`t2Check`, redraws the sites when files arrive); `LEVEL_CAP`.
3. **Clamp 30 → `LEVEL_CAP`** in `worksites.js` (wsLevel, N, kScale, tierOf, pieces), `c1_kinds.js`, `c2_kinds.js`, `c3_kinds.js`, `c3_proc.js`, `c4_kinds.js` (all OWN) and `wslife.js`, `defplan.js`, `defbuild.js` (shared, below). At cap 30 bit-identical (`c1..c4_kinds_test`, `p1_test` OK).
4. `web/assets/tr2/*.glb` — **30 models, 4.8 MB, 512 px** (+ the existing `swap.json`). Removed from my set (not wired): `dia_mine_red/green`, `gem_mine_turquoise`, `oil_refinery_0`.
5. Tests / tools: `dev/tr2_s4b_test.sh` (`S4B OK`: plan() invariants over 1020 level × site cases, cap 30 / 50, composites need all files, nothing loaded → old pieces unchanged, every file shipped), `dev/tr2_s4b_perf.py` (BLOCK_TR2 = old baseline of the same build), `dev/tr2_s4b_diag.py`, `dev/tr2_s4b/` (single-site harness: `shot.py`, `info.py`, `lod.py`).

## Shared-file edits (all marked `// TR2-S4b:`)
- `world.js` — **3 lines**: `import * as wsTr2 from './ws_tr2.js';` (l. 38) and in `startLate()` (l. 529-531): `const t2 = Promise.race([wsTr2.preload(castleLevel(levelOf('keep'))), new Promise((r) => setTimeout(r, 6000))]);` + `loadLate(...).then(() => t2).then(() => { loadDone = true; })` (the Tripo files download beside the late models, never blocks more than 6 s).
- `wslife.js` — 2 lines: import `LEVEL_CAP`; `Math.min(30, …)` → `Math.min(LEVEL_CAP, …)` (l. 345).
- `defplan.js` — import + 3 clamp lines (`countAt`: `30 - k.unlock` → `LEVEL_CAP - k.unlock`; `defPlan` `Math.min(30,` ; `defSolids(level = LEVEL_CAP)`).
- `defbuild.js` — import + 2 clamp lines (`level = LEVEL_CAP`, `Math.min(LEVEL_CAP, …)`).
- `assets.js` — **not touched** (tr2lib loads its own files by URL).
No `web/app/*`, `pkg/`, gate scripts, server, `layout.js`, `solids.js`, `nav.js`, `basetargets.json`, `battle*`, army files changed.

## Budget (SPLIT §3) — what is proven
**Strategic cameras**, final build, `p38_perf.py`-style (same script with the Tripo files blocked = old pieces of the same build):
| view | calls old → new | tris old → new |
|---|---|---|
| top (whole home map) | 513 → **501** (−2.3 %) | 3,503,788 → 3,450,713 (−1.5 %) |
| ctr / town / fields / lake (earlier build, before the lazy-import fix) | all ≤ old | within ±1.8 % |
**Close-ups of one site** (camera 85–95 m, `ws_*` views; calls / tris old → new):
| site | calls | tris |
|---|---|---|
| oil | 208 → 208 | +0.4 % |
| quarry | 244 → 249 (+5) | −0.1 % |
| livestock | 238 → 243 (+5) | +2.2 % |
| gold | 280 → 285 (+5) | +2.8 % |
| fishery (lake) | 359 → 379 (+20, +5.6 %) | +2.3 % |
| farm | 293 → 309 (+16, +5.5 %) | **+4.9 %** |
| lumber 1 view (camera clamped at the rim; neighbours near) | 234 → 259 (**+25, +10.7 %**) | **+4.1 %** |
**So the rule «calls_after ≤ calls_before at every view» is NOT met in the close-ups** (it is met at the strategic views): each Tripo file is its own texture = its own draw (+ its shadow draw); the old kit drew a whole site in 1–2 draws. A site with 3–7 different models costs +5…+25 calls only while the camera is closer than 120 m; beyond 120 m the far mesh is ONE draw per site. The lever left is a texture atlas per site (not done). The lumber row is not the lumber site: the camera target is clamped to the kingdom rim (r ≤ 298), so at `ws_lumber1` the lumber site itself is drawn by its far mesh (> 120 m); the +25 comes from the neighbouring sites inside the same frame that are within 120 m — `dev/tr2_s4b_diag.py` (mesh list per site, old vs new, same camera): farm 18 vs 12 meshes (6 textured near meshes), fishery river 13 vs 11, panning 12 vs 11, gold / lumber 1 / lumber 2 +1 each; sites that got cheaper: slaughter 3 vs 5, fishery lake 3 vs 4, greenhouse 2 vs 3. Net +3 meshes in the list (≈ +6 draws with shadows) — **the full +25 is only roughly explained** (the list is not frustum-culled; I did not isolate the rest).
- Lever if it matters on a phone: a texture atlas per site, or fewer files per farm (farm = 6 different GLBs).
- **Programs:** 201 vs 203 (`p39_progs.py`, earlier build) / 164 vs 166 in the final perf runs → **+0**.
- **Textures (GPU estimate, 512 px = 1.33 MB each):** 30 files = **≈ 40 MB** if every model is resident (limit 120 MB); level 1 needs 2 files. `renderer.info.memory.textures`: +5 (top view) … +15 (ws views) vs old.
- Shadow casters: Tripo near meshes cast like the old pieces they replace; far meshes cast only when visible. p39 counts casters 524 vs 452 and customDepth 201 vs 126 **including the hidden far meshes** (they are not drawn) — **not** re-measured as «drawn casters».
- Load: 30 GLB, 4.8 MB total; downloads at level-need only; the old pieces stand in until a file arrives.

## NOT proven / known limits
- **Phone fps, shader-compile time on a phone, real GPU memory** — nothing here measured on a phone.
- Close-up call count above (+5…+25) — the §3 rule fails there; strategic views pass.
- Far LOD is flat-shaded / vertex-coloured: darker and without texture detail than the near mesh; the switch at 120 m is visible as a style change if you look for it (`farlod_*` vs `near_*` frames).
- `fishing_hut_1` is 9.2k tris (over the 8k building budget; slimming = S1).
- Windmill sails are baked into the model (no turning); the water wheel no longer turns (`noMovers`).
- Gem mines (`mines.js`: turquoise / diamond red / green) are NOT swapped — tier-skin-gated procedural estates with targets and FX. Oil refinery not wired (procedural tanks, SOLIDS_PROC). Small props, stalls (S4c), watchtower2 and stages stay old.
- `preload` runs once per page load; a site built before the files arrive is redrawn once.
- Flames of the Tripo chimneys are not wired (the game has no flame effect yet) — smoke only.

## Pitfalls (new)
- tr2lib → assets.js reads `window`: any module a raw-node test imports must load tr2lib lazily (`import('./tr2lib.js')` in `ws_tr2.js`) and guard `typeof window`.
- `Batcher.add` overwrites `color` with the tint → a vertex-coloured mesh (far LOD) must be built directly.
- Simplifying the textured Tripo meshes barely helps (68–95 % remain): UV seams fragment them. Weld by position + colour from the texture first (→ 19 %).
- `TR2OFF` in my single-site harness is not a true off (wsbuild's own preload re-triggers); for the old baseline use `BLOCK_TR2=1 python3 dev/tr2_s4b_perf.py` (aborts the tr2 requests).
- `dev/app_s35/wall.js` → `../app_dbg.js` symlink is needed for `dev_s35.html`; the perf script needs `SKIPINTRO=1`, one browser job at a time, `setsid nohup … &` and polling (the bash tool times out at 10 min).
