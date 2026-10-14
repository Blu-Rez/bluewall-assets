# report_TR2_S4a — houses + civic buildings of the town from the Tripo library
Worker TR2 S4a · 14 Oct 2026 · base = branch `kit` (p47 + TR2-S2) · models = `lib-tripo` + `inbox/TR2_S2` (swap.json, TR2_swap.md)

## What the player sees now (home map, castle level 30, software GL, Q=low)
- The planned town (78 homes + chapel / town hall / tavern / market / wells) is built from Tripo models: 4 house families × 3 variants (cottage, craftsman, merchant, noble; one variant per lot, chosen by the lot seed), `shrine_0` (chapel), `civic_hall_0` (town hall), `tavern_0`, `market_hall` + 4 market stalls + `well_stone` (market), 3 well types.
- Yard dressing on houses: flag / lantern only (at most 2 per lot, appear with the level tiers 1/6/12/18/24/30). Civic lots keep their full dressing (benches, tables, lanterns, flags, barrels, chest).
- Everything is still ONE destructible target per block / chapel as before (aB per vertex, `patchDestruct` on the shared atlas material) — the battle collapses them exactly like the kit houses.
- If the models cannot be loaded (network error, old cache) the OLD kit town is built unchanged (`warmTown()` rejects → `createPlannedTown` falls back to kit_homes / kit_civic).

## Numbers (home map lv 30, per frame, `dev/../work/s4a/frames.py` vs `census.py` baseline)
| view | calls before → after | tris before → after | |
|---|---|---|---|
| top (strategic) | 508 → 510 | 3,474,459 → 3,779,347 | **+8.8 %** |
| town | 488 → 488 | 2,971,046 → 3,246,266 | +9.3 % |
| centre | 477 → 476 | 2,992,854 → 3,284,811 | +9.8 % |
Planned town only: homes 290,792 tris (2 draw calls, one per 40-lot chunk), civic 94,002 tris (1 call); the old planned town was ≈ 48 k visible tris. Programs 166 → 166 (+0: one shared Tripo material config). Atlas textures: 2 atlases (homes, civic) ≤ 2112 px wide — estimate ≤ ~50 MB GPU, NOT measured. Shipped models 4.0 MB (27 files).
**The +5 % rule on tris is NOT met (+8.8…9.8 %).** First build was +14.6 % (yard props cost 1.9–3 k tris each = a whole cottage → cut to flag + lantern). What is left is the house bodies themselves (cottage 3.2 k, merchant 4.4 k, noble 4.0 k, craftsman 6.5–7.7 k vs ≈ 1.3 k of the old homes) and the civic set (4 stalls × 3 k). Levers the owner can choose: (a) slim the craftsman/merchant bodies further (UV-aware simplify made holes in the roofs at 3.2 k–5.2 k, so I did not ship that), (b) fewer stalls (market N), (c) accept ≈ +9 %. I did not hand-build or recolour anything.

## Gate / tests
`GATE_W: ALL OK` · noRoute **667** (< 700) — measured with the Tripo civic nav circles ON (23 circles instead of 27; `node --require` preload `globalThis.__BW_CIVIC_TR2=1`, same 667) · `TR2 TIERS OK` · `TR2 S4A OK` (893 checks: files + swap entries, determinism, pieces inside the lot, tiers never remove pieces, civic solids finite and on the lot, no «bot/ربات» in strings) · `B2 OK`, `B3 OK`, `P41 OK`.

## Shared-file lines (HOOK) — world.js, 2 lines, marked `// TR2-S4a:`
1. import: `import { registerTownTargets, createPlannedTown, warmTown } from './town_build.js';`
2. town block (≈ l.237): `if (tplan) warmTown().catch(() => {});` — the models + atlases load while the world is built.
The late job `while (!planned.idle) planned.tick()` needed no change: `idle` is true while models load (nothing is queued), and `rebuild()` re-queues after the load. assets.js is NOT touched (kit_homes / kit_civic / kit_village stay as the fallback; remove them only after QA).

## NOT done
- Generic fill houses (town.js, ~80 procedural box houses) and the hamlets are still the OLD houses — models `house_generic_a..d` are shipped but not wired; with the budget above there is no room for them (each ≈ 2.6 k tris).
- Chimney smoke for Tripo houses (no anchors; the old planned homes had ≤ 18 smoke plumes).
- `town.js`/`village.js` kit_village houses unchanged; kit_* not removed from assets.js (no MB saved yet).
- Frames at lv 1 / 20: see photos list (only what is in `photos_TR2_S4a.tar.gz` was looked at).
## NOT proven
Phone fps, shader compile time on phone, real GPU memory (all numbers here are software GL / estimates), behaviour with a slow network (fallback path was reasoned, not forced in a browser).

## Frames (photos_TR2_S4a.tar.gz) — what I actually looked at, full size, home map lv 30
- `top`, `town` (strategic views): Tripo houses + civic everywhere inside the ring, no holes / black faces / stretched textures seen; the market hall (pink roof) is visible. `castle_view` (called "civic" in the script; the camera target was the bbox centre = castle, not a civic lot).
- `cl_market` (camera outside the outer wall → the hall is mostly hidden behind the wall), `cl_tavern`, `cl_townhall`, `cl_chapel`: white / blue-roof houses (merchant/noble/craftsman), town hall with blue roof, shrine with the turquoise dome, flags + lanterns beside the houses, market stalls (cloth, pottery) at the right edge of `cl_townhall`. Textures look right (atlas, no visible seams at this size).
- **Not achieved:** a street-level close-up of ONE house (the `cl_h_cottage` camera went under the terrain → grey frame, not shipped), frames at lv 1 / 20 (the lv 1 run was cancelled for the round cap), a destroyed-block frame. So house detail at street level is NOT visually verified.
- Worth a look by the owner: the pennants (`props_street/flag`, h 2.8) read big next to the small houses; and grey sack-like blobs beside some wooden-roof buildings near the chapel/tavern — I did not identify them (likely the production lots = S4b, not mine).
