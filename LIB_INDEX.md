# LIB_INDEX — Tripo model library (226 entries; `lib/tripo/<category>/<key>/<key>.glb` + credit.json)
Packs (weapons_*, lamps_*, trees_*, rocks_*, …) are ONE glb with several named nodes `obj_i`/names (one node per object, pivot at its own base centre).
All: 1 material, WebP texture ≤1K, meshopt+quantised (needs MeshoptDecoder), ymin=0, longest side ≈1 (real scale + facing +Z NOT fixed yet = stage S1).

| category | key | tris | KB | note |
|---|---|---|---|---|
| animals | animal_calf | 5000 | 128 | static, unrigged |
| animals | animal_camel | 6000 | 150 | static, unrigged |
| animals | animal_cow | 5996 | 184 | static, unrigged |
| animals | animal_dog | 4998 | 144 | static, unrigged |
| animals | animal_donkey | 4998 | 153 | static, unrigged |
| animals | animal_horse_black | 5000 | 134 | black horse, static unrigged (#200 edit of the white horse) |
| animals | animal_horse_brown | 4999 | 164 | chestnut/brown horse, static unrigged (#200 edit) |
| animals | animal_horse_white | 5000 | 117 | white horse, static unrigged (#200) |
| animals | animal_lamb | 4000 | 149 | static, unrigged |
| animals | animal_pig | 4500 | 121 | static, unrigged |
| animals | animal_sheep | 5000 | 147 | static, unrigged |
| animals | animal_wolf | 5000 | 173 | static, unrigged |
| animals | birds | 8997 | 219 | flying poses with spread wings, static |
| animals | poultry_fish_pack | 12512 | 287 | static, unrigged |
| bridges | bridge_moat | 5989 | 233 | drawbridge between two towers |
| bridges | bridge_stone_0 | 5000 | 184 | single arch |
| bridges | bridge_stone_1 | 5000 | 183 | three arches with turquoise band |
| bridges | water_gate | 5986 | 222 | gate with grille and steps |
| castle | castle_gate_diamond_black | 5998 | 215 |  |
| castle | castle_gate_diamond_blue | 5993 | 253 |  |
| castle | castle_gate_diamond_green | 5999 | 267 |  |
| castle | castle_gate_diamond_ice | 5995 | 265 |  |
| castle | castle_gate_diamond_red | 5998 | 211 | (duplicate generation "red castle (1)" not used) |
| castle | castle_gate_gold | 5992 | 283 |  |
| castle | castle_gate_iron | 5992 | 213 |  |
| castle | castle_gate_stone | 5996 | 200 |  |
| castle | castle_gate_wood | 6000 | 234 |  |
| castle | castle_keep_stone_1 | 18175 | 914 | keep, 4 conical towers |
| castle | castle_keep_stone_2 | 17946 | 869 | keep, dome + square towers |
| castle | castle_tower_medium_diamond_black | 5000 | 192 |  |
| castle | castle_tower_medium_diamond_blue | 4999 | 227 |  |
| castle | castle_tower_medium_diamond_green | 4999 | 247 |  |
| castle | castle_tower_medium_diamond_ice | 4998 | 275 |  |
| castle | castle_tower_medium_diamond_red | 4998 | 183 |  |
| castle | castle_tower_medium_gold | 4999 | 215 |  |
| castle | castle_tower_medium_iron | 4967 | 196 |  |
| castle | castle_tower_medium_stone | 4998 | 170 |  |
| castle | castle_tower_medium_wood | 4996 | 212 |  |
| castle | castle_tower_short_diamond_black | 3999 | 188 |  |
| castle | castle_tower_short_diamond_blue | 4000 | 210 |  |
| castle | castle_tower_short_diamond_green | 4000 | 229 |  |
| castle | castle_tower_short_diamond_ice | 3998 | 247 |  |
| castle | castle_tower_short_diamond_red | 3996 | 161 |  |
| castle | castle_tower_short_gold | 3999 | 226 |  |
| castle | castle_tower_short_iron | 3999 | 201 |  |
| castle | castle_tower_short_stone | 3999 | 161 |  |
| castle | castle_tower_short_wood | 4000 | 211 |  |
| castle | castle_tower_stone_1 | 5999 | 317 | tower with flag |
| castle | castle_tower_stone_2 | 6000 | 285 | tower conical roof |
| castle | castle_tower_tall_diamond_black | 6000 | 211 |  |
| castle | castle_tower_tall_diamond_blue | 6000 | 248 |  |
| castle | castle_tower_tall_diamond_green | 5999 | 262 |  |
| castle | castle_tower_tall_diamond_ice | 5994 | 252 |  |
| castle | castle_tower_tall_diamond_red | 5997 | 200 |  |
| castle | castle_tower_tall_gold | 5999 | 252 |  |
| castle | castle_tower_tall_iron | 5959 | 205 |  |
| castle | castle_tower_tall_stone | 5999 | 209 |  |
| castle | castle_tower_tall_wood | 5998 | 245 |  |
| castle | castle_wall_diamond_black | 1999 | 219 | wall tier: diamond black (crenels noisy) |
| castle | castle_wall_diamond_blue | 1999 | 264 | wall tier: diamond deep blue (crenels noisy) |
| castle | castle_wall_diamond_green | 2144 | 253 | wall tier: diamond green (crenels slightly wavy) |
| castle | castle_wall_diamond_ice | 2000 | 248 | wall tier: diamond pale blue |
| castle | castle_wall_diamond_red | 2000 | 221 | wall tier: diamond red |
| castle | castle_wall_gold | 2000 | 244 | wall tier: gold |
| castle | castle_wall_iron | 2358 | 212 | wall tier: iron |
| castle | castle_wall_stone | 1999 | 214 | wall tier: stone |
| castle | castle_wall_stone_b | 2000 | 162 | new stone wall in the same shape/style recipe as the 8 other tiers (#322), light grey stone with turquoise band; the older castle_wall_stone stays in the library, pick on |
| castle | castle_wall_wood | 3432 | 289 | wall tier: wood (3.4k tris) |
| civic | armory_0 | 8329 | 277 | two-storey armory, 8.3k tris (slightly above 8k) |
| civic | armory_1 | 6349 | 240 | long low arsenal |
| civic | bakery | 7992 | 224 |  |
| civic | barn_0 | 4998 | 206 |  |
| civic | barn_1 | 5853 | 252 |  |
| civic | brewhouse | 8808 | 302 | 8.8k, slightly over |
| civic | butcher | 7985 | 255 |  |
| civic | camp_0 | 5992 | 222 |  |
| civic | camp_1 | 5985 | 237 |  |
| civic | cannon_house_0 | 5997 | 253 |  |
| civic | cannon_house_1 | 5994 | 226 |  |
| civic | civic_hall_0 | 3994 | 824 |  |
| civic | civic_hall_1 | 3996 | 677 |  |
| civic | clock_tower | 5455 | 257 |  |
| civic | coop_0 | 3998 | 177 | wooden hen house with blue tiled roof and ramp (#320) |
| civic | coop_1 | 4000 | 156 | round mudbrick hen house with clay dome, blue band and perch holes (#321) |
| civic | granary_0 | 4993 | 193 | barrel-vault granary |
| civic | granary_1 | 4993 | 203 | two-dome granary |
| civic | jetty | 6088 | 270 |  |
| civic | jeweller | 7982 | 252 |  |
| civic | market_hall | 10318 | 320 | over budget (10.3k): simplifier cannot go lower without damage |
| civic | mint | 7999 | 262 |  |
| civic | shrine_0 | 5998 | 221 | imamzadeh with conical turquoise dome |
| civic | shrine_1 | 6000 | 206 | fire temple (chahartaq) |
| civic | silo | 4998 | 190 |  |
| civic | smokehouse | 6996 | 246 |  |
| civic | stable_0 | 4996 | 201 |  |
| civic | stable_1 | 4997 | 214 |  |
| civic | tavern_0 | 12514 | 352 | over budget (12.5k): base gets lumpy below this; two generations of the same picture (tavern_1) |
| civic | tavern_1 | 12759 | 352 | over budget (12.8k); alt generation of tavern_0 |
| civic | treasury_0 | 5997 | 228 | dome treasury |
| civic | treasury_1 | 5995 | 262 | cube treasury with turrets (Tripo name: ancientcitygate) |
| civic | watermill | 7995 | 278 | tall mill with wheel and hoist |
| civic | well_abanbar | 5999 | 171 | ab-anbar: domed water reservoir with two wind-catcher chimneys and a stair entrance (#209 var 3) |
| civic | well_qanat | 3992 | 175 | qanat well: mudbrick ring, windlass, steps, clay jar (#209 var 2) |
| civic | well_stone | 3994 | 216 | stone well with deep-blue tiled roof, windlass, bucket and clay jar (#209 var 1) |
| defense | def_ballista | 4994 | 189 |  |
| defense | def_catapult | 4987 | 189 |  |
| defense | def_firepot | 2998 | 164 |  |
| defense | def_oil | 3000 | 144 |  |
| defense | def_scorpion | 3499 | 187 |  |
| defense | def_tesla | 4999 | 211 |  |
| houses | house_cottage_0 | 5000 | 300 |  |
| houses | house_cottage_1 | 5000 | 313 |  |
| houses | house_cottage_2 | 4999 | 285 |  |
| houses | house_craftsman_0 | 6473 | 244 | within budget (6473 vs 8000): workshop house: open arched ground-floor bay with a work counter, cedar balcony, hanging sign, blue tiled roof; slimmed from 17741 tris with |
| houses | house_craftsman_0_alt | 9778 | 374 | over budget (9778 vs 8000 budget): stonebuilding: tall stone workshop house; redo with Face Limit ~6000 in Tripo would fix it / older version (Tripo v1); the new redo too |
| houses | house_craftsman_1 | 7748 | 274 | within budget (7748 vs 8000): blacksmith house/forge: grey-blue stone ground floor, brick chimney, cedar balcony, blue tiled hip roof; slimmed from 17750 tris with UV-awa |
| houses | house_craftsman_1_alt | 9973 | 391 | over budget (9973 vs 8000 budget): medieval stone house; redo with Face Limit ~6000 in Tripo would fix it / older version (Tripo v1); the new redo took the main name |
| houses | house_craftsman_2 | 7410 | 266 | within budget (7410 vs 8000): potter house/workshop: arched opening with clay pots, cedar balcony, blue tiled roof; slimmed from 16981 tris with UV-aware simplify |
| houses | house_craftsman_2_alt | 7943 | 329 | within budget (7943 vs 8000): pottery workshop; texture a bit blotchy / older version (Tripo v1); the new redo took the main name |
| houses | house_generic_a | 3000 | 303 |  |
| houses | house_generic_b | 3935 | 267 | roof slightly rough |
| houses | house_generic_c | 4232 | 248 | stairs slightly messy |
| houses | house_generic_d | 3000 | 266 |  |
| houses | house_merchant_0 | 5000 | 299 |  |
| houses | house_merchant_1 | 4988 | 279 |  |
| houses | house_merchant_2 | 4998 | 279 |  |
| houses | house_noble_0 | 5996 | 300 |  |
| houses | house_noble_1 | 5995 | 326 |  |
| houses | house_noble_2 | 5981 | 309 |  |
| mines | coal_mine_0 | 5989 | 219 | tunnel mouth with carts |
| mines | coal_mine_1 | 5991 | 243 | open-pit coal mine |
| mines | dia_mine_black | 4993 | 208 |  |
| mines | dia_mine_blue | 4998 | 199 |  |
| mines | dia_mine_green | 4999 | 211 |  |
| mines | dia_mine_ice | 4998 | 207 |  |
| mines | dia_mine_red | 4993 | 209 |  |
| mines | farm_field_1 | 4061 | 231 | wheat field + scarecrow |
| mines | farm_field_2 | 3808 | 214 | mixed farm + shed |
| mines | fishing_hut_1 | 9201 | 325 | hut on piles, 9.2k tris (above 8k) |
| mines | fishing_hut_2 | 6960 | 273 | fish-drying house + jetty, 7k tris |
| mines | gem_mine_turquoise | 6000 | 228 |  |
| mines | iron_mine_0 | 5995 | 220 |  |
| mines | iron_mine_1 | 5996 | 205 |  |
| mines | iron_mine_2 | 6000 | 253 |  |
| mines | lumber_mill_0 | 6623 | 266 | water-wheel sawmill (alt generation of the same picture: zip file "wooden sawmill (1)") |
| mines | lumber_mill_1 | 5992 | 258 | log cabin yard (alt generation: zip file "wooden lumber mill") |
| mines | lumber_mill_2 | 6410 | 275 | open plank shed with saw bench (thin posts) |
| mines | oil_refinery_0 | 7992 | 270 | distillation tower with stills |
| mines | oil_refinery_1 | 6995 | 257 | alembic distillery hall |
| mines | oil_well_0 | 5981 | 227 | wooden derrick with hut |
| mines | oil_well_1 | 4988 | 199 | steampunk pump jack |
| mines | oil_well_2 | 6000 | 235 | oil field with channel and basin |
| mines | rice_paddy_1 | 2982 | 173 | flooded paddy |
| mines | rice_paddy_2 | 3769 | 206 | paddy with footbridge |
| mines | stone_quarry_0 | 7490 | 265 | stone pit with crane; lumpy source, 7.5k tris |
| mines | stone_quarry_1 | 5000 | 235 |  |
| mines | stone_quarry_2 | 5358 | 250 | marble quarry with gantry crane |
| mines | windmill_asbad_1 | 4954 | 201 | within budget (4954 vs 8000): Persian asbad windmill: long row of mudbrick chambers with tall slits, reed sails, buttresses; slimmed from 17356 tris with UV-aware simplif |
| mines | windmill_asbad_2 | 4988 | 189 | Persian wind tower style |
| mines | windmill_tower | 3999 | 783 |  |
| nature | bushes | 6069 | 242 |  |
| nature | cliffs | 6998 | 188 |  |
| nature | crops | 9102 | 330 |  |
| nature | flowers | 8590 | 322 | poppy has loose petals; one floating petal removed |
| nature | grass | 3826 | 150 | one clump only (pack picture gave 1 object); sloppy-simplified 3.8k tris |
| nature | ground_cover | 10288 | 283 | grass_tall is sloppy-simplified (2.4k) |
| nature | plants_desert | 5506 | 245 |  |
| nature | rocks_boulder | 6000 | 232 |  |
| nature | rocks_ore | 6000 | 213 |  |
| nature | rocks_sandstone | 6000 | 214 |  |
| nature | rocks_small | 5998 | 220 |  |
| nature | trees_broadleaf | 7990 | 279 |  |
| nature | trees_conifer | 7127 | 283 |  |
| nature | trees_orchard | 7984 | 298 |  |
| nature | trees_season | 7998 | 319 |  |
| nature | trees_special | 9368 | 243 | willow is sloppy-simplified (3.4k tris, texture smeared); tamarisk/almond colours look alike |
| people | villager_boy | 3000 | 248 | boy with cap, barefoot (#208) |
| people | villager_girl | 3000 | 245 | girl with braid and headscarf (pics10 #203) |
| people | villager_littlegirl | 2998 | 273 | little girl (#204) |
| people | villager_man | 3000 | 230 | adult working man with short beard, cap, brown vest and sash (ancienttunic3dmodel) |
| people | villager_oldman | 3000 | 234 | old man with white beard, cap, brown vest (medievalman3dmodel) |
| people | villager_oldwoman | 3000 | 266 | old woman with shawl (#202) |
| people | villager_woman | 2998 | 263 | adult woman with headscarf and tunic (traditionaloutfit3dmodel) |
| people | villager_youngman | 3000 | 231 | young working man with apron (#207) |
| props | construction_pack | 13829 | 332 |  |
| props | lamps_candles | 12762 | 263 | chandelier_crown includes its wall hook arm |
| props | lamps_fantasy | 14378 | 318 |  |
| props | lamps_hand | 14108 | 339 |  |
| props | lamps_house_oil | 14552 | 293 |  |
| props | lamps_persian_shrine | 14539 | 332 |  |
| props | lamps_torches_braziers | 13793 | 247 |  |
| props | lamps_tower_gate | 12286 | 257 |  |
| props | lamps_wall_street | 14695 | 323 |  |
| props | market_stalls | 11986 | 303 |  |
| props | oil_pipes_pack | 7997 | 224 |  |
| props | oil_tanks_pack | 7488 | 217 |  |
| props | props_camp | 11995 | 276 |  |
| props | props_mining | 15364 | 318 | second generation of the same picture (h04) not used |
| props | props_street | 11208 | 284 | trough has water painted in the texture |
| props | props_town | 15702 | 329 |  |
| traps | trap_spike_pit | 3000 | 97 | single object (pack picture gave 1 object); retry = traps_floor2 in pics11 |
| traps | traps_blast | 11508 | 264 |  |
| traps | traps_floor2 | 9000 | 241 | retry of traps_floor; this time 3 separate objects |
| traps | traps_mech | 12650 | 300 |  |
| units | soldier_a | 3000 | 301 | soldier in blue/steel armour, clean-shaven |
| units | soldier_b | 3000 | 294 | soldier, mail armour, beard |
| weapons | weapons_arrows_quivers | 7458 | 245 |  |
| weapons | weapons_axes_double | 8994 | 274 |  |
| weapons | weapons_axes_single | 10402 | 233 | axe_hatchet and axe_bearded were rescaled with the pack; real sizes differ |
| weapons | weapons_bows | 9434 | 217 | crossbow_light vs crossbow_heavy are hard to tell apart by look (order by Z) |
| weapons | weapons_daggers_1 | 10800 | 250 |  |
| weapons | weapons_daggers_2 | 10798 | 276 |  |
| weapons | weapons_exotic | 8961 | 231 | net is sloppy-simplified (1.7k), slightly ragged; blowgun is thin |
| weapons | weapons_hammers_big | 9000 | 257 |  |
| weapons | weapons_hammers_maces | 10799 | 248 |  |
| weapons | weapons_polearms | 10783 | 236 |  |
| weapons | weapons_shields | 10718 | 237 | spara (wicker) shield is sloppy-simplified (1.7k), slightly ragged |
| weapons | weapons_spears | 10595 | 203 |  |
| weapons | weapons_staffs_basic | 10800 | 216 |  |
| weapons | weapons_staffs_magic | 10621 | 277 |  |
| weapons | weapons_swords_long | 10797 | 233 |  |
| weapons | weapons_swords_medium | 10800 | 230 |  |
| weapons | weapons_swords_short | 10794 | 246 |  |
| weapons | weapons_swords_tiers_a | 7200 | 221 |  |
| weapons | weapons_swords_tiers_b | 9000 | 265 |  |
| weapons | weapons_swords_xlong | 8998 | 241 | claymore vs zweihander named by guard size |

## Added 14 Oct 2026 (TR1 gaps1 via TR2_S2; tris/kb after TR2 slimming)
| category | key | tris | KB | note |
|---|---|---|---|---|
| castle | castle_wall_corner_stone | 4500 | 160 | TR1 gaps1 #9: wall corner, stone (ry 90 in tr2_swap.json) |
| castle | castle_wall_corner_stone_b | 3499 | 153 | TR1 gaps1 #9: wall corner / end cap, stone, variant b (ry 90) |
| castle | river_quay | 4494 | 169 | TR1 gaps1 #8: river quay piece, ~6 m, flat ends (ry -90) |
| mines | masonry_0 | 7966 | 232 | TR1 gaps1: stonemason (ry -90) |
| mines | greenhouse_0 | 6993 | 241 | TR1 gaps1: greenhouse (ry -90) |
| mines | gold_panning_0 | 7901 | 272 | TR1 gaps1: gold panning (ry 90, front ambiguous) |
| mines | livestock_pen_0 | 4977 | 178 | TR1 gaps1: livestock pen, no animals (ry -90) |
| mines | smelter_0 | 5978 | 200 | TR1 gaps1: smelter (ry -90) |
| mines | gold_mine_0 | 5970 | 213 | TR1 gaps1: gold mine (ry -90) |
| defense | def_watchtower | 4986 | 197 | TR1 gaps1: watchtower (ry 180) |
| defense | def_hedgehog | 1998 | 135 | TR1 gaps1: hedgehog / spike obstacle (ry 0) |
