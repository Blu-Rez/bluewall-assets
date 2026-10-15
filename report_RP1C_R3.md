# RP1C_R3 — hero mode, round 3b + round 4 (A1) — final report

> **For the mother:** RP1C_R3 = owner-only hero mode, third pass. (1) the marker over every character: **no crown** (owner 18:40), a small empty ring under her, a slightly glowing faceted triangle hanging exactly over the head bone with a clear gap, same-colour halo = the light; (2) **10 walkable ramps** up to the wall-walk (6 outer ring + 4 town ring); (3) **«Go up» markers** (icon + light column within 30 m, HUD arrow, prompt); (4) collision against what you see (grid of the visible body band), doors on the real facade; (5) ground shadow, camera framing, jump, walk/run, swim, hero scale — each with numbers; (6) PF1 F9 warm-up. Review like any patch: every frame full size, `GATE_W: ALL OK`, **+0 shader programs** from the new visuals (marker / ramps / go-up use the parameters of existing materials), no real light, no new image, nothing in the boot bundle, no change to castle / town / battle / economy / server / `pkg` / gate files. Shared-file lines are listed in §8 (4 lines in 3 client files; `rpg.js`, `doors.js` and the 4 new modules are RP1C's own). Put it into the next package. **Not proven: the feel on a phone** (everything here ran in software GL at 844×390).

Push id `RP1C_R3`. Tests: `bash dev/rp1c3_test.sh` (static + node, ~1 min) and `bash dev/rp1c3_test.sh page` (+ the browser battery, ~12 min) → **«RP1C_R3 OK»**; gate `bash dev/gate_w.sh` → see §9.

## 1 · What the owner said, and what is in

| owner / brief | result |
|---|---|
| 16:35 «the crown is ugly: faint, inside the ring, a sign above» → **18:40 (angry): no crown at all, ring back to the earlier small size, above her head a slightly glowing cube/triangle like a mention, with a gap, exactly vertical** | Done as the 18:40 word. The crown code is deleted (no `drawCrown`, no emblem). Ring: empty, 1.3 m outer (was bigger in my 16:35 version). Sign: 3 looks, **default 1 = faceted glowing triangle gem**, 2 = flat neon triangle, 3 = diamond; x/z are taken from the head bone every frame (exactly over her head), 20 cm clear gap at the near distance, slow float of ±2.5 cm. Halo = a same-colour soft sprite behind it (the «light above every character»). Every character within 40 m has it (fades 32→40 m); the hero's own is hidden in first person and when the camera is squeezed closer than 2 m. Sheets: day + night. |
| 19:27 «B blob» | Ground shadow look **B is the default** (see §3). |
| Ramps (walk or run up the wall) | **10 ramps**, §2. |
| PF1 F9 (+24 shaders on entering hero mode) | §6 — the part I could build is in; +1 program at the first frames remains; the +24 case did not reproduce for me. |
| GR1 `groundH` only if it beats `homeGround` | **Not adopted**, numbers in §6. |
| Hero lag note | §7 (honest: not solved, the next lever is named). |
| `cull.js` `mxThaw` line | untouched (`git diff` on `cull.js` is empty; checked by `rp1c3_test.sh`). |
| A1/1 collision | §4. |
| A1/2 shadow · A1/3 camera | §3. |
| A1/4 jump | §5. |
| A1/5 walk / run | §5. |
| A1/6 swim | §5. |
| A1/7 «Go up» | §2. |
| A1/8 scale | §8b. |

## 2 · Ramps and «Go up» markers

* **10 ramps** (`ramps.js`, planned once per hero session from the live wall runs): 6 on the outer ring (all design U = two flights with a flat turn landing), 4 on the town ring (S, U, S, S = straight or U). The inner ring (16 m) has none.
* **Grade ≤ 0.33** (0.30 chosen first; three ramps needed 0.33 — measured max 0.33 while walking them); **lane 2.6 m** (≥ 2.4 asked), flat 2.6 m landing at the wall-walk floor, **parapets 1.15 m high / 0.5 m thick** on both sides, coping, stone fill down to the terrain (no gap under it).
* **Castle material**: vertex colours only, the average colour of the castle's own wall stone sampled from the TR2 atlas at the wall's UVs (nothing invented; a neutral stone if the castle is procedural), courses every 0.9 m. One material, no texture, no new image, **+0 programs**. **6 384 triangles for all ten**, ≤ 1–2 calls near a ramp (each ramp is frustum-culled), no real light.
* **Decoration + hero collision only**: not a game object, not a target, not a solid for the troops. The game's `noRoute` is untouched (gate in §9).
* **Walk test with the real update + the real camera** (`rampTest`, all 10): up onto the wall-walk and back down, `up/down = OK`, **camera inside a solid on 0 frames, falls 0** (page battery, every ramp). *Found and fixed on the way:* the camera grazed the merlon tops for 1–5 frames (0.03–0.17 s) on the way down every ramp (it was only kept above the parapet while she was ON the wall); the camera now keeps above the parapet of any wall box it is over when it is higher than 6 m (inline maths, no allocation).
* **«Go up» markers** (`rp_goup.js`): one marker per ramp foot (10 of 10), within 30 m — a glass icon with ↑ and a soft **light column** (both THREE.Points with a PointsMaterial = the door orbs' parameters → **+0 programs**, measured 163/163/163 programs with them drawn / hidden), **≤ 2 draw calls, < 1 ms** per frame (0.0–0.1 ms measured), no per-frame allocation. When none is on the screen a **HUD chip** (compass arrow + metres) points to the nearest one (hidden under 6 m and while swimming / in the air / first person); standing at the foot (< 3 m, on the ground) the pill **«Go up»** (↑ glyph; no other text) appears and the chip goes; 12 m away it is gone. Everything is created at `enter()` and removed at `exit()` (checked: no element, no group left). *Bug found by the night run and fixed:* a second hero session showed no chip (stale state in `exit()`).
* *Look finding (honest):* the ramp stone is the castle's OWN stone (the dominant wall material of the ring, with the wall's own tint — `harvest()` in `ramps.js`, the very material object the castle uses, so +0 programs). On the outer ring that is the dark **green** stone of the wall-walk and the outer faces; next to the **blue** inner wall face (frames 2 and 3 of the ramp sheet) the ramp reads as a green walkway against a blue wall. It matches the wall-walk it leads to, but it is not the colour of the face it leans on; if the owner wants it blue, the choice is one line (which patch set `harvest` takes).
* UX fixed late: the arrow chip is hidden while she is already up on a ramp (terrain 0.6 m or more below her) — it used to point back down to «the nearest way up» (frame 3 of the first sheet).
* Frames: `sheet_goup_gate_plaza_foot.png` (from the gate, from the plaza = chip, near the foot, at the foot = pill), `sheet_ramps_final.png` (6 frames: the marker + light column + ramp from the town side, climbing the outer U and the town ramp, arrived on the wall-walk of both rings, the plaza chip), night: `night_*_gate.png`.

## 3 · Ground shadow, camera framing (sheets at 844×390)

* **Shadow** (`sheet_shadow_3looks_day.png`, `…_night.png`): **A** soft blob (today); **B** blob (0.72 scale) + a short soft shadow lying along the sun by day / the moon by night (the game's own key-light direction, `tod.js`); **C** = B + a faint dark ring under each planted foot. **Default B.** Same material parameters as the old blob → **+0 programs**, no shadow map. The blob follows the ground slope, shrinks in the air, scales with her. *Honest:* B's directional streak is subtle on the dark road; C's foot rings are faint (that is why they are not the default).
* **Camera** (`sheet_camera_3looks_day.png`): **A** today (D 3.6 m, pitch 0.2); **B** lower + closer over-the-shoulder (D 3.4 m; all distances × the hero camera scale 1.12, she stands at ndc −0.30 = 0.35 of the width whatever the aspect, horizon at 0.40 of the height by construction of the pitch, ground ahead in view, face never visible); **C** higher + wider (D 4.8, pitch 0.4). **Default B.** The pitch is only a look's default: the drag clamp is unchanged. The camera never goes through walls / towers / parapets (`camCheck` = 0 on all ramp walks, §2). Distance, collision radius and shadow all scale with the hero constant.
* *Not proven:* that B is the best on the real phone; the owner decides from the sheets.

## 4 · Collision (A1/1) — `dev/rp1c_collide_test.sh` + `rp1c_collide_page.js`

**Why it was wrong:** the hero's colliders were the game's own TARGET boxes and house discs (made for battle / tapping): some far bigger than the building (an invisible wall 3 m off the church), some smaller, and many visible buildings, tents and timber had none (she walked through them). **What is in now** (`rp_grid.js`): one pass over the opaque static meshes draws the **body band** (every triangle that covers 0.45…1.55 m above the ground and is not a floor or a roof) into one bit grid (25 cm cells, 860×860 m, 1.5 MB); a distance field per 32 m tile on demand gives a smooth slide along every surface, diagonal ones too, no tunnelling; `ray` puts the door on the REAL facade. Pure CPU, built in slices behind the loading card, nothing added to the scene.

The test walks / runs / dodges her into every door, every castle wall / tower / gate / ballista, 160 free-standing surfaces (house walls, fences, tents, timber) and the cottage discs at 8 approach angles (doors: the 8 angles of the half-plane in front; the dodge also at 20 fps = the longest frame the game allows).

| | runs | (a) frames with her centre inside a solid | (b) stuck ≥ 0.5 s while input pushes | (c) pass-through events | unstuck teleports |
|---|---|---|---|---|---|
| **before** (the R2 boxes + discs, same test) | 9 619 | **128 009** | 0 | **6 958** | 0 |
| **after** (final build, hero ×1.2544) | **7 437** (+240 at 20 fps) | **0** | **0** | **0** | **0** |

Doors (`doors.js`): the face point is the real facade; **opened on 1 107 of 1 176 approaches aimed at them**; the others stop at the door, never enter: the dodge roll does not open doors (it is not a «walk at it») and two workshop doors approached on a 34° diagonal. A door she may not enter stays a hard wall; the leaf is never drawn through her.
*Honest limits:* (b) counts «stood still while input pushed **and a slide was possible**» — pushing straight into a concave corner is not slidable and is counted as a *trap* (≈ 570 runs, listed in the JSON), not as stuck; some jobs were skipped because no free 8 m run-up existed (door 213, wall 267, tower 81, ballista 69, gate 9, disc 81, grid 519); the grid is built when the hero is entered (a building moved afterwards is not in it until the next entry); alpha-tested foliage cards, skinned meshes (people / animals), instanced packs (trees keep the game's discs) and horizontal slabs (a bridge deck) are not in the grid; the **water edge** is covered by the swim rule (§5), not by this test.

## 5 · Jump, walk / run, swim

**Jump (A1/4)** — `strip_jump_run_0p05s.png` (a frame every 0.05 s: take-off, apex, landing) and the table (page battery, three speeds):

| | apex (target 0.55–0.60) | air time (0.65–0.75) | landing absorb (80–120 ms) | horizontal speed kept (take-off → landing) |
|---|---|---|---|---|
| stand | 0.576 m | 0.700 s | 100 ms | 0.00 → 0.00 m/s |
| walk | 0.576 m | 0.717 s | 100 ms | 1.35 → 1.35 m/s |
| run | 0.576 m | 0.700 s | 100 ms | 5.51 → 5.51 m/s |

*What was wrong in the old numbers:* R2 gave the right apex (0.57 m) with `g = 22, v = 5` — which is only **0.45 s in the air**: a toy hop, the body is up and down before the clip can show a jump. Now `g = 9.4, v = 3.29` → the same 0.575 m in **0.70 s**; the clip is stretched over the flight (its peak at 48 % = the physics apex at 50 %). *Camera in the jump* (measured, three speeds, 60 fps): it follows her 1:1 vertically (rise 0.58 m for her 0.58 m), peak vertical speed 2.35 m/s, peak acceleration 22 m/s² at take-off (the 10 /s low-pass on the camera pivot eases the 3.29 m/s launch in about 0.1 s): **no step, no jerk**, the follow distance does not change in the air (3.73 / 3.81 / 4.02 m at stand / walk / run). It is a smooth bob, not a jerk; if the owner finds the horizon bobbing too much, the fix is one line (the pivot follows the ground + half the hop instead of the hop) — I did not tune it without his word.
*Not proven / needs a clip:* the take-off is by construction the physics take-off — the clip has **no anticipation (knee bend / wind-up)** and its legs are stretched, not tucked, in the air → **needs-clip list**.

**Walk / run (A1/5)** — I did not touch any clip. Locomotion speed is tied to the clip's measured stride (phase runs at v / stride; the walk clip is at full weight from 0.45 m/s — before, half-blended poses at 0.4–1.2 m/s slid 37–45 cm/s). Acceleration / deceleration 12 / 15 m/s² (were 16 / 16, i.e. instant). Measured on the final build (`dev/…` helper scripts, 60 fps, software GL):

| | speed | foot slide along travel, signed (planted foot) | to 95 % of speed |
|---|---|---|---|
| walk | 1.48 m/s | **+8 cm/s** (5 % of the speed; mean |slide| 14 cm/s) | **0.10 s** |
| run | 5.51 m/s | **+7 cm/s** (1 %) | **0.32 s** |

Turn: body yaw follows the camera (95 % in 0.25 s, lean ≤ 30° towards a sideways push); a 180° reversal at run speed drops to 0.31 m/s and is back to 5.5 m/s after 0.7 s — no instant 180°; the model rolls ≤ 0.045 rad (2.6°) into it. Walk↔run is blended by speed (weights over 1.48 → 5.51 m/s), not by a switch. *Honest:* the run's «mean |slide|» column is not reliable (the toe stays near the ground through the swing, so the planted-foot detector is noisy: 237 cm/s), only the signed number is quoted; sprint (×1.28) is beyond the run clip's stride and slides (needs a sprint clip); the walk↔run blend time was not re-measured separately.

**Swim (A1/6)** — rule: knee-deep (< 0.95 m) = the walk clip, speed slowed to ≈ 1.8 m/s (from 5.5 at a full stick); deeper than 0.95 m = the swim clip, body at the waterline (chin height; the clip lies back-and-head out at every speed), camera kept above the water, speed 1.3 m/s steady (peaks 3.15 m/s for ≈ 0.2 s on entry from a run), a ring + splash on entry / exit with the water module's own quad (`water_life.js` `fxAt`, kind 0 ring / 1 splash — one line, §8), no walking on the river bed, exit onto the bank by the normal ground rule (no teleport). Frames: `sheet_swim_entry_mid_exit_day.png`.
Test (`rp1c_water_page.js`: 24 shores in the page battery = 48 entry + 48 exit runs; 48 shores in the long run = 96 + 96): **0 unstuck teleports; 0 stuck windows on free ground** (every stuck window is at a solid quay wall or a steep terrain bank, listed); river-bed walking 2/48 (runs that ran in from the air); height jumps ≤ 2/48; **enters the swim state 46/48 (96-run: 90/96), leaves onto the bank 44/48 (90/96)**. The failures are not the hero's rules: **quay walls with no way out of the water** and **river banks of 58–63°** in the terrain (the 40° climb rule correctly stops a walker on them) → findings for GR1 / TR2 («river-edge steps», needs Tripo). *Not proven:* how the swim clip looks from every angle (legs hang; there is no leg stroke), and the feel on the phone.

## 6 · F9 and `groundH`

* **F9 (PF1):** `main.js` `heroWarm` builds the plain (screen) path with the game's own `sw.compile` when hero mode starts on a phone booted at night (the bloom path is switched off in hero mode there), and `warmHero` skips the 4×4 render-target compile on the phone path. Numbers (`dev/rp1c_f9_test.py both low`, `F9 OK`; programs before → after start → after the first 4 frames): **without** the warm-up 162 → 162 → 164 (+0 at start, **+2 at the first frames**); **with** it 162 → 163 → 164 (+1 at start, 17 ms; **+1 at the first frames**). On the phone profile (`phone` flag): +4 at start (4 hero materials warmed, 29 ms) and **+1** at the first frames. So the first-frame hitch drops from 2 programs to 1; the remaining one (an unnamed program, `?:254` in the test's list) I did not identify and did not manage to build ahead of time. **PF1's +24 did not reproduce** in any run of mine (`lateReady` was already true when the hero started, so the plain path was already built) — I cannot say it is gone on a real phone booted at night; that needs the owner's phone.
* **`groundH` (GR1) vs `homeGround`:** the hero already stands on `world.fastHeight` (= `groundH`, terrain + road ribbon) as her base; `homeGround` = that + the nav surfaces (bridge decks, steps, plazas) + the ramp surface + the foot-contact ribs. Compared over 6 000 free points of the home map: mean difference **2.2 cm**; 203 points differ by > 5 cm and 38 by > 25 cm — the biggest are the ramps themselves (e.g. (−35, 37): `groundH` 0.14 m, hero ground 9.64 m = the ramp; (−38, −41) 8.91 m; (12, 43) 4.89 m) and two points in the river ((−41, −110), (−104, −199): `groundH` −2.2 m, hero ground 0.72 m). Cost 0.58 µs vs 0.73 µs per call (0.15 µs = nothing). `groundH` alone is strictly less than `homeGround` (it cannot know the ramps or the decks) and saves nothing measurable → **not adopted as a replacement**; the raised-town-geometry question (AN1_R3's) is theirs. Data: `data/groundH_vs_homeGround.json`.

## 7 · Hero lag (honest)

The hero view is still heavy: **238–376 draw calls and ≈ 1.5 M triangles** (measured by the mother / PF1 on the merged kit) against the **≤ 150 calls / ≤ 400 k triangles** budget. This round **did not fix that**: the new things I added are cheap (marker 3 calls per character, ramps ≤ 2 calls near one and 6 384 triangles for all ten, go-up ≤ 2 calls, collision grid = CPU only), the hero-side governor and the town cell split from R2 are unchanged, and the calls / triangles are the castle and the town themselves. **The next lever is not in hero code:** merge the static castle + town meshes (TR2 F4: one merged mesh per cell / material instead of one mesh per piece) — that alone should take the call count down by the number of static pieces; after that the triangle budget needs the LOD of the castle pieces. Until then the phone will lag in the town regardless of the hero. `cull.js` (with its `mxThaw` line) is unchanged.

## 8 · Files, shared lines, scale

**New (RP1C's own):** `web/assets/rpg/ramps.js`, `rp_grid.js`, `rp_marker.js`, `rp_goup.js`. **Changed (RP1C's own):** `rpg.js` (69 lines marked `// RP1C-R3:`), `doors.js` (1 marked line + the facade call). **Shared client files — all marked `// RP1C-R3:`:**
1. `client/src/main.js`: `heroWarm` (new line, F9) and `mkHero` (`warm: heroWarm` added to the options object) — 2 lines (the file has 4 `// RP1C…` lines in total, limit 12).
2. `client/src/water_life.js`: `fxAt(x, z, kind, size, alpha)` — 1 line (the hero's entry / exit ring + splash use the existing `ringAt`).
3. `client/src/world.js`: `waterFx` — 1 line in the returned world object.
Nothing in `cull.js`, `dev/gate*.sh`, `web/app/*` (`wall.js` is a build artifact: not shipped), `pkg/`, server `*.py`. No secret, no Persian text and no «bot / ربات» in a game string (checked by `rp1c3_test.sh`).

**8b · Scale.** One constant: `rpg.js` `HS = 1.12 * 1.12` = **hero +12 % over R2 → 2.20 m**; camera distance (`HC`), collision radius, shadow, marker and swim depths follow it. AN1_R3's `SCALE.md` (default pick 2 = 2.20 m) is what I applied; **AN1's own recommendation is to keep ×1 (1.96 m)** now that the villagers are 1.75 m (×1.12 makes her 26 % taller than a man). The owner decides from the lineup sheet; to take AN1's recommendation change that one line to `HS = 1.12` (the collision test and the sheets were run at 2.20 m; at 1.96 m the numbers would be re-run, not assumed). Findings in `SCALE.md` that are not mine (castle gate 8.7 m arch, wooden archer towers 8 m, the cart, the soldiers) are not touched.

## 9 · Gate and tests

`bash dev/gate_w.sh` → **GATE_W: ALL OK** on the final tree (battle sim: noRoute events **647**, limit 700, baseline 647 = unchanged — the ramps are decoration + hero collision only, nothing the game routes through). `bash dev/rp1c3_test.sh page` → **RP1C_R3 OK**: the static part (every owned file parses, no Persian text and no «bot» in a game string, no secret, `main.js` 4 `RP1C` lines ≤ 12, nothing in `dev/gate*.sh`, only the allowed files differ from the kit, `cull.js` untouched with its `mxThaw` line, no allocation in `cull / doors / rp_goup / rp_marker` `tick`), the node tests (marker, ramp / go-up / water-rule maths, face rule, leg solve, town cell split, governor), the browser battery **PAGE OK (35 checks: programs, 10 ramps up + down with the real camera, 8 go-up checks, 9 jump checks, collision 0 / 0 / 0 / 0 + doors, 6 water checks, no page error)** and **F9 OK**. The outputs are in `data/` (`page_battery_final.txt`, `rp1c3_test_final.txt`, `gate_w_final.txt`). Run time: static ≈ 1 min, battery ≈ 12 min + F9 ≈ 4 min in software GL; the browser parts must not run next to another browser job.

## 10 · NOT proven / needs-clip / needs-Tripo

**Not proven:** the feel on a phone (fps, touch, the jump and the camera) — every number here is software GL at 844×390; the +1 first-frame program of F9 on a real phone, and PF1's +24 case (`lateReady` was already true in every run of mine); how the sign reads on the real phone screen (≤ ±8 px off exact vertical on the idle clip because the head bone sways); the directional shadow on dark roads; the collision for things listed as not in the grid (§4); the swim clip from all angles.
**Needs-clip list (skeleton: the six hero sisters' shared rig):** a **jump with knee bend / wind-up and tucked legs** (the current one is a stretched pose); a **sprint** clip (the run clip's stride is exceeded at ×1.28); **swim with a leg stroke / arm cycle** (the current clip is a lying pose); optionally a **stair-climb** (ramps are the way up meanwhile).
**Needs-Tripo / other chats:** **river-edge steps** and quay exits (the water-exit failures); the castle gate / tower door / keep arch scale (SCALE.md rows 24–26); child models; the archer towers' 8 m legs (SCALE.md §4a).

## 11 · Files in this push

`patch_RP1C_R3.tar.gz` (the 4 new + 2 changed hero modules, the 3 shared client files, the tests in `dev/`: `rp1c3_test.sh`, `rp1c3_page.py`, `rp1c3_node.mjs`, `rp1c2_marker.mjs`, `rp1c_collide_test.sh`, `rp1c_collide_page.js`, `rp1c_water_page.js`, `rp1c_f9_test.py`, `rp1c3_sheet.py`, `rp1c3_drv.py`, `rp1c2_q.py`; and `dev/rp1c3_tools/`: the measuring scripts behind the gait / slide / jump-camera / ramp-walk / `groundH` numbers and the frame helpers) · `photos_RP1C_R3.tar.gz` (sheets + frames, §2–§5, all 844×390) · `data/` inside the photos tar (the JSON behind every number) · this report · `RP1C_R3_progress.md`.
