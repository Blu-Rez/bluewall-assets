# REPORT A2 — water from the mountain into the moat (two streams)

Owner request (6 Oct 2026): «اگه مپ رو تو این زاویه مثل ساعت ببینی باید ساعت ۲ هم آبی بیاد از بالا کوه از وسط کوه پایین و بیاد تو خندق».
Owner answer to the sample sheet: «هر دو! ولی رود ۱ عریض‌تر» → both streams are built, `stream_w` (river 1, k = 1.8) is wider than `stream_e` (river 2, k = 1.0).

## What it is

| | stream_w (river 1) | stream_e (river 2) |
|---|---|---|
| width scale `k` | 1.8 | 1.0 (= like the p38 river) |
| head (foot of the fall) | (-157, -411) | (-92, -430) |
| length | ≈ 335 m, 34 pts | ≈ 467 m, ≈ 49 pts |
| fall (falls.js metrics) | ≈ 79–85 m | ≈ 107–115 m |
| ends in the moat | world angle ≈ -112…-104° (west of the north gate), last pt (-62, -168) | world angle ≈ -47…-41° (NE shoulder), last pt (122, -130) |
| bridges | one road crossing ('camp' road, (-101, -200)) + footbridges | footbridges |

* Both streams are one water system with the moat and the p38 river: the bed is cut into the terrain (`L.height`), the water is the existing moat-level plane (`L.MOAT.level = -0.75`), the last point runs on into the moat's centre line. No dead ends, no extra water plane.
* The head of each stream is a carved gorge slot ending in a headwall, with a waterfall drawn by the EXISTING `falls.js` (see world.js edit) → +0 shader programs.
* Banks (reeds, rocks, sedge, flowers) come from `moat.js`; stream banks use their own rng, they add no meadow-flora cells (this was what produced +50 draw calls in an earlier build).
* Streams are crossed by the road network through `roads.js` `autoBridges()` (a bridge wherever a road meets a stream) and `addFords()` — plain footbridges every ≈ 120 m so that the plain is not split into pockets (nav / noRoute).
* The streams were planned OFFLINE (`dev/a2_plan.mjs`, A* on a 4 m grid over the real terrain and every map record) and frozen into `layout.js` `STREAMS`, clear of camp, quarry, mines, hamlets + spurs, nomads, pasture/muster/lair and of each other.
  **Hamlets: 0 changed, nomads unchanged** (`dev/a2_water_test.sh` checks this; one changed candidate would re-plan every later hamlet/nomad camp because of the single seeded rng — `stream_e` threads the gap between camp and the hamlet east of it for exactly that reason).

## PROVEN (I ran it / saw it)

Screenshots (real game, `dev_s35.html?lv=30`, swiftshader, `/home/claude/work/`):
* `a2_final2_a2_top.png` — high camera: the whole course of BOTH streams from the falls, across the north plain, to the moat. stream_w clearly wider.
* `a2_final2_a2_w.png` — stream_w: wide river with two bridges past the camp into the moat.
* `a2_final2_a2_e.png` — stream_e: from the mountain through the camp/hamlet gap to the NE moat.
* `a2_final2_a2_bridge_w.png` — close view: wide river, stone bridge, reeds, flowers, moat.
* `a2_final2_home.png` (+ `_crop`) — the OWNER camera (azim 1.191, target (49.5, 51.5), dist 257.6, polar 1.179, fov 52): the twin waterfalls at 1–2 o'clock, the cleared meadow strip under them, the first stretch of water.

Tests, all run on the final sources:
* `dev/a2_water_test.sh` → **A2 OK** (fishery_river still on a shore, nav treats the stream bed as water, units cross over 3 bridges with 0 wet steps, hamlets 0 changed, nomads unchanged).
* `river_test.sh` → RIVER OK · `nav_test.sh` → NAV OK · `ws_test.sh` → WS OK · `cam_test.sh` → CAM OK (1680 cases, worst ground-above-line 2 m) · `wsroute_test.sh` → ROUTE OK, components 1.
* `bash dev/gate_w.sh` → GATE_W: ALL OK (details in the "Gate" section).

Perf (`dev/a2_perf.py`, same rig before and after, SKIPINTRO=1):

| view | draw calls before → after | tris before → after | programs |
|---|---|---|---|
| home | 445 → 459 (+14) | 2,555,108 → 2,574,733 (+19.6k) | 167 → 167 |
| rtop | 481 → 486 (+5) | 3,347,068 → 3,361,282 (+14.2k) | 167 → 167 |
| ctr | 442 → 449 (+7) | 2,559,731 → 2,585,490 (+25.8k) | 167 → 167 |

* Measured WITHOUT the worksite crowds (they fluctuate by ≈ ±10 calls from run to run): home 372 → 375 (+3), rtop 402 → 405 (+3), ctr 371 → 372 (+1). So the real A2 cost is ≈ +1…+3 draw calls (budget ≤ +10) and ≤ +26k tris (budget ≤ +40k), +0 programs.
* Client bundle: gzip of `web/app/wall.js` 1,012,255 → 1,014,395 B (**+2.1 KB**, budget +15 KB). No new textures, no new assets (no `credits_a2.json` needed).
* `distPolyline` cost: micro-benchmark `dev/a2_bench.mjs` ≈ equal to the base (exact chunk-box pruning in `streamD`).
* Late jobs (`[late] job N`): jobs 2, 4, 5, 8 are above 100 ms — in the BASELINE too (base 176.8 / 120.8 / 128.5 / 271.0 ms, after 144 / 142 / 118 / 279 ms; run-to-run noise is bigger than the A2 delta). A2 adds no frame job of its own.

