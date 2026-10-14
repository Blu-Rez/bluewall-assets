# TR2_progress — worker TR2 (Tripo library into Blue Wall, everything except the army)
Round 4 (S4d on top of S2; S3 / S4a / S4b / S4c run in other chats) · 14 Oct 2026 · kit **p47** (TR2-S2 included) · `GATE_W: ALL OK`, noRoute **667** / limit 700.
Read first: `claude/TR2_WIRE_PROMPT.md` (Project). Setup: `add_repo` (Blu-Rez/bluewall-assets, push) → `git clone --depth 1 --branch kit … /home/claude/bot/bluebot_v2` → `bash …/workers/setup_kit.sh` → `bash /home/claude/dev/gate_w.sh`; library: `git clone --depth 1 --branch lib-tripo … /home/claude/lib`. Continue from `inbox/TR2_*`.

## Stage table (weights from the prompt)
| stage | weight | state | notes |
|---|---|---|---|
| S0 setup, baseline, map, sheet | 5 % | **done** (owner answers applied: D7 = keep_2 at all levels, rest default) | `TR2_map.md`, `TR2_gaps.md`, `TR2_baseline.md`, 2 contact sheets, question sheet D1–D8 sent |
| S1 model prep | 10 % | **≈ 90 %** (S1b + S1c done: facing of 166 models, sizes + yaw of all 169 pack nodes, old-vs-new sheets close + phone, 11 gaps1 models slimmed/oriented; `preview.png` per model NOT made) | done: whole-library inventory (`lib_inv.json`), Khronos validator 0 errors / 226, old-slot sizes (`old_sizes.json`), scale rules + wall/tower/gate analysis (`TR2_swap.md` v0). **Not done:** facing/yaw by LOOKING at every used model (S1b), 2K→1K for `civic_hall_0/1` + `windmill_tower`, slimming over-budget models (`castle_wall_wood/iron/diamond_green`, `tavern_*`, `market_hall`, `brewhouse`, `fishing_hut_1`, `armory_0`), nature/lamp/prop target sizes, old-vs-new sheets at game camera + phone size, `preview.png` |
| S2 loader + material + tiers | 15 % | **done** | `tiers.js` + `TR2 TIERS OK`, structure modules generalised (bit-identical at cap 30), `tr2lib.js` (loader, shared material, bake / instances, lazy tiers), destruct-hook frames, programs / texture numbers, texture-size finding (512 default) — see `report_TR2_S2.md` |
| S3 castle | 12 % | not started | |
| S4 town and world | 20 % | **S4d done** (animals + villagers; ≈ 1/4 of S4); S4a / S4b / S4c in other chats | `report_TR2_S4d.md`, `TR2_gaps_S4d.md` |
| S5 free layout | 20 % | not started | |
| S6 new building + defence | 8 % | not started | defaults: armory (`armory_1` recommended, `armory_0` lumpy), `def_catapult` |
| S7 QA and delivery | 10 % | not started | |
**📊 progress ≈ 29 %** (S0 5 % + S1 ≈ 9 % + S2 15 %).

## Numbers (baseline, kit p45, home map lv 30, software GL, Q=high — NOT a phone number)
- shader programs **203**, materials 551, meshes 1091, casters 452 (`dev/p39_progs.py 30`)
- `web/assets` 73 MB (144 GLBs; kits `kit_ws_p3` 4.3 MB unused, `anims` 2.6 MB, `troll` 1.6 MB …)
- draw calls / tris at the game camera: see `TR2_baseline.md` (`p38_perf.py perf 30`)
- noRoute 667 (limit 700): **only 33 spare — every stage that adds targets/solids must re-measure**

