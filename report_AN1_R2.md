# report_AN1_R2 — animals + villagers walk right (feet on the ground, no sliding, no walking through walls)
AN1 · Job 3 · 15 Oct 2026 · kit `f45b637` (branch `kit`) + this patch · `bash dev/gate_w.sh` → **`GATE_W: ALL OK`** (noRoute **614** / limit 700 — baseline 614, did not rise) · `bash dev/an1_r2_test.sh` → **`AN1_R2 OK`** (32 check lines) · `bash dev/tr2_s4d_test.sh` → `TR2 S4D OK` · `bash dev/an1_off_test.sh` → `AN1 OFF OK`.
All frames and numbers: software GL (SwiftShader) in headless Chromium, **844×390 (landscape)** — **not phone numbers**. Nothing in `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`. No clip, no model and no texture was changed, hand-built or recoloured. The words «bot / ربات» appear in no game text.

## In one table
| what the owner saw | measured BEFORE | measured AFTER | what fixed it |
|---|---|---|---|
| villagers skate / pop at every step loop | the Tripo `Walk_Loop` carries **4.2–4.7 m of root motion per 3.89 s loop** (man 4.73, woman 4.43, youngman 4.70, oldman 4.23 m) and the game moved the instance on top of it → **a 0.58 m (max 1.37 m) jump every loop**, idle frame 1.1–1.2 m ahead of the walk; speed match v / (rate × natural) = **1.70–1.83** (0 % of frames within ±30 %) | match **1.02–1.08**, **100 %** of frames within ±15 %; no loop jump | `tr2_life.js` strips the clip's root travel once at preload (the clip itself is not touched); `walkSpeed` = the real planted-foot speed; clip rate = ground speed / that |
| animals' legs do not fit the ground speed | pasture cow **0.64**, pasture horse trot **0.78**, cart horse **1.33**, yard villager **1.76** | cow **1.04**, horse walk **1.04**, trot **1.12**, cart horse **1.04**, yard villager **1.06** | one natural-speed estimator on the *visible hooves/feet* (`stanceSpeed`), clip rate follows the speed the mover really has |
| turning | **919** one-frame yaw jumps of up to **180°** (mean 77°) in 6 × 50 s of villagers; cart drivers 108 jumps up to 45° | **0** jumps; turn-rate limit 3 rad/s people, 1.5 rad/s animals, 2.2 rad/s knights; people **stop and pivot** when the goal is behind them (no sideways slide: 6e-16 rad in the unit test) | `steer()` in the new `walk_kit.js` |
| start / stop | Walk → Idle switch while still moving at **2.4 m/s (max 3.75)**; max acceleration of a villager **p50 61 m/s² (max 66)**, cart driver **194 / 518**, knight 45 / 135, dog 33 / 36 | switch at **0.65 m/s (max 0.80)**; max acceleration **12.7 / 16.8**, cart driver 5.9 / 19.5, knight 2.4 / 8.5, dog 5.9 / 6.0; ramps **acc 1.3, brake 1.8 m/s²** (people), 0.7 / 1.0 (animals) | same |
| feet in the floor / floating | villagers at worksites **24 %** of samples sunk > 8 cm (max 90 cm); **pen cows 84 %** sunk (median 77 cm: the pen floor is 38–92 cm above the terrain); cart drivers 18 %, cart horses 20 %, stable yard 13 % | worksite villagers **9 %** (p95 13 cm), **pen cows 0 % (98 % within ±3 cm)**, cart drivers 10 %, cart horses 9 %, yard 4 % | a walking grid per worksite (`makeGrid`) rasterised from the site's own meshes: the floor height of every cell (terrain, soup pads, pen floors, planks) |
| through walls / props | **7.0 %** of villager samples inside a wall / fence / prop (248 of 3539, 20 sites), cart drivers 1.3 % | villagers **0 %** (0 of 2936), cart drivers 0.7 % (9 of 1210); cows, horses 0 → 0 | the same grid: blocked cells + A* + string pulling, the mover's collision guard |
| walking in water | carts: driver **3.2 %**, horse **4.4 %** of samples on the river bed under > 30 cm of water (and 0.3 / 0.6 % in ≤ 30 cm); villagers and pen animals 0 % | carts: driver **1.5 %**, horse **1.0 %** (6 spots); villagers 0 % deep, 0.4 % wading in ≤ 30 cm (spot F, final build; 2 of 3133 samples = 0.1 % deeper than 30 cm, at the edge of a blocked cell); pen animals 0 % | grid: water deeper than 30 cm is blocked, shallow water is waded on the bed |

