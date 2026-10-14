# TR2_swap — library key → game slot → scale / yaw / offset / budget (S1, v0)
TR2 · 14 Oct 2026 · numbers computed from `lib_inv.json` (every GLB measured with gltf-transform) and from the game code/kit measurements (`old_sizes.json`). **Status: v0 = scale RULES from numbers; yaw/front per model still to be confirmed by looking (S1b) — column «seen» = no.**

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
Yaw: **+90°** (length axis Z → game's local X; `wallRun` rotates by `ry = atan2(-dz, dx)`). Seen: no.
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
