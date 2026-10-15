# TR2_progress — worker TR2 (Tripo library into Blue Wall, everything except the army)
Round 4 (S3 castle) · 14 Oct 2026 · kit **p45 + TR2_S2** (S2 merged by the mother, GATE OK) · `GATE_W: ALL OK`, noRoute **667** / limit 700.
Read first: `claude/TR2_WIRE_PROMPT.md` (Project). Setup: `add_repo` (Blu-Rez/bluewall-assets, push) → `git clone --depth 1 --branch kit … /home/claude/bot/bluebot_v2` → `bash …/workers/setup_kit.sh` → `bash /home/claude/dev/gate_w.sh`; library: `git clone --depth 1 --branch lib-tripo … /home/claude/lib`. Continue from `inbox/TR2_*`.

## Stage table (weights from the prompt)
| stage | weight | state | notes |
|---|---|---|---|
| S0 setup, baseline, map, sheet | 5 % | **done** (owner answers applied: D7 = keep_2 at all levels, rest default) | `TR2_map.md`, `TR2_gaps.md`, `TR2_baseline.md`, 2 contact sheets, question sheet D1–D8 sent |
| S1 model prep | 10 % | **≈ 90 %** (S1b + S1c done: facing of 166 models, sizes + yaw of all 169 pack nodes, old-vs-new sheets close + phone, 11 gaps1 models slimmed/oriented; `preview.png` per model NOT made) | done: whole-library inventory (`lib_inv.json`), Khronos validator 0 errors / 226, old-slot sizes (`old_sizes.json`), scale rules + wall/tower/gate analysis (`TR2_swap.md` v0). **Not done:** `preview.png` per model |
| S2 loader + material + tiers | 15 % | **done** | `tiers.js` + `TR2 TIERS OK`, structure modules generalised (bit-identical at cap 30), `tr2lib.js` (loader, shared material, bake / instances, lazy tiers), destruct-hook frames, programs / texture numbers, texture-size finding (512 default) — see `report_TR2_S2.md` |
| S3 castle | 12 % | **done** | `castle_tr2.js`: walls / towers / gates / keep from Tripo in 9 tiers + half/half, hi/lo LOD cells, destruct + rings work, 56 GLBs 5.3 MB — see `report_TR2_S3.md`; budget: strategic +1.6…2.4 % calls / ≤ +3.4 % tris, ground views +5…+10 % tris, **+6…8 calls (net rule «≤ 0» not met)** |
| S4 town and world | 20 % | tracked in the S4a–d chats (TR2_SPLIT.md) | not counted here |
| S5 free layout | 20 % | **done (client + server spec)** — pushed `TR2_S5`, `TR2_S5_server` | editor, sample (house + storehouse moved on the real map), real-pointer test, 12 rules, 85 movable things; see `report_TR2_S5.md`. Server = the owner's |
| S6 new building + defence | 8 % | not started | defaults: armory (`armory_1` recommended, `armory_0` lumpy), `def_catapult` |
| S7 QA and delivery | 10 % | not started | |
**📊 progress ≈ 61 %** of the stages counted in this file (S0 5 % + S1 ≈ 9 % + S2 15 % + S3 12 % + S5 20 %; S4 is counted in its own chats).

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
D1 cap 50 · D2 pure tiers 1/7/13/19/26/32/38/44/50, half/half from 4/10/16/23/29/35/41/47 · D3 rows 1–10 / 11–20 / 21+ · D4 sample first, then A + B (C only if safe; confirm «دیدار» = «دیوار») · D5 armory (`armory_1`) · D6 `def_catapult` · D7 `castle_keep_stone_2` all levels · D8 one model per house/civic kind. Assumption: gem mines ruby/emerald/turquoise = `dia_mine_red` / `dia_mine_green` / `gem_mine_turquoise`.

## Round 2 — S1b (owner answers applied: D7 = `castle_keep_stone_2` at all levels; D1–D8 otherwise default)
Done (pushed as `inbox/TR2_S1b`): 166 directional models looked at from 4 sides → front/`ry` per model (`tr2_swap.json`, `TR2_swap.md` §6; 21 sheets `sheet_TR2_S1b_front_NN.png`). **Key finding: buildings face +X, not +Z** (117 of 166). 11 models slimmed / shrunk to 1K and checked side by side (`ship_TR2_S1b.tar.gz`, §7). **Tool bug found:** TR1's `slim_uv.mjs` corrupts already-quantised library files (grey + warped) — fixed (`dequantize()` first), tools in `tools_TR2_S1b.tar.gz`.
Pitfalls (new): the render rig is `r_root/` (`tr2_views.html` + `views.py`, static server `python3 -m http.server 8777` from that dir, `three` and `lib` symlinked in) — one sheet of 8 models × 4 views renders in ≈ 5 s, so contact sheets are cheap; `pkill -f` kills your own shell if the pattern is in the command line (happened again this round).

