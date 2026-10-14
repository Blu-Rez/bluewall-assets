# REPORT B1 — town plan engine (`planTown`)

**خلاصه (فارسی):** برنامه‌ریز شهر نوشته شد و روی نقشه‌ی واقعی بازی و روی ۸ نقشه‌ی دستکاری‌شده (حلقه‌ها ±۵°، رودخونه ±۲۰ متر) تست شد: `B1 OK` (۱۶۸ بررسی، ۰ شکست) و `GATE_W: ALL OK`. سطح ۳۰: ۲۰ نوع ساختمان، ۱۴۱ رکورد (۱۰۲ خانه). دو چیز کامل نیست: (۱) اولین اجرای سرد ~۱۲۴–۱۶۷ ms است (گرم ~۳۷–۴۷ ms؛ حالت برش‌خورده بیشترین گام ~۲۴–۳۱ ms)؛ (۲) تعداد خونه‌ها ۱۰۲ است، چون نوار شهر بین دیوار و قلعه باریکه — راه‌حلش دست A1/A2 است. اون سوالِ «۱) همین چیدمان / ۲) خونه‌ی بیشتر و فشرده‌تر» جواب نگرفت؛ گزینه‌ی ۱ رو رفتم.

## What was built

| file | owner | what |
|---|---|---|
| `client/src/b1_townplan.js` | B1 (new) | `planTown(layout, lv)`, `planTownFull(layout)`, `planTownSteps(layout)`, `KINDS` (ph table), `countAt`, `AFFINITY` (documented rules), `rectCircleGap` |
| `client/src/b1_layout.js` | B1 (new) | `layoutFromGame()` (adapter: game modules → the plain `layout` object) and `perturbLayout()` (test variants) |
| `client/src/b1_dev.js` | B1 (new) | dev flag `?b1town=1[&b1lv=N]`: coloured boxes of the plan; flag off = returns at once |
| `client/src/world.js` | **SHARED** | +2 lines (see below) |
| `dev/b1_*` | B1 (new) | test (`b1_town_test.sh`), role-map script, perf / programs scripts, test output `b1_test_out.txt` |

`town.js` is **not touched** (as the brief says): the dev boxes are drawn on top of the old houses, so in the in-game shots some boxes sit on top of old `town.js` houses. That goes away when the mother removes the generic houses.

## PROVEN (command / file that shows it)

