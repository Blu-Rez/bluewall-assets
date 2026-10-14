# p28 progress (Oct 4, 13:27 → ≈17:30 Tehran)
Package: `bluebot_bluewall_p28` (A birds + B title + C optimisation, ONE package). Everything measured in the sandbox (software GL = relative numbers only, never a temperature). **Nothing is verified on a phone** — the new overlay («Performance info») exists to get real phone numbers.

## A. White birds hovering ("مرغ‌ها رو هوان")
- Cause: the 6 `crow.glb` crows. (a) the GLB uses `KHR_materials_pbrSpecularGlossiness` → three r186 ignores it → untextured = plain WHITE; (b) the clip "Take 001" (4 s) animates only head/jaw/knees/hips — **no wings** — so a "flock circling in the air" can never fly.
- Fix: `web/assets/crow.glb` JSON patched (spec-gloss → baseColorTexture, MASK alpha, invalid TEXCOORD_2 normal map removed; original = `dev/s28/crow.orig.glb`); `life.js crow()` = black crows walking/pecking on the field (ground-snapped); `life.js _hens()` = 8 procedural hens/roosters (one InstancedMesh, tint per bird) on the level grass yard west of the coop (the valley wall rises east of it), walking/pecking, hidden at night / with "birds" off. Eagles/swans unchanged. Owner: «خوبه» on the crow sample.

## B. Loader title aged (`dev/s28/age_title.py`, `pub/ld_title3.webp?v=3`)
Worn lacquer (greyer mottled patches, calmer highlights), micro-scratches, lacquer chips at the face edge, soot in the crevices, faint teal patina on the rim, grain, a few alpha nicks. Same font/colour family/size/silhouette. Sample shown (390×844 real loader + close-up); awaiting his word on strength (K=1.0; `age_title.py SRC DST K`).

