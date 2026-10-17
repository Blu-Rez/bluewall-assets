# report_CL1 — «things pass through her» + «extras in front of the doors» (hero mode, home map)

CL1 · final · base = kit `KIT_VERSION` of 17 Oct 2026 · ROUND 6

## First block (for the mother) — the files that PLACE props / clutter on the home map (found first, as asked)
All in `bluewall/client/src/` (read-only for CL1; **no placement file, no ST1 / TR2-S5 plan, castle or road file was touched, planId unchanged**):
| what | file(s) |
|---|---|
| forest trees (crossed-card impostors, real LOD trees with trunk packs) | `trees.js` |
| bushes | `sc_bush.js` |
| scatter rocks (also stamped by `edge_strip.js`, `mines.js`, `tr2_s4c.js`) | `sc_rocks.js` |
| bank life: reeds, sedge, lotus / lily, bank flowers, bank rocks | `moat.js` (`bank-life` group) |
| crops (corn / pumpkin / cabbage), hay bales, the `late-stage` groups, worker-life glue | `world.js` |
| worksite decor (`…:minor` meshes: block fields, carts, tables, racks, banners, lamps) + the dynamic worker props (`wslife`) | `worksites.js`, `wsbuild.js`, `ws_tr2.js`, `c2_kinds.js`, `c3_kinds.js`, `tr2_life.js`, `layout_live.js`, `walk_kit.js` |
| town props (barrels / crates / sacks / wagon / handcart `tr2:props_town/*`) | `tr2_s4c.js`, `b2_homes.js`, `b3_civic.js` |
| gem piles / vault props, attacker camp, defence decor | `vault.js`, `camp.js`, `defbuild.js` |
| ST1 storage yards (NOT touched) | `storeyards.js` |
| boulders (`drone_rock_01` GLB, 9) | the placing code was not located by grep (material name only) |
**What the hero collides with is decided on the hero side** (`web/assets/rpg/`), so the fix is there, not in the placing files: `rp_grid.js` (the collision grid), `rpg.js` (start sequence), new `rp_clear.js` (door keep-clear), `doors.js` / `cull.js` read only.

