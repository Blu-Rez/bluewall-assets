# ST1 — Treasury Quarter: storehouses, gem vaults, central crystal

Built on the kit at `508723b` (ROUND3_JOBS + BT1). Owner = Wingless. Everything below is from the real game (`dev_s35.html`, home map, 844×390, software GL — **not a phone**).

## What changed
* **One place for all nine storages** (`storeyards.js`, new): *Treasury Quarter* = nine yards on the south side of the town, between the keep and the south wall — wood (-66,51), stone (-51,66), iron (-60,93), gold (-15,105), oil (-84,90), ruby (-36,102), emerald (6,105), turquoise (12,78); **food is the one outlier**: (-9,-81), north, because the civic lots need the south band (B1 oracle: no other assignment keeps every tavern / mill / civic lot placed under the rings ±5°, river ±20 m, combo layouts). Records `{id, kind, x, z, ry, r}`; `r` = 13 m circles, ≥ 19 m apart, ≥ 1 m off every road edge, out of river / walls / moat / market / gates, door faces a street. `stores.js` / `vault.js` plan = the quarter, B1 reads the same nine circles (`kind` store / vault), the haul destinations follow.
* **One family design**: plinth + court slab + steps (tier-skinned: timber / grey stone / black iron / sand+gold), two tall pennants in the resource colour, two torches (the game's own `ctx.torch` flame = no new lights), a big **emblem silhouette on the ridge** (wood: log pyramid, stone: hewn blocks, iron: anvil, gold: bar pyramid, oil: drop on a barrel, food: wheat sheaf; +35 % over the procedural size so it reads from the strategic camera) and a **heap that follows the fill** (`setFill` unchanged; stages are `B.tag` min-levels of skin ids 23–28, ids 17–22 = the fixed tier looks).
* **Halls = the owner's Tripo models** (`storage_wood/stone/iron/gold/black/ice/red/green/blue.glb`, from his gpt pictures: wood = base picture, the other eight = material edits of it, so it is ONE building in several materials). Shipped to library format (`dev/st1_ship.mjs`): welded, simplified 16–18 k → 6.5 k triangles (attribute-aware, UVs kept), 2K → 512 px WebP, meshopt; 130–174 KB each; no recolour, no repaint. `swap.json`: `ry -90` (the double door faces +x in the file). Mapping: wood→wood, stone→stone, iron→iron (metal riveted shack), gold→gold (golden temple), **oil→black**, ruby→red, emerald→green, turquoise→ice, food keeps `granary_0`. `storage_blue` is shipped but no store uses it (a level-20 skin later).
* **Vaults**: the static hall comes from `storeyards.js`, the live parts (cut-gem crown on the roof, floating gem + glow, pile in the basin) stay in `vault.js` and follow wallet / vault level; over a Tripo hall the crown floats 2.9 m above the ridge.
* **Central crystal** (`world.js crystal()` → `buildCrystal`): default = the library's crystal cluster (`rocks_ore/crystal_blue`) on a pale ring with four rune pillars, tier colour from the castle level. Alternatives `?st1c=2` (cut sapphire on a dais), `?st1c=3` (rune obelisk).
* **Three looks** (`?st1=1|2|3`, `?st1=0` = exactly the old stores): 1 hall (procedural family), 2 pavilion (open porch), 3 Tripo halls. **Default = 3 automatically when all eight `storage_*` files load; if one is missing the game falls back to look 1** (`warmYards`, logged, never breaks). Contact sheet: `ST1_contact_sheet.png` (numbered 1 / 2 / 3, default marked).
* Budget design: all Tripo pieces of the quarter are baked into ONE atlas (one material = **+1 draw call**); the rest rides the existing static batch; **no new shader program, no new light**.

## Numbers (software GL, 3 frames averaged; same page, same build; before = `?st1=0`)
**Strategic views as the player gets them (camera eases, units move: ±~5 draw calls between two runs of the same build is noise):**

| view | before calls | after calls | before tris | after tris | Δ tris | programs before→after |
|---|---|---|---|---|---|---|
| lv30 top | 513 | 517 | 3,390,855 | 3,491,360 | +3.0 % | 161→161 |
| lv30 ctr | 477 | 480 | 2,893,623 | 2,985,671 | +3.2 % | 161→161 |
| lv30 town | 472 | 471 | 2,928,597 | 3,003,775 | +2.6 % | 161→161 |
| lv50 top | 510 | 510 | 3,380,478 | 3,468,338 | +2.6 % | 161→161 |
| lv50 ctr | 473 | 480 | 2,872,596 | 2,983,922 | +3.9 % | 161→161 |
| lv50 town | 472 | 471 | 2,926,394 | 3,005,244 | +2.7 % | 161→161 |

**Same fixed camera before / after (free camera, controller frozen; the world is still alive, so ±10 calls of crowd noise remain):**

| fixed camera (lv30) | before calls | after calls | before tris | after tris | Δ tris | programs |
|---|---|---|---|---|---|---|
| top | 495 | 489 | 3,530,356 | 3,581,909 | +1.5 % | 161→161 |
| quarter | 475 | 474 | 2,779,274 | 2,884,163 | +3.8 % | 161→161 |
| town | 548 | 520 | 3,868,615 | 3,865,272 | -0.1 % | 161→161 |

Reading: triangles −0.1 … +3.9 % (budget +10 %), programs 161 → 161 (+0), draw calls never above the 'before' run in the fixed-camera table (the quarter adds ONE atlas call and removes the procedural splits; budget +2). `noRoute` is in the gate line below.

Kit baseline (before ST1, untouched kit): top 518 calls / 3.397 M tris / 161 programs.

## Tests
* `dev/st1_test.sh` → **ST1 OK** (places, fit, doors, identity, skin ids, B1 oracle, storage family: swap entries + files + sizes + piece names).
* Town tests with the nine yards in place: b1_town (all perturbed layouts), p41, b2, b3, c3, c4 — green. Gate (`dev/gate_w.sh`): **`GATE_W: ALL OK`**, battle sim noRoute **649** (< 700; kit baseline 614 → **+35**, pinned at end 71 → 118, crossings 0.00, ground unit-steps in water 0). The rise is the new town layout (stores moved, so houses / vaults / church sit on other lots) seen by the headless sim; I did not hunt for a layout that gives exactly 614. `dev/st1_test.sh` is not in `gate.sh` (I may not touch `dev/gate*.sh`) — the mother should add it.

## Files
Owned: `client/src/storeyards.js` (new), `stores.js`, `vault.js`. Shared: `client/src/world.js` — **7 `ST1` lines** (import, `warmYards` start, `await warmSt1`, `buildStores(ctx, {M, height, scene})`, crystal hook ×3). `web/assets/tr2/swap.json` — **+9 entries** `storage_*: {ry:-90}` (one-line JSON: it will conflict textually with any other patch touching it; re-apply with: `d['models']['storage_'+k]={'ry':-90}` for k in wood stone iron gold ice green red black blue, `json.dumps(d, separators=(',',':'))`). New GLBs in `web/assets/tr2/`: `storage_*.glb` ×9 and the dressing / fallback library models the quarter uses: `armory_1 granary_0 lumber_mill_2 oil_refinery_1 oil_tanks_pack props_mining rocks_ore treasury_0 treasury_1` (≈ 1.5 MB). `client/src/basetargets.json` — **regenerated** (`dev/gen_targets.py`, 133 → 131 targets: houses 58 → 56; church and the 3 vaults on new lots; same meta). It is only used by the headless sim, but `p1_test` fails without it. Whoever merges another town change must regenerate it again. `dev/`: `st1_test.*`, `st1_lab*`, `st1_shots.py`, `st1_perf.py`, `st1_proof*.sh`, `st1_town_tests.sh`, `st1_ship.mjs`.

## NOT proven
* Phone feel: all numbers are software GL (~1 fps) — draw calls / triangles / programs are exact, milliseconds are not measured.
* Night: a night run exists (night 22:00 looked at full size: the quarter, ruby and emerald vault, gold store, crystal, ctr view — gems glow, torches lit, halls readable); I did not look at dusk / dawn.
* The two dark halls (iron, oil) are close in colour at distance; they are told apart by the emblem (anvil / drop) and the banner colour (blue / red), not by the hall.
* `storage_*` models were checked in the lab from four sides, then in the game; their `ry` and size (12 m deep, 9.6 m wide) are from my renders, not from an artist.
* Looks 1 and 2 were checked in the lab and in two in-game shots, not at every size.
* The quarter exists on the home map. I did not look at the attack map (BT1 says it equals the home map; `buildStores` is shared).
* Food store is north of the keep (outlier, see above), by the town plan's choice.
* Heap stages: looked at 0 / 50 / 100 % in the lab (`lab_heap_fill_0_50_100.png`) and at the default 60 % in the game; the live wallet → `setFill` path is the unchanged old interface and was not driven by a real wallet in my runs.

## Needs Tripo
Nothing is blocking. Optional: `storage_food` (a granary in the same family: straw-yellow thatch + pale plank, same 12 × 9.6 × 7 m) so the food store matches the others; `storage_wood` second shape (the porch version, `storage_wood_b`, rendered and kept out of the game); `storage_blue` has no store yet.
