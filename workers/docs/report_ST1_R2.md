# ST1_R2 — gem glow: dimmer, more colourful, prettier (job B1)

Kit: branch `kit`, HEAD 0574fdc. Patch: `patch_ST1_R2.tar.gz` (owned: `gemgeo.js`, `vault.js`, `storeyards.js`; shared diff: `mines.js`, every shared line marked `// ST1_R2:`).

## What changed
- **vault.js** — the big crown gem on the roof is GONE (mesh, its material, its `ctx.live` entry, its level hook). The small floating hero gem stays (now `rich` geometry, slower bob ±0.35 m / spin 0.35 rad/s), it floats 1.4 m over the old crown seat. The white-core glow sprite is replaced by a small soft halo in the gem's own colour (`makeHalo` / `haloUpdate`). Opacity cap: **night 0.25, day 0.08** (default look 2), smooth in `P.night`, tiny breathing, a full vault only breathes a little faster (no more ×0.75 pulse). Badge anchor rule unchanged (1.8 m over the gem). The vault target is still registered BEFORE `buildVaultHall` (the target-id fix is intact; `st1r2_test` checks the order).
- **storeyards.js** (vault part) — the basin pool now lies ON the court paving (y0+0.375; the old one was at y0+0.06, i.e. under the stone and invisible) in the gem colour: the faint pool of light on the stone under the stand. Also fixed in the old-hall fallback in vault.js.
- **gemgeo.js** — `solid(..., rich)`: the white sparkle is capped at 0.3/0.2 and saturation is boosted (more colour, less white wash) for the small gems; halo helpers (`HALO_STYLES`, `haloLook`, `haloTexture`, `haloColor`, `haloRGB`, `makeHalo`, `haloUpdate`). 3 looks via `?st1g=1|2|3` (default 2).
- **mines.js** (shared, `// ST1_R2:`) — see the interpretation below.

## Decision for the owner/mother (one line each)
1. **"where it is built"**: the vault BUILD SITE has no gem and no glow placeholder (checked `storeyards.js`, `worksites.js`, `wsbuild.js`, `world.js`, `town.js`). The only other big gem + big glow in the game is on the MINES (giant gem scale 5.6, 26 m glow up to 0.65 at night) = where the gem is *made*. I treated the mines as the second place: giant gem → small gem + the same halo. If the owner meant something else, drop the `mines.js` shared diff; the vault part stands alone.
2. **Default look = 2** (medium). Looks 1 and 3 are `?st1g=1` / `?st1g=3`, no rebuild; changing the default is one number in `haloLook()`.
3. The pool shader squares the alpha (`vec4(vC*a, a)` with SRC_ALPHA additive → colour × a × texAlpha²). That is why the faint pool needed `a = 0.9, r = 8`; it only shows ~1.5 m of soft rim round the bowl. This also applies to other owners' torch pools (not touched).

## 3-look sheet (numbered; answer with the number)
`ST1_R2_sheet_looks_vault.png`, `_emerald.png`, `_map.png`, `_mine.png` — night, lv30, 0 = before, 1 subtle / 2 medium (default) / 3 rich.
Night caps: 1 = 0.16 (day 0.05, d 2.2 × gem), 2 = 0.25 (day 0.08, d 2.8), 3 = 0.38 (day 0.12, d 3.4). Honestly: at night the three are close, because the cap is low on purpose; 3 is the one that reads best from the far map, 1 almost disappears there.

## Overdraw — ESTIMATE (PF2's `pf_overdraw` is not on the kit yet)
Method (`st1r2_shots.py`, field `over`): every additive sprite in the frustum is projected; "quad px" = pixels of its screen quad (fragments shaded), "alpha-weighted px" = quad px × its opacity (what the blend actually adds), "max layers" = how many stack. 9 views per run (map, quarter, quarter_near, 3 vaults, 3 mines), same camera before/after.

| run | sprites | quad px (fragments shaded) | alpha-weighted px |
|---|---|---|---|
| day · lv30 | 28 → 28 | 158406 → 103338 (-35 %) | 22575 → 6567 (-71 %) |
| day · lv50 | 28 → 28 | 168137 → 103866 (-38 %) | 23196 → 6643 (-71 %) |
| dusk · lv30 | 28 → 28 | 157374 → 103894 (-34 %) | 67166 → 16528 (-75 %) |
| dusk · lv50 | 28 → 28 | 180409 → 103857 (-42 %) | 78135 → 16527 (-79 %) |
| night · lv30 | 28 → 28 | 188236 → 104069 (-45 %) | 105953 → 20524 (-81 %) |
| night · lv50 | 28 → 28 | 174832 → 104195 (-40 %) | 97741 → 20330 (-79 %) |

