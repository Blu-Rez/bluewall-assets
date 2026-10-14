# RP1B — progress (hero mode round 2)

State at push: all three jobs built and proven on the software-GL rig; two items stay open (below). Full evidence: `report_RP1B.md`. Test: `bash dev/rp1b_test.sh` → `RP1B OK`.

## Done (proven)
- Job 1: diet + owner-only quality governor; gate / fields / mill: calls −9 … −33 %, triangles −24 … −44 % (low preset); high preset amortised −18 … −38 % calls, −26 … −41 % triangles; programs +0; gate off unchanged.
- Job 2: reach 256 700 → 483 600 m² (98.8 % on foot, 99.3 % swimming); 42 / 42 physical walks; every bridge (15) and gate (3) both ways; walls climbed + walked + descended; wading and swimming; back-to-the-gate button; camera 0 violations in all walks / wall tests.
- Job 3: 113 / 113 buildings with a sheet give a button id; same T1 sheet, closes back to walking.
- Owner additions: walls climbed + walked + descended (camera behind her, 0 violations), wade / swim working (poses are stand-ins: the shipped animation files have no swim / climb clip).
- Test: `bash dev/rp1b_test.sh` → `RP1B OK` (61 checks incl. 36 fake-clock governor / diet checks); also found and fixed a real bug on the way (objects the diet hid stayed hidden after leaving hero mode).

## Open
1. **≤150 calls / ≤400 k triangles not reached** (gate 271 calls / 1.44 M, low preset). Needs world-code work: per-copy distance culling of the instanced packs (trees, rocks, worksite life), a merged static castle, shadow casters that are not map-wide packs. Not hero code, not touched.
2. **Real `swim` / `climb` clips** (model-maker chat): the code uses clips named `swim` / `climb` automatically.

## Not proven
Real phone fps / feel; foot sliding; the tight camera for half a second while she mantles over a wall edge; wall-walk is one piece between two solid towers (she climbs down and up again at the next piece); anything with the TR2 models or layout; Train press in the barracks sheet (disabled at Lv 30, same logic as the strategic view — vault Collect shows the state change).

## Next, if asked
- let her walk through the towers on the wall-walk (today: one wall piece between two solid towers, she climbs down and up again);
- open the drawn-closed gates / keep door while she passes;
- play `talk` / `bow` on the button tap (the GLB has them, the game does not load them).
