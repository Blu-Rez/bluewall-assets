# TR2_swap — library key → game slot → scale / yaw / offset / budget (S1, v2 = v0 + S1b + S1c)
TR2 · 14 Oct 2026 · numbers computed from `lib_inv.json` (every GLB measured with gltf-transform) and from the game code/kit measurements (`old_sizes.json`). **Status: v2 — scale RULES from numbers (v0) + FRONT/yaw of 166 directional models by looking at 4 sides (S1b, section 6) + target size / yaw of all 169 pack nodes and the old-vs-new sheets (S1c, section 8); machine-readable `tr2_swap.json` (`models` + `packs`). Not yet: per-model `preview.png` (the 4-view sheets cover them), the weapon packs (hero chat), people/animals keep S1b numbers.**

## خلاصه برای وینگلس
این فایل می‌گه هر مدل Tripo رو تو بازی چقدر بزرگ کنیم و کدوم طرفش رو بچرخونیم. اعداد از اندازه‌ی واقعی مدل‌ها و دیوار/برج‌های فعلی بازی درآمده؛ «دیده‌شده» = هنوز با چشم تأیید نشده.

## Library facts (all 226 measured)
- Every model's **longest side is ≈ 1** (units): longest axis is Z for buildings/walls/gates/bridges (length / depth), Y for tall things (towers, clock tower). Base at y = 0 except 11 skinned files (villagers ×8, soldiers ×2: bounds read −1, measure after posing) and `house_cottage_2` (y_min 0.034 → lift 0).
- Textures: 221 × 1K, **5 × 2K** (`castle_keep_stone_1/2` keep stays 2K, `civic_hall_0/1`, `windmill_tower` → shrink to 1K in S1b).
- **Khronos glTF validator: 0 errors on all 226**; 10 warnings = `NODE_SKINNED_MESH_NON_ROOT` on the 8 villagers + 2 soldiers (harmless for three.js).
- 66 packs, 303 named nodes (listed in `lib_inv.json`): e.g. `trees_conifer` = cedar / cypress / spruce / pine; `traps_floor2` = caltrops / spiked_board / bear_trap; `traps_mech` = crossbow / spiked_log / spiked_ball / saw; `traps_blast` = net / firepit / landmine / powder_barrel; `lamps_*` = 6 lamps each.

## 1. Castle — game dimensions (code: `layout.js:9 WALL`, `a1_rings.js DIMS`, `castle.js tower()`)
| ring | wall H | wall T | tower R | tower height `h = H + 5.5` (+2 every 3rd) | gate half-opening |
|---|---|---|---|---|---|
| outer (Blue Wall) | 9.5 | 4.2 | 4.6 | 15 (17) | 7.5 |
| inner (keep ring) | 16 (A1 `INNER_H`) | 3.2 | 3.5 | 21.5 (23.5) | 4.5 |
| town | 8.2 | 3.8 | 3.9 | 13.7 (15.7) | 5.2 |

### Walls: the 9 tiers do NOT share proportions (height/length 0.54 … 0.78)
Rule: one **slot length L = H / 0.68** per ring (outer 14.0 m, inner 23.5 m, town 12.1 m), height scaled to the ring's H, thickness scaled freely to T (thickness is depth, cheap to stretch). The length stretch `f` below is the extra z-scale each tier needs so the half/half alternation meets with the same slot length; all tiers stay within **0.79 … 1.15**.
| tier | model size x(thick) · y(h) · z(len) | tris | h/len | z-stretch f | note |
|---|---|---|---|---|---|
| wood | 0.225 · 0.742 · 0.977 | 3432 | 0.76 | 1.12 | over 2k budget → slim in S1b |
| stone | 0.2 · 0.526 · 0.975 | 1999 | 0.54 | 0.79 |  |
| iron | 0.206 · 0.655 · 0.973 | 2358 | 0.67 | 0.99 | over 2k budget → slim in S1b |
| gold | 0.165 · 0.613 · 0.975 | 2000 | 0.63 | 0.92 |  |
| diamond_ice | 0.188 · 0.739 · 0.978 | 2000 | 0.76 | 1.11 |  |
| diamond_green | 0.133 · 0.708 · 0.978 | 2144 | 0.72 | 1.06 | over 2k budget → slim in S1b |
| diamond_red | 0.208 · 0.707 · 0.977 | 2000 | 0.72 | 1.06 |  |
| diamond_black | 0.125 · 0.764 · 0.976 | 1999 | 0.78 | 1.15 |  |
| diamond_blue | 0.263 · 0.694 · 0.977 | 1999 | 0.71 | 1.04 |  |
| stone_b | 0.177 · 0.647 · 0.979 | 2000 | 0.66 | 0.97 | alt stone (not in the 9) |
Yaw: **ry = −90°** in this file's convention (section 6): length axis Z → game's local X (`wallRun` rotates by `ry = atan2(-dz, dx)`), one face toward +Z. Seen: yes (both faces alike; which face is OUTER is decided in S3 from game frames).
Targets / destruct: **one game target per old wall segment stays** (`ctx.tgt` per segment, `w = len`); the Tripo pieces of that segment share its `aB` (so `noRoute` stays 667, ring hide/show in `a1_rings.js` keeps working). Pieces must be baked into the Batcher mesh, never `InstancedMesh`.

