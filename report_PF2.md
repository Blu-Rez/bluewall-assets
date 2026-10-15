# PF2 — hitches first (shader programs), the owner's benchmark v2, an overdraw probe

> **To the mother: PF2 = F1 + F2 fixed (the hitches), F3 + F8 measured and written up as findings (no code), and the ROUND 4 / A2 items done: the `BW_bench` timer bug (root cause found, reproduced, fixed), the 5-phase benchmark, `pf_overdraw(view)`, and a `?nres=` A/B switch.**
> **Shared-file lines: `client/src/main.js` only — 13 marked `// PF2` lines (limit 30), listed one by one in §7.** I changed nothing in `world.js` / `dragon.js` / `dragon_model.js` / `weather.js` / `battle.js` / `assets.js` / `shaderwarm.js` / `perfhud.js` (not needed: see §2). Own files touched: `perf.js` (+1 export), `pf_probe.js`. **+0 shader programs added by PF2, no new light, no pixel changes by default** (`?nres=` is off unless the address carries it). `web/app/wall.js` is not in the patch (rebuild with `client/build.sh`).
> **What is NOT proven** is in §8: no phone number in this report is a phone number. The rig is software GL (SwiftShader, 2 vCPU, draw calls swallowed): program counts and call / triangle counts are real, milliseconds are not the phone's.

## 0. Short version

| item | result |
|---|---|
| **F1** late lights | **done, measured.** Programs at boot **226 → 199**; six seconds later **226 → 199 (+0)**, i.e. «+15 six seconds after the first draw» (PF1) / «+29…31» (my rig) → **+2** (two depth-only crowd shadow programs, named in §2). The lights were never created late (count is constant at 6): one of them (the model dragon's belly glow, added to the hidden `late:prowler` bucket) was not on the mirror camera's layer, so the mirror compiled 5-light variants first and 6-light variants 240 ticks later. Fix = 3 lines in `main.js`; no light created, moved or added. |
| **F2** night composer path | **done, measured.** A day-only session never builds the +82…110 night programs any more: idle day (120 s) **378 → 199 programs**. The path is built in idle seconds when dusk is near (`nightPathWanted`, 4.0 real minutes before the first bloom frame, checked against the real `tod.js` cycle); a session that starts at night still builds what it needs at once. |
| **F3** `instanceColor` always / never | **measured → finding, no code.** Only **6 programs** are twins (one unnamed material shared by 5 instanced meshes in `late:defenses`, 3 with / 2 without `instanceColor`). The «103 programs from empty-name materials» are mostly different *materials*, not colour twins. A global patch is not worth its risk for 6 programs (§4). |
| **F8** start-up weight | **measured → finding, no code.** Every late GLB is already meshopt + quantization + webp (nothing left to compress without a look change), and `troll` / `pegasus` / `prowler` / horses each have a home consumer that is on screen (gate guards, farm, army camp): making them lazy would make them pop in. Numbers and a proposal in §5. |
| **A2.1** the card lied | **root cause found, reproduced on the old build, fixed.** The recorder of a player *without* `?pf=1` is installed in the middle of the running loop and started with `tick = -1`; its first stored frame carried -1, so the first interval was the page's age (87.9 s in my rig, ≈ 605 s on the owner's phone) → «worst 605660 ms», the map phase's fps = frames / 605 s = «0.6 fps», and the drift windows (seconds since the first frame) held no frames = «blank». (§6) |
| **A2.2** phases | **done.** 4 × 8 s (map day, map night, hero day, hero night, the hour forced and restored) + one **uncapped** map phase (adaptive cap off); one card line per phase; POST 1.6 KB. Night phases wait (not measured) until the night path is built. |
| **A2.3** night is 3.5 × day | F2 removes the by-day cost and the dusk hitch; **`pf_overdraw(view)`** added (pixels × blended layers, hand-checked within 0.4 %); **`?nres=0.7`** A/B switch for the owner's phone. Whether the night GPU cost is resolution-, bloom- or glow-bound **cannot be known without his phone** — the new card's night line + the two switches are how he will tell us (§6.5). |
| tests | `bash dev/pf2_test.sh` → **PF2 OK** (6 unit + 15 browser + 13 benchmark checks, + the static checks) · `bash dev/pf1_test.sh` → **PF1 OK** (19 unit + 24 browser checks; its bench checks updated to the v2 result, §10) · `bash dev/gate_w.sh` → **GATE_W: ALL OK** (noRoute 647, limit 700 — unchanged) |

