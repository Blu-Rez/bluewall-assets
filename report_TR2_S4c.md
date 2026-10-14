# report_TR2_S4c — nature, lamps and props from the Tripo library (S4c)
TR2 · 15 Oct 2026 · kit **p47** (includes TR2-S2) · models from `lib-tripo` · `GATE_W: ALL OK` (noRoute **667**, limit 700, baseline 667).
All numbers: software GL (SwiftShader) in headless Chromium, home map lv 30, quality `low` for frames/perf, `Q=high` for programs — **not phone numbers**.

## 1. What the player SEES now (autumn = today's date; `?s=0..3` = the other seasons)
- **Trees** (forest, hamlets, town edge): spruce and pine (layered conifers; spruce is 80 % of the conifers), oak, willow, poplar (broadleaf) from the library (cedar / cypress / plane / walnut / birch / apple / almond / tamarisk stay in the library: one more variant = one more draw call); autumn adds the red-gold maple, winter swaps the broadleaf for bare trees and adds snow-laden firs (same season switch as before). Far forest = the old card-impostor system, baked from the Tripo models (3 cards = 6 triangles a tree; the pine cards are drawn 1.45× wider because the library conifers are slimmer than the old EZ ones); the LOD pool still turns the trees around the camera focus into real meshes.
- **Bushes**: round shrub and boxwood (card atlas, 8 tris each) · **rocks**: mossy boulder, granite crag (260 tris), small angular stone (130 tris) with the old moss / snow / ground-skirt shader · **meadow**: tulips, daisies, clover and ferns (fewer clumps than before, each clump is a denser mesh).
- **Lamps**: street lamp post with glass lantern (lit streets), fire-basket poles and torch poles (towers, gates, quay), wall torches on the faces of houses / barracks / civic (50) and hand torches (8). **The lamp models are unlit; the game's own flame sprite sits on top of them** (anchor read from the model), no new light. All of them are **baked into the castle batch with the structure's id (`aB`)**, so a torch on a wall / tower falls with it.
- **Props**: barrels, crates, sacks, wagon, handcart (instanced) and the four market stalls (wired; no stall is placed at lv 30).
- `?s4c=0` in the URL = the old models (A/B switch, also the automatic fall-back when a pack fails to load).

## 2. Numbers (A/B at the same 5 strategic cameras, lv 30)
| camera | draw calls old → new | tris old → new | programs (low) |
|---|---|---|---|
| top (strategic) | 510 → **491** | 3 484 365 → 3 501 622 (**+0.5 %**) | 166 → 165 |
| ctr | 477 → **455** | 2 990 049 → 2 966 921 (**−0.8 %**) | 166 → 165 |
| town | 489 → **467** | 2 952 399 → 2 940 733 (**−0.4 %**) | 166 → 165 |
| fields | 542 → **522** | 3 715 853 → 3 709 523 (**−0.2 %**) | 166 → 165 |
| lake | 256 → **254** | 1 673 966 → 1 714 192 (**+2.4 %**) | 166 → 165 |
Budget was tris within +5 % and calls_after ≤ calls_before at the strategic cameras: **met at all five in this run**. Also measured (new only): `streets` 387 calls / 2.66 M tris, `rgateNE` 468 / 2.94 M, `rnorth` 444 / 2.93 M; lv 1: top 352 / 2.13 M, lv 20 frames in the photos.
- Shader programs: **201** (Q=high `p39_progs.py 30`; baseline 203, allowed +0..2 → **−2**); at `low` 165 vs 166 (the old rock/leaf variants no longer exist). The Tripo trees / rocks / props / lamps all use tr2lib's ONE shared material configuration; the only new program variants are the wind-sway tree material (one) and the rock shader with a Tripo texture (one).
- Added to `web/assets`: **+1.80 MB** (13 packs; `swap.json` was already in the kit). Texture memory estimate: 7 packs × 512² + 6 packs × 256² = **+11.3 MB GPU** (with mips; the old tree/rock/flower textures are no longer uploaded: `renderer.info.memory.textures` 393 → 360, geometries 528 → 542). Absolute total on the phone: **not measured**.
- The lake camera sees moving creatures: its call count moves ±10 between runs (old 256–260, new 254–271 over 7 runs of intermediate builds; the table is the run of the final code). The two lamp packs cost +2 calls in the static batch, the three rock meshes equal the old kit.

## 3. Proofs and frames (all opened full size)
`photos_TR2_S4c.tar.gz` (32 full-size PNG, all opened by me):
- `01_*_oldnew_{top,ctr,town,fields,lake}` old (`s4c=0`) vs new, same camera · `02_*` the new frames alone.
- `03_{streets,rgateNE,rnorth}`: the closest real camera (85–95 m): castle lamps, braziers on the towers, fire baskets, street lamp lanterns, wall torches, meadow flowers.
- `04_{winter,spring,summer}_{top,ctr}`: season switch (`?s=3/0/1`): snow-laden firs + bare trees in winter, green meadow in spring / summer.
- `05_lv{1,20}_{top,ctr,streets}`: the same world at castle level 1 and 20 (lv 30 = `01`/`02`).
- `06_close_*` and `07_gallery_*`: close-ups / species gallery from an intermediate build (models identical; the species list was cut after).

