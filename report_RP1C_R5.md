# report_RP1C_R5 — hero mode: camera 25 % farther + «water exit» 43 → 46 of 48

## First block (for the mother)
RP1C_R5 = two small things in hero mode, ONE file (`web/assets/rpg/rpg.js`, mine) + one test file (`dev/rp1c_collide_page.js`, mine). Review like any patch: every frame full size, `GATE_W: ALL OK` (noRoute 647 < 700), no change to castle / town / battle / economy / server / pkg / gate files, `web/app/*` not in the patch, no shared-file line outside rpg.js.
1. **Camera:** the default third-person look (B) is 25 % farther (`CAM_FAR = 1.25`). Zoom range, looks A / C and `CAM_MIN` (3.0) / `CAM_RISE` (3.2) are untouched. Face rule: every frame of all **33** in-game scenarios ≤ **55.0°** (rule «face never visible ≤ 55°» holds).
2. **Water exit 43 → 46 of 48** (rule: ≥ 44; hero mode only). Cause = TR2_H_R4's bridge parapets (`nav.rails()`, type `'rail'`): they are 2-D boxes without a height, so for a swimmer / wader UNDER a bridge they were a wall across the river (2 of the 5 failed exits), and a wader could not pull herself out of a steep bank (the climb rule gave only the swimmers a bonus; 3 more). Fix: (a) the parapet knows its deck (`y0`) and does not stop a body that is in the water under it (and, after the water ends inside its strip, until she is out of the strip — `S.rIn`, no 0.9 m pop); on the deck or on dry land beside it it stays solid (QA1-051 intact: 90 / 90 sideways pushes on 15 bridges end on the deck); (b) anyone with water over her feet (> 2 cm) pulls herself over a bank like a swimmer does (scaled by the depth).

## Numbers (software GL; before = the untouched kit; after = this patch)
| what | before | after |
|---|---|---|
| default camera distance (look B): 3-D / horizontal | 3.82 m / 3.62 m (D = 3.4 × HC) | 4.76 m / 4.53 m (× 1.25) — her height on the 844×390 screen 238 px → 189 px |
| face rule, 33 scenarios, max body-to-camera angle in ANY frame | 55.0° | 55.0° (identical; the 2 fails of the page are the same as on the kit, see below) |
| `rp1c3_test.sh page`: water exit (out on the bank, dry) | 43 / 48 | **46 / 48** (needs ≥ 44) |
| water entry reaches swim | 44 / 48 | 44 / 48 (limit 44) |
| water: height jumps / unstuck teleports | 0 / 0 | 0 / 0 |
| collision (a) inside / (b) stuck / (c) pass-through / unstuck, 7419 runs (+240 at 20 fps) | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| doors: walking / running AT them opens | 714 of 728 | 714 of 728 |
| camera scan (10 480 spots × 4 headings; fix ON): closer than 2.15 m / inside a solid | 3 / 26 | 3 / 26 (min distance 0.69 m, as before) |
| bridge sideways push, 15 bridges × 6 | 90 on the deck | 90 on the deck |
| `rp1c3_page.py` | PAGE OK | PAGE OK (35 checks) |
| `rp1c_r5_test.sh` / `rp1c_r5_test.sh page` | — | RP1C_R5 OK |
| `tr2h4_test.mjs` / `rp4_test.sh` / `rp1c4_info_test.sh` | OK | TR2H4 OK (42) / RP4 OK (170) / RP1C_R4_INFO OK |
| `gate_w.sh` | GATE_W: ALL OK | **GATE_W: ALL OK** (noRoute 647 < 700, unchanged) |

## Every changed line (all in `web/assets/rpg/rpg.js`, my file; marked `// RP1C_R5:`)
- l. 9 `const CAM_FAR = 1.25;` (new)
- `refreshColliders`: each bridge parapet gets `b.y0` = the deck height of its bridge (`S.nav.bridges[i].y`)
- new `inRailStrip(x, z)` (is the body circle on a parapet's footprint)
- `pushOut`: `if (b.y0 !== undefined && S.rIn) continue;`
- `tryMove`: the climb-rule bonus for a wader (`S.dep > 0.02`: 0.3 … 1.1 m by depth); swimmers keep 1.1
- `phys`: `S.dep` stored; `S.rIn` = in the water below a deck (`S.sw > 0 && S.y < 0.3`), kept while she is still inside a parapet strip, cleared outside it / on land / in a building
- `segHit`: the camera of a swimmer under a bridge passes under the parapet too (the rail box does not cut its ray)
- `CAMS[2]` (look B): `D: 3.4 * CAM_FAR`
- `S.rIn = false` in the two places that teleport her (`toGate()`, `dev.setPos`)
Test: `dev/rp1c_collide_page.js` — `solids()` carries `y0`, `inside()` / `nearest()` skip a parapet while `S.rIn` (the same rule as `pushOut`; ground truth otherwise unchanged: every other box, disc and the grid stay absolute). New: `dev/rp1c_r5_test.sh`.

## Frames (photos_RP1C_R5.tar.gz, 844×390, all looked at full size)
`before_*.png` kit, `after_*.png` camera ×1.25 (home square, keep, barracks, vault, windmill, cottage, bridge), `after_swim_under_bridge*.png` swimming under a bridge (intermediate build, same rule), `final_*.png` the final code (home, wading under the bridge ×3). The hero stays the subject (48 % of the screen height), the back of her head and shoulders are what you see, no face frame.

## Not proven (اثبات‌نشده)
- The real phone: feel / fps of the farther camera (software GL only; «a bit close» was the owner's word — 25 % is my reading of it, one constant `CAM_FAR` if he wants more / less). No hero zoom exists, so «zoom range unchanged» is trivially true.
- Frames only at 844×390 (landscape); portrait 390×844 not looked at.
- Face page 2 (J combat, K underworld scenarios) not run in-game; they do not depend on the camera distance (node sweep `FACE_NODE OK`).
- Two face-page items fail identically on the untouched kit (not R5): «B strafe R settled while moving 44.9° (test limit 35°; the hard rule 55° holds)» and «G door auto-walk tap did not open».
- `rp1c3_test.sh` (static) prints one FAIL «RP1C was added to a dev/gate*.sh» and `rp1c2_test.sh` «crowd.js differs from the base»: both the same on the kit (the gate file was edited by the mother on purpose; the old base snapshot predates crowd.js).
- When she swims UNDER a deck the camera sits above the deck (hero hidden behind it): the floor rule of CAM_MIN, unchanged by R5.
- A hero who wades under a bridge and walks up the bank inside the parapet strip can step out on the deck side (head briefly through the deck while climbing — frame `final_swim_final.png`). Only reachable by wading in first; from the deck / dry land the parapets stay solid.
- Shore #6 of the water test samples a bridge deck as «dry side» (she swims under it and cannot «exit»): test artefact, in the 2 remaining misses; water entry sits exactly at the 90 % limit (44 / 48) as on the kit.
