# report_RS2 — hero mode: one round button + fan, no blue page, sister entrance

**First block for the mother:** «RS2 = the always-open 6-card strip is gone: ONE round button with the current sister's face; touching it pops the other five out beside it (round frames, face centred), a touch on one goes to her and the fan folds, a touch anywhere else closes it. Going to a sister no longer shows a full blue loading card: a small chip «بارگذاری <name>» sits on the page the player is on. A short entrance (drop-in + a soft light, 1.0 s) plays when hero mode starts and after every switch. The Stage B switch (sisters standing) lives inside the fan; Stage B logic and its saving are unchanged. Review like any patch: every frame full size, GATE_W: ALL OK (noRoute 647), +0 programs, 2 draw calls for the light, shared lines listed below, nothing under web/app/*, pkg/, dev/gate*.sh, server *.py.»

Base: kit `e35e072`. Owner: `rp_sisters.js` (rewritten UI part; Stage B untouched). Shared file `rpg.js`: only lines marked `// RS2:`.

## What changed
1. **Fan (job 1).** `.rs-wrap` top-right: main button 56 px (current sister, accent border, chevron badge that turns when open) + 5 fan buttons 48 px + the Stage B switch 46 px (all ≥ 44). Items sit behind the main button (scale .35) and spring out 0.24 s each with a 30 ms stagger. The face crop is data (`FACE`, `faceBg`): the face centre of each card portrait is the circle centre, the card always covers the circle. Outside touch closes through a capture-phase `pointerdown` that never stops the event (the same touch still drives stick / look). The fan hides itself in the underworld / under sheets exactly like the old strip.
2. **No blue page (job 2).** `rpg.js` `mkChip(text, hex)` (bottom-centre pill, spinner + thin progress bar, same calls as `createLoadView`: progress / setTitle / hide). `start()` uses it instead of `createLoadView`, and calls `closePick()` at once, so the player is back on the page he came from (the strategic map) with the chip on it. `pick()` (swap in hero mode) uses `G.chip`. The spinner also shows on the main button. goUnder / goHome keep their own loaders (out of scope).
3. **Entrance (job 3).** Checked first: there was none (the sister simply appeared). Now `entry()` runs at the end of `enter()` and after every successful swap: on flat ground she starts 0.7 m up and the engine's own fall + land physics bring her down (clips `fall` / `land`; the stick works from the first frame; the camera follows her down), plus a ground ring and a soft light beam in her accent colour mixed 35 % to white, 1.0 s game time, then removed. Phone governor level ≥ 5: the drop only, no light. Not on flat ground (water, ladder, wall-walk): no drop.
4. **Stage B (job 4).** Untouched logic; the switch is the last slot of the fan (caption in the open fan says ON / OFF). Hold a fan sister ~0.5 s = bring her (as before).

## Budget
- Programs **+0**: both light materials are `MeshBasicMaterial` with the marker ring's parameters; the beam geometry has a `normal` attribute and the materials are FrontSide (the beam = 4 quads, two crossed, both windings) — the program cache key of both equals the marker ring's (`rig` key == marker key: page test).
- Draw calls: the light = **2** per frame (counted per draw by `onBeforeRender`; frozen frame 280 with / 278 without).
- Textures: 128×128 + 64×128 canvas textures, uploaded once (`renderer.initTexture`) when the first entrance starts of a hero session, freed on `exit()`. No per-frame allocation (`entryAt` returns a small object per frame; the rig is built once).
- Time: light 1.03 s game time, on her feet after 0.83 s (fixed 1/30 s frames).
- Memory after switches: unchanged (`tex` / `geo` equal before / after).

## Files
`bluewall/web/assets/rpg/rp_sisters.js`, `rpg.js` (shared lines below); dev: `workers/dev/rs2_node.mjs`, `rs2_page.js`, `rs2_test.sh`, `rs2_start.js`, `rs2_swap_look.js`, `rs2_entry_at.js`; updated for the new DOM: `rs1_a_page.js`, `rs1_b_page.js`, `rs1_boxes.js`, `rs1_leak.js`, `rs1_leak2.js`, `rs1_sizes.js` (`.rs-c` → `.rs-f`, `.rs-strip` → `.rs-wrap`).

### Shared lines in `rpg.js` (all `// RS2:`)
- `SIS`: `fa` (Persian name) on the 6 entries (2 lines).
- CSS block `.rs-chip …` + `@keyframes rsChipSpin` (7 lines, after the `.rp-i:active i` rule).
- new function `mkChip` (7 lines) before `start()`.
- `start()`: the `lv =` line (chip + `closePick()`), the error line (`خطا در بارگذاری`).
- `sisCtx()`: `chip: mkChip`.
- frame loop: `sisters.tick(now, dt)` (the light runs on the sim's dt).

## Tests
`node rs2_node.mjs` → `RS2_NODE OK` (160 checks: crop covers the circle / face centred, slots ≥ 44 and apart, curve ends at 0, ≤ 1.2 s, texts without bot / ربات). `node rs1_node.mjs` → `RS1_NODE OK`. Browser (`bash rs2_test.sh`, persistent browser, software GL): `rs2_page.js` ok:true (fan geometry, outside-touch close with the touch still reaching the canvas, switch inside the fan, chip text, 0 blue cards, 0 picker, double tap ignored, entrance times / programs / draw calls / memory, exit leaves nothing), `rs1_b_page.js` ok (Stage B logic + saving), `rs1_a_page.js` ok (the six-sister sweep: one resident model, memory unchanged, markers follow, she keeps walking while the next one loads with the chip on screen, no blue card). `gate_w.sh` → `GATE_W: ALL OK`, noRoute 647 (< 700).

## Frames (photos_RS2.tar.gz — all viewed full size by me)
`fan_{844x390,800x360,932x430}_{closed,open}.png`, `chip_loading_844x390.png` (chip over the live scene, spinner on the main button), `entrance_t0.12.png` (drop-in + beam + ring), `entrance_t0.45.png` (landing, ring spreading).

## Not proven (say it to the owner)
- Anything about a **real phone**: feel, fps, smoothness of the drop-in, the look under the phone's colour pipeline. Every test ran in software GL at ~1 frame/s; the timing figures above are game time, not wall time.
- «No hitch» on a phone: the first entrance builds the rig and uploads two tiny textures (measured 0.1 ms here, meaningless as a phone figure). Not measured on a phone.
- The no-blue-page flow was tested in the hero harness (`__rpLoad` + `h.start` with a held glb) — **not** in the full app page starting from the real strategic map; there the code path is the same `start()` (the picker closes at once and the chip is the only thing added), but I did not see it on the real map.
- The entrance while swimming / on a ladder / on a wall-walk (no drop by design; the light's position there is untested).
- Governor level ≥ 5 behaviour (drop only) is by code, not run.
- Known, unchanged: the strategic map still does not show standing sisters; goUnder / goHome keep their blue loaders.
- The fan's face crops were judged by eye on the six portraits; a new portrait set may need new `FACE` numbers.
