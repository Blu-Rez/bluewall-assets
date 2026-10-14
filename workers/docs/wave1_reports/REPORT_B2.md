# REPORT B2 — four house families (cottage / craftsman / merchant / noble)

**خلاصه (وینگلس):** ۴ خونه‌ی کاملاً متفاوت ساخته شد (کلبه، پیشه‌ور، تاجر، اشراف) از مدل‌های واقعی CC0، هر کدوم ۳ شکل بدنه (لول ۱ / ۱۲ / ۲۴) و ۶ پله‌ی دکور (۱/۶/۱۲/۱۸/۲۴/۳۰). ۱۲۰ خونه‌ی مخلوط ۹۱٪ مثلث خونه‌های فعلی و ۱ دراکال (به جای ۸) می‌گیره. وصل‌کردنش به بازی با چت مادره (من به town.js دست نزدم).

Base = p38. Owned files only; **SHARED edits: none**. `web/app/*` not in the patch.

## Proven (I ran it / looked at it)
| item | proof |
|---|---|
| ONE sheet, 4 kinds × lv 1 / 15 / 30, numbered 1–12, rendered by the real code path (`b2_homes.js homePieces` → `village.js bakePieces` → `kit_homes.glb`), game camera angle, looked at at full size (rows cropped 1:1) | **`/home/claude/work/b2_sheet_homes.png`** (sent to the owner) |
| `bash dev/b2_homes_test.sh` → **`B2 OK`** (see output below) | `/home/claude/work/b2_test_out.txt` |
| every `homePieces` name exists in the kit; deterministic per seed (60 seeds × 30 levels × 4 kinds); a house that levels up never moves/removes a piece inside a body stage; ≥ 20 distinct looks per kind/level over 60 seeds (all 60 differ) | test |
| tris per house ≤ 1.5 k: max 1477 (noble lv 30, seed 2); kit 193.9 KB ≤ 400 KB; 1 material, 0 textures | test |
| 120 mixed homes (55 % cottage / 25 % craftsman / 14 % merchant / 6 % noble, levels 1–30 at random, 955 placed pieces) | see perf table; picture `/home/claude/work/b2_proof_mix120.png` |
| credits file | `web/assets/credits_b2.json` (4 items: Quaternius Medieval Village MegaKit, Quaternius Fantasy Props MegaKit, KayKit Medieval Hexagon, Kenney Castle Kit — all CC0), checked by the test |
| `GATE_W: ALL OK` | `/tmp/gate.out` (client-only gate, run once at the end) |

```
kit: 193.9 KB, 58 pieces, 1 material(s), 0 texture(s)
cottage    tris avg 495  max 737   lv1 339  lv15 475  lv30 693
craftsman  tris avg 833  max 1110  lv1 670  lv15 818  lv30 1063
merchant   tris avg 948  max 1152  lv1 868  lv15 879  lv30 1106
noble      tris avg 952  max 1477  lv1 601  lv15 962  lv30 1444
120 mixed homes: 78138 tris (651 per house) vs the current town houses 85800 (715 per house) -> 91.1 %
B2 OK
```

## Performance, before / after
Measured in isolation (the town is not wired to my kit: `town.js` is forbidden), so these are the *house* numbers, not whole-scene frame times.

| | current generic houses (`town.js`, `dev/b2_base_houses.mjs`, quality high) | 120 mixed homes (B2) |
|---|---|---|
| triangles | 101,480 for 142 houses = **715 / house** (→ 85,800 for 120) | **78,138** = 651 / house (**91.1 %**) |
| draw calls (batched) | **8** (7 house materials + gold) | **1** (one flat vertex-colour material, all pieces merged by `bakePieces`) |
| programs | — | **+0** by construction: one `MeshStandardMaterial` with vertex colours, no textures, same kind as kit_ws / kit_def (not measured in the full game: not wired) |
| textures | — | 0 (limit 512²) |
| client bundle | — | `b2_homes.js` = 8.3 KB source, **1.65 KB gzip** minified (limit +15 KB). It is not imported by anything yet (+0 until wired) |
| bake job (`bakePieces`, all 120 homes at once, software-GL headless Chromium) | — | **99–110 ms cold, 50–57 ms warm** (40 homes: 86 / 32 ms). Cold is right at the 100 ms line → **bake in chunks of ≤ 40 homes** (see wiring) |

Whole-scene baseline for the record (`p38_perf.py perf`, before any B2 change, `/tmp/perf_before.out`): top 481 calls / 3.09 M tris, ctr 449 / 2.57 M, town 476 / 2.52 M, fields 499 / 3.26 M, lake 247 / 1.46 M. After-numbers for the whole scene need the wiring → **not measured**.

## What each family is (all from real modules; nothing hand-modelled)
* **cottage (کلبه)** — small 4×6 m (6×6 at lv ≥ 24), one storey, steep roof: straw → brown tile → blue slate; stone chimney; yard: wood pile, barrel, wheelbarrow, sacks, bucket, fence, blue pennant.
* **craftsman (خانه‌ی پیشه‌ور)** — 6×6, two storeys, **upper floor jettied over the street**, dark timber grid on the upper front, shop windows, hanging blue shop sign; workbench, anvil, barrels, crates, timber, torch, pennant.
* **merchant (خانه‌ی تاجر)** — tall and narrow 4×6, three storeys, gable to the street, light-blue plaster, brick ground floor, balcony, canopied shop stall in front, crates, sacks, barrels, wagon, pennant.
* **noble (خانه‌ی اشراف)** — stone 6×6, two storeys, **blue-spired corner towers (one from lv 12, two from lv 24)**, low-walled forecourt with a gate gap, gate torches, weapon rack, banners.
* Bodies change at lv 12 and 24 (roof colour / size / towers); the yard dressing changes at every castle tier (1 / 6 / 12 / 18 / 24 / 30, same `TIER_AT` as `skin.js`).
* Seeded variations (per seed, stable while levelling): roof colour (2 per body), chimney side + type, which side the yard props sit on, ±15 cm / ±8° jitter on every prop, one extra yard-clutter prop at tier ≥ 1 (not for the noble).

