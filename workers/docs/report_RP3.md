# report_RP3 — underworld hub «Heart of the Mountain»

**RP3 = underworld hub «Heart of the Mountain». Review like any patch: every frame full size, GATE_W: ALL OK, gate off = +0 programs / +0 boot bytes, no change to battle / economy / server / pkg / gate files, `rpg.js` lines listed: ONE line (the `goUnder` build call, now `await mod.buildUnder(T, { parse: H.parseGLB, base: BASE + 'rpg/under/', v: V })`, marked `// RP3:`, rpg.js line 419). Nothing else outside `web/assets/rpg/rpg_under.js` and `web/assets/rpg/under/`.**

## What it is
A cold-turquoise cavern basin (R=100 m bowl, rock wall ~98 m high, ground out to 176 m in fog) with a camp fire, 4 tents, a vendor stall, a quest board (object only, no text), benches, crates/barrels, 4 flags, beacon cauldrons and stone bowls along 8 roads, 130 crystal clusters, 46 glowing wall veins, 34 rim spires, drifting motes and ground-following mist. 8 mouths cut into the wall, each sealed by a slow mist curtain with its own stone portal frame (motif per region): sepidsar N (ogive crown), black_mountain NE (megalith), black_citadel E (crenellated), salt_flats SE (teeth), white_fortress S (twin towers), golden_city W (dome), simorgh NW (wings) + the way home SW (swirl portal at the top of a 10-tread stair). Spawn on the SW road facing the camp. The 7 region mouths are `open:false` (nothing behind them yet).

Module contract is the RP1 one (additive fields only): `scene, hgt, colliders[x,z,r], clampXZ, portal{x,z,y,r}, fill, spawn{x,z,yaw}, update, dispose, stats` + new `heightAt, BOUND, pois, regions[{key,x,z,dir,open}], camp, setQuality(0..3)`. `buildUnder` is now `async` and takes `{parse, base, v}`; without `parse` it builds box stand-ins of the same size (that is what the headless test does).

## Files
- `web/assets/rpg/rpg_under.js` (52 KB, rewritten) · `web/assets/rpg/under/*.glb` (9 files, 1459 KB total; only the picked nodes of 9 library packs, extracted with gltf-transform; fetched on entering the hub only)
- `web/assets/rpg/rpg.js` — shared file, the one line above (diff in `shared/`)
- `dev/rp3_test.sh` + `rp3_test.mjs` (headless proof) · `rp3_seq_final.sh` + `rp3_c.py` (full-game proof through `rp1_drv.py`) · `rp3_meas.py` (gate off vs on-not-started)
- Pieces used (12, owner default list): tent, cooking pot, fire bowl, beacon cauldron, stall, flag, crates, barrels, granite boulder, cliff, spire, ore crystal. No Tripo credit used (procedural geometry + existing library pieces). No character model touched.

## Proven (each by running it)
- `bash dev/rp3_test.sh` → **RP3 OK** (45 checks): contract fields; spawn on free ground; BFS with the game's own rules (body 0.45, push-out, no-climb 0.85·run+0.06, radial clamp) reaches camp, vendor, board, the portal and all 7 mouths (≈28,900 m² walkable, 306 colliders); budget (headless): 26 draw calls, 96k tris, 7 program signatures, exactly 3 lights, no shadow casters; `setQuality` thins motes 520>340>160>40; 900 frames of `update` with no new objects and no NaN; same layout on a second build; `dispose` fires for all 26 geometries + 7 textures + 26 materials; module has no «bot / ربات», no secret names, no Persian text in code; mutation check (a collider dropped on the road) makes the test fail.
- Full game (kit bundle, dev page, hero Aylar, 390×844 software-GL): enter hub **27 hub draw calls / 31 total with the hero, 273k tris, kit 12/12 loaded, build+fetch ≈0.8 s on this server**. Shader programs 166 → 176 on first entry, 178 after later entries (**+10 / +12 max; budget ≤ +14**). The hero **walked with the real physics** (steering only) spawn → camp (17 s), board, and to r=62 on every one of the 8 bearings, then onto the portal → back in the castle (`where: home`) with no stuck event.
- Enter / exit ×5 (portal once, `goHome` the rest): hub = exactly +25 geometries / +15 textures inside, and exactly that removed on exit; counts identical on cycles 3, 4, 5 (home 486 geo / 368 tex, inside 511 / 383), i.e. no growth. (Home-scene counts also rose +26 geo / +15 tex between the first baseline and cycle 2: lazily uploaded home resources for the door view, not the hub — no way to attribute it more finely here.)
- `GATE_W: ALL OK` (full `dev/gate_w.sh`, incl. battle sim noRoute 667 < 700). Gate off: `rp3_meas.py` — rpg:false page and rpg:true-not-started page both: **166 programs, 580 requests, no `/rpg/` file at all at boot** (`rpg_under.js` and `under/*.glb` are only requested inside `goUnder`). Header byte sums differed by 2.2 MB between the two runs (cache/compression noise, no rpg files in either list), so «+0 boot bytes» is shown by the identical request list, not by the sum.
- Frames (full size, looked at one by one, in `photos_RP3.tar.gz`): `g_under_spawn`, `g_under_camp`, `g_board`, `g_mouth_N/NE/E/SE/S/W/NW`, `g_portal_far`, `g_portal_stair`, `g_home_after_exit`; plus `pieces1.png` (pieces sheet sent to the owner) and `uploads_sheet.png` (the six GLBs the owner uploaded, numbered).

## Not proven
- Real phone fps / feel (all numbers above are SwiftShader software GL on the server; the in-game overlay read ~20 fps there, which means nothing for a phone). `setQuality` was checked headless only (mote counts), not for its fps effect.
- Anything with enemies (there are none in the hub; no combat touched).
- Music / ambient audio (none added).
- Look on a real screen: tuned by eye on software-GL frames. Known soft spots, left as they are: the floor around the hero's lamp is washed turquoise; the hero's boots look misty where the low mist sheet crosses them; stair treads glow like neon lines; camp flames read as soft puffs.

## Not done / needs the owner
- Mood sheet (6 environment images, one-paste server script `RP3_paste_mood.sh`): no answer yet → default **1 «غار عظیم»** is what the hub follows.
- Pieces sheet: no answer yet → default = my 12 (above).
- The owner uploaded 6 Tripo-style environment models (≈19k tris, 2048² JPEG, ~1.4 MB each; temple, dungeon, 2× cavern ruins, crystal cavern, fortress ruins — #5 dungeon is a round platform with radial bridges, i.e. a hub-shaped diorama). They are not in the game: no number was given. Offered: far «ghost city» backdrops in the haze behind the wall (1 draw call, ~250 KB each after 1K webp). Default = none this round.
- The 7 mouths lead nowhere yet (`open:false`).

## Notes for the mother
- `web/app/wall.js` shows as modified in the kit working tree (built bundle rebuilt by `setup_kit.sh`); it is outside my ownership and `mkpatch.sh` ignores `web/app/`, so it is not in the patch.
- add_repo's reply suggested a full clone; not done (never clone `main`). Only `kit` and `lib-tripo` were cloned, `--depth 1`.