`bash dev/b1_town_test.sh` → last line `B1 OK`, 168 `OK` lines, 0 `FAIL` (saved: `dev/b1_test_out.txt`). It checks, on the real layout **and on 8 perturbed layouts** (rings ±5°, river ±20 m E/W/N/S, and two combined variants — each asserted to give a different plan):
- deterministic (two runs identical, 23 233 bytes); sliced plan (`planTownSteps`) == one-shot plan;
- no footprint overlaps (exact SAT on the rotated rectangles; 134 planned buildings + the fixed stores/vaults/market), nothing on a street (≥ 0.3 m clear of every street edge), nothing in the water or on the quay (≥ 6.6 m from the river centre line), everything ≥ 6.5 m inside the town wall and off the citadel moat and the gates; every door looks toward a street (≤ 40 m);
- affinity (HARD, measured by the test with its own dense geometry, not by the planner's numbers) — base layout: smokehouse ≤ 10 m from water (7.6, 8.1); mint ≤ 60 m from the treasury (40.2); refinery ≥ 40 m from any home (44.2 of 102 homes); bakery ≤ 30 m from a mill or the market edge (14.0, 18.7, 20.9); butcher ≤ 40 m from the market edge (8.8, 10.6); one well in each of the 8 quarters (1,1,1,1,1,1,1,1). The same rules hold on all 8 perturbed layouts and at every castle level 1…30;
- soft tendencies (asserted loosely): merchants nearer the market than cottages (111 vs 190 m), nobles nearer the keep than other homes (120 vs 131 m), cottages on the outer lanes (27 vs 36 m deep), smelter / sawmill / masonry on the side facing iron / lumber / quarry (worst angle 39° of 90° on base, 50° on the worst variant);
- **20 distinct kinds at level 30** (≥ 14 asked); kinds per level 4 / 15 / 20 / 20 at lv 1 / 10 / 20 / 30; counts per level never decrease and nothing moves between levels (the plan is made once for lv 30; a level is a prefix of each kind's growth order);
- the town grows 23 / 51 / 94 / 141 buildings at lv 1 / 10 / 20 / 30 (counts per kind below);
- `GATE_W: ALL OK` (`bash dev/gate_w.sh`, all 18 lines OK, battle sim crossings 0.00, noRoute 317 < 700);
- role map at level 30 with Persian legend: `/home/claude/B1_role_map_L30.png` (sent to the owner for approval); in-game proof of the dev flag: `/home/claude/B1_ingame_flag_top.png`, `/home/claude/B1_ingame_flag_town.png`; the page reports `window.__b1town.list.length = 134`, `level = 30` (141 − 6 stores − the market, which already exist).

Counts per kind per level (from the same plan; `dev/b1_levels.js`):

| kind | lv1 | lv6 | lv10 | lv15 | lv20 | lv25 | lv30 |
|---|---|---|---|---|---|---|---|
| cottage کلبه | 14 | 20 | 25 | 32 | 38 | 45 | 51 |
| craftsman پیشه‌ور | 0 | 4 | 5 | 7 | 8 | 10 | 11 |
| merchant تاجر | 0 | 0 | 0 | 7 | 11 | 16 | 20 |
| noble اشراف | 0 | 0 | 0 | 0 | 2 | 11 | 20 |
| market / townhall / chapel | 0/0/1 | 1/1/1 | 1/1/1 | 1/1/1 | 1/1/2 | 1/1/2 | 1/1/2 |
| tavern میخانه | 0 | 1 | 1 | 2 | 2 | 3 | 3 |
| well چاه | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| sawmill / masonry / smelter | 0 | 1/1/0 | 1/1/1 | 1/1/1 | 2/2/2 | 2/2/2 | 2/2/2 |
| mint / refinery / jeweler | 0 | 0 | 0 | 1/0/0 | 1/1/1 | 1/1/1 | 1/1/1 |
| mill / bakery | 0 | 1/1 | 1/1 | 1/2 | 2/2 | 2/3 | 2/3 |
| butcher / smokehouse | 0 | 0 | 1/1 | 1/1 | 2/2 | 2/2 | 2/2 |
| stores (existing) | 6 | 6 | 6 | 6 | 6 | 6 | 6 |
| **total** | 23 | 41 | 51 | 71 | 94 | 120 | 141 |

## PERF — before / after

Method: `dev/p38_perf.py` measuring code (calls + triangles per frame, 3 views, `q=low`, swiftshader), via the parametrised copy `dev/b1_perf.py` (adds `PAGE` / `EXTRA` env; `p38_perf.py` itself is unchanged). **before** = shared source without B1, **after** = with B1 (flag off), **flag** = `?b1town=1`.

| view | before: calls / tris | after, flag off: calls / tris | `?b1town=1`: calls / tris |
|---|---|---|---|
| top | 475 / 3 075 818 | 474 / 3 057 862 | 477 / 3 064 746 |
| ctr | 443 / 2 591 108 | 443 / 2 591 108 | — (not run) |
| town | 453 / 2 543 204 | 453 / 2 543 204 | 455 / 2 529 569 |

- flag off: calls and triangles are equal to before (ctr, town: identical numbers; top: −1 call, within frame-to-frame jitter of the animated scene). Flag on: **+2 draw calls** (house bodies + door marks, 134 instances each).
- Shader programs / memory after the home map is up: `renderer.info.programs.length` (`dev/b1_prog.py`, home map, lv 30, 10 s after ready): before 165 / 167 / 167 (three loads), after with flag off 167 / 167 / 167 (three loads) → **+0** (the unchanged base itself moves 165↔167 from load to load, depending on how far the progressive loading got; geometries 361–404 and textures 295–333 move the same way in base and after, so they are not attributable to B1). With `?b1town=1`: 169 (one load) = +2 programs (the two box materials), +2 geometries, +0 textures.
- **Client bundle** (minified, same esbuild flags as `build.sh`, `__BUILD__` fixed): before 2 586 904 B / 1 012 251 B gzip, after 2 605 364 B / 1 018 432 B gzip → **+18.5 KB raw, +6.0 KB gzip** (budget ≤ +15 KB gzip). The planner is part of the bundle even with the flag off (the hook is a static import).
- Textures: B1 creates none (the boxes are untextured), so the ≤ 512² rule is not touched.
- **Plan time (node, one-shot):** first call in a fresh process **124–167 ms** (JIT cold; every fresh-process run I made landed in 124.4 … 166.7); the 2nd / 3rd / 4th plan in the same process (each on a new layout object) took ~105–127 / ~47–54 / **~38–46 ms**; the test's warm best is 36 ms. **So "< 100 ms" holds warm, but NOT for the very first cold call.** Mitigation built in: `planTownSteps(layout)` runs the same plan in 38 slices — cold, in a fresh process: longest slice **23.6 / 25.3 / 31.2 ms**, total 122–145 ms; warm longest 17 ms — so no frame job is near 100 ms if the mother steps it once per frame (or per idle callback). The plan is cached per layout object (`WeakMap`), so it is computed once per layout.
- Things tried that did not help the cold time (so not shipped): ring-limited pose walks (slower), lazy top-K selection instead of the sort (same plan, no gain).

## SHARED edits (only `client/src/world.js`, +2 lines)

```
import { b1Dev } from './b1_dev.js';                    // after the buildTown import (line ~23)
b1Dev(ctx, scene);                                       // right after the `if (DAY) … else { … buildMilitary … }` block (line ~228)
```
Why: the only way to show the plan in the game behind a dev flag. It reads `?b1town=1` from the URL and returns at once otherwise (no object, no material, no geometry). `mkpatch` lists it as `shared/client/src/world.js.diff`. Nothing else outside `client/src/b1_*` and `dev/b1_*` changed (`web/app/*` is rebuilt output).

## NOT PROVEN

- Cold one-shot plan time < 100 ms (see above): 124–167 ms measured. Warm and sliced pass.
- Only level 30 was looked at in the game (`?b1town=1&b1lv=N` exists for the other levels; the counts per level are proven in node, not by screenshot).
- The distances that the brief gave without a reference point are my definitions (written in `AFFINITY`): market distance = to the square's **edge**; mint = centre to the centre of the gold store; refinery = centre to home centre; smokehouse = centre to the **water edge** (river centre line − 5 m). Another definition changes the numbers.
- "Every lot clear of streets" uses ≥ 0.6 m by construction and ≥ 0.3 m in the test. Doors: lots in back rows / yards face their neighbour, the test only requires a street within 40 m.
- The owner's answer to «۱) همین چیدمان / ۲) خونه‌ها بیشتر و فشرده‌تر» did not arrive; I kept 1 (the plan he was shown). No "denser" mode exists.
- The perturbed layouts rotate the town polygon, streets, gates and the market square about the origin and slide the river. The keep, citadel, stores / vaults and worksites stay where they are (they belong to other packages) — a real A1 change that also moves those is not covered.

## NOT DONE

- No models (B2 / B3 / C* bring them): everything is `w × d` boxes. All numbers marked `(ph)` in `KINDS` are placeholders: unlock levels, `n1 → n30` counts, footprints, `spread`, `rc`. The E1 economy table / the models must replace them (the planner reserves exactly `w × d` plus a 0.8 m gap).
- No pose-validation API for the player's moves (layout editor). The records are plain objects `{x, z, ry}` and the plan is a pure function of the layout, so moving a building = change the layout and re-plan, but a "can I drop it here?" call (the planner's internal `staticOK` / `dynOK`) is not exported.
- Fishery stays in `worksites` (brief). The existing windmill / watermill are not moved: the planner's `mill` kind (2 at lv 30) is **new in-town river-bank slots**; the mother decides whether the old mills become these.
- `town.js` generic houses are still built (not my file).
- `dev/b1_town_test.sh` is **not** added to `gate_w.sh` / `gate.sh` (shared script) — the mother should add one line.

## Findings the mother should know

1. **Homes: 102 at lv 30** (51 cottage + 11 craftsman + 20 merchant + 20 noble), against the `n30` targets 60 / 24 / 28 / 20 (= 132, all `(ph)`) and the ~135–285 generic houses of today's `town.js`. The planner warns `only 20/28 merchant`, `only 11/24 craftsman`, `only 51/60 cottage (the layout has no more room)`. The bottleneck is the layout, not the search: the town band between the wall and the citadel is narrow, the six stores and three vault circles stand in it, the river needs 8 m clearance (water half 5 m + quay 0.5 m + a 2.5 m margin) and the wall 6.5 m. For ~200 homes A1 / A2 must widen the band or move the stores, or the clearances must shrink (an `opts` flag for a denser mode is easy to add if the owner wants it).
2. River-bank lots (smokehouse ≤ 10 m from water, watermill) are scarce: 2 + 2 fit at lv 30 on the real layout.
3. Layout contract (for A1 / A2): `b1_layout.js: layoutFromGame()` reads `layout.js` (`TOWN, OUTER, MOAT, KEEP, PLAZA, TGATES, GATE, RIVER, SITES`), `roads.js` (cobble streets), `stores.js` / `vault.js` (fixed circles) and `terrain.js: marketSpot()`. If those exports are renamed or reshaped, only that adapter changes; `b1_townplan.js` never imports a coordinate.

## What the mother must wire

1. Call `layoutFromGame()` (or build the same plain object) → `planTownSteps(layout)` once per frame until `step()` returns true → `result().list`, or `planTown(layout, castleLevel)` (returns the lv-30 plan cut to that level, with `.meta` = `{ counts, warnings, lap, ms, quarters }`). The cache is keyed by the layout **object**: a changed layout must be a new object.
2. Record shape: `{ id, kind, role (H/C/P/T), fa, x, z, ry, w, d, r (bounding radius), inside: true, unlockLv, quarter (0..7), existing? , res? }`. The door side is local +z (three.js `rotation.y = ry`: x' = lx·cos ry + lz·sin ry, z' = −lx·sin ry + lz·cos ry), facing the street.
3. `existing: true` records are the market square and the six stores (`stores_<res>`, `kind: 'stores'`): pass-through of what already stands, do not build them again.
4. Show a building when `unlockLv <= level` (that is what `planTown(layout, level)` already filters); positions never change between levels.
5. Map `kind` → model (B2 homes: cottage / craftsman / merchant / noble; B3 civic; C* production) and replace `KINDS.*.w / d` (+ unlock, n1 / n30) with the real footprints and the E1 table.
6. Remove the generic houses from `town.js` where the plan places a building (my boxes overlap them).
7. Add `bash dev/b1_town_test.sh` to the gate (expects `B1 OK`).