### What changed (3 files + tests; shared lines marked `// CL1:` / `CL1`)
1. **`rp_grid.js`** — before CL1 the grid took only opaque, static, NON-instanced meshes. Everything instanced was skipped, so trees, bushes, rocks, barrels, crates, wagons, hay bales … were walked through. New **instance layer** (`instPass`, ~100 ms on a desktop): every instance of a static pack is rasterised into its own bit layer (`ibits`): tree cards → a trunk disc (r = 0.024·h, 0.28–0.6 m), bushes → a disc (0.25–0.7 m), opaque props → their body-band triangles (hole-filled). Kept in a SEPARATE layer so the door facade ray / cover discs still see only the static layer; the distance field and the push use both. Also: opaque materials flagged `transparent` with opacity ≥ 0.9 (blacksmith `WoodExteriorMat` / `FurnitureMat` / `GroundMat`) now count (`tfix`). API adds `solidAll`, `solidInst`, `info().inst`, `info().icells`; `build({inst:false})` / `build({tfix:false})` give the «before».
2. **`rp_clear.js` (new, lazy module)** — the door keep-clear: for every door a corridor 0.3 … 3.2 m along its facing × ±1.5 m is searched for separable decor pieces (connected triangle sets of the worksites' `minor` meshes, ≥ 0.45 m high AND wide, ≤ 6 m, in the body band); a piece in it is cut out of its mesh together with every piece that touches it (≤ 10 cm, group ≤ 4.4 × 4.4 × 3.2 m: a cart goes as a whole, not as a bed on blocks). Building shells (`tr2`, `static`, homes, civic, castle) are never touched (`cl1_test.sh` asserts it).
3. **`rpg.js`** — 3 small places: `clear` variable, the keep-clear block after the grid build (≤ 3 passes: cut → grid → doors again, because the quarry door itself was re-placed after the cut), `dev.clear`. Dev switch `window.__rpNoClear` (like `__rpNoWarm`) for the before / after measurement.
4. Tests (mine): `dev/cl1_test.sh [page]`, `cl1_page.py`, `cl1_phys.js` (walk INTO every prop type), `cl1_lane.js`, `cl1_doors.js`, `cl1_doors2.js`, `cl1_extras.js`, `cl1_wslife.js`, `cl1_smith.js`, `cl1_census.js`, `cl1_comp.js`, `cl1_ghost.js`, `cl1_who.js`, `cl1_cam*.py`, `cl1q.py`. Shared dev edits: `dev/rp1c_collide_page.js` line 34 (the test's inside-solid check reads both layers: `(GR.solidAll || GR.solid)`), `dev/rp1c3_test.sh` (+ `rp_clear` in the allowed-file set and the parse list).

## 1) Hero vs every static object type — before → after (walk INTO it, real physics, 30 fps, stick forward, 4 m start, 2.6 s)
A sample counts only if the walk really ARRIVED without the layer (nothing else in the way); «through» = she got within 0.35 m of the centre or ended on the far side.
| type (placed by) | stamped | valid samples | through BEFORE → AFTER |
|---|---|---|---|
| forest trees, impostor cards (`trees.js`) | 1 411 | 52 | **52 → 0** |
| real LOD trees, trunk packs | 18 | 17 | **17 → 0** |
| bushes (`sc_bush.js`) | 205 | 14 | **14 → 0** |
| scatter rocks (`sc_rocks.js`) | 252 | 15 | **15 → 0** |
| barrels (`props_town`) | 38 | 10 | **10 → 0** |
| crates | 21 | 9 | **9 → 0** |
| wagons | 5 | 3 | **3 → 0** |
| handcart | 1 | 1 | **1 → 0** |
| small props (4 kinds of 0.4–0.8 m worksite / home props) | 36 | 36 | **36 → 0** |
| hay bales (`world.js`) | 42 | 40 | **40 → 0** |
| **all** | **2 045 instances → 37 706 cells** | **197** | **197 → 0** |
Not walk-verifiable (the «before» walk never arrived: something else already stops her there): the 9 boulders (`drone_rock_01`), 2 gem piles, 2 + 2 tables, 1 sack pile — they ARE stamped solid, just not proven by a walk.
Blacksmith (opaque materials flagged transparent): solid cells in its footprint **731 → 1 391** (+660: frame, porch, ladder, furniture); its stone walls were solid before (walk at the cottage centre from 8 sides: 0 → 0 get inside 2.2 m).
**Already solid before (kept; RP1C collide, below):** every opaque non-instanced mesh that has geometry in the 0.45–1.55 m body band: houses / civic / workshop shells, castle walls / towers / gates / ballista boxes, fences, tents, wells, lamp posts, flag poles, statues, static carts / benches / tables.
**Still NOT blocking (on purpose; the owner may veto):** grass / fern / flower tufts, pebbles (`PathRocks`) and canopy leaves; crops (corn 63 / pumpkin 84 / cabbage 21: a field is walked through); water-bank plants (reeds ≈ 1 100, sedge ≈ 1 800, lotus 100 + flowers, `moat.js`); the 260 bank rocks (their tops are 0.43 m, below the 0.45 m body band: she steps over them like a pebble); everything dynamic (crowds, animals, units, 881 worker-life props).

## 2) Extras in front of the 97 doors (corridor 0.3 – 3.2 m × ±1.5 m; lane 0.9 – 3 m × ±0.75 m)
| | before | after |
|---|---|---|
| instance-layer solids in any door zone (0.9–3 m × ±2 m) | 0 doors | 0 doors (no tree / crate / barrel / fence / rock stands in front of a door) |
| doors with static solid cells in the lane / in the zone | 26 / 40 | **24 / 38** |
| quarry door: lane cells / zone cells | 46 / 120 (the door stood IN a field of 3 m stone blocks) | **0 / 0** — 16 blocks cut (5 in the lane + 11 stacked on them): a gap leads to the door |
| lumber1 (saw mill) door | 27 / 46 (two carts in the lane) | **0 / 0** — 2 carts cut as wholes (76 parts) |
| mill_wind2 door | a cart across the lane | cart cut (39 parts); the second cart beside the lane stays |
| mill_water1 door | decor group in the corridor | 16 parts cut (no before frame: the camera sits inside the mill roof) |
Cut in total: **147 pieces at 4 doors** (`rp_clear`, 2 passes, < 100 ms).
The 22 doors that still have static cells in the 0.9–3 m lane (well_00 20, well_02 18, keep 16, archer 14, mine_turq 14, mine_emerald 11, craftsman_00 9, lair 8, mill_wind1 7, smokehouse_00 7, smokehouse_01 6, merchant_05 6, butcher_00 / cottage_03 / 08 / 10 / 11 3 each, mill_water2 2, merchant_04 2, greenhouse 1, mill_water1 1, tavern_00 1): the cells belong to the BUILDING itself (awnings and porch posts of civic / home models, the windmill's spiked wall, the well body, the castle wall) — merged `tr2` / `static` / homes meshes that cannot be moved from the hero side. Not clutter; if the owner wants them gone it is a model change (door point out from under the awning).
**Walking at doors (RP1C collide, 8 angles):** walk + run open the door in **722 of 736** approaches (98.1 %; kit: 713 of 728 = 97.9 %). The 208 «blocked» (kit 194) are 205 dodge rolls (a roll never opens a door by design) + 3 walks (smokehouse_00 at 34° walk / run, mine_turq 11° run). The rise 194 → 208 comes from 33 more door runs (quarry / lumber1 now have free start points: skipped door runs 198 → 165).
**Before / after sheet, 15 doors** (`CL1_doors_sheet_1..3.png`, 640×360 per frame, from an extra camera 6.5 m behind the hero, every frame viewed at full size): forge, archer, lair, fishery_river, market_00 | quarry, well_02, craftsman_00, greenhouse, mill_wind1 | lumber1, mine_emerald, well_00, merchant_05, smokehouse_00. Real changes: quarry and lumber1 (+ mill_wind2 in `beforeB_/afterB_`). The rest are «no change»: lane already free, or the thing in front is the building model; archer / lair / well_02 / mill_wind1 are shown from a higher vantage (the default camera sits inside the castle wall / the awning) and carry the same frame on both sides.

## 3) The remaining «extras» of the map — category, count, advice (in front of doors only what was cut above)
| category | count | blocks her now | within 6 m of a door | advice |
|---|---|---|---|---|
| forest trees (cards / real) | 1 411 stamped + 18 real | yes (trunk disc) | 3 | keep (the forest is the setting) |
| bushes | 205 | yes | 1 | keep |
| rocks: scatter / boulders / bank rocks / pebbles | 252 / 9 / 260 / ≈ 90 | scatter + boulders yes; bank rocks + pebbles no (< 0.45 m) | 1 | keep; bank rocks could be made knee-high solid if wanted |
| water-bank plants (reeds, sedge, lotus, flowers) | ≈ 3 000 | no (soft) | 0 in a door zone | keep; thin by half if the GPU budget ever needs it |
| grass / fern / flower tufts | 131 in static packs | no (soft) | 3 | keep |
| crops (corn / pumpkin / cabbage) | 168 | no (soft by design) | 32 (2 in one door zone) | keep soft; fields in front of a door are low |
| hay bales | 63 (42 stamped) | yes | 0 | keep |
| town props (barrels 42, crates 25, sacks 5, wagons 5, handcarts 3) | 80 (66 stamped) | yes | 0 | keep; the sacks / awning posts baked into house meshes (craftsman_00) are not removable at runtime |
| misc small props (4 kinds, 0.4–0.8 m) | 36 stamped | yes | 0 | keep |
| gem piles / vault props | 2 stamped | yes | 0 | keep |
| worksite decor, static `minor` meshes (blocks, carts, tables, racks, benches, banners, lamps) | ≈ 110 pieces | yes (opaque) | **147 pieces cut at 4 doors** | done; the rest stands beside lanes (tables at greenhouse / smokehouse / fishery) |
| worksite dynamic props (`wslife`: carts, planks, stone blocks the workers move) | 881 | no (dynamic) | 1 door (mill_01: five 0.5 m blocks right now) | leave; they move |
| baked props inside merged building meshes (sacks, awnings, posts, rails) | n/a | yes where opaque | 22 doors (lane cells above) | model-side fix only |
| attacker camp / siege engines / army units | 29 + … | battle stage only | – | not touched |
| contact shadows / decals (`town_contact` 79, `sc_shadows` 28) | 107 | no (decals) | – | keep |

## Numbers (software GL; before = kit as received; after = this patch)
| what | before | after |
|---|---|---|
| walk INTO every prop type (`cl1_phys.js`): valid samples / through | 197 / 197 | 197 / **0** |
| RP1C collide (a) inside / (b) stuck / (c) pass-through / unstuck, runs (+ 20 fps) | 0 / 0 / 0 / 0 on 7 410 (+240) | **0 / 0 / 0 / 0 on 7 429 (+241)** |
| door-runs skipped for want of a free start | 198 | 165 |
| reach map from the gate, on foot / swimming | 97.65 % / 98.33 % | 97.59 % / 98.28 % (no unreachable pocket > 1 000 m²) |
| hero start (software GL, whole sequence incl. 2 grid builds + keep-clear) | not measured | 29–31 s (grid build 0.53 s, instance pass 0.1 s, grid memory 5.1 MB) |
| `cl1_test.sh page` | — | **CL1 OK** (9 checks, fresh boot) |
| `rp1c3_test.sh` (static + node) | — | all OK except «RP1C was added to a dev/gate*.sh» (the mother's `rp1c4_info` line in `gate_w.sh`; identical on the kit, as in the R5 report) |
| node tests | — | `gr1_test` GR1 OK · `st1_test` ST1 OK · `p1_test` P1 OK · `tr2_h` / `tr2_tiers` / `tr2_layout` / `tr2_s3` / `tr2_s4b` / `tr2_s4d` OK · `tr2_s4a_r2_test`: FAIL 18 (of 1 391) = **identical on the untouched base snapshot, no client/src file of mine** |
| `gate_w.sh` | GATE_W: ALL OK | **GATE_W: ALL OK** (noRoute 647 < 700, unchanged) |

## Frames (photos_CL1.tar.gz — every frame looked at full size)
`CL1_doors_sheet_1..3.png` (15 doors before | after), `before_<door>.jpg` / `after_<door>.jpg` (1280×720, JPEG q92, from an extra camera), `after2_*` (final code for quarry, lumber1), `beforeB_` / `afterB_` (mill_wind2, mill_water1), `after31…33_*` (higher vantages for archer / lair / well_02 / mill_wind1), `smith_top.jpg` / `smith_side.jpg` (the blacksmith cottage).

## Not proven (اثبات‌نشده)
- The real phone: feel and fps with the instance layer (2 045 stamped instances = 37 706 cells, grid memory 5.1 MB, hero start ≈ 30 s in software GL; the start time of the kit was not measured), software GL only.
- The soft-by-design decisions (crops, reeds / sedge / lotus, grass, bank rocks, pebbles) are my reading of «what should not stop a body»; one regex (`I_SOFT_MAT`, `I_SKIP_PATH`) each if the owner disagrees.
- Boulders (9), gem piles (2), tables, sack pile: stamped, but no walk could be verified (the before-walk never arrived).
- The walk-into test is a straight stick at the centre (one angle per sample); oblique approaches of the instance layer are covered only by the RP1C collide run (8 angles for boxes / discs / the grid, which since CL1 includes the instance layer: 0 / 0 / 0).
- `rp_clear` cuts the page's copy of the geometry, so the pieces are gone for the whole session (strategic view too) and come back when a worksite is rebuilt (level-up) or the page reloads; it runs again at the next hero start. Dynamic worker props (`wslife`) are not cut and not solid.
- 22 doors keep static cells in the 0.9–3 m lane (building models, listed above); the lane metric also over-counts doors at the CENTRE of a round building (wells). The door still opens by walking at it (98.1 %).
- mill_water1: no before frame (camera inside the roof), only the after frame; archer / lair / well_02 / mill_wind1: before = after (nothing separable), one vantage; the hero is hidden behind the roof / awning in the lair / well_02 / mill_wind1 frames.
- Frames only 844×390-class landscape renders from an extra camera; portrait not looked at; no day / dusk / night variants.
- `rp1c3_test.sh page` (ramps, water, jump, goup) and `rp1c_r5_test.sh page` were not re-run (nothing they test was touched). The RP1C collide numbers above come from running `dev/rp1c_collide_page.js` in a fresh game page by hand (the same JS the script runs), not through `rp1c_collide_test.sh` itself.