Worst single frames, night lv30 (before → after): vault_turq 42187 → 34019 quad px (alpha-weighted 19973 → 6036), mine_ruby 32602 → 10773 (21192 → 2531). Sprite count is the same (the glow is still one sprite per gem: +0 draw calls); the quad is smaller, the opacity lower. The estimator counts only the gem halos (additive sprites hanging over a vault or a mine); vault_turq still shows the biggest number because its close-up sees 4 halos at once and the quad px count includes the transparent corners of each quad (the alpha-weighted figure, 6036, is what the blend really adds). Per look (night lv30, alpha-weighted px, vault_ruby): look 1 830, look 2 1879, look 3 4391 (before 6621). Full per-view table: `ST1_R2_overdraw_table.md`.

## Budgets (before → after, same views, software GL)
- programs: 161/162 → 161/162 in every view (**+0**; 162 at dusk/night = the night lamps, same as before).
- draw calls: equal or lower in 49 of the 54 views (6 runs × 9); higher in 5: vault_ruby close-up (the first close-up after the free camera moves, so the most exposed to streaming differences) +3 (day lv50), +2 (dusk lv30), +3 (night lv30), +13 (dusk lv50: 396 → 409, tris +28k) and mine_turq night lv50 +1. These are free-camera views, where the town's lazy streaming / LOD differs from run to run (the same view at night lv50 is 397 → 396); the code adds no mesh (the crown mesh is −1 per vault in view, the halo replaces the old glow sprite 1:1). Nothing in the diff can add a call, but I did NOT re-run those four views to prove the +13 is noise — treat it as 'not proven'.
- triangles: within noise (±100k in the free-camera views, which move with the town's lazy streaming); the hero gem is the same `solid()` geometry as before, the crown (same geometry, scale 5) is gone.
Tests: see below.

## Tests
- `bash dev/gate_w.sh` → **GATE_W: ALL OK** (noRoute 647 < 700, 0 FAIL) on the final code. `st1_test.sh` → **ST1 OK**, `gr1_test` OK inside the gate.
- `bash dev/st1r2_test.sh` → **ST1R2 OK** (caps 0.25 / 0.08, halo colour = gem colour, no crown, no giant gem scale in mines.js, target-id order, pool on the paving).
- `BT1_LEVELS=30 bash dev/bt1_test.sh` → **BT1 OK** (LV 30: 120 groups, differing outside the battle layers 0, targets 130, lost 0, no sim building 0). The vault target-id fix still holds. (My first BT1 run timed out at 3000 s because it shared the 2 CPUs with the frame runs; the second ran alone and passed.)

## Frames (full size 844×390, headless SwiftShader — NOT a phone)
`photos_ST1_R2.tar.gz`: `before_{day,dusk,night}_lv{30,50}/` and `after_{day,dusk,night}_lv{30,50}/`, each with `map`, `quarter`, `quarter_near`, `vault_ruby|emerald|turq` (close-up of each vault), `mine_ruby|emerald|turq` (close-up of each mine) + `results.json` (calls / tris / programs / overdraw per view); `look1_night_lv30/`, `look3_night_lv30/` (4 views each; look 2 = `after_night_lv30`). Hours: day 13, dusk 18.8, night 22.
Seen at full size by me: night lv30/lv50, dusk lv30/lv50, day lv30/lv50 (map, quarter, vault, mine closes). The big pastel crown gems and the giant mine gem are gone in all of them; a small rich gem with a soft coloured halo remains, and the court shows a faint coloured rim.

## Findings for others / NOT proven
- **NOT proven**: how it feels on a phone (frames come from software GL at ~1 fps; no ms numbers), dawn, the attack-map look (BT1 only checks structure), and that "where it is built" = the mines is what the owner meant (decision 1).
- `bfx.vaultBurst` in `battle.js` still anchors its "crown" burst at `v.y + 9` (the old crown height). Harmless; the burst now starts a bit lower than the gem — whoever owns battle.js may want `v.gem` (now exported in the vault list).
- `H.heroY` returned by the storeyards builders is now unused by vault.js (kept so the builder API did not change).
- On the dev wallet the vault basin is often empty (pre-existing; the pile follows the wallet), so the pile is mostly not in the close-ups.
- New test `dev/st1r2_test.sh` is not in `gate_w.sh` (workers must not edit gate scripts) — mother: please add it next to `st1_test.sh`.
- `web/app/wall.js` is rebuilt locally by my runs and is NOT in the patch (rebuild with `dev/rb.sh`).
- Tools in the patch `dev/`: `st1r2_shots.py` (frames + overdraw), `st1r2_probe.py`, `st1r2_before/after/looks.sh`, `st1r2_table.py`, `st1r2_sheet.py`, `st1r2_test.js/.sh`.