## 4. What is in the patch
**My files:** `client/src/tr2_s4c.js` (NEW, 177 lines: the only module that knows the packs), `trees.js` (variants table → `S4C.treeSet`, far cards from the Tripo models, near-card width, season tint), `sc_rocks.js` (Tripo geometry + per-texture material in the old rock shader), `sc_bush.js` (Tripo shrubs into the card atlas). `sc_cards.js`, `crops.js`, `hamlets.js`, `ruins.js`, `nomads.js`, `sc_shadow.js`: not touched (see gaps).
**Hook lines in the shared `world.js` (all marked `// TR2-S4c`, 11):** import · `await S4C.load()` · `ctx.torch`: Tripo lamp call + 3 guards (`T4`) so the old procedural pole / sconce stays when a pack is missing · `instLists` loop → `S4C.props` · forest gate (`A.models.ez_pine_a || S4C.on`) · `scatterFlora`: `want` and bank chance × `S4C.meadowScale[k]` · final `instance(...)` → `S4C.meadow(k) || A.models[k]`. `fx.js` / `assets.js`: not touched (the flame anchor comes through `ctx.torch`).
**Models:** `web/assets/tr2/` 13 packs 1.80 MB (trees ×4, bushes, rocks ×2, flowers, ground_cover, lamps ×2, props_town, market_stalls), slimmed with `tools/tr2_slim_pack.mjs` (UV-aware, Permissive — never sloppy): trees 512 px, lamps / flowers / ground cover / small rocks 256 px.
**Tools:** `workers/dev/tr2_s4c_*` (run / A-B / close-up / impostor / gallery / debug / aB-check, `tr2_s4c_test.sh`).

## 5. NOT proven
- Phone fps, shader compile time on a phone, real GPU memory (all numbers above are SwiftShader).
- A destroyed tower / wall **with the torch falling** was not framed in a battle; the proof is the mechanism: the lamp is baked with `B.tagB` (per-vertex `aB`), checked in the page by `tr2_s4c_aB.py` (the two lamp packs hold 109 572 + 49 950 vertices in the static batch: 89 658 + 12 150 carry a battle-target id of 40 + 3 structures, the other 19 914 + 37 800 belong to free-standing street posts with id 0, exactly like the old posts), and S2 framed the same hook on a baked Tripo wall.
- Close-ups of lamps / props from a low camera: the game camera never goes lower than 6 m above ground and the closest zoom is 90 m, so the frames are from the real camera (`streets`, `rgateNE`, `rnorth`); small items are a few pixels there.
- Draw calls at the lake camera: new vs old inside the noise (see table); not a guaranteed ≤ at every camera on every run.
- **The look changed on purpose and is stylised:** the library broadleaf trees (oak, willow) are wide, sparse « bonsai » crowns, the conifers are layered discs; in the far forest the green foliage covers ≈ 74 % of the pixels the old trees covered at the top camera, and autumn broadleaf reads olive-tan, not dark brown. Colours (exposure, autumn warm tints) are in ONE place: `TREES` + `tint()` in `tr2_s4c.js`; the owner may ask for a darker / denser forest.
- Winter / spring / summer: frames exist (`season*`); the battle clearing of the scatter window is by reading the code (new instanced meshes are all added inside `nScene0 … scatterFlora`).

## 6. Not done / gaps → `TR2_S4c_gaps.md`
grass tufts (library grass too heavy), wheat fields (`crops.js`), haybale / pumpkin / corn / cabbage (placed by `life.js`), nomad tents / rugs (`nomads.js`), ruins, pebbles, weapon stand, stalls at lv 30; `ctx.tr2c.anchors` of S3 was not pushed, so tower / gate lamps use the existing `torch()` calls (hand torch on the castle, wall torch only on rect faces).

## 7. Old assets that can go later (after the owner accepts the look; `?s4c=0` needs them until then)
`ez_pine_a/b/c, ez_oak_a/b, ez_ash_a, ez_aspen_a, ez_bush_a/b` (3.0 MB), `rockset1/2` (0.7 MB), `bush, bushf, flower3, flower4, fern, clover, plant, torch, barrel, crate, stall, cart` (1.3 MB) = **≈ 5.0 MB**. `cliff1/2` (1.0 MB) are the mountains, not mine — keep.

## 8. Pitfalls
- Tripo packs are meshopt-QUANTISED: `swap.json k` is not a metre scale → always pass explicit `h` / `w` to `tr2.parts`.
- The camera never goes under 6 m above the ground (`controls.js`): low "close-up" frames need a 25 m+ distance; use `streets` / `rgateNE` / `rnorth`.
- A flying creature (dragon / pegasus wing) passing the camera paints a giant grey slab in a screenshot (seen twice): not a tree card; take the frame again.
- `pgrep -f` / `pkill -f` with a pattern that is in your own command line kills your shell (happened again).
- Each pack material = +1 draw call in the static batch (two lamp packs = +2); each tree variant = +1 call for its impostor: keep variants few.
