# RP1C_R2 — progress (hero mode: face · jump · feet · smoothness · lag · bigger)

State at push: Job 0 (face rule), Job 7 (jump), Job 4 (feet), Job 5 (smoothness), Job 9 (bigger + sharper) built and proven on the software-GL rig; Job 1b (lag) built and measured but its targets are NOT reached. Job 8 (crown + light) and Job 6 (ramps) are NOT in this push (owner's 11:43 message: they go to `RP1C_R3`). Full evidence: `report_RP1C_R2.md`. Test: `bash dev/rp1c2_test.sh` → `RP1C_R2 OK`.

## Done (proven)
- Job 0 face rule: angle between her facing and the camera ≤ 55° in every simulated frame of 33 in-game scenarios (limit 75°); settled while moving ≤ 30°. Camera dragged 360° (slow, fast, 2 turns in 0.5 s, 180° flick in 0.1 s), walk / run / sprint / strafe / diagonals, stick towards the camera (she keeps her back to it and walks backwards), stick reversed every 0.2 s, jump, dodge in 8 directions, swim, door auto-walk, sheet open. Node sweep FACE_NODE OK. Combat / underworld (lock + combo with the enemies behind the camera, block, dodge, skills, spawn / exit / enter): 14 scenarios ok, max 70° (the guard) — and a real bug found + fixed there: on the first frame in the underworld her model still had the home rotation (169° off), now set with her position.
- Job 7 jump: apex 0.57 m at 60 / 30 / 20 fps; no wall-climb exploit (6 / 6 tries).
- Job 4 feet: p99 ground error 0.102 → 0.020 m; > 2 cm off 759 → 34 samples; > 5 cm below 24 → 0; street median 7.4 cm → 0; foot-sink p99 0.20 → 0.039 m.
- Job 5 smoothness: one cycle phase for walk / run, stance-foot slide down (run 55 → 32 cm/s, 2.5 m/s 207 → 28), speed ramp 0.25 s / stop 0.28 s, frame-rate independent turning.
- Job 9: model, radius, speeds, strides ×1.12; camera distance ×1.06 (×1.12 gives no visible gain); mip bias −0.45 + aniso on her textures only; crisp contact shadow.
- Job 1b (partly): governor works in home / underworld / combat; readout line (long press on the eye); JS CPU −15 … −25 %, triangles gate −22 % / mill −37 %; +0 programs.
- Patch applies clean on `origin/kit` 0649e85 (`APPLY_CHECK_origin_kit.txt`).

## Open
1. **Job 1b targets not reached** (CPU −40 %, ≤ 150 calls, ≤ 400 k triangles). Needs world code: terrain / village trims in cells like the town, a merged static castle, per-copy culling of worksite packs.
2. **RP1C_R3** (next push): Job 8 crown marker (a little bigger than her head, with a gap above it) + same-colour halo + faint ground ring (numbered sheets), Job 6 ramps.
3. Old Job 2: sheet / controls — two checks of `rp1c2_page3.js` fail («after close: pad / buttons not restored», «walk-opened sheet: pad / buttons not hidden»).

## Not proven
Real phone fps / feel (every ms is software GL); landscape ladder / programs / ground re-runs on the final code (queued after this push); `rp1b_test.sh`, `rp1c_test.sh`, `gate_w.sh` on the final build; first-person face rule (excluded by design); foot sliding on stairs; combat sim feel; numbers measured on kit 8256556, not on the newer kit.

## Next
1. Landscape re-runs (ladder, programs, ground) + `rp1b_test.sh` / `gate_w.sh` on the pushed code.
2. `RP1C_R3`: rebase on newest `origin/kit`, marker (halo + ground ring, crown size / gap), ramps (grade ≤ 0.33, width ≥ 2.4 m, ≥ 4 outer-ring + ≥ 2 town-ring, wall-walk handover, camera clearance).
3. Job 1b world-code steps above, then the Job 2 sheet checks.