## 1 · How it was measured (before touching anything)
- The game was driven **paused and deterministic** (`__bw.pause(true)`, `world.update(t, 1/30, camera)`), 50 s × 6 spots (20,280) (244,−100) (38,−340) (249,258) (−300,−125) (−100,60) for the crowd movers (villagers, cart drivers + horses, pen animals, pasture cows + horses, stable yard) and 40 s × 2 spots for the mixer creatures (dogs, wolves, knights' horses). Every frame: position, yaw, clip, clip rate, clip start. That is ~700 000 mover-frames (before); the full lists are `out/an_sim_*.txt`, `an_ratio.txt`, `an_cre_*.txt`.
- **Foot slide.** Two numbers, because the absolute slide has a floor that only a new clip can remove (the feet of a gait clip do not all move at one speed: mean spread of the planted-foot speed is **0.42 × body speed for the cow, 0.35 walk / 0.32 trot for the horse, 0.59 for the wolf walk**):
  1. the **match ratio** = game ground speed / (clip rate × natural planted-foot speed of the clip). 1.00 = the planted feet stand still on the ground; > 1 = the body outruns the feet (skating), < 1 = the feet run under a slower body (treadmill). This is the number the fix drives to 1.
  2. the absolute planted-vertex slide in cm/s (cows / horses / villagers from the clip tables, dogs / wolves / knights measured directly on the planted vertices).
  The natural speed is taken from the **visible mesh** (skinned vertices below knee height, stance frames), not from the bones: the bone estimate was 20–24 % too high for the cow (checked offline on the stripped cow / horse / wolf GLBs).
- **Ground contact** = the highest visible up-facing surface under the mover (ray down, ignoring anything > 0.9 m above — a gate arch, a roof, a bridge deck) − the mover's root height (`out/ground_*.json`, 8 groups). Roads are up to 0.135 m over the terrain; the raised static town geometry needs GR1's `groundH` (not published yet) — see NOT proven.
- **Turning / ramps / switches**: from the same logs — yaw change per frame, finite-difference acceleration, ground speed at the frame where the clip changes.
- **Walls, props, water**: random positions of the logs tested against the site boxes / solids (`m4_seg.js`) and the water level (`L.MOAT.level = −0.75`; a mover within 25 cm of the bed where the terrain is under it, split into ≤ 30 cm = wading and > 30 cm = deep: `m4_wet2.js`, 12 000 samples). The water numbers of the six spots were taken before the last change (shallow water waded on the bed, which only touches grid cells in water); that change was re-measured on spot F only, the cart numbers of F are identical in both builds (0.9 / 1.1 % vs 0.9 / 1.2 %).

## 2 · Foot speed match (the "slide" number) — before → after
Match ratio (1.00 = feet planted on the ground), share of frames within ±15 %:
| mover | clip | frames | BEFORE median · ±15 % | AFTER median · ±15 % |
|---|---|---|---|---|
| villager (workers, 3 kinds) | Walk_Loop | 105 788 / 86 098 | **1.70–1.76** · 0 % | **1.02–1.06** · 100 % |
| cart driver | Walk_Loop | 249 658 / 255 152 | **1.83** · 0 % | 1.06 · 98 % |
| cart horse | Walk | 249 658 / 252 942 | **1.33** · 0 % | 1.04 · 100 % |
| pen cow | Walk | 3 778 / 4 852 | 1.09 · 98 % | 1.01 · 100 % |
| pen / cart-yard horse | Walk | 188 / 75 | 0.97 · 97 % | 1.09 · 89 % |
| pasture cow | Walk | 10 928 / 6 750 | **0.64** · 0 % | 1.04 · 100 % |
| pasture horse | Walk | 11 506 / 14 640 | 0.90 · 62 % | 1.04 · 100 % |
| pasture horse | Trot | 542 / 864 | **0.78** · 0 % | 1.12 · 100 % |
| stable-yard horse | Walk / Trot | 3 889 / 4 265, 3 300 / 2 450 | 0.94 · 93 %, **0.78** · 0 % | 1.05 · 100 %, 1.12 · 100 % |
| stable-yard villager | Walk_Loop | 5 805 / 3 222 | **1.76** · 1 % | 1.06 · 96 % |
The remaining 4–12 % on trot / horse walk is the estimator's own spread (one clip's feet do not agree with each other), not a rate the game can still change.

