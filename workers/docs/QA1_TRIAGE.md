# QA1 triage — who fixes what (Mother 2, 15 Oct 2026)

Source: `QA1_defects.md` (146 findings: A 5 · B 79 · C 62). All frames software GL, kit state **before** GR1_R2 / ST1_R2 / AN1_R3 / BT1_R2 / S5_R2 (kit `0574fdc` + WC1). **Re-check after p57 before fixing:** GR1_R2 (black sky band, sepia mountains, fog colour), ST1_R2 (crown gem, white flare at keep?), AN1_R3 (sizes) change several of these. Tools to re-run: `qa1_tools.tar.gz` (`dev/qa1_walk.py`, `dev/qa1_analyze.py`).

Two named causes for the owner's «giant dark poles»: **QA1-019** = the banner poles of `storeyards.js banners()` (18 poles, 7.6 m tall, 15 cm thick, drawn black); **AN1_R3 §6** = the three wooden archer towers of `buildings.js` 102-110 (8 m legs, black at night). Fix both.


## BRIDGE ENDS (A) — terrain bank carve (GR1) + slope limit (RP1C) + parapet colliders (TR2)  (5: A 5 · B 0 · C 0)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 001 | A | S34 bridge06 · third · day | bridge 6 traps the hero at the far end of its deck: walking A to B (game proof walker, real physics) she reaches the end of the 10 m walkabl |
| 002 | A | S35 bridge07 · third · day+dusk | bridge 7 (the long one, 50 m): a walker that steps off the side of the deck lands IN the river channel (y -0.99, under the water surface, no |
| 003 | A | S36 bridge08 · third · day | bridge 8: walking B to A she ends on the steep bank beside the deck end at (-170.12, 196.16, y 1.65) and stops (ground ahead 1.65, 2.19 in 0 |
| 004 | A | S40 bridge12 · third · day | bridge 12 (north edge): walking B to A she drops 20 m down a 40-70 degree mountain face (y 27 to 0.72 in 7 s), crosses the deck, and stops a |
| 005 | A | S41 bridge13 · third · day | bridge 13: walking B to A she leaves the deck end at lateral 2.8 m and stops in the gully at (18.49, -294.38, y -0.1 to 0.19) in front of a  |

## ST1 — storeyards.js / vault.js (poles, heaps, braziers, forecourt)  (44: A 0 · B 24 · C 20)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 012 | B | S01 gate_out · third · night | night: the gate towers beside the two braziers are blown to pure white (RGB 250+) in hard-edged star shapes with hard blue triangles between |
| 018 | B | S06 storage_wood · first · day | two thin pure-black masts taller than the frame (more than 5 m) stand either side of the wood yard, with no head visible; the right-hand bra |
| 019 | B | S06 storage_wood · third · day | IDENTIFIED: the thin black masts at every storage are the banner poles of storeyards.js banners(): two cylinders 7.6 m tall and about 15 cm  |
| 020 | B | S07 storage_stone · first · dusk | dusk: first person, the stone heap fills a third of the frame as flat white slabs with light seams and no grain, and the lilac forecourt led |
| 021 | B | S07 storage_stone · third · day | the stone heaps are stacks of plain pale-blue-white boxes with bright edges and no stone texture: they read as ice cubes or frosted glass, a |
| 022 | B | S07 storage_stone · third · dusk+night | dusk: the two stone heaps are near-white (RGB 200-230) blocks that are the brightest things in the frame, brighter than the sky behind: they |
| 023 | B | S08 storage_iron · first · day | thin pure-black masts taller than the frame run beyond the top edge on both sides of the yard (the same objects as at S06, S03 and the strat |
| 024 | B | S08 storage_iron · third · day | two lanterns hang in mid-air beside the iron-store door: no post, chain or bracket joins them to anything (the thin black masts stand 6 m fu |
| 025 | B | S08 storage_iron · third · day | the forecourt slab is one flat very pale blue colour with a bright edge, with no texture or wear, so next to the dark door it looks like an  |
| 026 | B | S09 storage_gold · first · day | the two black brazier stands beside the gold store are crumpled spiky black cages that read as a torn or inverted mesh, with no flame or glo |
| 027 | B | S09 storage_gold · first · dusk+night | dusk: the two iron braziers beside the gold store are unlit black cages although the hour is dusk; the wall torches already burn but these n |
| 030 | B | S10 storage_oil · third · day | the oil barrels are smooth pale blue-grey cylinders with a faint oval patch and no staves, hoops or lid: they look like paper cups or silos, |
| 033 | B | S12 storage_ruby · first · day | the top of the left-hand mast carries flat solid-black rectangular blocks with a few blue dots (a sign / banner head) with no texture or sha |
| 034 | B | S13 storage_emerald · first · day | a huge round dark-blue badge with a gold rim (a label sprite of the store, about 1.3 m across) hangs about 1 m from the first-person eye and |
| 036 | B | S15 vault_row · first · day | grass tufts stand straight up out of the pale blue plinth top she is walking on (the court slab is a flat pale-blue colour with grass blades |
| 070 | B | S06 storage_wood · first · dusk | pure-black pixels below the sky band: 0.51 % of the frame (a hole / an unlit surface) |
| 071 | B | S08 storage_iron · first · dusk | pure-black pixels below the sky band: 1.04 % of the frame (a hole / an unlit surface) |
| 072 | B | S09 storage_gold · first · dusk | pure-black pixels below the sky band: 0.96 % of the frame (a hole / an unlit surface) |
| 073 | B | S09 storage_gold · third · dusk | pure-black pixels below the sky band: 0.51 % of the frame (a hole / an unlit surface) |
| 074 | B | S10 storage_oil · first · dusk | pure-black pixels below the sky band: 1.21 % of the frame (a hole / an unlit surface) |
| 075 | B | S10 storage_oil · third · dusk | pure-black pixels below the sky band: 0.60 % of the frame (a hole / an unlit surface) |
| 076 | B | S12 storage_ruby · first · dusk | pure-black pixels below the sky band: 0.71 % of the frame (a hole / an unlit surface) |
| 077 | B | S14 storage_turq · first · dusk | pure-black pixels below the sky band: 0.59 % of the frame (a hole / an unlit surface) |
| 078 | B | S15 vault_row · third · dusk | pure-black pixels below the sky band: 0.93 % of the frame (a hole / an unlit surface) |
| 091 | C | S06 storage_wood · strat · dusk | dusk: the strategic camera sits right beside a tower top, so the brazier flame (a hot orange sprite about 120 px) fills the lower right sixt |
| 092 | C | S06 storage_wood · third · day | the log stacks are flat beige cylinders with a repeated chevron stamp and no bark or end grain, so they read as cardboard tubes; the brown c |
| 093 | C | S06 storage_wood · third · dusk | dusk: the log stacks keep their day brightness (warm orange-tan, almost the same as at noon) while the ground, the cart and the wall are alr |
| 094 | C | S06 storage_wood · third · night | night: the log stacks turn neutral dark grey (no brown in them at all) while the ground and the walls keep colour; the wood looks like grey  |
| 095 | C | S08 storage_iron · third · dusk | dusk: a long bright white strip (the court plinth lip, about 0.4 m) runs across the full width of the frame under the dark iron store; it st |
| 096 | C | S09 storage_gold · third · day | the gold bars are flat saturated-yellow boxes with no metal sheen or bevel: the gold store looks like yellow plastic bricks |
| 097 | C | S09 storage_gold · third · dusk+night | dusk: the gold bars are flat orange boxes with no sheen and the same saturated orange as at noon; they look unlit and brighter than the stor |
| 098 | C | S10 storage_oil · first · day | the dark storehouse wall is faceted: each facet carries its own bright specular edge, so the wall sparkles like broken glass instead of read |
| 099 | C | S11 storage_food · first · day | the entry arch, door frame and steps of the food store are a smeared pale texture (stretched UVs, no stone grain) next to the crisp crate st |
| 101 | C | S11 storage_food · third · day | the crumpled black brazier cage again (same prop as S06 / S09) beside the steps, and the lantern pair's post is missing (the lantern stands  |
| 102 | C | S12 storage_ruby · third · day | the ruby-store basin and its six bollards are one matte white-blue plastic colour with no stone grain; the near bollard (0.5 m from the came |
| 103 | C | S12 storage_ruby · third · dusk+night | dusk: the six ruby-court bollards and the basin rim are warm cream and stay brighter than the store; the plinth top is a flat lilac sheet wi |
| 104 | C | S13 storage_emerald · third · day | the emerald court repeats the ruby court: same white-blue plastic basin and six white ball-topped bollards, same wet-candy gloss on the stor |
| 105 | C | S14 storage_turq · first · day | the turquoise store, its basin, the plinth and the neighbouring ice tower are all the same pale blue-white: the treasure does not stand out  |
| 106 | C | S14 storage_turq · third · day | the plinth edge in front of every court is a flat pale-blue band about 1.5 m high with a hard bright edge and no material: it reads as a flo |
| 107 | C | S15 vault_row · first · dusk | dusk: a black brazier cage stands 2 m ahead with no flame; with the horse and villagers behind it the frame has a prop that reads as a broke |
| 108 | C | S15 vault_row · third · day | the near-left foreground is a large beige box-like prop with thin dark shelf lines (a stall or crate stack, 2.5 m tall) with no texture, cro |
| 109 | C | S15 vault_row · third · dusk | dusk: the court slab she stands on is a flat bright lilac (RGB about 150,150,210) cut by a hard edge into the dark grass, and the grass blad |
| 125 | C | S24 bridge01 · third · day | a pure-black pointed cap (3 m, no texture or highlight) tops the dark building on the left (chimney or finial): reads as a black cut-out aga |
| 130 | C | S29 ws_quarry · third · day | the quarry stone blocks are plain pale blue-white cubes with no stone texture (the same ice-cube look as the stone heaps at S07) |

## RP1C — rpg.js camera spring / placeCamera  (11: A 0 · B 11 · C 0)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 006 | B | S04 keep_entry · third · dusk+night | third-person camera squeezed to 0.55 m behind her (normal 3.6 m): the frame is mostly her back or hair, the spot is wedged against a wall /  |
| 007 | B | S15 vault_row · third · dusk+night | third-person camera squeezed to 1.34 m behind her (normal 3.6 m): the frame is mostly her back or hair, the spot is wedged against a wall /  |
| 008 | B | S20 windmill · third · dusk+night | third-person camera squeezed to 0.55 m behind her (normal 3.6 m): the frame is mostly her back or hair, the spot is wedged against a wall /  |
| 009 | B | S25 wall_inner · third · day | third-person camera squeezed to 0.60 m behind her (normal 3.6 m): the frame is mostly her back or hair, the spot is wedged against a wall /  |
| 010 | B | S32 bridge04 · third · day | third-person camera squeezed to 0.67 m behind her (normal 3.6 m): the frame is mostly her back or hair, the spot is wedged against a wall /  |
| 016 | B | S04 keep_entry · third · day | third-person camera collapses to its minimum distance at the keep forecourt: the frame is the back of her hair, with a dark stone pillar and |
| 017 | B | S04 keep_entry · third · dusk+night | dusk: the third-person camera is again collapsed to the back of her hair at the keep forecourt (same as day) and everything except her hair  |
| 042 | B | S20 windmill · third · day | third-person camera squeezed to its minimum distance at the windmill stand spot: the frame is the back of her hair, with a grey tent pole an |
| 051 | B | S24 bridge01 · third · day | no bridge has a side collider: all 13 bridges were tested with the game own free() / ground() and a 3 s sideways push at three places along  |
| 052 | B | S25 wall_inner · third · day | the inner face of the outer wall is a smeared pale-blue / white texture with soft diagonal stretched stones and sheared slivers: it reads as |
| 063 | B | S36 bridge08 · third · day | the stand spot at bridge 8 is on a 50 degree bank: the slope fills the left 40 % of the frame with vertical smeared streaks (stretched textu |

## GR1 — terrain.js / ground_near / roads / river / sky / backdrop  (44: A 0 · B 21 · C 23)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 015 | B | S04 keep_entry · third · dusk | black / empty pixels in the sky band: 40.3 % of the top 20 % rows are darker than luma 0.04 (jaggedness 1.9 px per column, the dark ceiling  |
| 029 | B | S10 storage_oil · first · night | black / empty pixels in the sky band: 31.2 % of the top 20 % rows are near-black (luma < 0.007) (jaggedness 1.1 px per column, the dark ceil |
| 031 | B | S11 storage_food · strat · dusk | dusk: the far mountain backdrop (the top 30 % of every strategic frame) turns into a flat sepia / tan paper cut-out: the pines lose all gree |
| 032 | B | S11 storage_food · strat · dusk | dusk: the river water is a saturated electric blue ribbon (RGB about 20,90,230) that is brighter than anything else on the ground and does n |
| 037 | B | S16 road_main · third · day+dusk+night | pole-like structure 17.0 m tall, 0.4 x 0.4 m (aspect 39), not a building: attackerCamp/ at (290, 156) |
| 040 | B | S19 field1 · strat · day | the strategic camera at field 1 ends up INSIDE a rock outcrop: the frame is dark boulder surfaces filling the screen, with a black polygon a |
| 043 | B | S21 river_bank · first · day | the river is drawn as a canal with pure-black bank strips (about 0.8 m high, no texture, hard rectangular edges) on both sides; the water be |
| 044 | B | S21 river_bank · first · dusk | dusk: from the bank at eye height the water is only a 1 px bright blue line on top of a wooden-looking black bank strip; the river is not vi |
| 050 | B | S24 bridge01 · third · night | night: the sand patch beside the bridge ramp stays pale beige (RGB about 200,190,160) while the grass around it is nearly black: it glows li |
| 056 | B | S29 ws_quarry · third · day | she stands against a boulder that is a flat beige-grey gradient with hard polygon facets and no rock texture (3 m tall, fills the left third |
| 060 | B | S34 bridge06 · third · day | the ravine bridges 6-13 are sunk in canyons: the walkable deck is at y 0.72 but the banks next to it are 3.1 / 6.5 / 9.3 / 5.8 / 9.0 / 7.7 / |
| 061 | B | S35 bridge07 · first · day | a giant tan-beige oak crown (about 20 m wide) fills the upper right 40 % of the frame as a flat sheet with a torn, pixel-stepped alpha edge  |
| 062 | B | S35 bridge07 · strat · day | the oak trees seen from the strategic camera are dark chocolate-brown cut-out cards with pixel-stepped black outlines, 40-120 px wide: they  |
| 064 | B | S40 bridge12 · third · day | bridge 12 (north edge): the approach spot is on a 40 degree mountain face, and the deck is a small blue patch far below at the bottom of the |
| 066 | B | S42 edge_E · strat · day | the strategic camera at the east map edge ends up behind a boulder wall: two thirds of the frame are dark rock surface, and the town is a po |
| 067 | B | S42 edge_E · third · day | z-fighting flicker: 2.74 % of the flat pixels flip when the camera moves 3 cm (worst cell 7,3 of 8x4) |
| 068 | B | S44 edge_W · third · day | z-fighting flicker: 1.17 % of the flat pixels flip when the camera moves 3 cm (worst cell 0,3 of 8x4) |
| 079 | B | S17 road_west · first · dusk | pure-black pixels below the sky band: 2.81 % of the frame (a hole / an unlit surface) |
| 080 | B | S17 road_west · third · dusk | pure-black pixels below the sky band: 1.24 % of the frame (a hole / an unlit surface) |
| 081 | B | S18 road_farm · first · dusk | pure-black pixels below the sky band: 2.95 % of the frame (a hole / an unlit surface) |
| 082 | B | S18 road_farm · third · dusk | pure-black pixels below the sky band: 2.48 % of the frame (a hole / an unlit surface) |
| 085 | C | S02 gate_in · strat · day | the far meadow is dotted with dark brown, hard-edged, pixel-stepped patches (ground decals / bush cut-outs 10-30 px wide) that read as burn  |
| 090 | C | S05 wall_outer · third · day | the outer wall now reads as stone (good), but one stone at the right has a sheared sliver (a triangle of stretched texture) and the wall bas |
| 110 | C | S17 road_west · third · day | the rail track lies on top of the pavement slabs with no bed or gap, and ends in the middle of the slab instead of reaching the portal |
| 111 | C | S17 road_west · third · dusk | dusk: the booth at the left of the mine road is a flat pastel box (pale yellow-green) with a flat orange rectangle (a sign) and a dark brown |
| 113 | C | S18 road_farm · third · day | the road named 'farm' (north) does not end at a farm: it ends at a ruby mine portal that is the same model as the west mine at S17 (same sla |
| 115 | C | S19 field1 · third · day | the field is a rectangle of sparse grass tufts on yellow-green ground split by a hard straight seam down the middle: no furrows, crop rows o |
| 118 | C | S20 windmill · strat · dusk | dusk: the waterfall on the far mountain (top right) is a rigid straight white bar with a cloud ball at its foot, unchanged from noon; at dus |
| 119 | C | S21 river_bank · strat · dusk | dusk: a white horizontal streak (sun or lantern glint on the river, 150-250 px long, blown to pure white) cuts across the river in the middl |
| 120 | C | S21 river_bank · third · day | a second black-edged strip behind the river shows a second black band with a road behind it: two parallel black bands read as a double canal |
| 121 | C | S21 river_bank · third · dusk | dusk: pine branches (needle cards about 2 m wide) hang at 1.6 m height and cover the top of both frames: the camera is inside the crown of t |
| 122 | C | S22 house_yard · third · day | the 'house yard' is plain tufted grass: no fence, path, well, garden or washing line between the cottages, so the yard has no function or de |
| 123 | C | S23 stairs · third · day | the tower base meets the dirt in a razor-straight line with no plinth or dirt blend; a cream untextured rounded blob (sandbag? bench?) lies  |
| 126 | C | S24 bridge01 · third · dusk+night | dusk: a pale sand patch with a hard polygonal outline and a red wheelbarrow lies beside the bridge ramp; the patch edge is a straight-sided  |
| 127 | C | S25 wall_inner · first · day | first person at the inner wall: the stone blocks are about 1.5 m wide with blurred edges (the texture is magnified about 3x compared with th |
| 133 | C | S33 bridge05 · third · day | a dark-brown flat oak card with a pixel-stepped outline stands next to the green tower at the bridge end and reads as a black silhouette aga |
| 134 | C | S34 bridge06 · strat · day | a big dark-brown oak card (about 100 px) lies on the meadow beside the field and looks like a burn mark; same cause as S35 |
| 137 | C | S41 bridge13 · third · day | bridge 13: from the stand spot on the ridge the bridge is hidden behind the hill crest (the frame shows grass and pines only), so the bridge |
| 138 | C | S42 edge_E · third · day | at the east map edge the pine foliage cards (3 m, close to the camera) have blocky 16 px alpha holes and a hard pixel-stepped outline: from  |
| 139 | C | S45 edge_N · first · day | at the north map edge the first-person frame is a single blurred grey cliff wall: the rock texture is magnified about 8x into soft squares,  |
| 140 | C | S45 edge_N · strat · day | steep ground at the stream banks (S45 centre, S28 left, S44 left slope) shows streaked, stretched texture like a smeared brush stroke: the s |
| 141 | C | S18 road_farm · third · day | weak z-fight candidate: 0.45 % of the flat pixels flip with a 3 cm camera shift (worst cell 7,2); could also be shadow-edge shimmer |
| 145 | C | S43 edge_S · third · day | weak z-fight candidate: 0.48 % of the flat pixels flip with a 3 cm camera shift (worst cell 6,3); could also be shadow-edge shimmer |
| 146 | C | S45 edge_N · third · day | weak z-fight candidate: 0.54 % of the flat pixels flip with a 3 cm camera shift (worst cell 5,0); could also be shadow-edge shimmer |

## TR2 — castle_tr2 / b2_homes / bridges / mine portal / domes  (20: A 0 · B 11 · C 9)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 013 | B | S04 keep_entry · first · day | first person at the keep entrance: nose against a dark stone pillar whose texture is magnified into a smear, next to flat pale-cyan / white  |
| 014 | B | S04 keep_entry · first · dusk+night | dusk: inside the keep forecourt the right half of the first-person frame is pure black (about a third of all pixels at RGB under 4) and the  |
| 028 | B | S09 storage_gold · strat · dusk+night | dusk: a white blown-out flare about 150 px wide hangs over the keep side of the town (a bloom of a beacon or sun glint) and washes out the k |
| 035 | B | S13 storage_emerald · third · day | the white building at the far left of the frame has torn, melted faces (diagonal slivers, broken windows) like the cottage seen from the gat |
| 038 | B | S17 road_west · first · day | the mine portal at the west road end is a flat pure-black rectangle with two timber braces: no depth, no inner frame, no dark gradient; a tu |
| 041 | B | S20 windmill · strat · night | night: the big round brick-and-thatch dome at the right edge of the frame (next to the windmill camp) reflects the moon as a pure white rim  |
| 046 | B | S22 house_yard · third · day | the cottages in front of her have torn-looking walls: a 5 m white wall with sheared triangular flaps and a broken window frame, and the next |
| 047 | B | S23 stairs · first · day | NO stairs, ramps or steps exist anywhere in the scene (searched by name step/stair/ramp; CLIMB_ON=false in rpg.js): the wall walk, tower top |
| 058 | B | S31 bridge03 · third · day | between the crate stacks at bridge 3 lies a jumble of grey-white shards: paper-thin triangles and tilted slabs carrying stray letter glyphs  |
| 065 | B | S41 bridge13 · third · day | z-fighting flicker: 1.02 % of the flat pixels flip when the camera moves 3 cm (worst cell 5,3 of 8x4) |
| 069 | B | S04 keep_entry · third · dusk | pure-black pixels below the sky band: 4.06 % of the frame (a hole / an unlit surface) |
| 086 | C | S02 gate_in · third · day | the cottage at the left of the gate road has twisted, torn-looking walls and windows (diagonal slivers, a collapsed roof edge) even from 30  |
| 088 | C | S03 plaza · third · day | four dark-blue brick pillars about 4 m tall (2x her height, 1.3 m wide) stand round the plaza crystal with a pale diamond floating above eac |
| 089 | C | S04 keep_entry · strat · day | a large blue-tiled roof of a house fills the lower right fifth of the strategic frame at the keep, hiding part of the plaza and keep forecou |
| 124 | C | S23 stairs · third · night | night: the cream blob at the lower left (sandbag / bench, about 1 m) is almost white and the brightest object in the frame; at day it was be |
| 131 | C | S30 bridge02 · third · day | beside the bridge approach stand big flat-brown beams (an A-frame about 4 m long and 15 cm thick, plus a crossed pair in the middle of the d |
| 132 | C | S31 bridge03 · strat · day | a plain white cube with a flat navy roof (about 6 m, no door, no window) stands behind the green tower inner side: it reads as an unfinished |
| 142 | C | S24 bridge01 · third · day | weak z-fight candidate: 0.48 % of the flat pixels flip with a 3 cm camera shift (worst cell 4,3); could also be shadow-edge shimmer |
| 143 | C | S24 bridge01 · third · night | weak z-fight candidate: 0.72 % of the flat pixels flip with a 3 cm camera shift (worst cell 3,2); could also be shadow-edge shimmer |
| 144 | C | S32 bridge04 · third · day | weak z-fight candidate: 0.51 % of the flat pixels flip with a 3 cm camera shift (worst cell 3,3); could also be shadow-edge shimmer |

## UI1 — strategic camera lands inside objects (camblock.js / controls.js)  (5: A 0 · B 4 · C 1)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 011 | B | S01 gate_out · strat · day | the strategic camera at the gate sits right over the pink market-tent roofs: tent canvas, a barrel and a grey box fill the bottom 25-35 % of |
| 045 | B | S22 house_yard · strat · day | same as S01: pink tent roofs and a barrel cover the lower third of the strategic frame near the gate road |
| 048 | B | S23 stairs · strat · day | same as S01 / S22: tent roofs, a barrel and a large grey box fill the lower third of the strategic frame near the gate |
| 059 | B | S32 bridge04 · strat · day | the strategic camera at bridge 4 sits against the crystal crown of an ice tower: the crystal spikes fill the right 40 % of the frame and hid |
| 100 | C | S11 storage_food · strat · day+dusk+night | the strategic camera stands right on top of the ice-crystal tower at the river bend (crystal spikes fill the left 30 % of the frame, icicle  |

## UNOWNED — farm props, carts, stumps, unnamed black objects  (17: A 0 · B 8 · C 9)

| ID | class | station · camera · hour | what (first 140 chars) |
|---|---|---|---|
| 039 | B | S19 field1 · first · day+dusk+night | a flat solid-black horizontal bar (about 3 m x 0.4 m) hangs on the hillside behind the field, between a tiny red-blue hut and a blue-roofed  |
| 049 | B | S24 bridge01 · third · day | flat-shaded salmon / pink boxes (cart load) and the grey cart wheels fill the lower third of the frame right behind her: untextured, no shad |
| 053 | B | S28 ws_lumber1 · first · day | first person: the whole frame is a smooth brown-grey slab with hard polygon edges 0.3 m from the eye (a tree stump face / log end or a bould |
| 054 | B | S28 ws_lumber1 · third · day | the cut-log stacks have an end-grain texture of chunky 8x8 pixel blocks (visible squares about 12 px wide on screen), and the split-wood pil |
| 055 | B | S29 ws_quarry · first · day | first person: a torn mesh of paper-thin pale triangles (razor slivers) spreads over the top of the frame, with a dark plank above: a broken  |
| 057 | B | S31 bridge03 · first · day | first person: the same shard heap fills the lower right quarter of the frame at 1 m: razor-thin dark and pale triangles with no thickness, h |
| 083 | B | S19 field1 · strat · dusk | pure-black pixels below the sky band: 3.62 % of the frame (a hole / an unlit surface) |
| 084 | B | S20 windmill · third · dusk | pure-black pixels below the sky band: 4.23 % of the frame (a hole / an unlit surface) |
| 087 | C | S03 plaza · first · day | first person at the plaza basin: the eye is against the crystal rock (about 0.3 m), the whole frame is a magnified smeared rock texture (abo |
| 112 | C | S18 road_farm · strat · night | night: the lit canvas of the mine head-frame (a flat 3 m panel by the winding wheel) is pure white with a bloom halo and no cloth detail; it |
| 114 | C | S18 road_farm · third · dusk | dusk: a huge hot-pink ruby crystal fills the lower right corner of the frame at 1.5 m (about 1.2 m across) and clips the frame edge: ore dec |
| 116 | C | S20 windmill · first · day | the windmill base wall is smooth cream with a smeared blue border band (stretched UV, no plaster grain) next to the crisp window ring and ca |
| 117 | C | S20 windmill · strat · day | a flat white oval about 4 m wide with dotted marks lies at the foot of the windmill (flour table? tarp? shadow blob?) with no thickness and  |
| 128 | C | S27 watermill · third · day | the water-mill cart in the foreground is flat dark grey-blue planks with no wood texture and its tarp is a pale beige blob; she stands boxed |
| 129 | C | S28 ws_lumber1 · third · day | a worker stands exactly where she was placed and overlaps her (his back fills the frame next to her): the spot is on the worker route, and t |
| 135 | C | S38 bridge10 · strat · day | the camp at bridge 10 is a bare brown square about 70 m wide with six soldiers and no tent, fire, rack or fence: a large empty parade ground |
| 136 | C | S40 bridge12 · strat · day | a long pure-black object with a red stripe (about 15-20 m, looks like a barge or an ore train hull) lies in the camp at the north edge next  |
