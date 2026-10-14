# TR2_map — every place the game builds/loads a NON-ARMY model → Tripo library key(s)
TR2 S0 · 14 Oct 2026 · kit p45 (installed on the owner's server) · tree: `bluewall/client/src` (line numbers = p45 kit, from a read-only code survey; counts marked ≈ are from code, not measured at runtime)
Status: ✅ library has a model · ⚠️ model exists but needs work (budget / one-per-kind / extra pieces) · ❌ no model (see `TR2_gaps.md`) · ⏸ stays as is (not a model / not in scope)

## خلاصه برای وینگلس
هر جایی که بازی یه مدل غیر-لشگر می‌سازه اینجا هست: «الان از کجا میاد ← کدوم مدل Tripo ← وضعیت». ✅ = مدل داریم · ⚠️ = داریم ولی باید کار بشه (سنگین/یه‌دونه برای هر نوع) · ❌ = مدل نداریم (می‌ره تو `TR2_gaps.md` برای چت مدل‌ساز).

## A. Castle (all procedural today: `castle.js`, Batcher merge per material, `aB` target ids)
| slot | today | library key(s) | status |
|---|---|---|---|
| wall piece (3 rings, `wallRun` castle.js:25-83; ≈10 / ≈7 / ≈16 pieces per ring) | box/merlon code + skin shader | `castle_wall_<tier>` ×9 (+ `castle_wall_stone_b` alt) | ⚠️ wood 3.4k / iron 2.4k / diamond_green 2.1k tris over the 2k budget → S1 slim |
| towers (≈27, castle.js:119-179, rings with 9/6/12 vertices) | cylinder/cone code | `castle_tower_{short,medium,tall}_<tier>` ×9 | ✅ role split: short = wall joints, medium = gate flank / corners, tall = keep-side + watch posts (final rule in S3) |
| main gatehouse (×1, :288-355) | code | `castle_gate_<tier>` ×9 | ✅ |
| town gates (×2, :182-223) | code | `castle_gate_<tier>` + `bridge_moat` (drawbridge between two towers) | ✅ |
| keep (×1, :364-420) | code | `castle_keep_stone_1` (default), `_2` alt; 2K texture allowed for the keep only | ⚠️ ONE tier only (D7) |
| river bridges (≈2-4, :226-236) | code | `bridge_stone_0/1` | ✅ |
| water gate (×2, :87-117) | code | `water_gate` | ✅ |
| river quay (:241-259) | code | — | ❌ stays procedural, listed in gaps |
| wall corner / end piece | code (inside wallRun) | — (use towers at joints) | ❌ by design |
| moat / water (`moat.js`) | procedural + texture | — | ⏸ not a model |

## B. Town (`town.js`, `village.js`, `b1_townplan.js`, `town_plan.js`, `town_build.js`, `b2_homes.js`, `b3_civic.js`)
| slot | today | library key(s) | status |
|---|---|---|---|
| generic houses (≈109 at lv 30, up to ≈240 later; `bakeVillage` from `kit_village.glb` modules, village.js:56-133) | modular walls/roofs, 9 mats | `house_generic_a/b/c/d` (+ the 12 family houses as filler variants if the sheet shows too much repetition) | ⚠️ 4 models for ≈109 slots → variants by yaw/scale/slot, instanced/baked; `bakeVillage` retired for these |
| cottage (کلبه) | `kit_homes` pieces, `homePieces()` b2_homes.js | `house_cottage_0/1/2` | ⚠️ one look per kind (D8) |
| craftsman (پیشه‌ور) | same | `house_craftsman_0/1/2` (+`_alt` old versions, not used) | ⚠️ 6.5-7.7k tris (within 8k) |
| merchant (تاجر) | same | `house_merchant_0/1/2` | ⚠️ |
| noble (اشراف) | same | `house_noble_0/1/2` | ⚠️ |
| house yard dressing (chimney, woodpile, barrow, fence …, per tier) | kit pieces `p_*` | `props_street`, `props_town`, `lamps_house_oil` nodes | ⚠️ choose in S4a |
| chapel (کلیسا, `civicBuild` b3_civic.js:46-103) | `cv_church_b/y` | `shrine_0` (imamzadeh dome) / `shrine_1` (fire temple) | ✅ |
| well (چاه) | `cv_well_b/y` | `well_stone`, `well_qanat`, `well_abanbar` | ✅ |
| townhall (تالار شهر) | `cv_townhall_*` | `civic_hall_0/1` (2K → 1K) | ⚠️ |
| market (بازار) + 15 stall slots | `cv_market_*`, stalls | `market_hall` (10.3k tris, over budget) + `market_stalls` pack | ⚠️ |
| tavern (میخانه) | `cv_tavern_*` | `tavern_0/1` (12.5k / 12.8k tris, over budget) | ⚠️ |
| civic wing / clock tower (kit_civic extras) | `cv_wing`, `cv_tower` | `clock_tower` (if not taken by D5) | ⚠️ `civic_wing` has no model |
| lots / plan / targets | `registerTownTargets` town_build.js:16-21 (1 target per ≈26 m block + 1 per chapel) | — | ⏸ must keep |

## C. Worksites (20 kinds in `WS_KINDS`: 10 base + 10 from C1–C4; `wsbuild.js`, `c1..c4_kinds.js`)
| kind | today (kit pieces) | library key(s) | status |
|---|---|---|---|
| lumber (چوب‌بری) | `ws_lumbermill` + logs | `lumber_mill_1/2` | ✅ |
| sawmill | `c2_sawshed` | `lumber_mill_0` (water-wheel sawmill) | ✅ |
| quarry (معدن سنگ) | rocks + `ws_*` | `stone_quarry_0/1/2` | ✅ |
| masonry | `c2_masonlodge` | — | ❌ |
| iron (معدن آهن) | `ws_mine` | `iron_mine_0/1/2` | ✅ |
| smelter | `c2_smeltery` | — | ❌ |
| gold (معدن طلا) | `ws_*` | — (no gold mine; `mint` is a different thing) | ❌ |
| panning | `c1_pan` … | — | ❌ |
| mint (ضرابخانه) | `c3_vault/hall` | `mint` | ✅ |
| oil (میدان نفت) | `ws_*` + tanks | `oil_well_0/1/2`, `oil_tanks_pack`, `oil_pipes_pack` | ✅ |
| refinery | `c3_*` + 6 tanks | `oil_refinery_0/1` | ✅ |
| farm (مزرعه) | `ws_barn/silo/coop`, `c4_*` | `farm_field_1/2`, `barn_0/1`, `silo`, `coop_0/1`, `crops` pack | ✅ |
| livestock (دامداری) | `ws_openbarn/smallbarn` + fence | `barn_*`, `stable_0/1` + animals | ⚠️ no dedicated pen model |
| fishery (ماهیگیری, water rule) | `ws_fishrack`, `c1_house` | `fishing_hut_1/2`, `jetty`, `poultry_fish_pack` | ✅ |
| smokehouse | `c1_house` + rack | `smokehouse` | ✅ |
| slaughter (کشتارگاه) | `c4_slaughterhall` | `butcher` | ⚠️ shared with butcher |
| butcher | `c4_butchershop` | `butcher` | ✅ |
| greenhouse (گلخانه) | `ws_*` | — | ❌ |
| mill (آسیاب) ×4 sites | `c4_windmill/watermill`; retired legacy `livePiece` windmill (world.js:139) | `windmill_asbad_1/2`, `windmill_tower`, `watermill` | ✅ (`windmill_tower` 2K → 1K) |
| bakery | `c4_bakery` | `bakery` | ✅ |
| gem mines ×3 (`mines.js`, ruby / emerald / turquoise, layout.js:165-169; owner: diamond/turquoise mines are FIXED on the mountain) | rock + crystals, `freezeChildren` merge | `gem_mine_turquoise`; ruby/emerald → `dia_mine_red` / `dia_mine_green` (assumed); `dia_mine_ice/black/blue` unused for now | ⚠️ confirm mapping in the sheet |
| armory / treasury / brewhouse / jeweller / clock tower / cannon house / granary / camp / stable (not placed today) | — | `armory_0/1`, `treasury_0/1`, `brewhouse`, `jeweller`, `clock_tower`, `cannon_house_0/1`, `granary_0/1`, `camp_0/1`, `stable_0/1` | ⏸ candidates for D5 + general decoration |
| construction stages / scaffolding (`ws_construction`) | kit_ws | `construction_pack` | ✅ |

## D. Defence field (`defplan.js` 16 kinds, `defbuild.js` bakes `kit_def.glb`; visual only — no gameplay today)
| kind | library key(s) | status |
|---|---|---|
| traps ×11: bear, bear2, spikeball, grate, pit, saw, mine, keg, crossbow, tesla, grenade | `trap_spike_pit`, `traps_floor2`, `traps_mech`, `traps_blast` (packs: nodes named in S1), `def_tesla` for the coil | ⚠️ packs → pick nodes by looking; some kinds may have no matching node (listed in S1) |
| hedgehog (مانع خاردار) | trap/prop pack node (S1) | ⚠️ |
| watchtower (برج دیدبانی) | `castle_tower_short_<tier>` / `lamps_tower_gate` | ⚠️ no dedicated model |
| firestone (سنگ آتش) | `def_firepot` | ✅ |
| brazier pair (مشعل‌دان دروازه) | `lamps_torches_braziers` | ✅ |
| ballista (برج منجنیق) | `def_ballista` | ✅ |
| NEW defence (D6) | `def_catapult` (default), `def_scorpion`, `def_oil` | S6 |

## E. Nature (`trees.js`, `sc_*.js`, `world.js`, `crops.js`, `terrain.js`)
| slot | today | library key(s) | status |
|---|---|---|---|
| forest / scattered trees | procedural + LOD pool, impostor cards (`trees.js:148`, `sc_cards.js`, `world.js:774`) ≈ thousands | `trees_conifer`, `trees_broadleaf`, `trees_orchard`, `trees_season`, `trees_special` (packs of several nodes each) | ⚠️ thousands of trees: Tripo near the camera + impostor/LOD far (S4c, measured) |
| bushes | `sc_bush.js` cards (≈280) | `bushes` | ⚠️ |
| rocks / cliffs | `sc_rocks.js rockGeometry`, terrain cliffs | `rocks_boulder/ore/sandstone/small`, `cliffs` | ⚠️ |
| ground cover (meadow, tens of thousands of blades, LOD'd) | `world.js:861-931` instanced | `grass`, `flowers`, `ground_cover`, `plants_desert` | ⚠️ meadow density is a tris budget problem (S4c) |
| crops / fields | `crops.js:51` instanced wheat tufts (wind shader); `sc_farm.js` village plots | `crops` pack, `farm_field_*`, `rice_paddy_1/2` | ⚠️ |

## F. Lamps and props
| slot | library key(s) | status |
|---|---|---|
| torches / flames at gates, walls, roads (game's own flame fx, no new lights; `fx.js`, world.js:116-218) | `lamps_torches_braziers`, `lamps_wall_street`, `lamps_tower_gate`, `lamps_house_oil`, `lamps_hand`, `lamps_candles`, `lamps_fantasy`, `lamps_persian_shrine` (models are unlit; light stays the game's) | ✅ |
| street / town / camp / mining props | `props_street`, `props_town`, `props_camp`, `props_mining`, `market_stalls`, `construction_pack` | ✅ |
| unused: `oil_pipes_pack`, weapons ×20, `soldier_a/b` | — | ⏸ hero/army chat |

## G. Animals (`pas_life.js`, `pas_stable.js`, `life.js`, `wslife.js`, `water_life.js`)
| slot | today | library key(s) | status |
|---|---|---|---|
| horses (pasture ≈8 + 2 foals) | rigged `horse_*` (clips) | `animal_horse_white/brown/black` (static, no rig) | ⚠️ no animation |
| cows ≈6 / calf | rigged `cow` | `animal_cow`, `animal_calf` | ⚠️ static |
| sheep / pig (worksites) | rigged `an_sheep`, `an_pig` | `animal_sheep/lamb/pig` | ⚠️ static |
| hens ≈8 | — | `poultry_fish_pack` | ⚠️ |
| crows ≈6, eagles ≈2 | rigged (1 clip) | `birds` (flying pose, static) | ⚠️ no wing flap |
| dogs ≈3, wolves ≈4 | rigged | `animal_dog`, `animal_wolf` | ⚠️ static |
| fish (≈166 × quality, instanced) | procedural | `poultry_fish_pack` nodes | ⚠️ |
| donkey, camel | — | `animal_donkey`, `animal_camel` | extras |

## H. Villagers (`crowd.js`, `pas_life.js person()`, `units.js`, `peasanthead.js`)
| slot | today | library key(s) | status |
|---|---|---|---|
| peasants (≈294 capacity; skeleton animation baked into a texture, InstancedMesh, LOD2; clips from `anims.glb`) | `peasant_m/peasant_f` | `villager_man/woman/youngman/oldman/oldwoman/boy/girl/littlegirl` | ⚠️ Tripo Biped 78 joints, `walk` clip only → freeze frame for idle; no work/run clips; baked-texture path to be tested in S2/S4d |

## I. Structures that read tier tables (generalise to the cap in S2; the ARMY copies stay untouched)
`skin.js:19 TIER_AT` + `to20` (:28) · `b2_homes.js:24-26 TIER_AT/homeTier/homeStage` · `b3_civic.js:25-26 TIER_AT/civicTier` · `town_build.js:39` (sig) · `a1_rings.js:26` (comment). Own `tierOf` in `worksites.js`, `wsbuild.js`, `wslife.js`, `c1/c2/c4_kinds.js`, `levels.js`, `upgradeui.js`, `bsheet.js` → decide per file in S2. Army copies (do NOT touch): `bunits.js`, `unitlook.js`, `battlesim.js UNIT_TIER_AT`, `army.js`, `armyplan.js`, `armyui.js`.