Absolute planted-foot slide, cm/s (mean) — from the clip tables for the crowd kinds, direct vertex measurement for the mixer creatures:
| mover | BEFORE | AFTER |
|---|---|---|
| worker villager walk | 146–148 | **48–49** |
| cart driver walk | 240 | 63 |
| stable-yard villager walk | 239 | 56 |
| pen cow walk | 48 | 36 |
| pen horse walk | 67 | 29 |
| cart horse walk | 90 | 66 |
| pasture cow walk | 73 | 46 |
| pasture horse walk / trot | 112 / 262 | 69 / 152 |
| yard horse walk / trot | 103 / 285 | 70 / 171 |
| dog walk (direct) | 173 | 110 |
| wolf walk (direct) | 145 | **148 — unchanged** |
| knight's horse walk (direct) | 280 | 229 |
| knight's horse gallop (direct) | not enough samples | 1077 (see NOT proven) |
Dog speed 2.18 → 1.13 m/s at clip rate 1.00 → 1.31; wolf 1.86 → 1.53 m/s at 1.00 → 1.28; knight walk 2.74 m/s at 1.00 → 0.80; knight gallop 9.0 → 7.95 m/s at 1.10 → 0.54.

## 3 · What changed in the game (files)
| file | change |
|---|---|
| `walk_kit.js` (**new**, 262 lines) | `steer()` (acceleration, braking curve, limited turn rate, pivot-on-the-spot for people, crawl-and-arc for animals, collision guard, way-point mode), `turnTo`, `approach`, `stanceSpeed()` (vertex-based natural speed with a bone fallback), `makeGrid()` (walkable-floor grid: blocked cells = a face between knee and head above the local floor; floor height per cell incl. soup pads, pen floors, planks; shallow water waded on the bed; components; A* + string pulling), `smoothLine()` for cart roads |
| `tr2_life.js` | `stripRoot` (the villager Walk root travel is removed once at preload), `walkSpeed` = true planted-foot speed × k × `WALK_SLOW`, `startWalk` begins the walk at the frame the idle pose was cut from (no pop out of the idle pose); a dev peek `window.__tr2dev` |
| `wslife.js` | one grid per worksite (built incrementally from its `ws:*` meshes, pumped a few ms per frame), villagers and pen animals move with `steer` along A* routes with the floor height of the grid, clip rate = ground speed / natural speed; carts: smoothed road line, trapezoid speed profile (**cart speed 1.4–1.8 m/s, was 2.2**), horse and driver follow the line with a hitch lag, cobble-ribbon lift (+0.07 m) |
| `pas_life.js` | pasture cows / horses and the stable yard: clip rate follows the speed they really have (the speed was reset every frame before), led horse and carrier speed ≤ 1.45 × natural, the boy faces his displacement |
| `life.js` | dogs / wolves: `steer` movers; knights: natural-speed gait match, turn limit 2.2 rad/s, wait until facing before going, acceleration ramp, cobble lift table |
| `creature.js` | `gaitSpeed()` uses `stanceSpeed` (try/catch, cached per clip), `herd()` is a `steer` mover with the species' natural speed |
Shared-file note: `walk_kit.js` is new; the rest are the files of §1 of the job. The two test files of S4D were adjusted (walking-speed range now 0.9–1.6 m/s — the old 1.6–2.6 counted the clip's own root travel; `creature.js` / `walk_kit.js` joined the list of the files the test lets change).

## 4 · Chosen defaults (stated once, easy to change)
- **Game speed follows the clip, not the other way round**: knights' speed stays inside 0.55 (gallop 0.7) … 1.45 × the clip's natural speed, the led horse and the carrier ≤ 1.45 ×, every other mover moves at its own speed and the clip rate (clamped 0.04 … 1.8) absorbs the rest. Consequences you can see: workers 1.36 → 1.25 m/s, carts 2.2 → 1.4–1.8 m/s, dogs 2.2 → 1.1 m/s.
- People stop and turn on the spot before walking away from a goal behind them (the pivot plays the Idle pose — there is no turn-in-place clip, see needs Tripo).
- Shallow water ≤ 30 cm is waded (feet on the bed); deeper is a wall for villagers and pen animals. Carts keep their road (fords stay).
- The Tripo animals stay OFF (AN1's default); nothing of this touches them.

## 5 · Proof pictures (full size 844×390 per frame, 6 frames 0.25 s apart, white / red posts every 1 m fixed in the world, camera beside the mover at its own ground level)
`photos_AN1_R2.tar.gz` → `strip_<subject>_before.png` / `strip_<subject>_after.png` (2532×780 = 3 × 2 frames), subjects **cartman** (villager walking), **carthorse**, **cow**, **trot**, **dog**, **gallop**. Looked at (all 12 sheets, full size): in the after sheets the feet / hooves stand on the road, grass or cobble in all six subjects, none sunk or floating by eye; a still strip cannot show sliding — that is the numbers of §2. Some gallop frames are the flight phase of the clip (all four hooves off the ground by design). The camera had to be moved to other spots for after because the before spots are no longer where the same mover walks (movers now follow different routes), so before / after pairs show the same kind of mover, not the same place.

## 6 · NOT proven / not done
1. The six after-strips were shot on the build before the last change (shallow water waded on the bed — it only touches grid cells in water). **No phone.** SwiftShader frames, stepped strips (0.25 s), not a continuous 30/60 fps video. Only **844×390** was checked; 800×360 and 932×430 were not shot (the movers do not depend on the view; framing does).
2. **Absolute slide has a floor.** The wolf walk's planted-vertex slide did not drop (145 → 148 cm/s) although its ratio is now 1.0: its feet already spread more than its body speed. Same for the gallop: the planted-vertex test also picks lowest vertices in the flight phase, so 1077 cm/s is not a skating number. A better wolf / gallop needs a clip (below).
3. **Raised static town geometry** (bridge decks, steps, plazas up to ~0.5 m): cart drivers / horses 9–10 %, dogs 18 %, knights' horses 10 % of samples are still > 8 cm into a visible surface (p95 35–47 cm). Needs GR1's `groundH`; ray-casting from the movers was kept out as agreed.
4. **Carts** still touch a box in 0.7 % of samples (masonry_01, refinery_00, mill_00 roads run through a prop) and ford the river on the bed in 1.0–1.5 % of samples (deeper than 30 cm) — their road is a fixed line, not the grid.
5. The match ratio uses the natural speed from the game's own estimator; it was checked independently (offline, stripped GLBs) for the cow, the horse and the wolf only — not for the dog and the knight's rider-horse.
6. Walk → Idle still switches at 0.65 m/s (the crossfade starts while braking); the 12.7 m/s² villager p50 was not traced to its cause (the ramps themselves are limited to 1.3 / 1.8 m/s², unit-tested; route restarts are the likely source).
7. Sheep and pigs of the pens do not walk at all in the game (no walk clip in their old models): nothing to measure or fix.

## 7 · needs Tripo (not in the library, nothing was built by hand)
- sheep / pig / lamb **walk clips** (static today), and a pig / sheep rig if the Tripo animals are ever switched on;
- a **turn-in-place** clip (people, quadrupeds) — the pivot is a rotation of the idle pose;
- villager **work / carry / sit** clips (the workers still use the walk and idle clips only), a **gait with a lower foot-speed spread** for the wolf walk and the gallop;
- tools in the hands (pick, axe) — not asked here, listed for completeness.

## 8 · In the patch (`patch_AN1_R2.tar.gz`)
`bluewall/client/src/{walk_kit,creature,tr2_life,wslife,pas_life,life}.js` (owned, whole files); `dev/an1_r2_test.sh` + `dev/an1_r2/unit.js` (turn rate, ramps, guard, grid, water, route — 32 lines), `dev/tr2_s4d_test.sh` + `dev/tr2_s4d/check_harness.py` (the two adjustments above); `tools/an1_r2/` the measurement tools (`host.py`, `ev.sh`, `sim_kin.js`, `sim_cre*.js`, `an_*.py`, `strip*.{js,py}`, `ground_table.py`, `m4_*.js`) with a README. Photos in `photos_AN1_R2.tar.gz`.
