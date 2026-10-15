# RP4_R3 — the roll is THROWN forward, a hit throws its victim (owner: «the push / dodge turns in place»)

Owner-only (hero module / combat core). Everything below was measured on the software-GL rig, **not on a phone**.
`rpg.js` is **NOT in the patch** (RP1C is editing it): the host hook is the separate `patch_RP4_R3_rpg_hook.diff` (section 4).

## 0. Short version
| | before | after |
|---|---|---|
| host roll, home map (real game, 8 directions + no stick + stick released) | 2.31 m, ends at 1.5 m/s with a jump to walking, camera glued to her | **2.90 m**, exact at any frame rate, 6.3 m/s at the start → 0.14 m/s at the end, camera follows softly |
| sim roll (underworld / RP4 arena) | 4.4 m, with no stick a back-step | **2.9 m** along the stick, **forward along her facing** with no stick; stick at the camera (host passes «no push») = 2.6 m the other way, facing kept |
| water edge (12 trials, 6 banks × 2 start distances, home map) | deepest water in the roll 0.95 m, 36 frames swimming | **≤ 0.60 m, 0 frames swimming** (roll stops at the bank) |
| walls (14 cases, both sides of the longest wall) | — | **0 frames inside** any wall; stops at 0.50 m (body radius) |
| hit knock-back | enemy: velocity nudge; hero: velocity nudge | **0.5–1.5 m in 0.2 s** (after hit-stop), through the enemies' own solids; hero hit 0.7 m, knock-down 1.5 m |

## 1. The cause of «rolls in place»
- home map: the host roll gave 1.5 + 5·(1−t/0.6)² m/s = 2.31 m in total, ended on 1.5 m/s (an abrupt stop of the throw), and the camera pivot follows at k = 16 /s — she stays glued to the middle of the screen, so a 2.3 m roll reads as «in place».
- underworld: the sim roll was 4.4 m but a no-stick roll was a back-step and the throw was not shown against the world either; knock-back was a velocity nudge with no distance, no time, no solids.