## NOT PROVEN / known limits (read this)

1. **The headline DoD («from his camera: the stream from the mountain to the moat») is only partly proven.** From the owner's exact camera the twin falls, the cleared meadow strip and the first slivers of water are clearly visible; the mid-course of `stream_e` is hidden behind a ridge, the north moat is hidden behind the wall (it shows only from ≈ -50°, the NE shoulder), and the last stretch near the NE shoulder is partly under tree canopy. The complete course is proven only in the higher views (`a2_top`, `a2_e`, `a2_w`). I did not find a course that keeps both the hamlet/nomad plan unchanged AND shows the whole stream from that exact low camera.
2. The 1999×923 owner-size shot (`a2_final_home.png`) is from the build BEFORE the last meadow-strip change; the final-build shot `a2_final2_home.png` is 1600×739 (same camera, smaller viewport).
3. **The forest re-rolled globally.** `world.js buildForest` draws from one seeded rng with `forestDensity`; every density change near a stream changes the draw sequence, so all trees stand somewhere else (same density, same look, different positions). Unavoidable with the meadow strip; the owner may notice that individual trees moved.
4. **noRoute events in the battle sim rose 317 → 622** (gate limit 700). The streams cut the north plain; the footbridges brought it down from 953. Units are fine (components 1, no wet steps), but the AI takes longer detours in the north.
5. The lower `stream_e` has no footbridge (no valid site: bank height, camp/hamlet zones). The camp pocket is reachable over the `stream_w` bridges.
6. Only the `night` map carries `STREAMS` (the layout `c.STREAMS || []` in `setMap` keeps every other map exactly as before). I did not look at any other map.

## NOT DONE

* No water animation / flow shader of its own (the stream uses the existing water plane look).
* No sound, no fish, no boats on the streams.
* No server-side change (none needed; the map is the client layout).

## SHARED edits (smallest possible) and why

`client/src/layout.js` (SHARED: the RIVER polyline and the fishery site only → this is the only way to get a new river into the terrain, nav and every consumer of `distPolyline`):
* `// A2-STREAMS-BEGIN … END` block: `STREAMS: [{id, kind:'stream', k, pts}]` frozen by `dev/a2_freeze.py` from `work/a2/streams.json`; `export let STREAMS`; `STREAMS = c.STREAMS || []` in `setMap`.
* `distPolyline`: `if (pts === RIVER) d = streamD(x, z, d);` — so terrain carving, nav, clearance of hamlets/nomads/roads see every stream exactly like the p38 river (distance divided by `k` → a wider bed, banks and clearance).
* new `streamD(x, z, best)` (+ `streamChunks`, exact chunk-box pruning), `withRiver(pts, fn)` (lets the forbidden `falls.js` be reused unchanged for each stream).
* The RIVER polyline itself and `fishery_river`: **unchanged** (the test says it is still on a shore).

`client/src/world.js` (SHARED, 2 lines): `fallsA2 = STREAMS.map(S => L.withRiver(S.pts, () => buildFalls(...)))` after `falls`, and `for (const f of fallsA2) f.update(...)` next to `falls.update`.

## OWNED edits

* `moat.js`: stream banks (reeds, rocks, sedge, flowers) with their own rng `RS = rng(9137)`; shore export filters out stream points (`shore.filter(q => !q[4])`) so no meadow-flora cells are added.
* `roads.js`: `bridgesOver(pts, k)` for every stream (bridge len `max(22, round((17.5/sin + 3)·k))`), `addFords()` footbridges, `const FORD_GAP = 120; // (ph)`.
* `terrain.js`: `forestDensity *= smooth(15, 36, L.streamD(x, z))` — a meadow strip along the streams.
* `dev/a2_*`: planner (`a2_plan.mjs`), freezer (`a2_freeze.py`), test (`a2_water_test.sh/.js`), screenshot / perf / census tools. The mother must not run them as part of the gate except `a2_water_test.sh`.

## What the MOTHER must wire

1. Apply `shared/client/src/layout.js.diff` and `shared/client/src/world.js.diff` (the owned files are copied whole). Rebuild: `bash dev/rb.sh`.
2. Add `bash dev/a2_water_test.sh` (prints `A2 OK`) to `gate.sh` / `gate_w.sh`.
3. **If anything in layout.js changes that a stream avoids** (camp, SITES, MINES, PASTURE, MUSTER, LAIR, hamlet / nomad plan, roads, `sdTown`, the town ring) → re-plan: `node dev/a2_plan.mjs` (through `dev/a2_run.sh`) then `python3 dev/a2_freeze.py`, then `A2 OK` again. A frozen course never follows later layout changes by itself.
4. If another worker also touches `forestDensity` / `buildForest`, expect the forest to re-roll once more (same rng behaviour).
5. Keep `FORD_GAP` (ph) = 120 m and the bridge-length formula unless the nav team wants more crossing points (noRoute 622 of 700).
6. Nothing to add to `credits.json`: no asset, no texture, no model was added.

## Gate

`bash dev/gate_w.sh` on the final sources → **GATE_W: ALL OK** (client builds, no 'bot' word in player texts, credits.json, nomad plan, rules / ring / nav / river / cam / ws / wsroute / def tests, rc_test, battle sim: 0 wall crossings, 0 ground unit-steps in water, 99,886 on a bridge, noRoute 622 (< 700), pinned at end 68).
