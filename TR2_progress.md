# TR2_progress — worker TR2 (Tripo library into Blue Wall, everything except the army)
Round 2 (S1b) · 14 Oct 2026 · kit **p45** (installed on the owner's server 14 Oct; A3 / L1S / D2 / PPL not started, nothing merged on top of p45) · `GATE_W: ALL OK`, noRoute **667** / limit 700.
Read first: `claude/TR2_WIRE_PROMPT.md` (Project). Setup: `add_repo` (Blu-Rez/bluewall-assets, push) → `git clone --depth 1 --branch kit … /home/claude/bot/bluebot_v2` → `bash …/workers/setup_kit.sh` → `bash /home/claude/dev/gate_w.sh`; library: `git clone --depth 1 --branch lib-tripo … /home/claude/lib`. Continue from `inbox/TR2_*`.

## Stage table (weights from the prompt)
| stage | weight | state | notes |
|---|---|---|---|
| S0 setup, baseline, map, sheet | 5 % | **done** (answers pending, defaults apply after 15 min) | `TR2_map.md`, `TR2_gaps.md`, `TR2_baseline.md`, 2 contact sheets, question sheet D1–D8 sent |
| S1 model prep | 10 % | **≈ 75 %** (S1b done for directional models; packs + old-vs-new sheets left) | done: whole-library inventory (`lib_inv.json`), Khronos validator 0 errors / 226, old-slot sizes (`old_sizes.json`), scale rules + wall/tower/gate analysis (`TR2_swap.md` v0). **Not done:** facing/yaw by LOOKING at every used model (S1b), 2K→1K for `civic_hall_0/1` + `windmill_tower`, slimming over-budget models (`castle_wall_wood/iron/diamond_green`, `tavern_*`, `market_hall`, `brewhouse`, `fishing_hut_1`, `armory_0`), nature/lamp/prop target sizes, old-vs-new sheets at game camera + phone size, `preview.png` |
| S2 loader + material + tiers | 15 % | not started | design decided, see below |
| S3 castle | 12 % | not started | |
| S4 town and world | 20 % | not started | |
| S5 free layout | 20 % | not started | |
| S6 new building + defence | 8 % | not started | defaults: armory (`armory_1` recommended, `armory_0` lumpy), `def_catapult` |
| S7 QA and delivery | 10 % | not started | |
**📊 progress ≈ 12 %** (S0 5 % + 75 % of S1).

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
