# PF1_progress — performance (the lag)

Size L; the tool budget (~100) was exceeded (the 12:01 programs question, the AA decision and one real matrix-skip bug cost the rest). Everything below is proven or marked not proven in `report_PF1.md`.

| step | state |
|---|---|
| Job 1 measure (probe `?pf=1`, views at 844×390, ×1/×4/×6, heap sampling, texture list, start-up, program counts) | done; top-10 sent to the owner once, final table in report §1 |
| 12:01 «why 346 programs» | done: rig reproduces it (197 → 212 → 256 → 338 → 345 / 369); causes + F1–F3; no program added by PF1 |
| Job 2 `BW_bench.run()` + HUD in both modes | done; ONE POST ~1–2 KB; headless result in the report |
| 3a renderer / pixel floor / order of cuts | floor 1.0 in the hero done; **MSAA-off tried and reverted** (hero edges step); F11 for RP1C's order |
| 3b shadows | cadence follows the cap; sizes unchanged |
| 3c bloom | unchanged (reason in report) |
| 3d adaptive cap 60 → 45 → 30 | done, unit-tested; ×1 rig caveat explained with a forced-level A/B |
| 3e allocation hunt → matrix skip | done; **bug found live (stale child matrices after `updateWorldMatrix`) and fixed**, fuzz test extended, live check 0 wrong |
| 3f update-rate LOD | findings F6 |
| 3g texture weight | nothing oversized in my dirs; F7 for the others |
| 3h start-up | audio fetch after the models (−9.0 MB before the welcome card); F8 |
| gates | GATE_W ALL OK (noRoute 614); PF1 test; RP1B: one pre-existing failure on the untouched kit (96 door items < 100) |

Not proven: real phone fps / GPU / compile hitch times; battle mode not sampled live for the matrix skip; night bloom look not re-photographed (not touched).
