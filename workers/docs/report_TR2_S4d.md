# report_TR2_S4d — animals + villagers (stage S4d of S4)
TR2 · 14 Oct 2026 · kit **p47** (TR2-S2 included) + models from `lib-tripo` · `GATE_W: ALL OK` (34 OK lines, noRoute **667** / limit 700) · `dev/tr2_tiers_test.sh` → `TR2 TIERS OK` · `dev/tr2_s4d_test.sh` → `TR2 S4D OK`.
Software GL (SwiftShader), headless Chromium, `dev_s35.html` lv 30 — **not phone numbers**. Every frame named below was opened and looked at full size (1280 × 720).

## خلاصه (فارسی)
حیوون‌های مرتع/دامداری/مزرعه (اسب ۳ رنگ، گاو، گوساله، گوسفند، بره، خوک، سگ، گرگ)، روستایی‌ها (۴ مدل)، عقاب/کلاغ، مرغ/خروس/جوجه و ماهیِ پرنده الان مدل Tripo هستن؛ ارتش دست‌نخورده. **ضعف‌ها (واقعی):** حیوون‌ها ریگ ندارن → پا نمی‌زنن (سُر می‌خورن با تکون ملایم)، پرنده بال نمی‌زنه، روستایی فقط راه‌رفتن داره (کار/نشستن/صحبت = ژست ایستاده، ابزار تو دست نیست، ماهی‌گیر قایق ایستاده‌ست). اگه مدل‌ها نرسن بازی همون kit قدیمیه (تو بازی واقعی ثابت شد). مقایسه با kit: draw-call ۶ تا ۱۹ کمتر، programs ۴ تا کمتر، مثلث −۱٪ تا +۶٪، دانلود +۲٫۰۹ MB (که ~۲٫۰۷ MB‌ش بعد از حذف مدل‌های قدیمیِ بلااستفاده برمی‌گرده).

## What the player SEES now (kit → S4d)
| place | kit | S4d |
|---|---|---|
| **pasture paddock** (`pas_life`) | horse herd in 3 coats (m2m horses, real leg animation), cows in 5 hides | same herd with **Tripo horses in 3 coats** (`animal_horse_brown / black / white`, bay / black / grey), **Tripo cow + calf** (one hide), foals; grazing = head-down pitch, walk / trot = procedural body motion (no leg animation) |
| **stable yard, round pen** | trainer + riders from the peasant model + clips | **Tripo villagers** (man / woman), frozen standing pose for every non-walk clip |
| **livestock pens, cart horses** (`wslife`) | cow (5 hides), horse (3 coats), sheep, pig with `Idle/Eating/Walk` clips | **Tripo cow, 3 horse coats, sheep, pig** (static, procedural gait), cart horses = Tripo horses |
| **worksite people** (`wslife`, up to ~210 agents on the home map) | peasants with tools in hand, work / sit / kneel / talk clips | **4 Tripo villagers** (man, woman, young man = axe + pick workers, old man = fisherman), baked-animation crowd kinds (same 2–5 draws), **no tools in the hands, no work poses** (frozen standing frame) |
| **town villagers** (`units.js`, 6 walkers / kneelers / talkers) | peasant + a head built by `peasanthead.js` | **Tripo villager_man / woman** (head included) as plain skinned characters |
| **sky / fields** (`life.js`) | eagle, crows with flap clips; hens | **Tripo eagle** (circling + banking, no flap), **6 crows gliding in a ring over the fields**, **8 hens + 2 roosters + 4 chicks** (`poultry_fish_pack`) with the same walk / peck brain |
| **dogs / wolf packs** (`life.js`) | old dog / wolf | **Tripo dog / wolf** herds (bob + sway while walking) |
| **lake** (`water_life.js`) | leaping fish = ellipsoid + tail | **Tripo carp** tumbling through the same arc |
**Not replaced:** the army (all of `bunits / unitlook / army / battlesim`, incl. the war horses), swans / mallards (no model in the library — gap 14c), the shader fish school under the water (silhouettes, not models), `pas_stable.js` (pure geometry — nothing to swap), `peasanthead.js` / old models stay as the fallback.

## What the player sees WORSE than before (honest list)
1. **Animals do not move their legs.** The library animals are static meshes (no rig, TR2_gaps 14). `tr2_life.js` gives them a procedural gait (bob / roll / pitch scaled with speed, head-down pitch for grazing, a hop for `Jump`): they glide. Foot sliding is visible when one walks across the paddock at close zoom; from the game camera (min distance 90 m) a horse is ~25 px long and it reads as walking.
2. **Villagers have one clip (`walk`).** Idle = the walk frame where the feet are together (found by `study()`, feet 0.15–0.17 apart); work / kneel / sit / talk / torch clips all show the same standing pose. **No tools** in their hands (the old tool props were fitted to the old rig; the Tripo biped has `L_Hand / R_Hand` bones — gap 18). **Fishermen in the boats stand** (the old ones sat with a rod).
3. **Birds do not flap** (eagle static flying pose; crows now glide in a ring instead of flapping around).
4. **One cow hide** instead of five (kit: black, black-white, red, brown-white …).
5. Far figures (> 150 m) are still the old LOD2 capsules (coloured cloth / legs), not Tripo-textured.