## 1. The programs table (before = the kit as I started, PF1 merged; after = this patch)

Rig: playwright + SwiftShader, 844×390, `?pf=1&q=high&w=clear`, one page per row, `renderer.info.programs.length` (`dev/pf2/progs.py`, `table.py`; the raw JSON is in the patch's `dev/pf2/`). «forced» = the state is forced (`__bwPath`, hour pinned) and the number is read cold in that state.

| state | before | after | Δ |
|---|---|---|---|
| boot, day, first draw with the late stage ready | **226** (197 + 29) | **199** (197 + 2) | −27 |
| +6…8 s after the first draw (touching) | 224…226 | **197…199** | −27 |
| day, 120 s idle, no input | 378 | **199** | **−179** |
| dusk near (hour 16.8), 120 s idle, no input | 378 | 351 (the night path built in ≈ 63 s of idle) | −27 |
| night, plain path (forced, cold) | 257 | 199 | −58 |
| night + bloom composer (forced, cold) | 347 | 310 | −37 |
| hero, day | 357 | 318 | −39 |
| hero, night | 381 | 318 | −63 |
| hero, night + composer | 385 | 321 | −64 |

(The owner's phone: 346, hero + night. Same sequence as PF1 §1: 197 → … → bloom path → hero.) **Reading it:** the by-day rows lose the night path (F2) and the 29 + 31 mirror-variant programs (F1); the night rows lose the same F1 programs. The attribution of the *forced-night* and *hero* rows to F1 is the mechanism (§2: the 5-light / 6-light twins, +29 at boot and +31 at the 240-tick re-tag, which my «before» run shows as `numPointLights` differences) — I did not re-run those rows with a per-state light-count counter, so for them it is «consistent with», not «proven».

## 2. F1 — what actually happened (and where I deviated from the job text)

The job text says «create every point light before `sw.compile`». **The data says the lights are not late**: in the «before» run the scene holds 6 visible point lights from the first frame to the last (`lightsAll` 6–7, `lightsVisible` 6). What changed 240 ticks after the first draw was *which lights the mirror camera counts*: three.js bakes `numPointLights` into the program key, counts a light only if it is visible **and** `light.layers.test(camera.layers)`, and the mirror's camera (`reflect.js`, `vcam.layers.set(5)`) only sees lights that carry layer 5. `reflect.js` tags lights at construction and every 240 ticks; the model dragon's belly glow, which the late stage adds (to the hidden `late:prowler` bucket), had layer mask 1 (not 33). So the mirror pass compiled its programs with **5** point lights (+29 at the first draw) and again with 6 after the next re-tag (+31).
**Fix:** `tagLights()` in `main.js` enables the mirror layer on every light once the late stage is built, before the first `sw.compile` (3 lines; `reflect.js` keeps its own re-tag; no light is created, moved or added). **Measured:** boot 197 → 199 instead of 197 → 226/228.
**What remains (+2):** two *depth-only* programs (the shadow depth material of the instanced crowd casters in `late:wslife` and `late:horse_m2m_grey`); the depth variants are created by the first *shadow render*, not by `renderer.compile`. Named with `dev/pf2/who.py`. Not closed: a warm-up shadow render in `shaderwarm.js` would cost one more slice at the load for 2 programs; I left it.

## 3. F2 — the night path

three.js bakes `outputColorSpace` / `toneMapping` into the key, so the bloom composer (render target) needs its own copy of every program: +82…110. Before: `bgCompile()` built it ~400 ms after «Ready», for everybody, every session, by day. Now: `warmOther()` (main.js) builds it only when `useComposer()` is already true (a session that starts at night) or `nightPathWanted(hourNow())` (`perf.js`: game hour ≥ 16.7 or < 6.5). One real hour is one game day (`tod.js` DAY_MAP, non-linear); `night > 0.25` starts at game hour 18.0 = real minute 44.9, hour 16.7 is **4.01 real minutes earlier**, and the idle compile (duty 0.25, one new program per slice) needs ≈ 60–110 s. Triggers: once at «Ready» and in the frame loop every 120 frames while the path is missing (so a session that was open all afternoon starts it by itself). If the compile has not finished at dusk, `useComposer()` already stays on the plain path (no bloom yet, no hitch).
**Tests (`pf2/unit.mjs`, node, against the real `tod.js`):** wanted = false through the bright day (6.5 … 16.7), never late (no sample with `night > 0.25` and the path unwanted), lead 4.01 min. **Browser (`pf2/page.py`):** day, 100 s without input: path not built, programs flat; hour 16.8: built in idle before night; real clock jumped 4 min: the *loop* trigger (not the boot one) starts it.
**Cost to a day-only player:** 0 night programs, 0 night compile slices. **Cost at dusk:** the same slices as before, but in idle time and 4 minutes early.

## 4. F3 — `instanceColor`

`pf2/inst_census.py` lists every instanced mesh with its material: of the materials used by instanced meshes, **one** is shared by instanced meshes with and without `instanceColor` (an unnamed `MeshStandardMaterial`, 5 meshes in `late:defenses`: 3 with colour, counts 6 / 12 / 6, 2 without, counts 6 / 3). That is 6 programs per render path (screen and composer). The remaining «103 programs with an empty material name» are different materials with no name, not colour twins. Proposal for the owner of `defense.js` (≤ 3 lines): give those two meshes an `instanceColor` (all-white) or use a second material for them. A global «always add instanceColor» would change the program of every instanced pack (the shader reads `instanceColor` when it exists) and cost memory for nothing: not worth it.

## 5. F8 — start-up weight

Every GLB in `LATE` is already meshopt + `KHR_mesh_quantization` + webp (checked by reading the headers), so there is nothing to compress without a look change. Sizes: `troll` 1.57 MB, `prowler` 1.33, `pegasus` 1.04, horses 0.85 + 0.83 + 0.88 + 0.79 (`m2m_bay / black / grey`, `hq_barded`), `treant` 0.78, `anims` 2.57 (MODELS, not late) — the four named groups are **≈ 7.3 MB of the ≈ 14 MB late stage**. Each has a consumer *at home*: `life.js` `troll(g)` (gate guards), `prowler(g)` / dragon model, `life.js` horses (barded knights), `wslife.js` (farm horses), `army.js` pegasus; making them lazy means the gate guards / farm horses appear seconds after «Ready» (a visible pop) or need a world.js change in the late-stage gating (not mine: ≤ 6 lines allowed, and it is more than that). **Proposal (owner of `world.js` + `life.js`):** keep them, but load these four groups *after* «Ready» in the same background queue (the player already sees the castle), with a fade-in on first reveal; that moves ≈ 7 MB off the 51 MB the first frame needs without a pop. The battle loader (`bunits.js need()`) already loads troll / pegasus on demand. **Not done by me** because it changes what the player sees at the first frame and needs the late-stage owner.

## 6. ROUND 4 / A2 — the owner's benchmark

### 6.1 Why the card lied (root cause)
`makeRecorder` hooks `requestAnimationFrame` once, at the first `rec.start()`. With `?pf=1` that is at construction; **for the owner (no `?pf=1`) it is the first `BW_bench.run()`**, in the middle of the running loop. The recorder's `tick` started at -1, and the first frame it flushed was stored with `F.t[0] = -1`; every later frame has the real timestamp (≈ the page's age). So: first interval = page age (**605 660 ms** on his phone = 10 min of play), phase fps = (n − 1) / (605 s) = **0.6 fps**, and `fpsAt(0, 5)` looked for frames in the first 5 s *after* time 0 and found none = drift blank. I reproduced it with the old build, same address shape as the owner's: **«0.8 fps avg · worst 87861.5 ms · map - · drift -→-»** (the page was 88 s old) — exactly his symptoms.
**Fix (`pf_probe.js`):** a frame is stored only if its timestamp is valid (`tick > 0`), `start()` re-arms it; intervals are *only* differences of rAF timestamps; an interval above 2000 ms is a **stall**: counted (`stalls`, `stallMs`, `stallMax`), left out of avg / p50 / p95 / p99 / max / fps; the tab's `visibilitychange` during the run is counted (`vis.n`, `vis.ms`); drift = first 5 s vs last 5 s *of each phase's valid frames* (null under 6 s). Tests: `page.py` G (a synthetic 605 660 ms gap = 1 stall, fps 59.9 / avg 16.7 / p95 16.7 / max 16.7 unchanged by it) and `bench_check.py` (the whole run on the page without `?pf=1`: no figure above 2000 ms).

### 6.2 The phases and the card
`BW_bench.run()` now runs **5 phases × 8 s**: map day (hour 13), **map day uncapped** (adaptive cap off, `CAP.off`, then restored), map night (hour 23), hero night, hero day (the hour is forced through `ctx.setHour`, restored at the end). **Before the night phases it builds the night path and waits (not measured, ≤ 3 min, a live «building the night shaders… N s» on the card)** — otherwise the «night» phase would silently measure the plain path (F2 means a day session no longer has it). One line per phase on the card (fps · p95 · worst · calls · K tris · buffer px · q), then one line with programs a → b, stalls, hidden count, drift, night-path state, sent / not sent. POST **1.6 KB** (limit 3.5 KB; `v: 2`). Headless result (software GL; see §8 — these are **not** phone numbers; `pf2/bench_check.py` → ok):

```
BENCH day 14 · night 10.8 · hero 29.9 / 26.6 · uncapped 22.6 fps
MAP DAY      14 fps · p95 133.4 · worst 683.2 ms · 636 calls · 4696K tris · 844x390 · q high
MAP NIGHT    10.8 fps · p95 133.3 · worst 150 ms · 688 calls · 4122K tris · 633x292 · q high
HERO DAY     29.9 fps · p95 33.4 · worst 49.9 ms · 225 calls · 1419K tris · 590x273 · q high
HERO NIGHT   26.6 fps · p95 50 · worst 449.9 ms · 272 calls · 1506K tris · 717x331 · q high
MAP UNCAPPED 22.6 fps · p95 66.7 · worst 83.4 ms · 667 calls · 4961K tris · 844x390 · q high
programs 197→357 · stalls 0 (0 ms) · hidden 0
drift 10.5→17.8 · night path ok · not sent
```
(`photos_PF2.tar.gz/bench_card_v2.png` is this card at 844×390, viewed at full size: one line per phase, nothing wraps or is clipped.) Read the buffer column: the game's dynamic resolution moves between phases (the rig is slow, so it drops to 0.75 on the night phase); on a phone the same thing happens, and a night line with a smaller buffer is not a cheaper night.

### 6.3 `pf_overdraw(view)` (for ST1_R2)
In `pf_probe.js`; `window.pf_overdraw` exists on owner / dev / `?pf=1` pages. It counts, **on the CPU, from the real scene and camera**, the pixels × layers of every visible additive (`AdditiveBlending`) and alpha-blended sprite / mesh: sprites as their quad, meshes by rasterising their triangles on a ≈ 40 000-cell grid (back faces culled by `material.side`). No GPU work, no render target, **no shader program**, the same number on every device for the same camera → a before / after is comparable. `pf_overdraw()` = current camera and buffer; `pf_overdraw({ camera, w, h })`; `pf_overdraw({ within: { x, z, r } })` = only objects whose centre is within r metres (one vault, the keep crystal); `{ filter(obj) }`. Result: `{ w, h, px, add: B, alpha: B, glow: { objs, px, ratio, wpx }, top: [10 heaviest objects: kind, name, position, size in m, opacity, px, % of screen] }` with `B = { px (pixels × layers), ratio (layers per screen pixel), covered, max (most layers on one pixel), wpx (× opacity = the visible strength), objs, tris }`; `glow` = the big additive sprites (≥ 4 m: the gem / crystal halos and lamp glows) on their own. **Check (`page.py` H):** a camera 25 m from the ruby vault's glow sprite (10 m, opacity 0.47) → **25 758 px**; by hand `(10 / (2·25·tan 26°) · 390)²` = **25 663 px** (0.4 %); weighted by opacity 12 106. **Numbers from the default night view (844×390, hour 23):** additive layers 0.12 per screen pixel (67 objects, max 5 on one pixel), **gem / lamp glows 0.04** (25 big sprites; the ruby / emerald / turq vault glows are 10 m sprites at opacity 0.47), alpha-blended layers **1.23**: almost all of it one unnamed 2800 m alpha mesh that covers the whole screen (the sky dome, I believe; not verified by name) plus `water-mist` (20 % of the screen) and the instanced `Glass_lamp_*` panes (2–3 % each). **Not counted:** depth occlusion by walls (an upper bound), skinned meshes, `Points`, texture alpha.

### 6.4 What F2 changes for the night cost
By day the night path no longer exists; at dusk it is built in idle seconds, so the *dusk hitch* is gone. The *steady* night cost (the composer's full-resolution half-float target, the bloom chain, the output pass, the glow overdraw) is unchanged. Facts from the code: **bloom exists only on `high` / `ultra`** (`PRESETS`; medium and low have no composer at all), so «bloom at ½ resolution on the low tier» is moot — the low tier has no bloom; and the bloom chain **is already half resolution** (`UnrealBloomPass.setSize` starts its blur chain at ½ of the composer target, then ¼ … 1/32). The expensive part that is left is the scene itself drawn into a half-float target at full resolution, which is what `?nres=` lets the owner A/B.

### 6.5 What the owner can do with the new tools (one screenshot each)
1. Run `BW_bench.run()` as now: the day / night / hero lines show the ratio and the buffer size.
2. Run it again on `?nres=0.7` (the night path renders at 0.7 × resolution; `pf2/page.py` J checks the target is 0.7 × the canvas): if the night line drops a lot it is resolution-bound and the mother can choose a default.
3. Run it with the bloom switch off in Settings: the night line without the composer.
4. `pf_overdraw()` at the vault and the keep crystal at night (ST1_R2 does the before / after).
5. **Ask the owner for ONE screenshot of the new card after p57** (the card is built to be one screenshot: five lines + programs / stalls / drift).

## 7. Shared-file lines (`client/src/main.js`, 13 marked `// PF2` + the one changed line whose comment says `(PF2: warmOther)`; limit 30)
(line numbers in the file after this patch)
1. `import { REFL_LAYER } from './reflect.js'; import { nightPathWanted } from './perf.js';   // PF2: …` (imports)
2. `let hourF = null; const pinned = () => (hourF != null ? hourF : devH);   // PF2: BW_bench forces the hour …` — replaces `const pinned = () => devH;`
3. `const NRES = …;   // PF2: ?nres=0.7 …` (default 1)
4. `composer.setPixelRatio(renderer.getPixelRatio() * NRES);   // PF2: * NRES` (makeComposer)
5. same in `resize()`: `if (composer) { composer.setPixelRatio(renderer.getPixelRatio() * NRES); composer.setSize(w, h); }   // PF2: * NRES`
6. the bloom-setting handler calls `warmOther()` instead of `bgCompile()` (`// PF2: warmOther …`)
7. the `createProbe({ … })` call: three more fields `setHour`, `nightPath`, `warmNight`   `// PF2: the bench's hour / night-path hooks`
8. `// PF2 F1: …` comment block (2 lines) + `const tagLights = () => scene.traverse(…)   // PF2`
9. `if (!OLD) setTimeout(warmOther, 400);   // … (PF2: warmOther)` — replaces `setTimeout(bgCompile, 400)`
10. `tagLights();   // PF2: F1 (before the first compile of the late stage)`
11. `// PF2 F2: …` comment (1 line) + `const warmOther = () => { … nightPathWanted(hourNow()) … };   // PF2`
12. loop: `if (lateReady && !pathReady.rt && frames % 120 === 7) warmOther();   // PF2: the day turns towards dusk …`
`perf.js`: `export const nightPathWanted = (h) => h >= 16.7 || h < 6.5;` (+ comment). `pf_probe.js`: the recorder fix, the bench v2, `overdraw()` / `pf_overdraw`.

## 8. NOT proven (plain)
- **No phone number.** Every ms / fps above is software GL; the program counts and call / triangle counts are real, the hitch *length* of a program (50–300 ms on a phone, PF1's figure from `shaderwarm.js`) is not measured by me. The expected relief (no +29 / +31 compile at the first minutes, no 82…110-program night compile by day, no night compile *at all* for day-only sessions) is a count of programs, not of milliseconds.
- **+2 depth-only shadow programs remain** after the first draw (§2) — the job asked for «equal».
- The attribution of the *forced-night* and *hero* rows of §1 to F1 is the mechanism, not a per-state light-count counter.
- **Night 3.5 × day** (116 vs 33 ms on his phone) is **not explained** — I removed one cause (the by-day build and the dusk hitch), added the measuring tools and a switch; whether the steady night cost is resolution, bloom or glow overdraw needs his phone.
- Dusk lead (4 min) and the 60–110 s idle compile were measured in software GL; on a slow phone the idle compile may take longer than 4 min → it stays on the plain path (no hitch) until done, i.e. a late bloom, not a stall.
- The owner's *own* run of the new `BW_bench` has not happened; the fix is proven on the page without `?pf=1` (his shape of page), not on his phone.
- `?nres=` changes `gl_PointSize`-based sprites slightly (the point-size scale follows the canvas, not the target) — it is an A/B switch, default 1, and is not meant to ship at < 1 without a look check.
- No frame was taken for a pixel change because there is none by default (§0).

## 9. Findings for other owners
- **F9 (RP1C, hero):** in the sequential run the hero's own start adds **+5 programs by day, +0 at night on the plain path, +3 on the composer path** after PF2 (before: +8 / +24 / +4, PF1 F9). The +24 is gone in this sequence; I did not isolate why (the night plain path is no longer half-built by the mirror mismatch — the mechanism, not a counter), so F9's «warm the hero's programs with the hero load» still stands for the +5 / +3.
- **Sky / water (GR1, whoever owns `sky.js` / water):** at the default night view one alpha-blended 2800 m mesh covers the whole screen and `water-mist` covers 20 %: 1.23 blended layers per pixel before any glow (§6.3). If the dome can be drawn opaque (or first, with `depthWrite`) the layer goes away.
- **`defense.js` (F3):** 5 instanced meshes share one material with and without `instanceColor` (6 programs per path).
- **`world.js` / `life.js` (F8):** the lazy-after-Ready proposal in §5.
- **`rp1b_test.sh`:** unchanged known failure («≥ 100 door items», 96 in the kit) — not PF2's.

## 10. Files
`patch_PF2.tar.gz`: `bluewall/client/src/{main.js,perf.js,pf_probe.js}`, `patch.diff`, `APPLY.md`, `workers/dev/pf2_test.sh`, `pf2_rig_build.sh`, `pf1_dev.html`, `pf1_player.html`, `workers/dev/pf2/*` (progs / boot_diff / who / idle / inst_census / inst_who / table / unit.mjs / page.py / bench.py / bench_check.py / od_try.py / package.sh), and **`workers/dev/pf1/page.py` updated**: the PF1 browser test's benchmark checks asserted the v1 result (`map / hero / idle`, `all`, `drift.map5`); ROUND 4 asked for the new phases, so they now assert the v2 shape (five phases, per-phase stats, stalls, per-phase drift, card lines). Everything else in `pf1_test.sh` is unchanged and passes. `photos_PF2.tar.gz`: `bench_card_v2.png` (the benchmark card at 844×390).