## API (`client/src/b2_homes.js`, no THREE / DOM, runs in node)
```js
HOME_KINDS = { cottage:{fa,w,d,floors,unlock}, craftsman:{…}, merchant:{…}, noble:{…} }   // w × d = lot footprint incl. yard (m): 9×9, 9×10, 8×11, 12×12
homePieces(kind, lv, seed) -> [{ n, x, z, ry, s }]   // lot-local, x right, z toward the street, ry in RADIANS, s always 1, y always 0 (chimney height is baked into the piece)
homeSmoke(kind, lv, seed)  -> [{ x, y, z }]          // chimney tops, lot-local, for ctx.smokeAt
homeTier(lv), homeStage(lv), TIER_AT, HOME_ORDER
```

## `(ph)` placeholders for the game-rules owner
* `HOME_KINDS[*].unlock` = cottage 1, craftsman 6, merchant 12, noble 20 (ph) — the file only carries them, nothing here gates anything.
* Lot footprints `w × d` (9×9 / 9×10 / 8×11 / 12×12) are measured from the models + yard props, not rules.
* Body-stage lv 12 / 24 and the tier → dressing mapping are my look choices on top of `TIER_AT`.
* The 55 / 25 / 14 / 6 % mix and the uniform level spread of the 120-home test are my assumption (B1 decides the real mix) — the per-kind table above is the honest number.
* No costs / HP / damage / times anywhere.

## Not proven
* **Whole-game picture and frame time with the houses wired in** (no wiring: `town.js` / `layout.js` are forbidden). Only the isolated harness (same `bakePieces`) was shot.
* **+0 programs in the full game** (true by construction; not read from `renderer.info`).
* **Real-GPU cost**, shadows of 120 homes, `patchDestruct` / picking of these pieces (`bid` is accepted by `bakePieces`; I never passed one).
* The owner's pick from the numbered sheet: asked in chat; **no answer at the time of writing → I built the default: all 12 cells as shown** (flagged here as the decision rule says).

## Not done / honest limits
* **Blue crystal accent at high levels (spec):** no crystal model exists in the CC0 kits I can use. At lv 30 the accent is the **blue pennants + blue-spired towers/roofs**. A real crystal skin would be `skin.js` tier 5 on a tagged batch → mother's wiring (see below).
* Cottage "thatch" is a straw-coloured tile roof (real MegaKit roof geometry, flat colour), not a thatch texture; windows are heavily simplified (a few triangles each) and look slightly skewed up close; the market-stall / sign / props are thinned real models (~30–130 tris each).
* One shell (wall layout) per kind × stage; the street variety comes from roofs / chimney / yard / jitter, not from different wall layouts (kit-size / triangle budget).
* Noble lv 30 is the heaviest house: 1444 tris avg, 1477 max (limit 1500).
* A tall two-piece chimney stack exists in the API (`stack`) but is unused.

## What the mother must wire (nothing of this is done)
1. Load `web/assets/kit_homes.glb` like the other kits (GLTFLoader + `MeshoptDecoder`); add `credits_b2.json` to the credits screen.
2. For every home record from B1's plan `{id, kind, x, z, ry, level, seed}`: `homePieces(kind, level, seed)`, matrix = lot(x, z, ry) × piece(x, z, ry), **y = ground height at the lot**, then `bakePieces(scene, gltf, list, { shadows, tag: 'homes' })` (`village.js`); give `bid` for destruct/picking if wanted. **Bake in chunks of ≤ 40 homes per frame** (all 120 at once = ~100 ms cold).
3. Rebake a lot when its level changes (or at least at lv 12 / 24 / 6 / 18 / 30 where the look changes).
4. Smoke: `homeSmoke(kind, level, seed)` → `ctx.smokeAt(x, y, z)` for each chimney (rotate/translate with the lot).
5. B1's lot planner: use `HOME_KINDS[kind].w / d` as the footprint; unlock levels are `(ph)`.
6. Optional: tier-5 crystal skin via `skin.js` for lv 30 homes.

## Files
* Patch: `/home/claude/patch_B2.tar.gz` (owned: `client/src/b2_homes.js`, `web/assets/kit_homes.glb`, `web/assets/credits_b2.json`; dev: `dev/b2_*`).
* Dev: `dev/b2_recipe.mjs` (the kit recipe: which real modules, colours, limits), `dev/b2_mkkit.mjs` (packer: composed pieces, per-material thinning, vertex-colour baking; copy of p38 `mkkit.mjs` with additions), `dev/b2_build_kit.sh`, `dev/b2_homes_test.sh` (+ `.mjs`), `dev/b2_sheet.py` (the numbered sheet), `dev/b2_dev.js/.html/_build.sh`, `dev/b2_shot.py` (fast viewer), `dev/b2_base_houses.mjs` (baseline counter). Rebuild the kit: `bash dev/b2_build_kit.sh` (needs the `@gltf-transform` install in `/tmp/claude-0/gt` and the model packs under `/home/claude/blu-rez/bluewall-assets`).
