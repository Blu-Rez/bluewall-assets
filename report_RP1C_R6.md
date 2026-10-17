# report_RP1C_R6 — hero mode: camera farther / higher / pitched down (+ squeeze search, no top-down views in the open, nothing inside a solid) and the jump (hop camera, landing)

## First block (for the mother)
RP1C_R6 = the hero-mode third-person camera rebuilt around the owner's complaint («almost from above her head, near, ground fills the screen») + a jump pass. ONE game file (`web/assets/rpg/rpg.js`, mine) + dev tests (`dev/rp1c_r6_*`). Review like any patch: every frame full size, `GATE_W: ALL OK` (noRoute 647 < 700), no change to castle / town / battle / economy / server / pkg / gate / `web/app/*` files, no shared-file line outside rpg.js. Base = kit `e35e072` (the newest kit `0e75919` has the same `rpg.js`; `gate_w.sh` was run on `e35e072` + this `rpg.js`).
1. **Camera.** Default look B: 5.6 × HC = **6.3 m** behind her (R5: 4.77 m) at **16° down** (R5: 5.6°), the camera 3.0 m over her feet; she is 34 % of the 390 px screen height (R5: 46 %) and the ground AHEAD of her is in the picture. When something stands behind her the camera no longer rises to 60–87° at 1–3 m (the kit): it first tries a small rise (≤ 25°) and the other shoulder, and only when nothing gives ≥ 2.3–2.4 m it takes a **pocket** camera (54°–90°, 2.6 m, the lowest elevation that still has room). The kit's camera is kept (`dev.camKit(true)`, `placeCameraOld`) for the wall-walk / the climb / the underworld and for the before numbers.
2. **Camera bugs found with the scan and fixed:** under a bridge the camera sat ON the deck and she was hidden (now under the deck, ray-tested against the real piers); a bank / mountain slope behind her lifted the camera 13 m over her (floor clamp now limited to 1.0 m, then the ray is shortened); a camera 2.0 m behind her cut her head off the 844×390 picture (head-fit cost); a camera 1.2 m INTO a wall when she stands at its foot (real-box fallback); a 0.1 m penetration of a 3 m pole disc (height-aware); pops when the camera turns past a wall (smoothed rise / shoulder / dolly + a 0.15 s look-ahead ray). Numbers below.
3. **Jump.** Physics and clip timing were already consistent (measured at 60 / 30 / 20 fps, standing and running: take-off in the first frame, soles leave the ground with the body, apex 0.576 m, air 0.65–0.70 s, soles never > 3 cm under the ground while standing) — I did not touch them. What changed: (a) the **camera** no longer follows every hop (the pivot lags 0.6 of the height: the camera's own height range during a jump 0.53 m → 0.21 m, largest 1-frame step 0.039 → 0.016 m at 60 fps); (b) the **landing** is a dip, not a hold: depth follows the impact (a 0.57 m hop 0.30, was 0.60), in 70 ms / bottom 80 ms / out 170 ms, back to loco 0.34 s after touch-down (was 0.40), the crouch pose leaves at 16 /s. Frame strips: `jump_standing_side_KIT.png` (the kit lands in a deep squat at t = 0.80 s, hips on the ground) vs `jump_standing_side_NEW.png`.
4. **Face rule** untouched and proven again: all 33 in-game scenarios of `rp1c2_page.js` max **55.0°** (the one fail «G tap did not start / finish the walk» is also on the kit; R5 had a second one, «B strafe R settled 44.9°», that no longer fails); page 2 (combat / underworld, 14 scenarios) all ok, max 70.0° in the lock-on combat case (the hard combat limit, unchanged); `rp1c2_face.mjs` → FACE_NODE OK.

## Numbers (software GL; before = the kit camera (look B after R5) switched on with `dev.camKit(true)` in the same file; after = this patch)
Camera scan = 10 456 spots (12 m grid, 4 headings each; fix ON as in the game; 24 samples where the dev teleport puts HER inside a wall box are skipped in both):
| what | before (kit) | after |
|---|---|---|
| distance camera–her: mean / p5 / p1 / min | 4.67 / 3.00 / 3.00 / 0.71 m | **6.26 / 6.30 / 3.49 / 2.29 m** |
| closer than 2.15 m / 1.2 m / 2.4 m | 4 / 2 / 4 | **0 / 0 / 4** |
| camera inside a solid (`camPen` > 5 cm) | 0 | 0 |
| view elevation (below the horizon): mean / p95 / max | 18.9° / 38.9° / 78.3° | 18.0° / **23.0°** / 72.1° |
| samples steeper than 41° / 50° | 481 / 370 (3.5 %) | **78 / 46 (0.44 %)** |
| her height on the 844×390 screen: mean / p5 | 178 / 154 px | 137 / 131 px |
| the ground 6 m ahead of her is out of the picture | 4.95 % | **2.65 %** |
| her head out of the picture | 2 | **0** |
Dynamic test (`rp1c_r6_dyn.js`: 20 routes, 7 680 frames at 60 fps with the real `update()` + camera: walk / run / back into a wall / along a wall / camera turns round her / town / gate / bridge / swim under the deck):
| what | before | after |
|---|---|---|
| 1-frame jumps of the camera > 0.3 m (total / the worst) | 46 / 3.8 m | **3 / 0.70 m** |
| shake (2nd difference > 0.1 m) frames / direction reversals | 146 / 29 | 73 / 20 |
| camera inside a solid | 0 | 0 |
Jump (`rp1c_r6_jump.js`, 60 fps; 30 / 20 fps in `numbers_RP1C_R6.json`), standing | running: take-off 0.017 s | 0.017 s (both versions), apex 0.576 | 0.588 m, air 0.683 | 0.700 s; camera height range 0.53 → **0.21** | 0.56 → **0.23** m; her feet travel on the screen 32 → 27 px | 30 → 26 px.
Other tests (all run with the final code): `rp1c4_cam_test.sh` RP1C_R4_CAM OK (fix OFF 497 spots < 2.15 m → fix ON 0; bridge sideways push 90 / 90 on the deck); `rp1c3_page.py collide water` PAGE OK (water exit 46 / 48, entry 44 / 48, height jumps 0 / 0 — identical to R5); `rp4_test.sh` RP4 OK (170); `tr2h4_test.mjs` TR2H4 OK (42); `rp1c4_info_test.sh` RP1C_R4_INFO OK; `rp1c_r6_test.sh page` **RP1C_R6 OK**; `gate_w.sh` **GATE_W: ALL OK** (noRoute 647 < 700, unchanged).

## Frames (photos_RP1C_R6.tar.gz, 844×390, all 12 looked at full size)
`before_*.png` / `after_*.png` for the six spots: `home_square` (the home square), `gate`, `bridge_side` (beside the bridge), `town` (inside the town), `near_wall` (1.6 m from the 8.2 m wall), `under_bridge` (she swims under a deck). `*_numbers.json` = the per-frame numbers (distance, elevation, her height, head / feet y, the ground 5 / 10 m ahead, face angle).
- home / gate / town: she is smaller (136 px instead of 180), the camera 1.5 m farther and 0.4 m higher; the ground ahead and the buildings are in the picture.
- **bridge_side**: before = 57° at 3.0 m («almost from above, ground fills the screen» — the owner's picture), after = 23° at 6.3 m, level.
- **under_bridge**: before = the camera on the deck, she is hidden; after = under the deck at 8.5°, 3.4 m, she and the river ahead are visible.
- **near_wall**: before 62° at 3.0 m, after **55° at 2.65 m** — still a steep view: she stands 1.6 m from an 8 m wall, there is ~1.1 m of room behind her, so any camera that keeps her whole in the picture must be steep. Further from the wall it opens up at once: `wall_distance_*.png` (2.6 m from the wall 43°, 3.6 m 17° at 3.2 m, 7 m 17° at 6.3 m).
- `jump_*`: standing and running jump, a fixed side camera (crop 330×390) and the real camera at the same instants (t = 0.02 … 1.0 s).

## Every changed line (all in `web/assets/rpg/rpg.js`, my file; marked `// RP1C_R6:`)
- l. 9 `CAM_B = { far: 5.6, pit: 0.28 }` (replaces R5's `CAM_FAR`); l. 10 `CAM_MIN` / `CAM_RISE` kept (the kit camera); l. 11–14 new constants `PIT3_*`, `CAM_SQ_*`, `CAM_FIT`, `UNDER_D`, `BANK_LIFT`, `DISC_H`, `PK_*`; l. 22 `LAND_STAND` 0.40 → 0.34
- l. 408 / 410 / 662: the landing dip (pose weight shape, blend rates, `S.landW` from the impact speed)
- `segHit` (l. 692–727): the real-box fallback when she stands at a face, discs for a raised camera only over their top (`DISC_H`), `bankLift`
- `CAMS` look B reads `CAM_B` (getters); `camP`; new `hopLag` / `pivotStep` (the pivot lags a hop); `placeCamera0` dispatches: `placeCameraR6` (new, the squeeze search + pocket + smoothing + look-ahead + under-deck branch) for the third-person look, `placeCameraOld` (the kit's function, unchanged body) for `S.camKit`, the wall-walk, the climb, first person, the underworld
- new `deckUnder`, `underTrisOf`, `triRay`, `underBridgeIdx` (the triangles of the static meshes round a bridge, cut out once per bridge, double-sided Möller–Trumbore)
- pointer drag clamp `PIT3_MIN..PIT3_MAX` (the kit's 72° down is now 46°)
- dev API only: `camKit`, `segHit`, `camPen`, `camInfo` (+ `xe`, `f`)
- tests (mine): `dev/rp1c_r6_test.sh`, `rp1c_r6_scan.js`, `rp1c_r6_dyn.js`, `rp1c_r6_jump.js`, `rp1c_r6_jframes.py`, `rp1c_r6_frames.py`, `rp1c_r6_one.py`, `rp1c_r6_shot.js`, `rp1c_r6_run_scans.sh`

## Not proven (اثبات‌نشده)
- **The real phone**: feel and fps of the new camera (software GL only; the whole dynamic test — physics + camera, 7 680 frames — runs in 3 s on this machine, but the camera's own cost on the phone is not measured). The distance / pitch are two constants (`CAM_B`) if he wants more or less.
- **Near big walls the view stays steep**: within ~2.6 m of an 8 m wall (and in tight courtyard corners) the camera is 43–72° — 46 of the 10 456 scan spots (0.44 %; the kit 3.5 %). It is physics (no room behind her), not a bug; the alternatives are a camera 1.2 m behind her (her head leaves the picture) or fading the wall mesh (castle file, not mine). Owner's call.
- **Residual pops**: 1 pop of 0.70 m (walking along a wall while the camera is turned at 40°/s, one pole entering the swept ray) and 2 of 0.38 m (full camera circle 1.6 m from a wall) in 7 680 frames; 73 shake frames (mostly the smooth starts of a dolly-in).
- **Jump**: nothing in the physics / clip timing measured wrong, so I changed only the landing and the camera; if what the owner sees is something else (no wind-up crouch before take-off — the take-off is at the key press by design; a slope; the phone's frame rate), I have not seen it. 20 fps footage was only checked by numbers, not by eye.
- Frames only at 844×390 landscape (portrait 390×844 and 932×430 not looked at).
- The under-bridge triangle cache is built lazily at the first swim under a deck (tens of ms once per bridge on this machine; not measured on the phone).
- The scan skips 24 samples where the dev teleport puts her inside a wall box (the kit identical); the door module's / `unstick`'s forced yaw snaps (3.4 m jump in `town_walk0` of the old harness) are not camera code and are excluded from the pop count.
- The «before» frames / numbers are the kit camera inside the new file (`camKit`): `segHit` is shared, so the kit path also got the three `segHit` fixes (it only makes the before numbers slightly better).
- `rp1c_r5_test.sh` (static greps for `CAM_FAR = 1.25`, look B text and the R5 marker count) fails BY DESIGN now — R6 replaced those; `rp1c_r6_test.sh` supersedes it (drop the file or its camera greps). `web/app/*` (the build) is not in the patch.
