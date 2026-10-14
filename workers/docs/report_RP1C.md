# report_RP1C — hero-mode frame round 3 + door orbs

**For the mother (first block):** RP1C = hero-mode frame round 3 + door orbs. Review like any patch: every frame full size (photos_RP1C, 6 frames, 390x844), `GATE_W: ALL OK`, gate off = +0 programs / +0 requests under `assets/rpg/` (proved by `dev/rp1c_test.sh`, 166 programs, 0 requests), no change to castle / town / battle / economy / server / pkg / gate files, `main.js`: **0 lines** (the 12-line allowance is unused), the numbers table below. Owned files: `web/assets/rpg/rpg.js`, `rpg_diet.js`, NEW `cull.js`, NEW `doors.js` (`client/src/reach.js` untouched). **One shared-file edit: `client/src/bsheet.js`** (UI1's file) — a read-only `peek(id, SM)` added before the `return` and exported; 2 lines + the return line (diff in `shared/`). Not touched: `dev/gate*.sh`, `web/app/*` (wall.js is a build artifact, excluded).

## What it is
1. `cull.js` — spatial culling of the world's repeated InstancedMeshes while hero mode is on (InstancedMesh has no instance offset, so each taken pack gets a *near-copy proxy* that shares geometry + material = +0 programs and holds only the copies within a radius of the hero; the original is hidden; refilled when she moved 6 m / the source changed / the radius changed; refills have a 1.2 ms/frame budget, round robin). Casters get a second proxy limited to her shadow box and `WebGLShadowMap.render` is wrapped while hero mode is on to swap main <-> shadow proxies (restored on exit). Radii come from the diet's step (`cullR` added to `rpg_diet.js` STEPS) scaled by the real copy size (a tall tree is seen further than a rock).
2. `doors.js` — 113 doors (every pick / worksite / lot with a T1 sheet, `sheets.lots()` + `world.picks`): 3 `THREE.Points` (gold = collect, green = affordable upgrade, blue = info only; every door within 45 m that is not an icon), up to 3 glass-plate `Sprite` icons (one 8 kinds x 3 states canvas atlas) for doors within 12 m in front of the camera (scale in 200 ms + one pulse; smaller than 6 m so it never fills the screen). Within 2.5 m the existing round door button wears the same icon (same SVG glyphs) and opens the sheet. Tapping an orb / icon (44 px min target, tap = <450 ms and <14 px) makes her walk to the door by herself (local BFS over free 1 m cells, steered through the joystick input, camera swings behind her), the T1 sheet opens on arrival and the `interact` clip plays; the joystick, a movement key, a sheet or 2.5 s without progress cancels it.
3. Budget: +0 programs (proved: the 3 Points + sprites + proxies switched off and on again = 168 / 168 / 168), +3 calls for the orbs and +1..3 for icons (max +6; 4 measured in a street), code +36 KB (cull 13.4 + doors 14.3 + rpg.js +7.4 + diet 0.2 + bsheet 0.7), no per-frame allocation (checked by a test on the `tick` bodies).
4. Static merge (item 3 of the brief) **not done on purpose**: TR2 tier swaps rebuild meshes, so merged geometry would go stale against picks / destruction / swaps. Items 1 + 2 only.

## Numbers (high preset, software GL, 390x844, ONE `renderer.render` with `renderer.info`)
before = RP1B hero mode (cull + doors off, same page, same spot), after = RP1C. Main pass = shadow map not refreshed; refresh frame = shadow map refreshed.

| view | calls | triangles | shadow pass calls | shadow pass triangles | refresh frame (calls / tris) | programs |
|---|---|---|---|---|---|---|
| castle gate | 297 -> **243** | 1.78 M -> **1.07 M** | 169 -> **144** | 1.19 M -> **0.65 M** | 466 / 2.97 M -> 387 / 1.72 M | 222 = 222 |
| open fields | 218 -> **177** | 1.95 M -> **1.03 M** | 134 -> **107** | 1.48 M -> **0.63 M** | 352 / 3.42 M -> 284 / 1.66 M | 236 = 236 |
| outer mill (ws:mill_wind2) | 359 -> **253** | 1.84 M -> **0.80 M** | 76 -> **54** | 1.03 M -> **0.31 M** | 435 / 2.87 M -> 307 / 1.11 M | 236 = 236 |

Low preset (from `rp1c_test.sh`, last run): gate 270 / 1.68 M -> 217 / 0.85 M, fields 217 / 1.62 M -> 156 / 0.85 M. Picture A/B (130x280 downscale of the canvas, proxies on vs the originals): mean |diff| 0 at the gate, 0.05 / 255 in the fields.

**CPU-throttled JS (CDP `Emulation.setCPUThrottlingRate`, NOT a phone):** median wall time of one `renderer.render()` on the main thread (three.js JS + command submission; the software rasteriser runs in another process), 3-5 renders each:

| view | 1x before -> after | 4x before -> after | 6x before -> after |
|---|---|---|---|
| gate | 11.2 -> 9.2 ms | 51.9 -> 54.9 ms | 82.5 -> 68.1 ms |
| fields | 9.5 -> 7.3 ms | 37.2 -> 44.0 ms | 61.8 -> 66.3 ms |
| mill | 10.6 -> 7.9 ms | 45.5 -> 36.5 ms | 74.0 -> 70.9 ms |

Honest reading: in this harness the main-thread `render()` time does **not** clearly fall under throttle (noise is about +-10 ms); the calls fall 18-30 %, the triangles 40-56 % and the shadow pass 55-70 % of its triangles — that is GPU work this software test cannot show. Cost of the new code itself (these throttled numbers were taken BEFORE I sliced the refill / door-state work across frames; the 4x runs then showed `cull.tick` 8-20 ms on a frame after a teleport): after slicing, sprinting 83 m with both ticks run every frame: cull mean 0.04 ms, p99 1.2 ms, max 4.6 ms; doors mean 0.11 ms, p99 0.8 ms, max 4.4 ms (1x; the rare max is `collect()` every 4 s / `build()` every 20 s, about x4 at 4x throttle).

**The targets (<= 150 calls, <= 400 k triangles in the main pass) are NOT reached**: 243 / 177 / 253 calls and 1.07 / 1.03 / 0.80 M triangles. What is left is mostly the world's own static meshes (castle, town, terrain ~400 k triangles on their own, which I may not change), the crowds (95 k, the diet's) and about 55 small proxy packs that each cost one call. Getting under needs the static merge or lower-detail world meshes (the TR2 / world owners).

