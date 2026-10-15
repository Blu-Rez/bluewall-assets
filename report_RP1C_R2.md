# RP1C-R2 — hero mode: face rule · jump · feet · smoothness · lag · bigger + sharper

**For the mother (first block):** `RP1C_R2` = Job 0 (face rule), Job 7 (jump), Job 4 (ground contact + feet), Job 5 (smoothness), Job 1b (lag: cull / governor / readout), Job 9 (a bit bigger + sharper). **Not in this push (they go to `RP1C_R3` with the ramps):** Job 8 (the crown marker + its light + ground ring: built and unit-tested, kept out on purpose), Job 6 (ramps). Owner-only (`rpg:true` / hero module): a normal player loads none of it. Patch is against the kit I started from (`8256556`); `patch_RP1C_R2.tar.gz/APPLY_CHECK_origin_kit.txt` says whether it applies to the newest `origin/kit`. Shared-file lines: **7 lines in 4 files** (section 9), all marked `// RP1C:`, all neutral when `REACH` is neutral. Everything below was measured on the software-GL rig (≈ 0.1–0.5 fps), **not on a phone** — real phone fps / feel is NOT proven.

## 0. Short version
| job | state |
|---|---|
| **0 — face rule** | **done, proven in 33 home scenarios + 14 combat / underworld scenarios.** The angle between her facing and the camera is **≤ 55° in every simulated frame at home** (limit 75°; settled while moving ≤ 30°, limit 35°) and **≤ 70° in combat** (lock + combo with the enemies BEHIND the camera and a 200° drag: 70° = the guard; every other combat / underworld scenario ≤ 52.4°): camera dragged 360° slow / fast, 2 turns in 0.5 s, a 180° flick in 0.1 s, walk / run / sprint / strafe / diagonals, stick towards the camera (she keeps her back to it and walks backwards), stick reversed every 0.2 s, jump, dodge in 8 directions + the no-stick back-step, swim, door auto-walk, sheet open, combat (attack / block / lock / dodge / skills), underworld spawn / exit / enter again. First person is excluded on purpose. One real bug found by this run and fixed: on the very first frame in the underworld her model still had the HOME rotation (169° off the camera) behind the loading screen — `goUnder` now sets her rotation with her position (2 lines in `rpg.js`). |
| **7 — jump** | **done.** Apex **0.57 m** (the owner's 0.55–0.6) at 60 / 30 / 20 fps (exact-g integration; it was 1.11 m and changed with the frame rate), 0.47 s in the air. **No wall-climb exploit:** jumping at a wall piece never put her on the wall-walk (6 / 6 tries, with and without the climb switch; max height above start 0.57 m). |
| **4 — feet on the ground** | **done.** Three fixes (all three of the brief's): rigid contact (the sole IS the surface; the old low-pass lagged below it on a hill), the street ribbon lift (cobbles are up to 0.15 m above the terrain: she now stands on the visible mesh), 2-bone leg IK with the pelvis following the lowest planted foot. Visible surface − her root: p99 of the error **0.102 m → 0.020 m** (1 565 samples over 60 walks / sprints); samples with the root > 2 cm off the surface **759 → 34**; > 5 cm below the surface **24 → 0**; on streets the median error **7.4 cm → 0**; foot sink (sole inside the ground) p99 **0.20 m → 0.039 m**, max **0.31 → 0.107 m**. |
| **5 — smoothness** | **done.** Walk / run cycles share one phase and the measured stride per clip (stance-foot slide cm/s down, table in 5), speed ramps in 0.25 s / stops in 0.28 s (no teleport-start), turns at a fixed time constant that does not change with the frame rate (it used to follow 30 % tighter at 20 fps), strides follow the ×1.12 size. |
| **1b — lag** | **cut, the targets (CPU ≥ 40 % lower, ≤ 150 calls, ≤ 400 k triangles) are NOT reached.** At 844×390, phone defaults, same session, interleaved (6 runs × 40 frames): JS ms per frame **−15…−25 %** (gate 24.1 → 20.5, fields 21.0 → 15.8, mill 25.0 → 18.7 — trimmed mean; median −14…−21 %); triangles at the gate **−22 %**, mill **−37 %**, fields −2 % (−10 % incl. the periodic passes); calls 238–376 (no cut: cells add a few calls, hidden things remove a few). **+0 programs** from all of it. The governor now works in every mode and there is a one-line readout (long press on the eye). Details + what remains: section 1. |
| **9 — bigger + sharper** | **done, with one deliberate deviation:** model ×1.12 (1.96 m), body radius ×1.12, speeds / strides ×1.12 (same cadence), camera pivot / shoulder ×1.12, but the camera DISTANCE ×1.06 only: with ×1.12 the picture on the screen is identical to the old one (she would only be bigger next to the houses) — measured: her on-screen height at the gate 844×390: ≈ 185 px (kit, read from the frame) → 193–198 px (bounding box of her model, depends on the pose of the frame) = about +5…+7 %. Mip bias −0.45 + anisotropy ≤ 8 on HER textures only, a crisp contact shadow, pixel ratio policy in section 1. |
| 8 — crown + light | built (`rp_marker.js`, 25 unit checks) but **held back for RP1C_R3** as asked. |

## 1. Job 1b — lag
Where the time goes (JS ms of one drawn frame, gate, 844×390, phone defaults, rig): `renderer.render` ≈ 15.5 ms (matrices of ~4 300 scene nodes, culling, sorting, GL submission; on this rig it also contains the software rasteriser, on a phone it is the draw-call cost), the rest of the loop 3.9 ms (world update 2.9, hero 1.2).
**What was cut (owner-only; nothing is saved, `exit()` puts everything back — tested):**
- **matrices**: three recomputes every node's world matrix on every draw; a subtree under an invisible node is now skipped, and on the frames between two world updates (the world moves only inside `world.update`, every 2nd drawn frame) the scene's automatic matrix update is switched off and only the nodes that are new since the hero started (her, doors, foes, trail, proxies) are recomputed (`cull.js era()`, one marked line in `main.js`). The picture is the same (equivalence test CULL OK).
- **life**: villagers / animals farther than 75 m are not packed or animated (`REACH.life`, `tr2_life.js`, 3 marked lines).
- **town**: the planned town's few chunk meshes (each spans the whole 300 m town: 235 k triangles in one call whatever the camera sees) are cut once into 64 m cells (same material, same triangles, per-cell frustum test, cells beyond the draw radius are neither drawn nor cast). 36 cells.
- **castle**: full model inside 50 m (it was 80), `REACH.lod` (1 marked line in `castle_tr2.js`).
- **shadows / fog / bloom (phone)**: one cascade, shadow map ≤ 1024, sun box 44 m, refresh cadence per level; far fog closer; bloom off on phones; water mirror off from the start on phones.
- **pixel ratio (phone)**: starts at **1.0**, never above `min(devicePixelRatio, 1.5)`; the sharp climb above 1.0 only after 8 s ≥ 50 fps and it is locked off for the session after one drop (`REACH.cap / own`, 1 marked line in `main.js dpr()`: the hero's own governor owns the resolution; the game's dynamic resolution and thermal steps are not multiplied in on top).

**The governor (works in home, underworld and combat — `setQuality` follows the level; it did not in the underworld before):** 8 levels, cut order = shadows → far crowd → bloom → only then pixel ratio (the PF1 rule): `0 diet` · `1 mirror off` (phone start) · `2 shadows thin` · `3 draw radius + fog in` · `4 shadows off` · `5 px 0.85` · `6 px 0.70` · `7 px 0.55`; down after a 1 s average < 30 fps for 2 s; up only after ≥ 8 s of ≥ 50 fps; a stall ≥ 1 s is not a frame time. Proven on a fake clock (`rp1c2_gov.js`, GOV2 OK: phone start, sharp lock, every transition printed).
**The readout** (long press 0.6 s on the eye button toggles it; small, top-left, icons-only UI otherwise): `52fps u5.7 r19.3ms 453c 2062k px1.00 q1/7` = **frames per second · JS ms of everything before the draw (hero + world + loop) · JS ms of the draw call itself (NOT the GPU's time) · draw calls · thousand triangles · render pixels per CSS pixel · governor step / last step (0 = everything on)**. Frame `L_readout.png` (844×390, live values; the 60 fps is fed by the hero's own frame function on a fake clock, calls / tris / px are the real renderer's).

**Before / after (844×390, phone defaults = governor level 1, interleaved, 40 frames each, "old" = the Job 1b levers switched off in the same session; JS ms per frame, trimmed mean (frames above 3× the median are stalls and left out) / median):**
| view | total JS ms old → new | render | update | calls median (mean incl. periodic passes) | triangles median (mean) | programs |
|---|---|---|---|---|---|---|
| castle gate | 24.1 → 20.5 (−15 %) / 24.0 → 19.8 (−17 %) | 20.1 → 16.4 | 3.9 → 4.3 | 317 → 324 (348 → 354) | 2.11 M → 1.65 M (2.42 → 1.84 M) (−22 %) | 185 → 185 |
| open fields | 21.0 → 15.8 (−25 %) / 20.5 → 16.1 (−21 %) | 17.1 → 12.4 | 3.5 → 3.4 | 244 → 238 (270 → 258) | 1.61 M → 1.58 M (1.88 → 1.69 M) | 185 → 185 |
| outer mill | 25.0 → 18.7 (−25 %) / 21.4 → 18.3 (−14 %) | 19.9 → 14.4 | 4.4 → 4.0 | 389 → 376 (404 → 387) | 2.65 M → 1.68 M (2.83 → 1.74 M) (−37 %) | 185 → 185 |
(The frames alternate cheap / full: ~12 ms on the frames where the world does not update, ~25 ms on the others — that is the update cadence on purpose; the mean is the throughput.)
Programs: a 60 s walk + 15 s sprint grew the program count by **+1** (the first time something new comes into view; 180 → 181), sprint +0; all 8 governor levels +0; her mip-bias hook is +1 program at hero entry (inherent: one extra variant of her material).

**NOT reached: CPU −40 %, ≤ 150 calls, ≤ 400 k triangles.** What is left at the gate (portrait census, same picture in landscape + more): castle `static-tr2` 227 k (already cells + LOD), crowd 115 k, terrain 83 k (one mesh), village trims 88 k (two meshes), static 72 k, ~34 instanced packs, ~270 separate calls (many small meshes). The next real steps are in world code: terrain / village trims cut into cells like the town, a merged static castle, per-copy culling in the worksite packs. Per-frame hero cost is not the problem (hero 1.2 ms of ~20). **Landscape ladder / programs / ground re-runs are queued after this push; the per-level ladder table below is the portrait run (390×844) — calls / tris differ by view, the level order and the savings per step are what matters:**
| level | label | px | shadows | calls | tris | programs |
|---|---|---|---|---|---|---|
| 0 | diet (mirror on) | 1 | on | 343 | 1.76 M | 181 |
| 1 | mirror off | 1 | on | 242 | 1.14 M | 181 |
| 2 | shadows thin | 1 | on | 234 | 1.13 M | 181 |
| 3 | draw radius + fog in | 1 | on | 204 | 0.96 M | 181 |
| 4 | shadows off | 1 | off | 201 | 0.96 M | 181 |
| 5 | px 0.85 | 0.85 | off | 201 | 0.96 M | 181 |
| 6 | px 0.70 | 0.70 | off | 197 | 0.93 M | 181 |
| 7 | px 0.55 | 0.55 | off | 194 | 0.90 M | 181 |

## 2. Job 7 — jump
`GRAV 22, JUMP_V 5` → apex 0.568 m, hang 0.455 s; the integration is the exact one for a constant g (`y += vy·dt − ½·g·dt²`), so the apex is the same at 60 / 30 / 20 fps (0.568 / 0.568 / 0.563 m; the old Euler step gave 0.53 / 0.49 / 0.45 at the old speed). The clip is stretched over the rise + the start of the fall (0.40 s), then fall, then land (state sequence jump → fall → land → loco checked at each fps). Wall test: from the foot of each of 3 wall pieces, running into the wall and jumping, with `setClimb(true)` and `(false)`: highest point above the start 0.57 m, `layer` stays 0, never on top (6 / 6).

## 3. Job 0 — face rule
Rule (`FACE`, `faceTarget / faceLoco / faceGuard`, one implementation for the game and the node sweep): third person, the camera is behind her; her body yaw follows the CAMERA's yaw (95 % in 0.25 s); a push to the side turns her at most 30° towards it; a push TOWARDS the camera is not «turn round»: she keeps her back to it and walks backwards (the walk clip in reverse, 0.6× speed, ≤ 1.9 m/s, no sprint; a roll towards the camera is the same, reversed); anything that turns her by itself (combat sim, wall climb) pulls the camera round after her; in every frame |body − camera| ≤ 70° (the guard) — the brief's 75°. The body never lags the camera by more than 55° whatever the drag speed.
Proof (`rp1c2_page.js`, inside the real game, every frame of every scenario, measured on the real Object3D / camera = `dev.faceInfo`): 33 scenarios, `ok: true`, no failure, **max 55.0°** (flick / double turn; run on the FINAL code, 12:38; the door-walk and sheet scenarios now wait for real frames of the slow rig instead of a fixed time), strafe + drag 360° ≤ 39.8°, sprint + drag 360° 25.1°, dodge ≤ 46.5°, backwards walk + 360° 11.4°; settled while moving 30° (limit 35°); combat (attack / block / lock / dodge with enemies BEHIND the camera) and underworld spawn / exit / enter in `rp1c2_page2.js`: 14 scenarios, all ok — underworld spawn 0° (after the fix above), lock + combo + drag 200° max 70° (guard), attack + stick back + drag −300° 45.5°, block + drag 360° 43.2°, dodge ×5 ≤ 52.4°, skills ≤ 44.7°, walk with reversals + drag 360° 30.9°, back home 0°, underworld again 0°; settled ≤ 30.4°. Node sweep `rp1c2_face.mjs` (the pure steps over a grid of drag speeds × stick directions): FACE_NODE OK.
Frames: `L_drag180_after.png` (the camera dragged 180°: her back, not her face) next to `L_drag180_before.png` (the kit: she turns to show her face).
NOT proven: first person (excluded by design); a real thumb on a real phone.

## 4. Job 4 — feet (numbers in section 0; method)
The measuring is the mother's `ground_walk.py` idea in `rp1c2_ground.js`: a raycast of the VISIBLE surface (every visible non-skinned mesh, ribbon included) under her root and under each planted foot, 14 starts, walk and sprint, a sample every 0.1 s, slope classes 0–10 / 10–20 / 20–30 / 30–35°. Foot sink p99 by slope (old → new): 0–10° 0.113 → 0.032 m, 10–20° 0.142 → 0.038, 20–30° 0.200 → 0.053, 30–35° 0.152 → 0.060 (the 30–35° class has 9–13 samples). The remaining max 0.107 m is a curb / stair edge (smoothed on purpose ≥ 12 cm). One bridge outlier (−0.45 m at the bridge deck: the ray hits the deck, her root is the deck's own height) is in the table, not hidden. (No side-by-side strips in this push: the numbers come from the raycast runs.) Mechanisms done: **rigid contact · ribbon lift · 2-bone leg IK** (all three).

## 5. Job 5 — smoothness
Measured on a flat meadow, planted-foot slide (cm/s, median of the stance phases) old → new: walk 7.1 → 6.4; 2.5 m/s 207 → 28; 3.5 m/s 82 → 24; run 55 → 32; sprint 49 → 22. Start / stop (run): 90 % of the speed in 0.25 s, stop in 0.28 s over 0.57 m (sprint 0.32 s / 0.35 s / 0.94 m), acceleration ≤ 16 m/s² (no step). Walk / run clips share ONE cycle phase with the run clip shifted (`GAIT.off −0.12`) so the heel strikes coincide at the blend; smoothing steps use `1 − exp(−rate·dt)`. NOT proven: foot sliding on stairs; the feel on a phone.

## 6. Job 9 — bigger + sharper
Model ×1.12 → 1.96 m; collision radius 0.50 m; speeds and strides ×1.12 (same step cadence); camera pivot / shoulder ×1.12, camera distance ×1.06 (see section 0); anisotropy ≤ 8 and a mip bias of −0.45 on the diffuse sampler of HER materials only (the world's materials untouched; +1 program at hero entry); the contact shadow is now a crisp radial disc tilted to the slope that shrinks in the air (plain `MeshBasicMaterial` with the door plane's parameters: +0 programs). Pixel ratio: see section 1 (phones start at 1.0 and climb to ≤ 1.5 when the frame rate allows; this is below the kit's 0.85 × dpr on a dpr-2 screen — the owner's lag complaint decided it; the sharpness comes from the bias + aniso + shadow, and from the climb when the phone can afford it).
Frames (canvas crops at 844×390, read straight from the WebGL canvas at a chosen pixel ratio; the camera dragged to look at her back): `before_full_px1 / after_full_px1`, crops `ba_crop_px1.png` (×3) and `ba_crop_px2.png` (×2) (kit | now; px 2 = a retina screen at native), `L_drag180_*`.

## 7. NOT proven / not done
- real phone fps and feel (every ms here is software GL; the readout is how the owner measures);
- the −40 % / ≤150 / ≤400 k targets (section 1);
- landscape ladder / programs / ground re-runs on the final code: queued (the numbers above marked «portrait» were taken at 390×844 on the previous build);
- `rp1b_test.sh`, `rp1c_test.sh` and `gate_w.sh` on the final build: run right after this push (≈ 10 min each); the shared-file lines are neutral by construction;
- first-person face rule (excluded); foot sliding on stairs; combat sim feel;
- the sheet / controls (old Job 2): two checks of `rp1c2_page3.js` still failed in my last run («after close: pad / buttons not restored», «walk-opened sheet: pad / buttons not hidden») — they are in the leftover Jobs 1/2/3 list, not in this push's claims;
- the kit moved on after `8256556` (p53 / p54: town_build, trees, castle stairs spec…): my numbers are on `8256556`.

## 8. Tests
`bash dev/rp1c2_test.sh` → `RP1C_R2 OK` (the dev files are in the patch under `dev/`) (build, parse, no Persian in the hero UI, no «bot», no secrets, ≤ 12 RP1C lines in `main.js`, only the allowed files differ, `crowd.js` is the base's, FACE_NODE OK, GOV2 OK, FOOT OK, CULL OK, no allocation in the per-frame functions). In-page proofs: `rp1c2_page.js` (face, 33 scenarios, all ≤ 55°), `rp1c2_page2.js` (combat + underworld, 14 scenarios), `rp1c2_jump.js`, `rp1c2_ground.js`, `rp1c2_smooth.js`, `rp1c2_prof2.js` (robust per-frame CPU), `rp1c2_progs.js`, `rp1c2_ladder.js`, `rp1c2_L_readout.js`, `rp1c2_L_canvas.js` (frames). Not added to any `dev/gate*.sh`.

## 9. Shared-file lines (everything else is owned: `web/assets/rpg/{rpg,rpg_diet,rpg_foot,cull,doors}.js`, `client/src/reach.js`, new `dev/rp1c2_*`)
- `client/src/main.js` (2 lines, `// RP1C:`): `dpr()` takes `REACH.cap` / `REACH.own` (the hero's governor owns the resolution; floor 0.5 while it does); `scene.matrixWorldAutoUpdate = …` between two world updates in hero mode.
- `client/src/castle_tr2.js` (2 lines): `import { REACH }`; `lodPick(d, cur, n = REACH.lod || LOD_NEAR)` (neutral = 0).
- `client/src/tr2_life.js` (3 lines): `import { REACH }`; `maxDist = min(maxDist, REACH.life)` in two places (neutral = 0).
- `client/src/reach.js` (owned): new knobs `cap, own, lod, life, mtx` (all neutral by default).
- `crowd.js`, `dev/gate*.sh`, `web/app/*`, `pkg/`, server `*.py`: not touched.

## 10. Frames (looked at full size by me)
`L_readout.png`; `before_full_px1.png`, `after_full_px1.png`; `ba_crop_px1.png`, `ba_crop_px2.png`; `L_drag180_before.png`, `L_drag180_after.png` (the kit's own frames are in `before/`, mine in `after/`).

## 11. Decisions taken by default (no questions asked)
- marker + light + ramps held for RP1C_R3 (owner's 11:43 message);
- camera distance ×1.06 instead of ×1.12 (otherwise no visible gain);
- phones start with the water mirror off and px 1.0 (sharp climb ≤ 1.5 only when the frame rate allows);
- the marker was built as one quad per character (shared geometry + texture, the door plane's material parameters: +0 programs) because the instanced version cost +1 program; it is R3's.
- «needs Tripo»: nothing new (the swim / climb clips from RP1B are still missing).