## Decisions the design already follows (from the code, S0)
1. **Destruct hook** (`destruct.js patchDestruct`) works on any `MeshStandardMaterial` (vertex `begin_vertex` + fragment `diffuseColor`), but needs a per-vertex `aB` = target id and WORLD-space vertices → every destructible Tripo piece is **baked into the Batcher/`bakePieces` mesh with `aB`**, never an InstancedMesh. `a1_rings.js` hides unbuilt rings by collapsing vertices through `aB` → same mechanism keeps working.
2. **Targets stay per old wall segment** (`castle.js wallRun` calls `ctx.tgt` once per segment); Tripo pieces of a segment share its `aB`. This keeps noRoute at 667.
3. **Wall slot length per ring** `L = H / 0.68` (outer 14.0, inner 23.5, town 12.1 m), per-tier z-stretch 0.79–1.15 (`TR2_swap.md`).
4. **Tower by ring**: outer + town → `castle_tower_medium_<tier>`, inner → `castle_tower_tall_<tier>`, short → gate flanks/bridge heads/watch posts. Tower tops carry war machines (`wk`: ballista, cannon, wizard, frost, flame): top height / platform must be read per model in S3.
5. **Tier module** (S2): `tiers.js` with `LEVEL_CAP` (from payload `max_level`), `TIER_TABLE`, `tierState(level)`, `pieceTier(level, slotIndex)`; generalise `skin.js TIER_AT/to20`, `b2_homes.js`, `b3_civic.js` (+ own `tierOf` in `worksites/wsbuild/wslife/c1,c2,c4_kinds/levels/upgradeui/bsheet` decided per file). **Army copies untouched:** `bunits.js`, `unitlook.js`, `battlesim.js UNIT_TIER_AT`, `army.js`, `armyplan.js`, `armyui.js`.
6. **One shared material config** for all Tripo models (MeshStandardMaterial + map, shadows on, no alpha blend) + destruct patch; measure programs before/after (`Q=high python3 dev/p39_progs.py 30` = 203 now).

## Pitfalls (new, this round)
- `dev_s35.html` needs `dev/app_s35/wall.js` → `ln -s ../app_dbg.js` (setup_kit.sh does not create it); `tr1_sheet.html` needs `dev/three` → `client/node_modules/three` and the library linked into the dev root (`ln -s /home/claude/lib/lib dev/tripo_lib`), else browser jobs hang silently.
- A browser job takes ≈ 8 min to load the home map at lv 30 (software GL); one browser job at a time.
- **Never `pkill -f` / `pgrep -f` a pattern that also appears in your own command line** — it kills the shell (happened twice).
- Bash timeout is 10 min: run `setup_kit.sh` and browser jobs with `setsid nohup … &` and poll.

## Owner questions (S0 sheet) — defaults if no answer
D1 cap 50 · D2 pure tiers 1/7/13/19/26/32/38/44/50, half/half from 4/10/16/23/29/35/41/47 · D3 rows 1–10 / 11–20 / 21+ · D4 sample first, then A + B (C only if safe; confirm «دیدار» = «دیوار») · D5 armory (`armory_1`) · D6 `def_catapult` · D7 `castle_keep_stone_1` all levels · D8 one model per house/civic kind. Assumption: gem mines ruby/emerald/turquoise = `dia_mine_red` / `dia_mine_green` / `gem_mine_turquoise`.

## Next step (round 2)
1. Read the owner's answers (if any), else defaults.
2. S1b: look at every used model from 4 sides (facing/yaw), fix 2K→1K, slim the over-budget ones with `slim_uv.mjs`, size nature/lamps/props/traps nodes, `TR2_swap.md` v1 + `tr2_swap.json`, old-vs-new sheets, `preview.png` per model.
3. S2: `tiers.js` + `dev/tr2_tiers_test.sh`, shared Tripo material + lazy tier loading + destruct baking.

## Round 2 — S1b (owner answers applied: D7 = `castle_keep_stone_2` at all levels; D1–D8 otherwise default)
Done (pushed as `inbox/TR2_S1b`): 166 directional models looked at from 4 sides → front/`ry` per model (`tr2_swap.json`, `TR2_swap.md` §6; 21 sheets `sheet_TR2_S1b_front_NN.png`). **Key finding: buildings face +X, not +Z** (117 of 166). 11 models slimmed / shrunk to 1K and checked side by side (`ship_TR2_S1b.tar.gz`, §7). **Tool bug found:** TR1's `slim_uv.mjs` corrupts already-quantised library files (grey + warped) — fixed (`dequantize()` first), tools in `tools_TR2_S1b.tar.gz`.
Not done (S1c): sizing of pack nodes (trees ×~80, rocks, bushes, plants, ground cover, lamps ×47, props, traps ×~12, crops, market stalls) against the old `trees.js`/`sc_rocks.js` scales and lamp heights; old-vs-new sheets at the game camera and at phone size; per-model `preview.png` (the 4-view sheets cover the directional ones).
Pitfalls (new): the render rig is `r_root/` (`tr2_views.html` + `views.py`, static server `python3 -m http.server 8777` from that dir, `three` and `lib` symlinked in) — one sheet of 8 models × 4 views renders in ≈ 5 s, so contact sheets are cheap; `pkill -f` kills your own shell if the pattern is in the command line (happened again this round).
## Next step (round 3)
1. S1c (packs sizing + old-vs-new sheets), short.
2. S2: `tiers.js` + `dev/tr2_tiers_test.sh` (`TR2 TIERS OK`), `tr2lib.js` loader (applies `ry` from `tr2_swap.json`, bakes with `aB`, one shared material), destruct compatibility test on a baked Tripo wall, programs/memory numbers.

