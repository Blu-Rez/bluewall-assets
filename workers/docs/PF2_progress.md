PF2 · 100% · done: F1 + F2 (programs: boot 226→199, idle day 378→199), F3/F8 findings, BW_bench v2 (timer bug root cause + fix, 5 phases, stalls apart), pf_overdraw(view), ?nres= · PF2 OK, PF1 OK, GATE_W ALL OK (noRoute 647) · next: owner reruns the benchmark after p57 (one screenshot) · blocked: none

# PF2_progress — hitches first (programs), the owner's benchmark v2, overdraw probe

| step | state |
|---|---|
| F1 late lights (mirror layer) | done, measured: boot 226 → 199, +8 s 224 → 197… 199 (+2 depth-only crowd shadow programs remain, named) |
| F2 night composer path | done, measured: day idle 120 s 378 → 199; dusk near 351 (built in idle ≈ 63 s); unit test: wanted 4.0 real min before the first bloom frame |
| F3 instanceColor always/never | measured: only 6 twin programs (one material, 5 meshes in `late:defenses`) → finding, no code (a global patch is not worth the risk) |
| F8 start-up weight | measured: every GLB is already meshopt + quantization + webp; lazy troll / pegasus / prowler / horses would make the gate guards and home creatures pop in → finding with numbers, no code |
| A2.1 benchmark card lied | **root cause found and reproduced**: recorder installed by the first run (no `?pf=1`) starts with tick = -1 → first interval = page age (88 s in the rig, 605 s on the phone), map phase «0.6 fps», drift blank. Fixed + test |
| A2.2 phases | 4 × 8 s (map day, map night, hero day, hero night) + 1 uncapped map phase, one card line each, POST 1.6 KB |
| A2.3 night 3.5× | night path never built by day (F2); `pf_overdraw(view)` added (hand-checked within 0.4 %); `?nres=` A/B lever; the rest needs the owner's phone (not proven) |
| tests | `pf2_test.sh` → PF2 OK · `pf1_test.sh` → PF1 OK · `gate_w.sh` → GATE_W: ALL OK (noRoute 647) |
| push | `push_result.sh PF2 …` done, «PF2 pushed» |