## 2. What was done
**combat.js (owned)**: `TUNE.dodge { dist 2.9, back 2.6, p 2 }`; displacement fraction `1−(1−f)^p` (fast start, slow end), i-frames 0.04–0.34 s unchanged; `startDodge`: stick → turn + `dist`; stick at the camera (`H.backIn`) → other way along her facing, yaw kept, `back`; no stick → forward along her facing. `TUNE.knock { min 0.5, max 1.5, t 0.2, hit 0.7, down 1.5 }`: `kickEnemy / kickHero`, the throw runs over `knock.t` with the same ease, through `collideE` (enemy solids). Reset / revive clear it. The determinism checks of `rp4_test.sh` pass.
**combat/fx.js (owned)**: new `collideE(x, z, r)` (the underworld's disc colliders + boundary), passed to `createSim`; `inp.back` (stick at the camera) added to `pre()`.
**hook (not applied)**: see 4.

## 3. Proof (all from the real game unless said)
Pictures (photos_RP4_R3.tar.gz): `rp4r3_topdown_8dir.png` (8 stick directions, a dot every 0.05 s, before = grey × marker at its end, after solid, 2.6 / 3.2 m rings), `rp4r3_speed.png`, `rp4r3_wall.png` (stop at the wall + sliding at 45° / 70°, both sides), `rp4r3_film_side.png` (side filmstrip before / after, same spot, 5 of 10 frames) and 6 full-size frames `frames/*.png` (844×390) that I looked at.
- 8 directions (home map, hooked rpg.js): 2.90–2.91 m each, sideways error 0.00, 0 frames inside a solid; no stick 2.90 m; stick released after one frame 2.90 m (the burst is locked at the press).
- speed curve: start 6.12 → peak 6.30 → end 0.14 m/s (before: 5.58 → 5.96 → 1.50, flat tail).
- camera (distance moved per frame, its largest change of speed): 86 → 39 m/s² (a 6.5 /s follow eased in / out: no jerk at the start or the end); the filmstrip shows the pose sequence and the ground she covers (2.41 m before, 2.93 m after, same spot, same side camera); in BOTH rows she is off the middle of the screen mid-roll, and I did NOT measure the screen offset separately (`rp.proj` returned stale screen coordinates), so «she visibly travels across the screen more than before» is expected from the softer follow (lag ≈ speed / 6.5 /s vs / 16 /s) but not proven by a picture.
- water: 12 trials: deepest water she stood in during the roll ≤ 0.60 m, 0 swim frames (before 0.95 m, 36). Rule in the hook: the roll stops when the next step would be deeper than 0.6 m (home map only; the underworld has no water).
- walls: stick straight at the longest wall (83 m × 3.8 m, h 8.2): from 3.0 m she rolls 2.50 m and stops at 0.50 m from the face, from 1.2 m she rolls 0.70 m; at 45° from 1.2 m she slides along it (2.17 m), at 70° 2.82 m; 0 frames inside in 14 cases, both sides. (The solids are the host's own: `tryMove` 0.2 m sub-steps with `pushOut` on boxes / discs — same as walking.)
- RP4 arena (the REAL fx.js + combat.js in a real browser, `dev/rp4r3_arena_smoke.py`): forward / right / back / diagonal / no stick = 2.90 m each (the body turns to the roll direction; with no stick her facing is kept); a roll started 1.9 m from the arena rim is cut at the rim (the host's own clamp: 2.9 → 1.9 m); a light attack throws a soldier 0.50 m, it starts to move 0.25 s after the press and is at 0.5 m 0.2 s later.
- tests: `bash dev/rp4_test.sh` → **RP4 OK (170 checks, 15 new: R3)**; `bash dev/wc1_test.sh` → **WC1 OK**; `bash dev/gate_w.sh` → **GATE_W: ALL OK, noRoute 647 (< 700, unchanged)**.

## 4. The host hook — `patch_RP4_R3_rpg_hook.diff` (apply AFTER RP1C_R3 is merged)
Against the current kit `rpg.js` (WC1 state; `patch -p1` from `bluewall/`, checked: it applies cleanly and reproduces my tested file). 4 added `// RP4:` lines in 2 hunks:
1. `update()`, the `if (S.st === 'dodge')` block (≈ lines 490–493): the throw is `2.9 m × (ease(f1) − ease(f0)) / dt`, `ease = 1−(1−f)²`, f over the clip's 1.7 / 1.9 s = 0.895 s — position-exact at any frame rate; `S.burst` (the direction chosen at the press) is unchanged. 3 lines: the speed, the velocity, the water stop (`waterDepth(next) > 0.6` → stop, home map only).
2. `placeCamera0()` (≈ line 588): the pivot follow `kExp(16, dt)` → `kExp(kc, dt)` with `S.kc` = 6.5 /s while `S.st === 'dodge'`, eased back to 16 /s over ≈ 0.3 s. 1 line.
Without the hook the home-map roll stays the old 2.31 m (the underworld / arena roll is the sim's and is already changed by the owned files).
RP1C: both hunks are inside `update()` (the dodge velocity block) and `placeCamera0()` (the pivot line); if RP1C moves them the changes are to be carried by hand — the numbers (2.9 m, 0.895 s, 6.5 /s, 0.6 m) are in the lines.

## 5. NOT proven / not done
- **the feel on a phone** (this is what the owner judges): all numbers are software GL, desktop-time-stepped; the roll's 2.9 m is inside the asked 2.6–3.2 m, but whether it feels «thrown» is not measured.
- my reading of the owner's «push» = the dodge roll (the button next to the attack) + the knock-back of a hit; if «push» was something else (a shove button) it is not built.
- the camera softening (6.5 /s) is only in the **home** map (`S.st === 'dodge'`); in the underworld the sim roll runs while `S.st === 'cmb'` and the camera keeps its stiff follow (+ fx.js's own fight framing), so she stays in the middle of the screen and the WORLD moves past her. Possible follow-up (not tested): `S.st === 'dodge' || (S.cmb && S.cmb.sim.hero.state === 'dodge')` in that one camera line.
- knock-back through the real underworld colliders: unit-tested (`collideE`, RP4 R3) and run in the arena (no colliders there except the rim); not walked in the real underworld in a browser.
- the clean-block push (`H.kbx / kbz`) was left as the old velocity push on purpose (it is a guard effect, not a hit).
- the home map has no combat attached (`S.cmb` false), so the hit knock-back exists only in the underworld and the arena.
- the arena filmstrip is the home map (side camera, villager NPCs walk through the frames); the first frame of the filmstrip was retaken after the textures were loaded.
- the `before` filmstrip / numbers were taken with the original `rpg.js` swapped in and out of the same tree (verified byte-equal to `base_snapshot` before the patch was built).

## 6. Shared-file edits
None shipped. `rpg.js` was edited only locally for the «after» measurements and restored (cmp with `base_snapshot`: identical). Owned files: `web/assets/rpg/combat.js`, `web/assets/rpg/combat/fx.js`. New / changed dev files: `dev/rp4_test.js` (+ section R3), `dev/rp4r3_*` (measurement tools: roll / wall / water / film / plot / arena smoke / driver queue client). Not touched: `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`, secrets. No new shader programs, no lights, no models, no text in the game (the word «bot» appears nowhere).