## Round 3 — S1c + S2 (pushed as `inbox/TR2_S2`)
Done: S1c (pack sizes: `TR2_swap.md` §8, `tr2_swap.json` v2 with 11 gaps1 models + 169 nodes); S2 (see `report_TR2_S2.md`): `tiers.js`, cap-generalised structure modules, `tr2lib.js`, `dev/tr2_tiers_test.sh` → `TR2 TIERS OK`, `dev/tr2_s2/` browser proof, `GATE_W: ALL OK` (noRoute 667), draw calls / tris within ±2.5 % of the baseline, programs: batched Tripo +0 (instanced +1/+2).
**Decisions taken by default (owner may change by number):** texture size at ship time **512** (castle / houses / civic / production / defence / traps / bridges / animals / people), **1K** keep + civic hall + market hall, **256** nature / lamps / small props (frames: `sheet_TR2_S2_texsize_*`); cap hook = one line in `econ.js`.
Not done: `preview.png` per model; wiring `tr2lib` into builders (S3 on); worksites / `c1–c4` / `wsbuild` / `wslife` clamp the level at 30 and have their own 5-tier `tierOf` (S4b); server cap 50 (S7).
Pitfalls: see `report_TR2_S2.md` (static server root for perf scripts; `tiers.js` must stay import-free).
## Next step (round 4) — S3 castle
1. Re-ship the castle models at 512 (`tools/tr2_retex.mjs`), ship only used keys; wall slot length per ring (`L = H / 0.68`), tower by ring, gates, keep `castle_keep_stone_2`, corners (`castle_wall_corner_stone`, ry 90), quay.
2. Wire `tr2.bake` into `castle.js` (per-segment `aB`, `ctx.tgt` unchanged → noRoute stays 667), tiers via `pieceTier(level, slot)` / `singleTier`, `tr2.ensureLevel` in the level hook.
3. Frames at lv 1 / 7 / 13 / 19 / 26 / 32 / 38 / 44 / 50 (+ half/half + a destroyed wall), `GATE_W`, noRoute.

## Round 4 — S4d animals + villagers (pushed as `inbox/TR2_S4d`)
Done: `tr2_life.js` (fauna / horses / people / skinned / gltfLike / dyn) + 16 GLBs at 512 px (2.09 MB); `pas_life` (horses ×3 coats, cows, calf, villagers), `wslife` (4 villager crowds, cow / horse ×3 / sheep / pig), `life` (eagle, 6 crows, hens / rooster / chicks, dog / wolf), `units` (town villagers), `water_life` (leaping carp); `world.js` +2 lines. `GATE_W: ALL OK` (noRoute 667), `TR2 TIERS OK`, `TR2 S4D OK`. In the real game (lv 30): 0 errors, 16 files, draw calls −6…−19, programs −4, tris −1…+6 %; fallback (no `assets/tr2`) = the kit scene exactly.
Honest limits: animals have no leg animation (procedural glide), villagers have only `walk` (other clips = frozen pose, no tools, boat fishermen stand), birds do not flap, one cow hide. Details + gaps: `report_TR2_S4d.md`, `TR2_gaps_S4d.md`. Found: `tr2lib.parts()` pack-node bug (S2 file); jetty-tip fishermen stand at lake-bed height in the kit too (S4b).
## Next step (S4d follow-ups, if the owner wants)
1. Buy / generate: quadruped rig + clips, bird flap clips, villager clips (idle / work / sit / kneel / talk) + tool props, 2–3 cow hides, swan / mallard (see `TR2_gaps_S4d.md`).
2. Mother: remove the unused old models (2.07 MB list in the report), fix `tr2lib.parts` for pack nodes, lift the tip fishermen onto the jetty deck (S4b).
