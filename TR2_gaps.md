# TR2_gaps — what the game has (or needs) that the Tripo library cannot cover yet
TR2 S0 · 14 Oct 2026 · give this file to the model-maker chat (TR1). Nothing here is hand-built or recoloured by TR2.

## خلاصه برای وینگلس
چیزایی که مدل ندارن (برای چت مدل‌ساز): کنگره‌ی ۹پوسته‌ای قلعه‌ی اصلی، گلخانه، معدن طلا، طلاشویی، سنگ‌تراشی، کوره‌ی ذوب، دامداری، اسکله‌ی رودخونه، برج دیدبانی دفاعی، مانع خاردار — و پوسته‌های ۹تایی برای خونه‌ها و ساختمون‌های شهر (الان فقط یه مدل برای هر نوع داریم).

## 1. Missing models (no library entry) — ask TR1 to buy/generate
| # | what | where the game needs it | today's fallback |
|---|---|---|---|
| 1 | **keep in the other 8 tiers** (wood, iron, gold, 5 diamond colours) | castle.js keep, 9 tiers by level | stone keep at all levels (D7) |
| 2 | **greenhouse** (گلخانه) | `WS_KINDS.greenhouse` | old procedural/kit piece stays |
| 3 | **gold mine** (معدن طلا) | `WS_KINDS.gold` | old kit piece stays |
| 4 | **gold panning** (طلاشویی) | `WS_KINDS.panning` (outside the town) | old kit piece stays |
| 5 | **masonry / stone-cutter's lodge** | `WS_KINDS.masonry` | old kit piece stays |
| 6 | **smelter / smeltery** | `WS_KINDS.smelter` | old kit piece stays |
| 7 | **livestock pen** (دامداری) | `WS_KINDS.livestock` | `barn_0/1` + fence + animals |
| 8 | **river quay / jetty wall** | `riverQuay` castle.js:241-259 | old procedural stays |
| 9 | **wall corner / end piece** | wall rings | towers at joints |
| 10 | **defensive watchtower** (برج دیدبانی دفاعی) | `defplan` `watchtower` | short castle tower of the current tier |
| 11 | **hedgehog / spike barrier** (مانع خاردار) | `defplan` `hedgehog` | trap-pack node if one fits (S1) |
| 12 | **civic wing** (ساختمان فرعی شهر) | b3_civic `cv_wing` | dropped / `clock_tower` |
| 13 | **tier variants of houses and civic** (9 each) | D8: one model per kind today | one model at all levels |
| 14 | **animated animals** (Quadruped rig: walk/idle/graze) | pasture horses, cows, sheep, dogs, wolves | static models |
| 15 | **bird flap clips** | crows, eagles | static flying pose |
| 16 | **idle / run / work clips for people** (only `walk`) | villagers, workers | freeze frame of `walk` |
| 17 | extra generic houses (≈109 slots, 4 models) | town.js | variants by yaw / scale / slot |

## 2. Over budget in the library (S1 slims with `slim_uv.mjs`, never `sloppy`)
| model | tris | budget | note |
|---|---|---|---|
| tavern_0 / tavern_1 | 12.5k / 12.8k | ≤ 8k | TR1: lumpy below this — maybe keep as hero building |
| market_hall | 10.3k | ≤ 8k | |
| brewhouse | 8.8k | ≤ 8k | |
| fishing_hut_1 | 9.2k | ≤ 8k | |
| armory_0 | 8.3k | ≤ 8k | D5 default → `armory_1` (6.3k) if it looks right |
| castle_wall_wood / _iron / _diamond_green | 3.4k / 2.4k / 2.1k | ≤ 2k | 9 tiers × many pieces → this matters most |
| castle_keep_stone_1/2 | 18.2k / 17.9k | ≤ 20k (keep) | 2K texture allowed for the keep only |
| 2K textures | `civic_hall_0/1`, `windmill_tower` | → 1K | |
| packs (trees, rocks, lamps, props, traps) | 6–15k per PACK | per item ≤ 1.5k / 3k | check the node count in S1 |

## 3. Technical risks found in S0 (not model gaps)
- **Destruct hook is compatible with textured models, with one condition:** `destruct.js` patches any material (`patchDestruct(mat)`: vertex `begin_vertex` + fragment `diffuseColor`), but it reads a per-vertex attribute `aB` (target id) and works on WORLD-space vertex positions. So walls/towers/houses must be **baked into world-space merged geometry with `aB`** (Batcher / `bakePieces`), **not** left as InstancedMesh (local-space → the collapse maths would break). Meshopt/quantised attributes → `toFloatGeo` first (already in `assets.js`). `MeshoptDecoder` is already wired in `assets.js`.
- **Shader programs:** the skin shader (`skin.js applySkin`) creates its own programs; Tripo models use ONE `MeshStandardMaterial + map` config + the destruct patch → expected +1..2 programs. Measured number: see `TR2_baseline.md`.
- **Texture memory:** 226 models each with their own 1K WebP texture ≈ 5.3 MB GPU each with mips; wall/tower/gate ×9 tiers must load only the current (± next) tier.
- **Meadow / forest density:** the game's meadow and forest are thousands of procedural instances; a Tripo clump at ~1k tris × thousands breaks the tris budget → Tripo near the camera + existing impostors/LOD far (decided in S4c with numbers).
- **Crowd animation:** `crowd.js` bakes skeleton animation into a texture; the Tripo Biped (78 joints, `walk` only) must be tested through that path (S4d), otherwise villagers fall back to individual SkinnedMesh at a capped count.
