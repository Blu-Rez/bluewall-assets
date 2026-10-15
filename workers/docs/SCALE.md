# SCALE.md — the one size table (AN1_R3 · A3)

Owner, 15 Oct 16:10: «the hero is a bit small, the horses are far bigger than she is — fix the sizes of horses, people and the hero.»
This file is **the** table. Metres. **now** = the build before AN1_R3 (kit `a69b4e2`), **after** = what the running game draws with this patch (measured live, `an1_r3/scale_live*.js`, software GL, 844×390 — not a phone).
All numbers of the game's people and animals come from ONE place: `walk_kit.js` → `SZ` (+ `LEN`, `sz(k)`, `lenOf(k)`). Change a number there and every file follows. `?an1gain=1.2` (URL, tests only) scales every entry of `SZ` at once.

## 1 · The table

| # | thing | now | target | after (live) | where (file · constant) | reason / deviation |
|---|---|---|---|---|---|---|
| 1 | **Hero** (six sisters; GLB 0.98 × `SC` 2.0) | 1.96 | 1.85–1.95 | **1.96** — not touched (`rpg.js` is RP1C's) | `rpg.js` `SC`, applied by RP1C | already at the top of the range. Against the new people she is +12 % over a man (1.75) and +19 % over a woman — taller than every villager, as a heroine should be. The lineup sheet offers ×1 / ×1.12 / ×1.25 = 1.96 / 2.20 / 2.45 m (see §3); my recommendation after the others are fixed: **keep ×1** |
| 2 | Villager man | 3.00 | 1.75 | **1.75** | `tr2_life.js` `PEOPLE.villager_man` = `sz('man')` | |
| 3 | Villager woman | 2.80 | 1.65 | **1.65** | `PEOPLE.villager_woman` | |
| 4 | Young man (pick / axe workers) | 3.00 | 1.75 | **1.78** | `PEOPLE.villager_youngman` = `sz('youngman')` | +3 cm so a crew is not 26 clones |
| 5 | Old man (fisher) | 2.90 | 1.75 | **1.68** | `PEOPLE.villager_oldman` | −7 cm: old, a little bent |
| 6 | Old woman | 2.65 | 1.65 | 1.55 (constant; no instance in the game today) | `PEOPLE.villager_oldwoman` | |
| 7 | **Child** boy / girl / little girl | 2.3 / 2.2 / 1.7 | 1.2 | 1.35 / 1.25 / 1.00 (constants; **no child model is loaded** — `villager_boy / girl / littlegirl` need Tripo, see §5) | `PEOPLE.villager_boy…` | three ages around 1.2 m (12 / 9 / 5 years) |
| 8 | Old peasant model (fallback when the Tripo villagers do not load: pasture herder, yard people) | 2.60 (×1.66) | 1.75 | 1.75 (`sz('man') / 1.562`) | `pas_life.js` `PS`, `wslife.js` `PS0` | only the fallback path |
| 9 | **Horse, riding** (pasture, stable yard, withers) | **3.79** | 1.45 | **1.43** median instance (up to 1.51; foals 0.87) | `pas_life.js` `H_LEN` = `lenOf('horse')`, `life.js` | Mesh2Motion horse: withers 1.619 / ear tips 2.034 in the model's own units → game scale 0.8957. **Head-up height is then 1.82 m, not the ≈2.1 m of the brief**: the model carries its head low (ratio 1.26); 2.1 m would need withers 1.67 m (+15 %, taller than the 1.55 draught horse and 20 % above the 1.45 asked for). I kept the withers at 1.45 (the first number of the brief). One number to change: `SZ.horse` |
| 10 | **Draught horse** (cart) | 1.72 | ≈1.55 | **1.55** (instance scale 0.957 × 1.619) | `wslife.js` `lenOf('draught', 'horse')` | the heavy breed is the biggest horse of the game; it was smaller than every riding horse before |
| 11 | **Knight's war horse** (barded) | 3.79 | ≈1.6 | **1.60** | `life.js` `lenOf('barded')` | barded model: back 3.86 of length 5.70 |
| 12 | **Knight on the horse** (rider 1.85 sitting) | rider 3.83 on a 3.79 m horse (from the old constants) | rider 1.85 | mounted figure **2.39–2.74 m** top to ground (6 live knights) | `life.js` `RIDER_K` = 3.087, `sz('rider')` | rider scale = world scale 3.087 × `size`; measured K3 size 1.24 → 3.83 m, so `size = 1.85 / 3.087` |
| 13 | **Cow**, pasture | 2.79 | 1.30 | **1.28** median (up to 1.34; calves 0.78) | `pas_life.js` `COW_LEN` = `lenOf('cow')` | |
| 14 | Cow, worksite | 1.88 | 1.30 | 1.34 median (1.20–1.40) | `wslife.js` `fa('animal_cow', lenOf('cow'))` | the worksite cow was already small; the pasture one was the giant |
| 15 | **Sheep** | 1.10 | 0.75 | **0.75** | `wslife.js` `lenOf('sheep')` | |
| 16 | **Pig** | 0.84 | 0.90 | **0.90** (was too small) | `wslife.js` `lenOf('pig')` | |
| 17 | **Dog** (wolf rig) | 0.94 | 0.60 | **0.55–0.65** (3 dogs) | `life.js` `herd(... size: lenOf('dog', 'wolf'))` | |
| 18 | **Wolf** | 1.20 | 0.80 | **0.74–0.91** (4 wolves, per-animal ±10 %) | `life.js` `lenOf('wolf')` | |
| 19 | **Hen / cock / chick** | 0.78–0.88 / 0.95 / 0.39 | 0.40 / 0.60 / 0.15 | by constant: hen 0.40, cock 0.60, chick 0.15 (the model's 0.678 m × size) | `life.js` `sz('hen')`, `sz('rooster')` | was ×2 |
| 20 | **Cat** | — (no cat in the game) | 0.25 | — | — | needs Tripo (§5) |
| 21 | Cart (kit_ws piece `ws_cart1`) | 4.80 long × 2.25 high × 2.12 wide | ≈3.5 × 1.7 | **unchanged** | `kit_ws.glb` (TR2 / worksite kit), placed at scale 1 by `wslife.js` | **finding**: next to a 1.55 m horse the cart is a lorry. Not mine (a kit model); scale it in the kit or in `wslife` `cartI` (one line) when the owner agrees |
| 22 | House door (Tripo cottages, craftsman, merchant, noble) | 1.9–2.3 | ≈2.1 | **unchanged** | TR2 (`assets/tr2/*.glb`, `swap.json`) | already right: a 1.75 man (1.96 hero) walks in with a hand's breadth |
| 23 | House storey (floor to floor) | 3.0–3.9 | ≈3.0 | unchanged | TR2 | craftsman 2 storeys read ≈3.9 each; acceptable |
| 24 | **Castle outer gate** (`gate_stone_26`, 26 × 15.3 × 9.0) | arch ≈8.7 | ≈4.5 | unchanged | TR2 `castle_tr2.js` / `swap.json` | **finding**: 1.9× the target; the hero is 22 % of the arch's height. Halving the model makes the gate 13 m wide; a lower arch needs a new model or a split (needs Tripo, §5) |
| 25 | Tower door (`tower_stone_9.8`) | ≈3.9 | 2.1–2.4 | unchanged | TR2 | **finding**, same family |
| 26 | Keep entrance arch (`keep_27`) | ≈9 | 4.5 | unchanged | TR2 | **finding** |
| 27 | **Street lamp / post lamp** (Tripo `lamps_wall_street/lamp_post` etc., `tr2_s4c.js`) | ≈ 3 m by construction (flame at 3.4–3.75 m; `H = hf / a.y × 0.72`; below the 4 m cut of `tall_things`, so not listed by it) | ≈ 3.5 | unchanged (seen in `night_c.png`: small black iron posts beside the houses) | `tr2_s4c.js` | fine |
| 27b | Wall flag pole (`castle.js`, 0.06 m radius) | 4.5 m | ≈ 4.5 | unchanged | `castle.js` | fine |
| 27c | **Wooden archer towers** (3 of them: (−2, 8), (46, 30), (−50, −8)) | **8 m legs, platform 8.1 m, cone roof top ≈ 12 m** — 4× the hero; pure black at night | a 4–5 m guard post | **unchanged — finding (§4a)** | `buildings.js:102–110` (old procedural wood, `M.wood`) | the giant dark poles of the 15:29 screenshot. Not mine, not fixed |
| 28 | **Soldiers of the army / patrols** (`units.js` `SC` 1.75 on a 1.56 m peasant) | 2.7–3.3 | 1.75 | **unchanged — finding for the army chat** | `units.js` | not in my files; the cavalry in battle (`army.js`, `battle.js`) likewise |

## 2 · Order of things now (after)
woman 1.65 < man 1.75 < young man 1.78 < **mounted knight rider 1.85 on a 1.6 m horse = 2.4–2.7 m** … hero 1.96 · cart horse 1.55 > riding horse 1.45 > cow 1.3 > pig 0.9 > dog 0.6 / wolf 0.8 > sheep 0.75 > cock 0.6 > hen 0.4.
Heights **over the hero's head** are no longer odd: the horse's withers (1.45) are at her chest; its head (1.82 up) is at her chin.

## 3 · The lineup sheet and the hero scale
`photos_AN1_R3.tar.gz` → `lineup_after_people.png`, `lineup_after_animals.png`, `lineup_after_cart.png`, `lineup_now_*.png` (same sheets with the sizes of before). 844×390, everything in a row on flat ground in front of a house door (orthographic front view, red line every 1 m, a circled number above every figure). **The hero is drawn three times (dev page only; `rpg.js` is not touched): 1 = today 1.96 m · 2 = +12 % = 2.20 m · 3 = +25 % = 2.45 m. Default pick = 2** (the brief). My own reading: with the people at 1.75 the hero at ×1 is already tallest in the village; ×1.12 makes her 26 % taller than a man (2.2 m — a giant). The owner decides from the sheet; **RP1C applies the hero constant** (`SC`).

## 4 · What cannot be fixed with a scale (needs another chat)
* the castle gate / tower door / keep arch (rows 24–26) — TR2 models;
* the cart (row 21) — kit model;
* the soldiers (row 28) — army chat;
* the **wooden archer towers 8 m (row 27c, §4a)** — `buildings.js`;
* the strategic-camera readability: the people were ×1.7 so that they read from the high camera. At real size a man is ≈ 5 px from the strategy distance. `?an1gain=1.7` brings the old gain back for a look (everything of mine scales together). If readability from far matters, the answer is a floating marker / name tag, not a giant villager.

## 4a · FINDING — the giant dark poles at night (owner screenshot 15:29), not fixed
**What they are:** the three **wooden archer towers** of the courtyard, `client/src/buildings.js` lines 102–110 (`// wooden archer towers`, at (−2, 8), (46, 30), (−50, −8)). Each is four 0.35 m wooden legs (2.4 m apart) **8 m high**, a 3.6 m platform at 8.1 m with rails, a cone roof up to ≈ 12 m and a torch at 9.8 m — **4× the hero (1.96 m), up to 6× with the roof**. The wood is the old procedural `M.wood` with tint `0x7a5a3a`; at night nothing lights it (the torch pool is off: `pool: false`), so from the hero's low third-person camera they read as **giant black poles** (`photos: night_c.png`, a 2 m red-white ruler beside one leg; the lamp posts of `tr2_s4c.js` in the same frame are small and fine). `dev/tall_things.py --hero --hour 23` finds them as the 8.0 m near-black columns `(−3…−1, 7…9)`, `(45…47, 29…31)`, `(−51…−49, −9…−7)` in the `static` batch.
**Owning file:** `buildings.js` (the castle / courtyard chat). **Options for them** (not mine): lower to a 4.5 m guard post, or replace with the Tripo `def_watchtower` (it exists in `swap.json`), and give the wood a night floor (emissive / vertex colour) so it does not go black.
**Second candidate, same family:** the courtyard **forge** at (40, −6) (`buildings.js:49–63`, next to the spawn): four 4.8 m wood posts and a 5 m hearth chimney block that is pure black at night (`night_b.png`) — a big roofed shed, 2.4× the hero.
**Third, not looked at in a frame:** 18 pairs of 7.6 m near-black columns (14 m apart, base at 2.2 m) around the town gates, e.g. (−2, −84) / (−16, −84), (4.8, 80) / (19.3, 80) in the `static` batch — probably the procedural town-gate piers of `castle.js` (lines ≈ 213–245); only measured, not seen.

## 5 · needs Tripo (nothing was built by hand)
* a **child** model (boy / girl): `villager_boy`, `villager_girl`, `villager_littlegirl` — the constants are ready (§1 row 7);
* a **cat**;
* a **lower castle gate / tower door / keep arch** — or the owner's decision to keep the heroic arch (≈8.7 m);
* a smaller **cart** (3.5 m) with a driver bench.

## 6 · Model dimensions (natural units, measured on the GLBs; `work/an1r3/models.json`)
| model | bind box x · y · z | back / withers | note |
|---|---|---|---|
| hero (6 sisters) | 0.58 · 0.98 · 0.19 | 0.98 | × 2.0 in `rpg.js` |
| Tripo villagers | ≈ 0.59 · 0.98 · 0.22 | 0.98 | skinned: `study()` measures the standing frame |
| `horse_bay/black/grey` (Mesh2Motion) | 0.64 · 2.03 · 3.19 | 1.619 (ear tips 2.034) | tail straight back |
| `horse_barded` | 1.73 · 4.86 · 5.70 | 3.86 | ×1.3 the others in its own units |
| cow | 2.31 · 4.59 · 8.07 | 4.59 | |
| sheep | 2.23 · 4.37 · 5.92 | 4.08 | |
| pig | 3.30 · 4.58 · 9.77 | 4.58 | |
| wolf / dog | 1.06 · 2.70 · 5.27 | 2.26 | |
| old peasant m / f | 1.80 · 1.56 · 0.35 | 1.56 / 1.53 | |
| `horseman` (army) | 3.9 · 7.4 · 12.3 | — | not used by my files |
| `ws_cart1` | 4.8 · 2.25 · 2.12 (m, kit units = metres) | | |