## Proven (what I looked at / ran)
- `bash dev/rp1c_test.sh` -> `RP1C OK` (36 checks, ~9 min, software GL): gate-off page 0 requests under `assets/rpg/`, 166 programs, no hero switch, no page error; cull A/B at 2 views (calls and triangles down, picture the same); 113 doors / 8 kinds; `sheets.peek` gold 6 / blue 107 in the offline preview; orbs = doors within 45 m that are not icons; 3 Points + <= 6 calls; <= 3 icons; programs +0 (on/off/on); door button icon = the door's kind; tap on an empty spot is not a door; tap on an orb from 12 m -> she walks 3.3 s (sim), stops 2.4 m from the door, the sheet opens (`.bsh.on`), `interact` plays; joystick cancels (and she stands still after); exit: no `rp-doors`, no `#rp` proxy, shadow pass function restored, no extra hidden pack; own GPU resources: enter + draw + exit returns exactly the geometry / texture counts; sessions 2 and 3 identical (463/327 -> 508/368 -> 508/368).
- `bash /home/claude/dev/gate_w.sh` -> `GATE_W: ALL OK`.
- Frames I looked at, full size, in `photos_RP1C`: 01 blue orb on a town house; 02 gold orb (clear) + a green orb at the left edge; 03 near glass icon (gold rim, home glyph) at 6.3 m, 390 px portrait; 04 tap from 13 m, she is walking; 05 arrived (the orb 3 m away, interact pose); 06 the sheet open on arrival.
- Leak / exit: three start/exit cycles in the high session: geometry 580 and texture 402 stable.

## Not proven / not done (say it plainly)
- **Real phone fps / feel** — none. Everything above is software GL on a server; the throttle is only a rough CPU stand-in.
- **Green orbs are test-forced.** The offline preview cannot produce an affordable upgrade, so `doors.st.force` (a test-only override, never set by the game) was used for green; gold and blue come from the real `sheets.peek`. In the frames green is only seen partly (02, behind a roof edge); I do not have a clean full green frame. The first light (blue) was too washed out on pale walls; fixed (stronger body, normal blending, saturated blue) — frame 01 is after the fix.
- **`rp1b_test.sh` currently fails 2 of its checks ON THE KIT ITSELF, not because of RP1C**: `wall #0 / #1: climbs up, walks the wall-walk and comes down`. The kit's HOTFIX47 has `CLIMB_ON = false` by default and `rp1b_page.js` never calls `rp.setClimb(true)`. Proof: the same `climbTest` fails identically with the kit's own `rpg.js` / `rpg_diet.js` put back; with `rp.setClimb(true)` and my code it passes (up in 6.8 s, walked -39..39 m, down, 0 camera violations). Everything else in `rp1b_test.sh` is `ok`. The RP1B test needs `rp.setClimb(true)` (or HOTFIX47 lifted) — mother's call; I did not edit the kit's test.
- **TR2 / new models:** `cull.js` takes packs by InstancedMesh shape (count, spread, triangles), not by name, EXCEPT that it leaves castle / structure packs to the diet by the diet's `STRUCT` name regex. If TR2 renames those meshes, a far structure pack could be distance-culled by the radius (>= 95 m) instead of kept; `doors.js` uses ids from `world.picks` / `sheets.lots()`, no mesh names. Not verified against the new TR2 models.
- Static merge not done (above). The `<= 150 / <= 400 k` targets not reached (above).
- `bsheet.js` is UI1's: the `peek` lines must be merged by hand if UI1 changed the same region (the `return` line).
- Real tap on a phone (touch events) not tried; I called the same `tapDoor` the HUD pointer handler calls, from the 390x844 projection of the orb. The doors' `Points` size is 1.9 m world units (attenuated), about 20 px at 30 m.

## Shared-file lines
- `client/src/bsheet.js`: +2 comment/def lines (`peek`) before the `return`, and `peek` added to the returned object (in `shared/client/src/bsheet.js.diff`).
- `client/src/main.js`: none.
- Owned and changed: `rpg.js` (about 92 lines: lazy import of `cull.js` / `doors.js`, `enter` / `exit` / `frame` hooks, `interact` clip, `S.act`, auto-walk `planLocal` / `autoStep` / `tapDoor`, the HUD tap handler, button icon swap, dev API `peek doors tapDoor planLocal openDoor autoState act cull`), `rpg_diet.js` (14 lines: `cullR` per step, skips packs the cull took, returns `STRUCT`).
- `dev/`: `rp1c_test.sh`, `rp1c_page.py`, `rp1c_page.js`, `rp1c_measure.js`, `rp1c_repl.py`, `rp1c_ask.py` (nothing added to `dev/gate*.sh`).

## For the owner (to run on the server)
`journalctl -u bluebot-wall --since "30 min ago" | grep perf | tail -40` — real phone perf lines (fps / calls / triangles of the hero mode with RP1C on) are the only thing that tells if this helped on a phone.