## What is in the patch
**New:** `client/src/tr2_life.js` (≈ 210 lines; the only new module) · 16 GLBs in `web/assets/tr2/` (**2.09 MB**, all textures 512 px = the S2 default) · `dev/tr2_s4d_test.sh`, `dev/tr2_s4d/` (node test, headless-browser check, harness page, in-game frame / budget / close-up scripts) · `TR2_gaps_S4d.md`.
**`tr2_life.js` API:** `preload()` (never throws; `ready()` false → every caller keeps the old code), `fauna(spec, {len, capacity})` → crowd-kind-like instanced kind (`add / remove / update`, clip names → procedural gait), `horses()` (3 coats behind one object), `people(key, {capacity, lod2})` → baked-animation `createKind` from the Tripo biped (calibrated: height in metres, feet on y = 0, `Walk_Loop` stretched ×1/0.6 so `stats.walkSpeed` ≈ 2 m/s = the old people's pace, every other clip name = frozen frame), `skinned(key)` (one plain skinned character for `units.js`), `gltfLike(spec)` (static model for `makeCreature` / `herd`), `dyn(spec, n)` (n dynamic instances).
**Hooks in shared / not-mine files (every line below carries `// TR2-S4d:` or sits inside a block that does; `diff` vs kit p47):**
| file | role | lines (new file numbering) | +/− |
|---|---|---|---|
| `world.js` | HOOK (S4d: 2 lines) | 48, 74 | +2 −0 |
| `wslife.js` | HOOK (models + animals) | 17, 23, 191–194, 201–205, 218–223, 289–290, 317, 447 | +21 −5 |
| `units.js` | HOOK (peasant part) | 10, 48–56, 76–78 | +13 −2 |
| `pas_life.js` | OWNED | 26, 191–219, 221, 227–228, 230–233, 236, 238, 483–499 | +56 −26 |
| `life.js` | OWNED | 18, 116, 128–141, 170–203, 205, 267, 331–332, 336, 339 | +56 −3 |
| `water_life.js` | OWNED | 14, 305–306 | +3 −1 |

Shared-file lines are all inside blocks that start with `// TR2-S4d:` and every block has a fallback: `if (TL.ready() && …) { Tripo } else { the old code, unchanged }`. `world.js` = `import` + one `await TL.preload()` after `loadAssets` (2 lines, limit 6). The two clamp lines of S4b in `wslife.js` (`Math.min(30, …)`) are untouched. Unchanged on purpose: `pas_stable.js`, `peasanthead.js`, `crowd.js` (no change needed), `world.js` l. ≈ 504 (`buildWsLife` models argument — `wslife.js` ignores it when Tripo is ready).

## Proofs
- **`GATE_W: ALL OK`** (34 OK lines incl. `ws_test`, `wsroute_test`, `tr2_tiers_test`, battle sim 0 crossings), **noRoute 667** (unchanged: S4d adds no targets / solids).
- **`bash dev/tr2_s4d_test.sh` → `TR2 S4D OK`** (≈ 50 lines): 16 GLBs valid and 2.09 MB · five life modules + world bundle for the browser · only S4d's files changed and `world.js` ≤ 6 marked lines · **fallback**: before `preload` every entry point (`fauna / horses / people / skinned / gltfLike / dyn`) returns null / false · headless browser: all 16 files load without error, villagers calibrated to 3.00 / 2.80 / 3.00 / 2.90 m (raw rig 0.98–0.99 × k 2.87–3.06) with feet on y = 0, idle frame found (feet 0.15–0.17 apart), walking speed 1.84–2.06 m/s, eagle / crow / dove 4 m wingspan, hen / rooster / chick / carp / trout instances, non-empty frame, **21 draw calls / 101 k tris** for the whole menagerie (7 animals + 3 horse coats + 4 villager kinds + birds + poultry).
- **In-game, real map lv 30** (`dev/tr2_s4d/game.py`, 1280 × 720): `window.__tr2life` = ok, animals + people, **16 files, 0 errors**, console clean (0 page errors / warnings). Frames (all opened): `h_past` paddock + stable yard (3 horse coats, cows, foals, villagers), `h_stock` stable + pens, `h_farm` farm (villagers working the fields, cows, sheep, pig), `h_lumber`, `h_fish` lake (fishermen on rafts, standing), `h_yard` town square (villagers), `s_top`, `s_ctr`, `s_town`, `s_past`, `s_lake`, `game_c_farm_close` (workers, cows, sheep, pig, cart), and `close_*` (the camera aimed at real S4d objects found in the scene, `dev/tr2_s4d/close.py`): horses (white / black coats), cow, sheep pen, pig, a boat fisherman, the lake fishery, the **Tripo carp** (placed by hand in front of the camera). Models alone: `harness_f1…f3` (7 animals, 3 horse coats, eagle / crow / dove, hen / rooster / chick / trout, 4 villagers; I looked at all three). **Frames that are NOT usable and why:** `broken_camera_fields_*` (the old `fields` camera pose is behind the mountain wall — same in the kit); a close villager shot at `minD` = 3 shows a terrain-tile void (camera glitch at that distance, not an S4d object) — villagers are judged from `h_*`, `c_farm`, the harness and the numbers.
- **Fallback proved IN the game** (`photos …/fallback_*`): the same game with `assets/tr2/` removed (every `tr2` request 404 → `preload` ends with `ready() = false`) builds **exactly the kit scene** (884 meshes, 166 programs, 98 skinned — identical to the unmodified kit build; h_past 512 calls / 3,863,762 tris vs kit 512 / 3,864,202) and shows the old peasants / horses / cows.
- **Old vs new:** `sheet_old_new_pasture.png` (kit h_past + s_past next to S4d's).

## Budget (software GL, lv 30, Q = low; median of 5 samples of 3 frames; kit p47 vs S4d)
| view | calls KIT | calls S4d | Δ | tris KIT | tris S4d | Δ |
|---|---|---|---|---|---|---|
| hero 1: paddock + stable yard (pasture) | 512 | 494 | -18 | 3,864,202 | 3,945,950 | +2 % |
| hero 2: stable + livestock pens | 243 | 232 | -11 | 1,744,021 | 1,739,989 | -0 % |
| hero 3: town square (villagers) | 371 | 361 | -10 | 2,476,460 | 2,450,513 | -1 % |
| strategic: top | 516 | 502 | -14 | 3,517,631 | 3,582,881 | +2 % |
| strategic: centre | 478 | 468 | -10 | 2,992,403 | 3,176,807 | +6 % |
| strategic: town side | 489 | 482 | -7 | 2,930,172 | 3,032,637 | +3 % |
| strategic: fields side | 523 | 505 | -18 | 3,807,581 | 3,881,631 | +2 % |
| strategic: pasture side | 546 | 527 | -19 | 4,006,585 | 4,192,079 | +5 % |
| strategic: lake | 260 | 254 | -6 | 1,682,002 | 1,670,810 | -1 % |

programs KIT 166 → S4d 162 · textures (info.memory) KIT 437 → S4d 410 · geometries KIT 564 → S4d 558 · instanced meshes 306 → 295 · skinned meshes 98 → 71 · scene meshes 885 → 856

(Measured before the ×0.6 walk-clip stretch — it changes only the length of the baked animation texture, not draws or tris; the gate / tests / frames were re-run after it.)
- **Draw calls: −6 … −19 in every view.** Tris: −1 … +6 % (worst: centre +6 % = Tripo villager 3 k tris vs the old peasant; pasture +2…+5 %). Programs **−4** (the old animated crowd kinds + their shader variants are gone: 166 → 162; Tripo adds 0 — it is the S2 shared material), skinned meshes −27, textures −27, geometries −6.
- **Texture memory:** 16 textures, all 512 px = **21.3 MB GPU** (1.33 MB each, ≈ 16 MB decoded RAM) — all resident on the home map (every species appears). The old animals / people are no longer drawn, so their textures are never uploaded (the `info.memory.textures` count shows −27).
- **Download:** +2.09 MB (16 GLBs). The old models that S4d no longer draws are still loaded by `assets.js` — **removable by the mother after checking nobody else asks for them: `peasant_m` 0.24 · `peasant_f` 0.20 · `cow` 0.51 · `wolf` 0.49 · `eagle` 0.19 · `crow` 0.14 · `an_sheep` 0.15 · `an_pig` 0.15 = 2.07 MB** → net +0.02 MB. **Not removable:** the three `horse_m2m_*` (the army's cavalry / axe riders / lord use them: `bunits.js`), `anims.glb` (rangers).
- Frame-time / phone fps: **not measured** (software GL ≈ 0.3 fps).

## Decisions taken by default (owner may change by number)
1. **512 px** textures for all 16 (S2 default: animals / people). 2. **Villager heights:** man 3.0 m, woman 2.8, young man 3.0, old man 2.9 (the game's 1.75 × heroic scale; the old peasants were ≈ 3.1 m). 3. **Walk clip ×0.6** (library walk = 3.4 m/s for a 3 m figure, the game's people have always walked ≈ 2 m/s with the clip at ≈ 0.65 ×): `stats.walkSpeed` = 1.84–2.06 m/s, callers' rate maths unchanged. 4. **Horse coats:** 0 bay → `animal_horse_brown`, 1 black → `animal_horse_black`, 2 grey → `animal_horse_white`. 5. **Crows glide** (6 over the fields) — the old flap clip has no replacement. 6. **Boat fishermen stand** (no sit clip). 7. Old models stay as the fallback and are not deleted.

## NOT proven / not done
- **Phone fps / shader compile / texture upload time** (software GL only). **Motion looks:** I saw the frames, not video — the gliding gait, the procedural graze pitch, the villager walk at 0.6× and the frozen "idle" are judged from stills and numbers (feet separation, speed), not from a moving picture.
- **Seen in frames:** horses ×3 coats, cows, calves / foals, sheep, pig, villagers (units + crowd), crows / eagle (dark birds in the sky, small), the carp placed by hand. **Not seen in a game frame:** the dog / wolf herds, hens / roosters / chicks at the farms (the harness frame shows them; in-game I only know the code ran without errors — the finder found no visible hen instance), a real carp leap (placed by hand — a 0.85 s event every ~20 s).
- **Pre-existing, not mine (kit has it too, measured identical by a probe on the unmodified kit):** the jetty-tip fishermen of the lake fishery stand at the lake-bed height (**y = −2.95…−2.99 vs water −0.7: chest-deep in the lake**, 5 of 10 fixed fishers on the home map) — `wslife.spawnFishery` uses `height(wx, wz)`; S4b / the mother should use the jetty deck (≈ water + 0.4). With the bigger standing Tripo figure it shows a little more.
- The `fields` camera pose of the old perf scripts puts the camera behind the mountain wall (broken frame in the kit too); I used `target (200, 40) azim 0.6` instead (`dev/tr2_s4d/game.py`).
- Server / other stages: nothing. Swans, mallards, goat, donkey / camel slots, child / old-woman villagers: `TR2_gaps_S4d.md`.

## Pitfalls (new)
- **tr2lib bug (S2 file, not edited):** `tr2.parts()` for pack nodes (`birds/*`, `poultry_fish_pack/*`, every `*_pack` node) resets the node's translation and scale → the part is **centred** (base at −h/2) and the swap `k` is off by 1/(node scale) (dove 7.9 m instead of 1.1 m). `tr2_life.js partsOf()` re-bases by bounding box and always passes `w` / `h`; **S3 / S4a / S4c will hit it with trees, rocks, lamps** — fix in `tr2lib.parts`.
- **Camera polar is measured from the vertical** (0 = looking straight down) and `zoomPolar()` overrides it every frame from the distance; the game's `minD` is 90 m. To look at models close, set `c.minD`, `c.pNear`, `c.pFar` (`dev/tr2_s4d/close.py`).
- `pkill -f` / `ps | awk '/chrom/ … | xargs kill'` kills **your own shell** if the pattern is in the command line (happened again, twice) — use `ps -eo pid,cmd | grep "[x]yz"` with the bracket trick and kill by pid.
- A fresh `dev_s35.html` needs `dev/app_s35/wall.js` → `../app_dbg.js`; the game loads in ≈ 2 min in software GL at Q = low (the S2 note says 8 min at Q = high); one browser job at a time.
- A first `renderer.info` sample after a camera jump can be 30–70 % too high (shadow-map refresh): the budget table uses the median of 5.

## How the mother applies it
`patch_TR2_S4d.tar.gz` (built with `workers/tools/mkpatch.sh`, 23 changed files vs the kit p47 snapshot): `owned/` = `client/src/tr2_life.js` (new) + 16 GLBs in `web/assets/tr2/` + S4d's own files `pas_life.js`, `life.js`, `water_life.js` (whole files) · `shared/client/src/{world,wslife,units}.js.diff` (hook lines only; apply from the `bluewall/` folder with `patch -p1 < file.diff` — checked: applies cleanly on the p47 snapshot and gives byte-identical files) · `dev/` = `tr2_s4d_test.sh` + `tr2_s4d/` (test, harness, in-game scripts) · `REPORT.md`, `TR2_gaps_S4d.md`. After applying: `bash dev/tr2_s4d_test.sh` (→ `TR2 S4D OK`), `bash dev/gate_w.sh` (→ `GATE_W: ALL OK`).
`photos_TR2_S4d.tar.gz`: 32 frames (`game_*` S4d in the real game, `kit_*` the unmodified kit, `fallback_*` S4d with `assets/tr2/` removed, `close_*`, `harness_*`, `sheet_old_new_pasture.png`).