## Round 3 — S1c + S2 (pushed as `inbox/TR2_S2`)
Done: S1c (pack sizes: `TR2_swap.md` §8, `tr2_swap.json` v2 with 11 gaps1 models + 169 nodes); S2 (see `report_TR2_S2.md`): `tiers.js`, cap-generalised structure modules, `tr2lib.js`, `dev/tr2_tiers_test.sh` → `TR2 TIERS OK`, `dev/tr2_s2/` browser proof, `GATE_W: ALL OK` (noRoute 667), draw calls / tris within ±2.5 % of the baseline, programs: batched Tripo +0 (instanced +1/+2).
**Decisions taken by default (owner may change by number):** texture size at ship time **512** (castle / houses / civic / production / defence / traps / bridges / animals / people), **1K** keep + civic hall + market hall, **256** nature / lamps / small props (frames: `sheet_TR2_S2_texsize_*`); cap hook = one line in `econ.js`.
Not done: `preview.png` per model; worksites / `c1–c4` / `wsbuild` / `wslife` clamp the level at 30 and have their own 5-tier `tierOf` (S4b); server cap 50 (S7).

## Round 4 — S3 castle (pushed as `inbox/TR2_S3`)
Done: see `report_TR2_S3.md`. `GATE_W: ALL OK` (noRoute 667), `TR2 TIERS OK`, `A1 OK`, `TR2 S3 OK`; frames at cap-50 levels 1 / 7 / 13 / 19 / 26 / 32 / 38 / 44 / 50, cap-30 half/half 3 / 14 / 21 / 28 / 30, a destroyed-wall battle frame.
**Contract for S4 / S6:** `world.tr2c.anchors()` (S4c lamps on walls / gates), `TBatcher` + `rings.rescan` for rebuilt destructible Tripo pieces, `dev/tr2_budget.py` for the frame rule; `ctx.tr2c == null` → every builder keeps its procedural fallback.
Open (owner / mother): keep looks small in the inner ring; gate facades closed; net draw-call rule missed by ≈ 7 calls (explained in the report); lib-tripo `MANIFEST.json` / `LIB_INDEX.md` need the 11 gaps1 rows.

## Round 5 — S5 free layout (pushed as `TR2_S5` + `TR2_S5_server`, 15 Oct 2026, base kit `508723b`)
Done: see `report_TR2_S5.md`. `GATE_W: ALL OK` (noRoute 614), `TR2 LAYOUT OK`, Python port `PORT OK` + `FUZZ OK`, real-pointer browser test `POINTER OK` (tap, drag, ✓, undo, swap, Done), frames at 844×390 / 800×360 / 932×430 + simulated Telegram insets.
**Contract for the others:**
- Layout record `{v:1, g, m:{id:[x,z,ry]}}`, overrides only, ≤ 8 KB; ids = plan lot ids + `store_<res>`; rules in `layout_rules.js checkPose` (12 codes) — the server port is `workers/docs/tr2_s5_ref_rules.py`, endpoints in `workers/docs/layout_api.md`.
- **ST1** (stores / vaults) merges first: keep `planStoresDefault()` / `planStores()` / `buildStores(...).rebuildSteps()` and `STORE_FP` (`layout_rules.js`); re-run `tr2_layout_test.sh` and `tr2_s5_vectors.sh`.
- **GR1** (roads / ground) merges before S5: streets come from `townLayout().streets`, ground from `L.height`; re-run the vectors (the server gets a height grid).
- Attack: `military.player_target` adds `"layout": victim.get("layout")` (server); the client shows `target.layout` and puts the player's own back after.
Open: draw calls +3 strategic / +8 at ground views (stores = own mesh group; net rule «≤ 0» missed, a fix is described in the report); ghost is a box, not the model; mill on/off the river variant; deploy-zone cache after a move; no phone run; server mock only.
## Next step
S4a–d town + world (parallel chats), S6 defence, S7 QA. After ST1 + GR1 merge: re-run the S5 vectors and test, then merge `TR2_S5` last (see `APPLY_TR2_S5.md`).
