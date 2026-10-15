# report_BT1 — the attack map = the home map
BT1 · 15 Oct 2026 · kit 508723b (p53 installed) · `BT1 OK` (lv 1 / 30 / 50) · `GATE_W: ALL OK` (noRoute 614).
All numbers: software GL (SwiftShader) in headless Chromium, quality `low`, 844×390, clear weather, hour 14 at home / 13:30 in the battle. **Not phone numbers.**

## 0. First block for the mother
- **BT1 = one root cause, fixed in `world.js` (6 changed lines, 4 of them carry `// BT1:`).** `world.setBattle(true)` hid every `late:*` group except 4, so the whole planned town (`late:townplan` = B2 homes + B3 civic, ≈ 168 k triangles) and the static crops / bales were **missing in every attack** — houses, civic buildings, hamlets. They are kept now. Their meshes already carry the target id (`aB`), so they crumble with the same destruct shader.
- Second fix in the same file: the procedural parts of a town lot (refinery column + tanks, mint yard …; `ws:<lot>:soup|glass|oil`) have no `aB` in their vertices, so one target (id 113, the refinery) had **no body that could fall**. `world.targetDown` now hides them with the lot's target.
- **No new shader program** (203 → 203, `bwdestr3` unchanged). Triangles / calls at the battle camera: **+3.8 % / +0.2 % (far) and +4.6 % / +4.1 % (near)** against today — inside the +5 % budget, but the near camera is close to the line (the town comes back by design). `noRoute` 614 = unchanged.
- `basetargets.json`: **not touched, `gen_targets.py` not run** (no footprint moved: the models were already registered at the old footprints; test shows 132 targets, 131 with a mesh body + 1 procedural body, 0 without).
- Files I own (`destruct.js`, `skin.js`, `camblock.js`, `battle.js`): **no change needed.** `battlesim.js`, units, hero files, server: not touched.
- **Finding F1 for the worksite owner:** `wsbuild.js` `Soup.mesh` has no `aB` attribute and `MAT.soup` is a plain `MeshStandardMaterial` (not destruct-patched), so procedural worksite parts can never crumble, only vanish. Proposed ≤ 10-line change (tag the soup vertices with the lot's target id and run `patchDestruct` on `MAT.soup`) is **not applied**: not my file and it changes a shader program key. My `targetDown` rule makes them vanish with the lot meanwhile.
- `web/app/wall.js` shows as modified in my tree: it is the dev **build output** of `world.js` (dev page rebuilds it). It is **not** in my patch.

## 1. What was different (frames: `photos/03_before_after_*`, `photos/02_*`)
Method: same session, same level, same camera for home and attack (`dev/bt1_pair.py`: `__bw.camera` set by script, `battle.start({...levels = lv})`, free camera), plus a scene-tree diff by group (`dev/bt1_diff.py`, `dev/bt1_test.py`).

| # | Difference seen | Cause (job letters) | Status |
|---|---|---|---|
| 1 | Lower town, hamlets, civic buildings, houses: **missing** in the attack (only grass / roads) | **(a)** `setBattle` hid `late:townplan` and the crop / bale groups; the TR2 S4a houses live in that group | **fixed** (BT_KEEP list) |
| 2 | Fields: crops, bales missing | same, `late:cabbage / corn / pumpkin / haybale` | **fixed** |
| 3 | Refinery (target 113) has nothing that falls | **(d)** its body is procedural `Soup` geometry without `aB` | **fixed** by `targetDown` rule; F1 for the proper fix |
| 4 | House / castle / worksite model, LOD, tier at the battle camera | **(b)** LOD: the planned town picks its LOD from the camera (`planned.lod`), so with the same camera it is the same bodies — measured identical in the group diff. **(c)** tier: `setLevel(enemy level)` gives the same meshes as the home map at that level (diff = 0 groups at lv 30 and lv 50) | no difference found |
| 5 | Stores (ST1) | **(e)** not battle targets at all (basetargets has no storage type) — nothing to destroy and nothing differs; the central gem / vaults are targets (vault frames) | **gap, listed** |
| 6 | Light / sky | **(f)** forced hour 13:30 and clear weather in the battle: intentional, left as is | by design |
| 7 | Layout edited by the player | **(g)** hook is clean: the base is read from `world.targets` / the layout at `battle.start`; nothing added | no change |
| 8 | **Below lv 30 the attack shows the outer wall rings, towers, gate and their guns that the home map does not have yet** (clear in `photos/01_lv1_*`, `01_lv13_*`: lv 1 home = keep ring only, attack = three rings); the ring groups `castle-tr2`, `late:wslife`, `late:worksites`, `late:deffield` differ in the test | A1 rule (owner 6 Oct, `a1_rings.js`): home shows the rings of its level, an attack always shows all three (`ctx.rings.setBattle(true)`); the sim has targets on all three rings at every level | **left as is** — not a BT1 battle layer, and changing it needs the sim targets to follow (battle sim, not mine). **Owner decision for the mother**: if «attack = home» must hold below lv 30 too, the sim has to drop the outer-ring targets for low levels |
| 9 | Some defences (war machines / wizard / frost / **flame tower braziers**, tesla coils) are not on the tower in the attack | `battlesim.makeBaseFromTargets`: defences are manned by level and base profile (`b.off`), `battle.js:128` hides the unmanned ones; the home map shows all. Data-driven, file not mine | by design, listed apart |
| 10 | Life (animals, birds, riders, creatures, camp army) hidden in the attack | owner's own life; the enemy's worksites and the people at work stay (p38) | by design |

## 2. The fix (shared-file lines)
`client/src/world.js` only — **6 changed lines, 4 tagged `// BT1:`** (limit 12):
1. `setBattle`: the hard-coded "keep these 4 groups" test becomes a list: `BT_KEEP = ['late:defenses','late:worksites','late:wslife','late:deffield','late:townplan','late:cabbage','late:corn','late:pumpkin','late:haybale']` and `for (const c of stage.children) if (!BT_KEEP.includes(c.name)) c.visible = false` (2 lines + 1 comment).
2. `targetDown`: one line + one comment: hides `ws:<lot>:soup|glass|oil` meshes of the lots whose `ctx.townTids` maps to the falling target; `restoreWorld` already restores everything saved in `downSaved`.
Restore after the battle: `downSaved` / the old `setBattle(false)` path — checked by the test (no mesh stays hidden).
`town.js`, `castle.js`, `solids.js`, `destruct.js`, `skin.js`, `camblock.js`, `battle.js`: **0 lines**.

## 3. Destroyed one of each kind (intact / half / ruin, full size, `photos/04_destroy_*`)
**Half (50 % hp) = the shader's damage tint only.** It is subtle at 844×390 (1–7 % of the pixels around the target change, part of that is moving units); that is the existing destruct design, not something BT1 changed. Intact → ruin changes 4–38 % of the pixels around the target.
Method: real game, attack at lv 30, camera on the target, `b.hp = 50 %` for "half", `__bw.battle._kill(id)` (the real collapse event → `handleEvents` → `world.targetDown`) for "ruin"; the last beat of the fall is forced (`b.cTv = 1`) because SwiftShader runs ~1 fps and the fall would not finish.
| kind | target | intact | half | ruin | I saw |
|---|---|---|---|---|---|
| wall | id 2 (33 wall targets) | ✔ | ✔ | ✔ | the green wall piece between the towers is gone, dust (diff checked) |
| tower | id 30 | ✔ | ✔ | ✔ | crumbles |
| gate | `gate` nearest [0,−60] | ✔ | ✔ | ✔ | gate house gone, side pillar stays |
| keep | id 64 | ✔ | ✔ | ✔ | crumbles |
| house | id 66 | ✔ | ✔ | ✔ | the target's blue house and the grey house next to it both go (one target = both) |
| house (refinery, worksite part of the town) | id 113 | ✔ | ✔ | ✔ | column + tanks vanish (soup rule) — **not a crumble**, see F1 |
| vault | id 122 | ✔ | ✔ | ✔ | crumbles |
| church (civic) | id 82 | ✔ | ✔ | ✔ | dome building gone |
| worksite | mine id 115 | ✔ | ✔ | ✔ | mine house + wheel crumble, rocks stay |
| worksite | forge id 118 | ✔ | ✔ | ✔ | the pavilion bursts into dust + debris, nothing left |
| worksite | lair id 121 | ✔ | ✔ | ✔ | the round hall is gone, a rubble heap + a falling slab |
| defence | ballista site id 12 (a castle tower with the war machine) | ✔ | ✔ | ✔ | tower **and** the ballista on it fall (seen from a high camera) |
| storage | — | **not a target** (ST1 gap) | | | not proven, nothing to prove |

## 4. Defence and the other worksite kinds
- **Defence (ballista site id 12)**: the site is a tower of the castle batch (`castle-tr2 > static-tr2`, vertices at y ≈ 11–13 m) with the ballista on top. From the town side the keep wall hides it, so the frame is taken from a high camera (`dev/bt1_destroy.py` with `CAMOFF` / `DIST`). Intact: green tower + ballista; ruin: tower and ballista gone, stones in the air. `world.targetDown` hides the machine (`ballistas.hide`) and the shader crumbles the tower — both paths untouched by BT1. Half: no visible change (see §3).
- **forge** (id 118) and **lair** (id 121) are the other worksite kinds that are targets (together with the mine): both crumble.
- **tower** id 30 and **keep** id 64: crumble as before.

## 5. Numbers at the battle camera (`dev/bt1_cost.py 30`, lv 30, same camera; "before" = today's hide list applied at run time)
| camera | calls before → after | tris before → after | programs |
|---|---|---|---|
| far (top, 230 m) | 446 → 447 (+0.2 %) | 4 428 449 → 4 596 879 (**+3.80 %**) | 203 → 203 |
| near (town, 55 m) | 342 → 356 (+4.1 %) | 4 022 368 → 4 205 893 (**+4.56 %**) | 203 → 203 |
Home map for reference: far 473 calls / 2.81 M tris, near 391 / 2.40 M (programs 161: the battle adds units / fx programs, not me). The battle is heavier than the home map in both cases (units, rings, defences, destruct data) — unchanged by BT1.
Budget: programs +0 ✔ · calls / tris ≤ +5 % ✔ (near camera 4.56 %: thin margin; if a later package adds triangles to the town, this is the number to watch). Battle sim result: the sim is created from `world.targets`, not from the scene: **unchanged** (nothing in `battlesim.js` / targets touched); not re-run as a separate seed comparison.

## 6. Test: `dev/bt1_test.sh` → `BT1 OK` (default levels 1 / 30 / 50, ~25 min in software GL)
- **lv 30 and lv 50**: 119 scene-tree groups at depth 3, **0 differ** between home and attack outside the listed battle layers (visible meshes and triangles ±2 %); 132 targets, body at home 131 / attack 131 + the refinery (procedural body, hidden by `targetDown`); **lost 0, no sim building 0**; every target is a building of the sim (= its solid and hit-point row).
- **lv 1**: 111 groups, 2 differ = the A1 ring groups (`castle-tr2`: 23 576 → 152 668 tris, `late:wslife` 13 151 → 18 165 tris) — the attack shows all three rings, the home map only the first (§1 row 8); targets 110, body at home 104 (the 6 outer-ring targets are not drawn at home) / in attack 110; lost 0. The test lists this as «A1 rings, not a failure below level 30».
- Listed apart (all levels): `late:defenses` — unmanned / unlit defences in the attack (§1 row 9).
- Note: the page clamps `?lv=` to 30; the harness sets the home level with `__bw.world.setLevel(lv)` (the HUD badge keeps showing 30 in the lv 50 home frames — a harness artefact, the map is the lv 50 one).

## 7. Gate
`bash dev/gate_w.sh` → **`GATE_W: ALL OK`**, battle sim `noRoute events 614 (< 700)` = the baseline (unchanged), `no wall crossings`. Run on the tree with the 6 `world.js` lines.

## 8. NOT proven
- **Phone feel**: fps, shader compile, GPU memory — all numbers are SwiftShader.
- Destroy frames at 1 fps software GL: the last beat of every fall is forced (`cTv = 1`); the real fall timing / look on a phone is not shown.
- **Storage** (ST1) is not a target, so no destroy frame; **refinery** vanishes instead of crumbling (F1); the defence frames: see §4.
- Soldiers walking around the restored houses (nav) not framed: the nav uses the sim buildings and `solids.js`, which I did not touch.
- Frames of lv 1 / 13 / 50 are at 5 cameras (town, castle, fields, worksite barn, mine); other cameras were compared by the group diff only.
- The home frames sometimes catch a flying creature's wing (one black wedge at lv 50 fields; retaken).

## 9. Photos (`photos_BT1.tar.gz`, all full-size PNG, all opened by me)
`01_lv{1,13,30,50}_{town,castle,fields,works,mine}` HOME (top) over ATTACK (bottom), same level, same camera · `02_lv30_{top,lower,hamlet,hamlet2}` · `03_before_after_*` the attack before / after the fix (lv 30) · `04_destroy_<kind>_{1intact,2half,3ruin,strip}`.

## 10. In the patch
`shared/world.js.diff` (the 6 lines, apply on top of the merged `world.js`), `dev/bt1_*` (`bt1_test.sh` + `bt1_test.py`, `bt1_pair.py`, `bt1_diff.py`, `bt1_destroy.py`, `bt1_cost.py`, probes, `bt1_sheet.py`, `bt1_photos.py`).

## 11. Pitfalls
- A `pkill -f` / `pgrep -f` pattern that is in your own command line kills your shell (twice).
- Two Chromium sessions on SwiftShader at once crash the second ("Target crashed"): run captures one at a time, with `nohup` (the tool limit is 10 min).
- The first-hour tour card (`coach.js`) covers every attack frame at castle level ≤ 3: set `localStorage bw_coach_battle=1`.
- A flying creature's wing across the camera fills a home frame with a black / grey slab: retake.