### Towers: proportions are the same in all 9 tiers (good) — pick the model by ring
| role | model | w/h | scale for height h | resulting width | goes to |
|---|---|---|---|---|---|
| medium | `castle_tower_medium_<tier>` | 0.58 | s = h / 0.98 | h 15 → 8.7 m (game 2R = 9.2) ✔ | **outer ring** (h 15), **town ring** (h 13.7 → 7.9 m, game 7.8 ✔) |
| tall | `castle_tower_tall_<tier>` | 0.32 | s = h / 0.98 | h 21.5 → 6.9 m (game 7.0 ✔) | **inner ring** (h 21.5) |
| short | `castle_tower_short_<tier>` | 0.80 | s = h / 0.98 | h 9 → 7.2 m | gate flanks, bridge heads, defensive watch posts |
Weapons on towers (`ctx.tgt … wk`, ballista/cannon/wizard…) stand on the tower TOP: top-of-tower height and platform position of every Tripo tower must be read in S3 (some tops are conical roofs = the game's own `roof(i)` towers).

### Gates / keep / bridges
| slot | key | model size (x · y · z) | rule | note |
|---|---|---|---|---|
| gatehouse ×3 | `castle_gate_<tier>` ×9 | 0.337 · 0.578 · 0.98 (h/len 0.59–0.61 in all tiers) | length = 2 × gate half-opening + flanks: outer 15 m opening → piece ≈ 26 m? decide in S3 by looking | yaw +90° |
| keep ×1 | `castle_keep_stone_1` (default) / `_2` | 0.733 · 0.772 · 0.98 / 0.813 · 0.862 · 0.981 | old keep footprint 25 × 17 m, body 14 m high (+ towers) → longest side 25 m: s = 25.5 → 18.7 × 19.7 × 25 m | 2K texture kept, 18k tris |
| bridge_moat | `bridge_moat` | 0.856 · 0.822 · 0.982 | length = the crossing (moat ≈ 18-24 m, river bridge = road width + banks); measure the crossing in S3 | yaw per crossing |
| bridge_stone_0 | `bridge_stone_0` | 0.379 · 0.339 · 0.981 | length = the crossing (moat ≈ 18-24 m, river bridge = road width + banks); measure the crossing in S3 | yaw per crossing |
| bridge_stone_1 | `bridge_stone_1` | 0.331 · 0.246 · 0.978 | length = the crossing (moat ≈ 18-24 m, river bridge = road width + banks); measure the crossing in S3 | yaw per crossing |
| water_gate | `water_gate` | 0.522 · 0.841 · 0.979 | length = the crossing (moat ≈ 18-24 m, river bridge = road width + banks); measure the crossing in S3 | yaw per crossing |

## 2. Houses and civic (old sizes from `kit_homes.glb` / `kit_civic.glb` measured; lots from `HOME_KINDS` / `CIVIC_KINDS`)
| slot | key | model size (x · y · z) | old body (x · y · z) / lot | target | scale s | result (x · y · z) | tris | seen |
|---|---|---|---|---|---|---|---|---|
| cottage | `house_cottage_0` | 0.823 · 0.725 · 0.981 | 4.7 · 3 · 6.3 (+roof) / 9×9 | z = 6.6 | 6.73 | 5.5 · 4.9 · 6.6 | 5000 | no |
| craftsman | `house_craftsman_0` | 0.767 · 0.978 · 0.854 | 6.7 · 6 · 7.1 / 9×10 | y = 9.0 | 9.20 | 7.1 · 9.0 · 7.9 | 6473 | no |
| merchant | `house_merchant_0` | 0.76 · 0.927 · 0.593 | 4.7 · 9 · 7.5 / 8×11 | y = 11.0 | 11.87 | 9.0 · 11.0 · 7.0 | 5000 | no |
| noble | `house_noble_0` | 0.406 · 0.721 · 0.979 | 11.2 · 6–11.7 · 10.8 / 12×12 | z = 11.0 | 11.24 | 4.6 · 8.1 · 11.0 | 5996 | no |
| generic house | `house_generic_a` | 0.961 · 0.741 · 0.686 | (kit_village modules, ≈ 8×8) | z = 8.0 | 11.66 | 11.2 · 8.6 · 8.0 | 3000 | no |
| chapel | `shrine_0` | 0.79 · 0.983 · 0.71 | 11.8 · 18.8 · 13 / 18×28 | y = 16.0 | 16.28 | 12.9 · 16.0 · 11.6 | 5998 | no |
| well | `well_stone` | 0.765 · 0.98 · 0.918 | 3.4 · 4.4 · 4 / 6×6 | y = 4.4 | 4.49 | 3.4 · 4.4 · 4.1 | 3994 | no |
| townhall | `civic_hall_0` | 0.978 · 0.734 · 0.658 | 7.4 · 8.7 · 8 / 28×22 | z = 16.0 | 24.32 | 23.8 · 17.8 · 16.0 | 3994 | no |
| market | `market_hall` | 0.977 · 0.287 · 0.395 | 12 · 6.5 · 8.8 / 32×32 | x = 16.0 | 16.38 | 16.0 · 4.7 · 6.5 | 10318 | no |
| tavern | `tavern_0` | 0.809 · 0.941 · 0.95 | 9.3 · 11 · 10.5 / 22×20 | y = 11.0 | 11.69 | 9.5 · 11.0 · 11.1 | 12514 | no |
(all other cottage/craftsman/merchant/noble variants `_0/_1/_2` use the same target as their family; checked on the sheet in S1b.)

## 3. Worksites, mines, mills (old pieces from `kit_ws` measured)
| slot | key | model size | old (x · y · z) | target | scale s | result | tris |
|---|---|---|---|---|---|---|---|
| lumber | `lumber_mill_1` | 0.973 · 0.498 · 0.952 | 13 · 16.1 · 11.4 | z = 12.0 | 12.61 | 12.3 · 6.3 · 12.0 | 5992 |
| sawmill | `lumber_mill_0` | 0.969 · 0.68 · 0.922 | (c2_sawshed) | z = 12.0 | 13.02 | 12.6 · 8.9 · 12.0 | 6623 |
| iron / mine | `iron_mine_0` | 0.979 · 0.518 · 0.91 | 12.5 · 8.9 · 15 | z = 15.0 | 16.48 | 16.1 · 8.5 · 15.0 | 5995 |
| farm barn | `barn_0` | 0.631 · 0.29 · 0.978 | 11.3 · 8.8 · 12 | z = 12.0 | 12.27 | 7.7 · 3.6 · 12.0 | 4998 |
| silo | `silo` | 0.863 · 0.979 · 0.713 | 3.6 · 9 · 3.5 | y = 9.0 | 9.19 | 7.9 · 9.0 · 6.6 | 4998 |
| coop | `coop_0` | 0.98 · 0.712 · 0.694 | 3.6 · 2.8 · 3.2 | x = 3.6 | 3.67 | 3.6 · 2.6 · 2.5 | 3998 |
| butcher | `butcher` | 0.881 · 0.771 · 0.975 | 5.5 · 2.9 · 3.2 (+hall) | z = 9.0 | 9.23 | 8.1 · 7.1 · 9.0 | 7985 |
| jetty | `jetty` | 0.973 · 0.342 · 0.282 | 11.9 · 5.3 · 18 | z = 18.0 | 63.83 | 62.1 · 21.8 · 18.0 | 6088 |
| watermill | `watermill` | 0.976 · 0.747 · 0.83 | 11.5 · 13.3 · 12.8 | z = 12.8 | 15.42 | 15.1 · 11.5 · 12.8 | 7995 |
| windmill | `windmill_asbad_1` | 0.355 · 0.52 · 0.977 | (c4_windmill ≈ 8 × 8) | z = 14.0 | 14.33 | 5.1 · 7.5 · 14.0 | 4954 |
| mint | `mint` | 0.893 · 0.828 · 0.96 | (c3_hall) | z = 12.0 | 12.50 | 11.2 · 10.3 · 12.0 | 7999 |

## 4. Defence (old traps ≈ 2–5 m, ballista tower `solid` 5.2 m, watchtower 5 m radius) · animals · people
| slot | key | model size | target | scale s | result |
|---|---|---|---|---|---|
| defensive ballista | `def_ballista` | 0.986 · 0.657 · 0.844 | z = 9.0 | 10.66 | 10.5 · 7.0 · 9.0 |
| NEW defence catapult | `def_catapult` | 0.975 · 0.649 · 0.732 | z = 9.0 | 12.30 | 12.0 · 8.0 · 9.0 |
| fire stone | `def_firepot` | 0.983 · 0.549 · 0.661 | z = 4.0 | 6.05 | 5.9 · 3.3 · 4.0 |
| horse (pasture) | `animal_horse_white` | 0.212 · 0.74 · 0.978 | z = 2.4 | 2.45 | 0.5 · 1.8 · 2.4 |
| cow | `animal_cow` | 0.501 · 0.583 · 0.979 | z = 2.2 | 2.25 | 1.1 · 1.3 · 2.2 |
| sheep | `animal_sheep` | 0.355 · 0.687 · 0.98 | z = 1.3 | 1.33 | 0.5 · 0.9 · 1.3 |
People: Tripo biped files are 2 units tall (skinned bounds unreliable) → **s = 1.7 / 2.0 = 0.85** for adults (child models smaller, measured after posing in S4d).

## 5. Not yet sized (needs the game's old nature/prop scale; S1b)
Trees (`trees_*` packs), rocks, bushes, ground cover, lamps, props, traps nodes: each pack node has its own base-centre pivot; target heights come from the old `trees.js`/`sc_rocks.js` scale and the game's lamp heights — next round.

## 6. S1b — facing of every directional model (looked at from 4 sides, 21 contact sheets `sheet_TR2_S1b_front_NN.png`)
**Convention (`tr2_swap.json`):** `ry` = degrees about +Y (three.js `rotation.y`) that brings the model's FRONT (door / arch / balcony / head) to +Z. front +X → `ry = −90`, front −Z → 180, front −X → +90, +Z or symmetric → 0. The loader applies it when it bakes a piece (`geo.rotateY`), so the GLB files stay untouched. **Important correction to the library note «facing +Z»: it is NOT true for buildings. 117 of the 166 directional models face +X, 27 face +Z (animals, people, 4 buildings), 2 face −Z, 21 are symmetric, 1 undecided (`jetty`).**

| front | models |
|---|---|
| **+X** (`ry −90`) | all 9 `castle_gate_*` (passage along X, both X faces have the arch) · all 10 `castle_wall_*` (length Z → X, two alike faces) · `castle_keep_stone_1/2` (**D7: `_2` at all levels**) · all 18 `castle_tower_{short,medium}_*` (door on +X) · `bridge_moat` (ramp on +X) · `water_gate` · houses: cottage 0-2, craftsman 0-2 (+`_alt`), merchant 0-2, noble 0-2, generic b / c / d · civic: armory_0, bakery, barn_0, brewhouse, butcher, camp_0/1, cannon_house_0/1, civic_hall_0/1, coop_0/1, granary_0/1, jeweller, mint, shrine_0, silo, smokehouse, stable_1, tavern_0/1, treasury_0/1, watermill, well_abanbar/qanat/stone · mines: coal_mine_0/1, 5 × dia_mine, gem_mine_turquoise, iron_mine_0/1/2, lumber_mill_0/1/2, oil_refinery_0/1, stone_quarry_0/1/2, windmill_asbad_1/2, windmill_tower (axle toward +X) · defence: ballista, catapult, firepot, oil, scorpion (aiming side to check in S6) |
| **+Z** (`ry 0`) | 12 animals (head toward +Z), 8 villagers (posed at walk t = 0.6 s), `armory_1`, `barn_1`, `market_hall`, `fishing_hut_1`, `fishing_hut_2` (the last four ambiguous: long faces) |
| **−Z** (`ry 180`) | `house_generic_a` (door on −Z), `stable_0` (open stalls on −Z) |
| **symmetric** (`ry 0`) | 9 × `castle_tower_tall_*` (small pyramid cap), `bridge_stone_0/1` (span along Z), `clock_tower`, `shrine_1`, `def_tesla`, 3 × `oil_well`, 2 × `farm_field`, 2 × `rice_paddy` |
| undecided | `jetty` (runs along Z; the shore end is decided in S4b) · `watermill` front +X but the WHEEL is on −Z: re-yaw by the water side in S4b |
`castle_tower_stone_1/2` are legacy round towers outside the 9 tiers (probably unused). Towers are NOT round: medium / short have a **square tapering body with a crenellated flat top** (the game's code towers are cylinders and cones) → `roof(i)` conical tops of the old towers disappear; war machines (`wk`) stand on the flat top.
Gate / keep / bridge numbers for S3 (with `ry`): gatehouse long side → X, passage → Z. **Keep `_2` (0.813 · 0.862 · 0.981)**: with `ry −90` its length 0.981 → X; at s = 25.5 it would be 25 × 22 high × 20.7 deep (old keep 25 × 17, body 14 m + towers): probably too tall → choose s from a game frame in S3 (≈ 20 → 19.6 × 17.2 × 16.3).

## 7. S1b — budget work (tools: `slim_uv.mjs` fixed + `texcheck.mjs`, in `tools_TR2_S1b.tar.gz`)
**Pitfall found (important for anyone re-using TR1's `slim_uv.mjs`):** the library files are already quantised + meshopt-compressed, and the TR1 version rewrites vertex attributes as Float32 from the raw integer arrays → **textured models come out grey and warped** (I rendered it, the 1K civic halls were destroyed). Fix: `dequantize()` right after reading, and skip simplify when the target ≥ the current triangle count (that also crashed). With the fix the results below are visually identical to the originals (rendered side by side at +X and +Z; sheets `sheet_TR2_S1b_cmp_*.png`).
| model | tris before → after | KB | note |
|---|---|---|---|
| `castle_wall_wood` | 3432 → 1996 | 255 | was stuck at 3.4k only because of the corruption bug |
| `castle_wall_iron` | 2358 → 2000 | 200 | |
| `castle_wall_diamond_green` | 2144 → 1996 | 241 | |
| `civic_hall_0` / `civic_hall_1` / `windmill_tower` | 3994 / 3996 / 3999 (unchanged) | 312 / 265 / 297 | **2K → 1K** texture (checked: 1024², webp) |
| `tavern_0` / `tavern_1` | 12 514 / 12 759 → 7708 / 7685 | 259 / 253 | now inside the 8k budget; the building itself stays lumpy (library note) |
| `market_hall` | 10 318 → 7794 | 273 | |
| `brewhouse` | 8808 → 7934 | 282 | |
| `fishing_hut_1` | 9201 → 7927 | 298 | |
`armory_0` (8.3k) is not slimmed: D5 default is `armory_1` (6.3k). The 11 files are in `ship_TR2_S1b.tar.gz` (`<cat>/<key>/<key>.glb` + `credit.json`, 2.9 MB); they replace the library copies when the game assets are built. **Not proven:** that the simplified meshes keep the destruct hook happy (S2) and the look at the game's camera / phone size (old-vs-new sheets are still to do).

## 8. Pack nodes — target sizes and yaw (S1c: all 169 nodes of the 36 non-weapon packs looked at — nature 1 view each, lamps/props/traps 2 views, wall-mount lamps + birds/fish/poultry 4 views + top view; sheets `sheet_TR2_S1c_*`)
Rule: the loader applies **`ry` first, then ONE uniform scale `k`** (`tr2_swap.json packs[pack/node]`). `dim h` = target HEIGHT in metres, `dim w` = target largest horizontal side. Nodes keep their own base-centre pivot (the node translation in the file is only a preview layout: reset it). Targets come from the OLD game objects (`old_sizes.json`, `trees.js` VARIANTS pine 13/17/21 m, broadleaf 13–16 m, bush 3.2/3.6 m; `sc_rocks.js`: rocks are scaled by their radius `s` in `rockGroup`, so rocks use `k = 2s / max(x,z)` per placement and the table is the nominal size; `ws_rockA/B` mountains 11 m high) and from the game's lamp heights (`cv_lamp` 4.4 m street lamp, wall sconce at 0.55·wall H).
**What the old-vs-new sheets show** (`sheet_TR2_oldnew_close.png`, `sheet_TR2_oldnew_phone_7px_per_m.png`; kit p45 vs library at the same scale, game camera FOV 63 portrait, 16° above the horizon = the game's near-zoom tilt; phone sheet is rendered at 7.7 px per metre = camera distance 90 m on an 844 px high phone): trees, boulders, lamps, props, traps and work props are within ±20 % of the old object at every group; the new objects are not smaller or bigger as a group. **At the closest zoom (min distance 90 m) a 4.4 m street lamp is ≈ 34 px high, a 1 m prop ≈ 8 px, a 0.4 m oil lamp ≈ 3 px; at the opening zoom (462 m) all of them are 1–6 px**: everything below ≈ 1 m (oil lamps, hand lamps, candles, sacks, flowers) only reads inside a building panel / close-up, not on the map.
**Fronts found by looking (4 sides / top view):** wall-mount lamps (`lamp_glass_jar`, `lamp_dome_brass`, `lamp_mosque_hanging`, `torch_wall`, `lantern_watchtower`, `lamp_gate_hanging`, `lamp_wall_bracket`) have their wall plate on one side at an angle between −145° and +24° — `ry` brings the lamp to +Z and the plate to −Z (checked on the top view after `ry`, `sheet_TR2_S1c_wallmount_top_after_ry.png`; residual tilt ≤ 15°). `lamp_street_arm` and `props_street/lantern`: arm toward −Z in the file → ry 180. Market stalls, tent, training dummy, chest, net trap, crossbow, saw, the 3 birds: front +X (ry −90). Rooster, chick, handcart: front −Z (ry 180). Fish: head +Z. Wagon, mine cart, winch, pipes, pump: no clear front (axis noted per row).
**Budgets:** 32 of 169 nodes are above the prompt's budget class: **all 20 trees** (≈ 2.0 k tris, `cedar` 2.6 k, `willow` 3.4 k; budget 1.5 k), `bushes/rose` 2.2 k, 4 construction props 3.4–3.5 k, 3 mining props 3.5 k, 5 traps 3.3–3.5 k (budget 3 k). Not slimmed now: trees are placed as instances (trees.js caps real trees at 55 near the camera → ≈ 110 k tris ≈ +3 % of the 3.46 M baseline; the far forest is baked impostors) — decided by measurement in S4c; if the +5 % rule is exceeded the trees go to 1.5 k with `slim_uv.mjs`. Flowers, crops, ground cover, desert plants (1.1–2.4 k) and the 2 cliffs (3.5 k) have no budget class in the prompt (instanced clumps / mountains).
**Textures:** every pack = ONE 1K WebP shared by its nodes (36 packs, 9.9 MB on disk). 15 nature packs + 8 lamp packs would be 23 × 5.3 MB = 122 MB on the GPU at 1K → **S2 decision: nature and lamp packs are re-encoded at 512 (1.4 MB each = 32 MB), props/traps/stalls stay 1K and are loaded only when the kind is on the map.**
**Quality notes (honest):** `flowers/daisy`, `flowers/poppy` have flat paper-like petals (usable, not pretty); all broadleaf/orchard trees are stylised blobs (consistent among themselves, different from the old EZ-Tree photographic leaf cards); `maple_autumn`, `fir_snow`, `apple` have the season baked in (use only in the matching season / garden); nodes of flowers and ground cover carry a small soil mound, so they sit on terrain without a skirt; **no hedgehog and no watchtower yet (TR1 buys #10, #11).**

### animals/birds
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| dove | 2999 | w 1.1 | 1.1 · 1.1 · 0.66 | -90 | bird (flight pose, wingspan; faces +X); x1.5 of real for readability |
| crow | 3000 | w 1.2 | 1.2 · 1.0 · 0.73 | -90 | bird (flight pose) |
| eagle | 2998 | w 2.0 | 2.0 · 1.76 · 1.19 | -90 | bird (flight pose) |

### animals/poultry_fish_pack
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| fish_small | 956 | w 0.5 | 0.1 · 0.19 · 0.5 | 0 | fish, head +Z; x1.5 of real |
| chick | 1784 | h 0.35 | 0.26 · 0.35 · 0.3 | 180 | chick, faces -Z in the file -> ry 180; x2 of real |
| trout | 2364 | w 0.9 | 0.17 · 0.35 · 0.9 | 0 | fish, head +Z |
| rooster | 2498 | h 0.95 | 0.43 · 0.95 · 0.85 | 180 | rooster, faces -Z in the file -> ry 180; x2 of real |
| carp | 2412 | w 1.1 | 0.37 · 0.61 · 1.1 | 0 | fish, head +Z |
| hen | 2498 | h 0.8 | 0.43 · 0.8 · 0.73 | 0 | hen, faces +Z; x2 of real |

### nature/bushes
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| rose | 2219 ⚠ | h 1.8 | 1.67 · 1.8 · 1.88 | 0 | bush |
| boxwood | 1200 | h 1.6 | 1.86 · 1.6 · 1.78 | 0 | bush |
| thorny | 1450 | h 2.6 | 2.68 · 2.6 · 2.67 | 0 | bush |
| round | 1200 | h 3.2 | 3.29 · 3.2 · 3.31 | 0 | bush |

### nature/cliffs
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| spire | 3498 | h 14 | 7.49 · 14.0 · 6.66 | 0 | rock spire |
| cliff | 3500 | h 12 | 9.91 · 12.0 · 10.42 | 0 | mountain wall (ws_rockA/B 10.6-11.3 m high, 13-14 m wide) |

### nature/crops
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| pumpkins | 1470 | w 1.5 | 1.5 · 1.09 · 1.38 | 0 | crop clump |
| wheat_sheaf | 2014 | h 1.5 | 1.12 · 1.5 · 1.12 | 0 | crop clump |
| hay_bale | 1149 | w 1.7 | 1.59 · 1.44 · 1.7 | 0 | crop clump |
| cabbage | 1498 | w 1.1 | 0.83 · 0.75 · 1.1 | 0 | crop clump |
| corn | 1476 | h 2.4 | 1.64 · 2.4 · 2.46 | 0 | crop clump |
| carrots | 1495 | h 0.8 | 0.82 · 0.8 · 1.03 | 0 | crop clump |

### nature/flowers
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lavender | 1882 | h 0.8 | 0.72 · 0.8 · 0.75 | 0 | flower clump (daisy/poppy: stylised, paper-like petals) |
| crocus | 1200 | h 0.45 | 0.4 · 0.45 · 0.47 | 0 | flower clump (daisy/poppy: stylised, paper-like petals) |
| tulip | 1200 | h 0.8 | 0.65 · 0.8 · 0.74 | 0 | flower clump (daisy/poppy: stylised, paper-like petals) |
| daisy | 2032 | h 0.7 | 0.7 · 0.7 · 0.7 | 0 | flower clump (daisy/poppy: stylised, paper-like petals) |
| poppy | 1200 | h 0.8 | 0.71 · 0.8 · 0.8 | 0 | flower clump (daisy/poppy: stylised, paper-like petals) |
| narcissus | 1076 | h 0.8 | 0.59 · 0.8 · 0.64 | 0 | flower clump (daisy/poppy: stylised, paper-like petals) |

### nature/ground_cover
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| mushroom_brown | 886 | h 0.55 | 0.57 · 0.55 · 0.62 | 0 | ground cover |
| reed | 1793 | h 2.2 | 2.32 · 2.2 · 1.74 | 0 | ground cover |
| clover | 1797 | h 0.4 | 0.53 · 0.4 · 0.6 | 0 | ground cover |
| grass_tall | 2391 | h 1.1 | 1.36 · 1.1 · 1.27 | 0 | ground cover |
| fern | 1795 | h 0.9 | 1.04 · 0.9 · 1.08 | 0 | ground cover |
| mushroom_red | 1626 | h 0.65 | 0.61 · 0.65 · 0.59 | 0 | ground cover |

### nature/plants_desert
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| grass_dry | 1198 | h 1.0 | 0.85 · 1.0 · 0.79 | 0 | desert plant |
| camelthorn | 1658 | h 1.1 | 0.5 · 1.1 · 1.08 | 0 | desert plant |
| agave | 1200 | h 1.3 | 1.61 · 1.3 · 1.47 | 0 | desert plant |
| cactus_barrel | 1450 | h 0.8 | 0.8 · 0.8 · 0.81 | 0 | desert plant |

### nature/rocks_boulder
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| slab | 1500 | w 3.4 | 2.95 · 2.87 · 3.4 | 0 | rock/boulder (ws_boulderA 4 m) |
| slate | 1500 | w 3.6 | 3.6 · 3.35 · 3.05 | 0 | rock/boulder (ws_boulderA 4 m) |
| mossy | 1500 | w 3.6 | 3.44 · 3.42 · 3.6 | 0 | rock/boulder (ws_boulderA 4 m) |
| granite | 1500 | w 3.8 | 3.8 · 3.93 · 3.63 | 0 | rock/boulder (ws_boulderA 4 m) |

### nature/rocks_ore
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| crystal_blue | 1500 | w 3.2 | 3.2 · 4.07 · 3.08 | 0 | rock/ore heap at mines |
| gold | 1500 | w 3.4 | 3.4 · 3.51 · 2.99 | 0 | rock/ore heap at mines |
| iron | 1500 | w 3.4 | 3.4 · 2.75 · 2.72 | 0 | rock/ore heap at mines |
| coal | 1500 | w 3.4 | 3.4 · 2.95 · 3.31 | 0 | rock/ore heap at mines |

### nature/rocks_sandstone
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| limestone | 1500 | w 5.0 | 5.0 · 5.54 · 4.22 | 0 | rock/desert |
| pillar | 1500 | h 8.0 | 3.4 · 8.0 · 3.47 | 0 | rock/desert; width 9 m would be too wide: pillar sized by HEIGHT 8 m |
| layered | 1500 | w 5.0 | 4.29 · 4.66 · 5.0 | 0 | rock/desert |
| red | 1500 | w 5.0 | 5.0 · 5.6 · 3.84 | 0 | rock/desert |

### nature/rocks_small
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| flat | 1000 | w 1.8 | 1.8 · 0.45 · 1.74 | 0 | rock/small scatter |
| speckled | 1000 | w 1.3 | 1.3 · 0.9 · 1.29 | 0 | rock/small scatter |
| angular | 1000 | w 1.3 | 1.3 · 1.01 · 1.17 | 0 | rock/small scatter |
| mossy | 998 | w 1.4 | 1.4 · 0.87 · 1.24 | 0 | rock/small scatter |
| round | 1000 | w 1.3 | 1.3 · 0.95 · 1.23 | 0 | rock/small scatter |
| split | 1000 | w 1.4 | 1.4 · 0.91 · 1.2 | 0 | rock/small scatter |

### nature/trees_broadleaf
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| poplar | 2000 ⚠ | h 18 | 4.55 · 18.0 · 4.69 | 0 | tree/broad group |
| walnut | 2000 ⚠ | h 12 | 13.93 · 12.0 · 13.55 | 0 | tree/broad group |
| plane | 1998 ⚠ | h 16 | 20.3 · 16.0 · 19.3 | 0 | tree/broad group |
| oak | 1992 ⚠ | h 14 | 16.14 · 14.0 · 14.95 | 0 | tree/broad group |

### nature/trees_conifer
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| cedar | 2588 ⚠ | h 18 | 14.43 · 18.0 · 13.79 | 0 | tree/pine group |
| cypress | 542 | h 16 | 2.65 · 16.0 · 2.68 | 0 | tree/pine group; very slim |
| spruce | 2000 ⚠ | h 17 | 10.33 · 17.0 · 9.82 | 0 | tree/pine group |
| pine | 1997 ⚠ | h 19 | 8.49 · 19.0 · 9.2 | 0 | tree/pine group; thin crown on a tall trunk |

### nature/trees_orchard
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| olive | 2000 ⚠ | h 8 | 7.02 · 8.0 · 7.7 | 0 | tree/garden-desert |
| pomegranate | 2000 ⚠ | h 5 | 3.84 · 5.0 · 4.15 | 0 | tree/garden-desert |
| date_palm_young | 1998 ⚠ | h 6 | 2.33 · 6.0 · 6.16 | 0 | tree/garden-desert |
| date_palm | 1986 ⚠ | h 14 | 2.62 · 14.0 · 9.25 | 0 | tree/garden-desert |

### nature/trees_season
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| apple | 1998 ⚠ | h 8 | 6.89 · 8.0 · 6.4 | 0 | tree/garden |
| fir_snow | 2000 ⚠ | h 17 | 11.38 · 17.0 · 10.72 | 0 | tree/winter pine (already snowy: winter only) |
| dead_tree | 2000 ⚠ | h 11 | 5.08 · 11.0 · 8.43 | 0 | tree/dead (bare winter, ruins) |
| maple_autumn | 2000 ⚠ | h 13 | 9.86 · 13.0 · 9.53 | 0 | tree/autumn (already red: autumn only) |

### nature/trees_special
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| birch | 2000 ⚠ | h 14 | 6.89 · 14.0 · 7.26 | 0 | tree/special (river = willow) |
| almond | 1994 ⚠ | h 8 | 6.28 · 8.0 · 5.61 | 0 | tree/special (river = willow) |
| tamarisk | 2000 ⚠ | h 9 | 6.79 · 9.0 · 7.09 | 0 | tree/special (river = willow) |
| willow | 3374 ⚠ | h 13 | 8.66 · 13.0 · 8.79 | 0 | tree/special (river = willow) |

### props/construction_pack
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| materials_pile | 3358 ⚠ | w 4.5 | 4.5 · 2.64 · 3.67 | 0 | construction: pile (old ws_stoneblocks 3.6 m) |
| scaffold | 3473 ⚠ | h 5.5 | 3.25 · 5.5 · 3.29 | 0 | construction: scaffold (old ws_scaffold 4.9 h x 8) |
| wall_half | 3499 ⚠ | w 7.5 | 5.57 · 7.65 · 7.5 | 0 | construction stage C (old ws_stageC 8 x 6.8 x 7.8); ladder on one side, no front |
| foundation_scaffold | 3499 ⚠ | w 6.5 | 6.24 · 7.0 · 6.5 | 0 | construction stage A/B (old ws_stageA 6 x 1.6, stageB 6.3 x 3.9) |

### props/lamps_candles
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| candle_lantern_box | 2500 | h 0.7 | 0.35 · 0.7 · 0.3 | 0 | candle lantern |
| candlestick_iron | 1364 | h 1.0 | 0.3 · 1.0 · 0.28 | 0 | candlestick |
| chandelier_crown | 2498 | h 1.6 | 1.59 · 1.6 · 1.23 | 0 | crown chandelier (hall) |
| candelabra_floor | 2500 | h 1.8 | 0.43 · 1.8 · 0.65 | 0 | floor candelabra |
| candelabra_table | 2064 | h 0.5 | 0.18 · 0.5 · 0.33 | 0 | table candelabra; tiny |
| candle_pillar | 1836 | h 0.9 | 0.28 · 0.9 · 0.28 | 0 | pillar candle |

### props/lamps_fantasy
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lamp_glass_jar | 2497 | h 1.2 | 0.61 · 1.2 · 0.62 | 325 | bracket jar lamp; WALL-MOUNT: plate at -145 deg (up-left) in the file |
| lamp_rune_stone | 2499 | h 1.6 | 0.52 · 1.6 · 0.52 | 0 | rune stone lamp |
| lamp_gem_ruby | 2500 | h 1.5 | 0.52 · 1.5 · 0.5 | 0 | ruby lamp |
| lamp_ice_crystal | 1964 | h 1.5 | 0.3 · 1.5 · 0.36 | 0 | ice crystal lamp |
| lamp_skull | 2500 | h 2.2 | 1.2 · 2.2 · 1.2 | 225 | skull lamp on a post; free-standing, skull toward (+X,-Z) in the file |
| lamp_staff_crystal | 2418 | h 2.5 | 0.46 · 2.5 · 0.46 | 0 | crystal staff lamp |

### props/lamps_hand
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lamp_hand_storm | 2479 | h 0.55 | 0.19 · 0.55 · 0.22 | 0 | hand lantern; carried / hook |
| lamp_hand_horn | 2414 | h 0.55 | 0.23 · 0.55 · 0.22 | 0 | hand lantern |
| lamp_hand_oil | 1784 | h 0.5 | 0.17 · 0.5 · 0.18 | 0 | hand lantern |
| lamp_hand_cloth | 2434 | h 0.5 | 0.31 · 0.5 · 0.31 | 0 | paper lantern |
| lamp_hand_cage | 2500 | h 0.55 | 0.24 · 0.55 · 0.24 | 0 | hand lantern |
| lamp_hand_persian | 2497 | h 0.55 | 0.2 · 0.55 · 0.17 | 0 | hand lantern |

### props/lamps_house_oil
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lamp_oil_stone | 2500 | h 0.5 | 0.3 · 0.5 · 0.44 | 0 | oil lamp (indoor / door step); tiny: invisible at the game camera, building panel only |
| lamp_oil_genie | 2500 | h 0.45 | 0.32 · 0.45 · 0.57 | 0 | oil lamp; tiny |
| lamp_oil_pedestal | 2500 | h 0.9 | 0.29 · 0.9 · 0.29 | 0 | oil lamp pedestal |
| lamp_oil_multiwick | 2500 | h 0.55 | 0.45 · 0.55 · 0.43 | 0 | oil lamp; tiny |
| lamp_oil_chiragh | 2500 | h 0.45 | 0.21 · 0.45 · 0.37 | 0 | oil lamp; tiny |
| lamp_oil_clay | 2052 | h 0.35 | 0.41 · 0.35 · 0.54 | 0 | oil lamp; tiny |

### props/lamps_persian_shrine
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lamp_dome_brass | 2482 | h 1.1 | 0.53 · 1.1 · 0.62 | 264 | bracket dome lamp (shrine / chapel); WALL-MOUNT: plate on -X (-84 deg) in the file |
| lamp_golden_temple | 2500 | h 1.8 | 0.45 · 1.8 · 0.51 | 0 | temple lamp stand |
| atashdan | 2500 | h 1.7 | 0.85 · 1.7 · 1.15 | 0 | fire altar (shrine); open fire bowl |
| lamp_tile_holder | 2499 | h 1.4 | 0.36 · 1.4 · 0.4 | 0 | tiled lamp stand |
| lamp_mosque_hanging | 2126 | h 1.3 | 0.75 · 1.3 · 0.69 | 156 | bracket hanging lamp; WALL-MOUNT: bar along X, wall on +Z (+24 deg) |
| lamp_star_bronze | 2432 | h 0.9 | 0.54 · 0.9 · 0.58 | 0 | hanging star lamp |

### props/lamps_torches_braziers
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| torch_pole | 2500 | h 3.2 | 0.63 · 3.2 · 0.64 | 0 | torch on a pole |
| fire_basket_pole | 2500 | h 3.4 | 0.89 · 3.4 · 0.86 | 0 | fire basket on a pole |
| fire_bowl_stone | 2500 | h 1.5 | 1.0 · 1.5 · 0.99 | 0 | stone fire bowl |
| brazier_tripod | 2499 | h 1.7 | 1.01 · 1.7 · 1.03 | 0 | tripod brazier |
| torch_wall | 2160 | h 1.1 | 0.85 · 1.1 · 0.86 | 229 | wall sconce torch (old ctx.torch sconce); WALL-MOUNT: plate toward +Z-ish (-49 deg) in the file; ry puts the torch on +Z |
| torch_hand | 1634 | h 0.9 | 0.15 · 0.9 · 0.15 | 0 | hand torch (villager / wall hook) |

### props/lamps_tower_gate
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| chandelier_hall | 2500 | h 2.0 | 1.47 · 2.0 · 1.43 | 0 | hanging chandelier (hall / gate house) |
| beacon_cauldron | 2500 | h 2.0 | 1.41 · 2.0 · 1.47 | 0 | beacon cauldron on a block (tower top / gate) |
| lantern_watchtower | 2500 | h 1.5 | 1.06 · 1.5 · 1.04 | 210 | bracket lantern for towers; WALL-MOUNT, plate on +Z (-30 deg) in the file |
| lantern_signal | 2492 | h 1.1 | 0.66 · 1.1 · 0.6 | 0 | signal lantern |
| beacon_basket_pole | 2294 | h 3.4 | 1.43 · 3.4 · 1.43 | 0 | beacon basket on a pole (tower top) |

### props/lamps_wall_street
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lamp_pedestal_small | 2499 | h 1.8 | 0.46 · 1.8 · 0.45 | 0 | pedestal lamp (door / steps) |
| lamp_gate_hanging | 2500 | h 1.6 | 0.78 · 1.6 · 0.87 | 197 | bracket lamp under a gate arch / wall; WALL-MOUNT: plate on +Z in the file; ry brings the lamp side to +Z (plate to -Z = the wall) |
| lamp_stone_pillar | 2500 | h 3.0 | 0.94 · 3.0 · 0.92 | 0 | stone pillar lamp (shrine / garden) |
| lamp_post | 2196 | h 4.4 | 0.76 · 4.4 · 0.74 | 0 | street post (= old cv_lamp 4.4 m) |
| lamp_street_arm | 2500 | h 5.0 | 1.07 · 5.0 · 1.81 | 180 | street post with arm; arm + lantern toward -Z in the file -> ry 180: arm toward +Z |
| lamp_wall_bracket | 2500 | h 1.2 | 0.35 · 1.2 · 0.54 | 180 | wall bracket lantern; WALL-MOUNT, plate on +Z in the file |

### props/market_stalls
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| stall_spice | 2996 | h 3.6 | 3.24 · 3.6 · 3.17 | -90 | market stall (old cv_stall 2.7 x 3.9 x 1.4); counter + awning face +X |
| stall_pottery | 2997 | h 3.6 | 2.72 · 3.6 · 2.84 | -90 | market stall; front +X |
| stall_cloth | 2999 | h 3.6 | 3.32 · 3.6 · 2.58 | -90 | market stall; front +X |
| stall_produce | 2994 | h 3.6 | 3.49 · 3.6 · 2.93 | -90 | market stall; front +X |

### props/oil_pipes_pack
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| pump_station | 1999 | w 5.0 | 3.47 · 4.85 · 5.0 | 0 | oil pump station (old c3_pump 7 x 8 x 7.5); flywheel faces +Z / -Z |
| valve_t | 2000 | w 1.8 | 1.25 · 1.75 · 1.8 | 0 | pipe valve T; branch/opening direction free |
| elbow | 1998 | h 1.4 | 0.78 · 1.4 · 0.97 | 0 | pipe elbow; opening toward +Z |
| straight | 2000 | w 3.0 | 1.84 · 1.6 · 3.0 | 0 | straight pipe; axis Z |

### props/oil_tanks_pack
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| tank_wood | 2500 | h 6.0 | 3.59 · 6.0 · 3.18 | 0 | oil tank (old c3_watertower 8.6 m) |
| tank_copper | 2488 | h 5.5 | 3.75 · 5.5 · 3.37 | 0 | oil tank |
| tank_brick | 2500 | h 5.5 | 4.12 · 5.5 · 3.88 | 0 | oil tank, ladder on +X |

### props/props_camp
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| tent | 2998 | w 4.2 | 2.7 · 3.02 · 4.2 | -90 | camp tent (entrance triangle faces +X); front +X |
| dummy | 3000 | h 2.2 | 1.25 · 2.2 · 0.82 | -90 | training dummy (arms spread along Z, faces +X) |
| cooking_pot | 3000 | h 1.5 | 0.98 · 1.5 · 0.95 | 0 | cooking pot on a tripod |
| anvil | 2997 | h 1.0 | 0.77 · 1.0 · 0.67 | 0 | anvil on a block (old c3_anvil 0.95 m); horn direction free |

### props/props_mining
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| winch | 3500 ⚠ | h 3.2 | 2.47 · 3.2 · 2.7 | 0 | mine winch; wheel face on +Z / -Z |
| sack | 2536 | h 0.8 | 0.68 · 0.8 · 0.75 | 0 | ore sack (old ws_sack 0.4 x 0.7 x 1) |
| sacks_pair | 3500 ⚠ | h 0.95 | 0.81 · 0.95 · 1.38 | 0 | two ore sacks (same scale as sack) |
| ingots | 2328 | w 1.3 | 1.3 · 0.67 · 1.21 | 0 | ingot stack (old c3_goldbars 1.3 m) |
| cart | 3500 ⚠ | w 2.6 | 2.26 · 2.11 · 2.6 | 0 | mine cart; long side along X (wheels visible from +Z); rails direction decided in S4b |

### props/props_street
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| lantern | 1564 | h 3.4 | 0.8 · 3.4 · 1.54 | 180 | small street lamp with arm; arm toward -Z in the file -> ry 180 |
| trough | 2500 | w 2.6 | 2.6 · 1.49 · 1.89 | 0 | stone water trough; open long side +Z |
| flag | 1254 | h 2.8 | 1.98 · 2.8 · 0.61 | 0 | flag on a pole (old p_flag 2.6 m); cloth face on +Z |
| table_stool | 2500 | w 3.2 | 3.2 · 1.44 · 2.7 | 0 | table with stools (old cv_tableset 4.3 m) |
| signpost | 1424 | h 2.4 | 1.21 · 2.4 · 0.79 | 0 | signpost |
| bench | 1966 | w 2.6 | 2.6 · 1.46 · 1.6 | 0 | bench (old cv_bench 4.2 m); sits facing +Z, backrest on -Z |

### props/props_town
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| sacks | 3000 | w 1.6 | 1.6 · 1.06 · 1.39 | 0 | sack cluster |
| chest | 2786 | w 1.4 | 1.4 · 1.33 · 1.14 | -90 | treasure chest (old cv_chest 1.6 m); front +X |
| crates | 2920 | w 2.4 | 2.4 · 1.71 · 2.32 | 0 | crate stack (old p_crates 1.9 m) |
| wagon | 3000 | w 4.2 | 4.2 · 2.49 · 3.23 | 0 | wagon (old c4_cart1 4.8 m); length axis X; front not clear |
| handcart | 1850 | w 2.0 | 1.27 · 0.78 · 2.0 | 180 | handcart (old p_barrow 1.5 m); wheel toward -Z in the file -> ry 180 (wheel toward +Z) |
| barrels | 2146 | w 2.2 | 2.1 · 1.81 · 2.2 | 0 | barrel cluster (old p_barrel 0.9 m each) |

### traps/traps_blast
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| net | 2611 | w 4.2 | 4.2 · 5.22 · 1.76 | -90 | net trap between two posts; net plane faces +X |
| firepit | 3499 ⚠ | w 3.6 | 3.6 · 1.51 · 3.43 | 0 | fire pit trap (old df_firestone 3.6); NO fire in the model: game adds it |
| landmine | 3500 ⚠ | w 2.4 | 2.34 · 1.31 · 2.4 | 0 | landmine (old df_mine 2.2) |
| powder_barrel | 1898 | h 2.4 | 1.41 · 2.4 · 1.42 | 0 | powder barrel (old df_keg 2.4 h) |

### traps/traps_floor2
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| caltrops | 3000 | w 2.6 | 2.6 · 1.07 · 2.4 | 0 | caltrops |
| spiked_board | 3000 | w 3.0 | 2.82 · 1.27 · 3.0 | 0 | spiked board (old df_bear2 3.2) |
| bear_trap | 3000 | w 2.4 | 2.37 · 1.02 · 2.4 | 0 | bear trap (old df_bear 2.4) |

### traps/traps_mech
| node | tris | dim · target m | size after k (x · y · z m) | ry | role / note |
|---|---|---|---|---|---|
| crossbow | 2338 | w 4.2 | 4.2 · 2.53 · 4.09 | -90 | crossbow trap (old df_crossbow 3.9); aims +X |
| spiked_log | 3499 ⚠ | w 4.0 | 1.76 · 3.41 · 4.0 | 0 | swinging spiked log (old df_swing 4.6); frame spans Z, swings along X |
| spiked_ball | 3499 ⚠ | h 3.4 | 3.0 · 3.4 · 1.86 | 0 | swinging spiked ball (old df_spikeball 3.2 h) |
| saw | 3314 ⚠ | h 2.8 | 1.87 · 2.8 · 0.75 | -90 | saw trap, blade plane faces +X |

## 9. S2 — the loader, the shared material and the TEXTURE-SIZE rule (new; numbers measured in `dev/tr2_s2/`, software GL — not a phone)
**Code:** `client/src/tr2lib.js` (loader + `parts` / `bake` / `instances` / lazy tiers), `client/src/tiers.js` (9-tier table + legacy 6-tier steps), slim table `web/assets/tr2/swap.json` (`ry` per model, pack node `k`).
`tr2.parts('castle_wall_stone', { w: 14 })` → geometry already turned by `ry` and scaled (`h` = height m, `w` = largest horizontal side m, `k` = factor; pack nodes `'trees_conifer/pine'` default to the `k` of §8). `tr2.bake(B, spec, matrix, { bid })` is the Batcher path for everything destructible; `tr2.instances(parent, spec, matrices)` for trees / rocks / lamps / props (never destructible).
**One material configuration** for every Tripo model: `MeshStandardMaterial { map, roughness 0.9, metalness 0, vertexColors true, envMapIntensity 0.35 }` (= the plaster / wood material parameters of the game) — what differs between two models is only a texture uniform.
**Measured (fresh renderer, shadows on, destruct-patched like `world.js` does for every static material):**
| scene | programs | GPU textures | draw calls |
|---|---|---|---|
| A. one patched plain static material (what the game has) | 3 | 5 | 3 |
| B. A + 1 Tripo model (batched) | 3 | 6 | 5 |
| C. A + 12 different Tripo models (12 textures) | **3** | 17 | 27 |
| D. C without the destruct patch (nothing patched) | 4 | 17 | 27 |
| E. C + one InstancedMesh group of Tripo pieces, casting shadows | 5 | 17 | 29 |
| F. E without shadow casting (far props) | 4 | 17 | 28 |
→ **batched Tripo = +0 programs, however many models/textures; the instanced path costs +1 program (+1 more if it casts shadows), total, not per model.** In the real game `p39_progs.py` numbers are in `report_TR2_S2.md`.
**Texture size (the first-class budget).** GPU estimate per texture (RGBA8 + mips): **1K = 5.33 MB · 512 = 1.33 MB · 256 = 0.33 MB.** At the game's closest zoom (≈ 7.7 px/m on an 844 px phone; 15 px/m if the phone renders at pixel ratio 2) a 14 m wall piece is 108 / 216 px wide, so a 1K texture is 5–9× more detail than the screen can show. Looked at (`sheet_TR2_S2_texsize_phone_7px_per_m.png`, `…_15px_per_m.png`: wall, tower, gate, cottage, civic hall at 1K / 512 / 256): **512 is indistinguishable from 1K at 7.7 px/m and still clean at 15 px/m; 256 only softens the big landmark facades (hall) at 15 px/m.**
**Rule proposed (the mother / owner may change the numbers by number):** textures shipped at **512** for castle, houses, civic, production, defence, traps, bridges, animals, people · **1K** only for the keep, the civic hall and the market hall (landmarks) · **256** for nature packs, lamps and small props (they are far/small). Tool: `tools/tr2_retex.mjs IN.glb OUT.glb 512` (geometry untouched, WebP, meshopt) — applied at ship time, S3/S4 ship only the models the game uses. Effect on the castle (5 model kinds × 2 tiers while half/half): 53 MB → **13 MB** resident; file sizes ≈ half (155 KB vs 300 KB per house).
**Lazy tiers** (`tr2.ensureLevel(level, kinds)` → load → rebuild → `tr2.drop(r.drop)`): at any level 1..50 at most **2 tiers (10 textures)** are resident, 1 tier (5) at the pure levels; `sheet_TR2_S2_tiers_cap50.png` = levels 1 / 7 / 13 / 19 / 26 / 29 (half) / 32 / 38 / 44 / 50.