## C. Optimisation — measured (software GL; deterministic numbers: draw calls, triangles, JS ms)
Tool: `client/src/prof.js` (zero-cost chain profiler: `pb()` / `pe(key)` / `pframe()`, `window.__bwProf`) wired into `world.update` (14 keys) and the main loop; dev harness `dev/s28/steps.py` + `mk_bench.py` (+ `probe.py`).
| state (dev page, q=high, h=14) | calls before→after | triangles/frame before→after | JS ms (sandbox) before→after |
|---|---|---|---|
| home clear (default view) | 310 → 344 | 2.92M → 2.44M (−16 %) | 24.6 → 17.2 (mirror 7.5 → 0.0) |
| zoom-out 345 | 305 → 311 | 2.87M → 2.20M (−23 %) | 12.2 → 11.9 |
| home storm | 287 → 340 | 2.86M → 2.42M (−15 %) | 21.4 → 25.9 (noise: render submit 18→24) |
(night + battle not re-measured; frame ms in software GL varied ±2× run to run and is NOT used.)
Toggle-bisect (clear, default view; Δ when the group is hidden): instanced meshes −1.34M tris / −68 calls (grass 360k, tree leaves ~500k, army/crowd ~340k); skinned creatures −212k tris / −72 calls; shadow pass −180k tris / −30 calls (avg per frame); splash points −180k tris?/−31 calls (noise; ~0.9k points); transparent −140k; lights toggle = shader recompile (prog 331→436, don't).
Top costs (default view, in-frustum tris): Grass 360k · tree leaves 340k+153k · army camp 184k + wall crowd 133k · terrain 173k · castle statics 165k · trims 82k · path rocks 73k.

### What changed (all behaviour-neutral at the default view; pixel diff vs p27 = only animated things)
1. **Off-screen creatures are skipped** (`life.js update`): they had `frustumCulled = false`, so all 99 skinned meshes were drawn + shadow-drawn + animated every frame (~70 calls). Now a 0.12 s frustum test (margin 30 m, static buildings 60 m) hides/stops them: 37 of 99 visible at the default view.
2. **Moat mirror reuses its picture while the camera is still** (`reflect.js`): re-drawn once a second instead of every 3rd frame (the castle is static); `every` is mutable (governor).
3. **Meadow instancing is chunked** (`assets.js instance(..., {chunk})`, `world.js` chunk 110 m): grass/ferns/flowers were ONE InstancedMesh spanning the map (all processed every frame); now cells with tight bounds are frustum-culled (+34 calls, −0.5M tris).
4. **Rain draws only the drops that can ever be seen** (`weather.js`): the shader zeroed 60 % of them; they are sorted last and not drawn in rain (snow still draws all). Same picture.
5. **Cool mode** (settings → Graphics «Cool mode (30 fps, runs cooler)»): 30 fps cap, render scale ≤ 1 and ×0.9, shadows every 6th frame, moat mirror off, bloom off.
6. **Thermal governor** (`main.js GOV`): counts full-rate play time (idle/panels/hidden cool it down ×2); after 6 / 10 / 14 min of continuous play — or when the 30 s average frame time creeps > 1.3× the baseline — it steps render scale ×0.95/0.90/0.82, shadows every 4th/5th/6th, mirror every 5th/7th/9th frame; recovers after 3 min of rest. First 6 minutes at `high` = identical to p27.
7. **Performance overlay** (settings → Graphics «Performance info», off by default, not created until switched on; profiler off ⇒ zero cost): fps / frame ms / worst, render scale (dpr × dyn) & buffer size, calls / tris / programs / textures / geometries, JS ms per subsystem (top 6), preset, shadow rate, mirror, bloom, cap, cool, governor level, battery % (if the WebView allows).
Also: `__bwFixDyn` dev switch (pins dynamic resolution while benchmarking).

## Honest limits / unproven
- No temperature or phone FPS was measured. Fewer triangles/calls/JS = less sustained work, but the real effect on heat must come from his phone: ask him to play 10 min with «Performance info» on and send ONE screenshot + «داغ شد یا نه».
- The storm (30 FPS) vs clear (59 FPS) in his screenshot may simply be the 30 fps idle saver (3.5 s without touch), not storm cost — the overlay's `cap` field tells.
- Software-GL frame times were too noisy to rank GPU cost; ranking used triangles/calls/JS ms.
- Draw calls went UP by 6–50 (chunking); on a phone the CPU submit cost per call is small compared with 0.5M fewer triangles, but it is a trade-off.
- Not done (ideas): LOD/decimated soldiers (baked-animation crowds, ~340k tris), merging static castle meshes, shadow pass skip when everything is static, 90 Hz cap (unchanged: 90 Hz draws 90), texture/geometry leak check battle ⇄ home (code paths untouched; `e2e_hero` run shows no console errors).

## Package (delivered ≈17:05)
`/home/claude/pkg/bluebot_bluewall_p28.tar.gz` — 17 files (16 + BUILD): client src (assets, controls[p27], i18n, life, main, perfhud NEW, prof NEW, reflect, settings, ui, weather[p27], world), `web/app/wall.js`, `web/assets/crow.glb` (patched), `web/index.html` (`ld_title3.webp?v=3`), `web/pub/ld_title3.webp`. Gate green except `bot_xfer_test` (no aiogram/sqlalchemy in the sandbox); `camtest.mjs` portrait + land clean; `e2e_hero.py` (home → attack → battle loaded): no console errors; `instest_bot.sh bluebot_bluewall_p28 ok`: install ✅, rollback identical ✅.
Install line: `cd /root && rm -rf bluebot_bluewall_p28 && tar xzf bluebot_bluewall_p28.tar.gz && bash bluebot_bluewall_p28/install.sh`.
After he confirms: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p28` (this also commits the p27 files, which were re-shipped).
## Next
1. His 10-minute play + ONE overlay screenshot (Settings → Graphics → «Performance info») + «داغ شد یا نه»; compare `cap` / `calls` / `tris` / JS ms per subsystem against the sandbox table above.
2. Title strength (K) and the hens' look (tints/size) pending his word. Variant knobs: `age_title.py ... K`, `life.js _hens` tints / sizes.
3. If the phone still runs hot: LOD for the baked-animation soldiers (~340k tris), shadow pass skip when static, merge static castle meshes, 24–30 fps when the view is static for > 20 s.
