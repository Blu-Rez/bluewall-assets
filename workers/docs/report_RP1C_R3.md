# RP1C_R3 — merged by Mother 2 (kit df703d9, 16 Oct 2026)

**What came in:** hero mode round 3b — marker over every character (no crown), 10 walkable ramps up the wall-walk (6 outer + 4 town), «Go up» markers + HUD chip, collision against the visible body band (rp_grid.js), shadow/camera 3 looks (default B), swim fx, jump table, F9 heroWarm.

**Merge notes**
- Shared lines applied by hand (all marked `// RP1C-R3:`): main.js (heroWarm + mkHero `warm:`), water_life.js `fxAt`, world.js `waterFx`.
- The RP4_R3 dodge/camera hook that was held since p56 is applied by hand into the new rpg.js (roll 2.9 m thrown; camera 6.5 /s while rolling). `rp4_test.sh` OK (170 checks).
- Tests on the merged tree: `rp1c3_test.sh` static OK; page battery OK after one test change (below); `GATE_W: ALL OK`, noRoute 647 (unchanged).
- Own frames at 844×390 (ramp far / mid / wall-walk): identical to the worker's sheet.

**The one thing that failed and what it was**
Doors: 959 of 1176 aimed approaches opened (worker: 1107; threshold 90 %). 192 of the 199 blocked ones were the dodge roll. Cause: RP4_R3 makes the roll 2.9 m (was 2.3 m), so a roll into a door ends AT the wall inside the roll state (which never opens a door), and on an oblique wall she slides away before the 0.2 s hold. Not a collision bug (0/0/0/0 on 7429 runs). Fix in the TEST only: walk + run are held to 90 % (708 of 724 = 97.8 %), dodge is reported apart (252 of 450 rolls opened).
Game consequence: rolling straight into a door does not open it; walking / running into it does.

**Not proven / owner decisions**
- Never run on a phone (software GL only).
- Hero scale: worker default HS = 1.12 × 1.12 (2.20 m); AN1 recommends HS = 1.12 (×1, 1.96 m). Owner picks.
- Ramp stone colour (green vs blue), camera look (default B), shadow look (default B).
- Needs-Tripo: river-edge steps / quay exits (water exit 44/48), castle gate / tower door scale, child models.
