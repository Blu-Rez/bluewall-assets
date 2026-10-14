# REPORT_AN1 — animals: interim switch back to the old animated animals (15 Oct 2026, kit 8256556)

## خلاصه (فارسی)
مدل‌های Tripo حیوان‌ها ثابتن و پا نمی‌زنن، و ریگ Tripo هنوز درست درنیومده. به درخواست مالک، تا وقتی ریگ‌ها آماده بشن **حیوان‌ها برگشتن به مدل‌های قدیمیِ پاداره** (اسب سه‌رنگ، گاو با ۴–۵ رنگ پوست، گوسفند، خوک، سگ/گرگ، عقاب/کلاغ، مرغ‌ها). **روستایی‌های Tripo دست‌نخورده‌ان.** فقط یه فایل عوض شده (`tr2_life.js`)؛ فایل‌های Tripo حیوان‌ها دیگه دانلود نمی‌شن (−1.3 MB). برگردوندنِ Tripo: `window.__TR2_ANIMALS = true` یا `?tr2animals=1`.

## What changed
- `client/src/tr2_life.js` only (+ dev files below). A default-OFF flag: `state.useAnimals` = `window.__TR2_ANIMALS === true` or `?tr2animals=1`. While it is off: the 12 Tripo animal files (`animal_*`, `birds`, `poultry_fish_pack` = 1.3 MB) are not downloaded; `has()` is false for them; `fauna()`, `horses()`, `gltfLike()` and `dyn()` return null for animal specs. Every caller (`pas_life`, `wslife`, `life`, `water_life`) already had its old code path behind exactly those checks (S4d's fallback), so no other file was touched. The 4 villagers (`people()`, `skinned()`) are unaffected.
- What the player sees again: old Mesh2Motion horses (bay / black / grey + foals) with real leg clips in the pasture, the stable yard, the lunge and the cart; old cow (several hides), sheep, pig in the pens; old dog / wolf herds; old eagle, crows and procedural hens. The leaping fish is the old ellipsoid again (the Tripo carp needs the pack).
- Dev: `dev/an1_off_test.sh` + `dev/an1_off/` (new); `dev/tr2_s4d/s4d.js` one line (`window.__TR2_ANIMALS = true` so the S4d harness still measures the Tripo animals).

## Proven (software GL, headless Chromium — not phone numbers)
- `GATE_W: ALL OK` (noRoute 667, battle sim 0 crossings).
- `dev/an1_off_test.sh` → `AN1 OFF OK`: with the default flag the page requests only the 4 villager GLBs, `preload` ok with no errors, `has()` false for all 11 animal keys, the four entry points return null, `people()` still builds.
- `dev/tr2_s4d_test.sh` §1–4 → `TR2 S4D OK` sections pass (changed source file: `tr2_life.js` only; army files untouched); the browser harness (§5, flag on) passes every line: 16 files load, villagers calibrated, 21 draw calls / 101 k tris for the whole menagerie — i.e. the Tripo path still works when switched on.
- In the real game (`dev_s35.html`, lv 30, Q low, 1280 × 720; `dev/tr2_s4d/game.py`): ready in 131 s, `__tr2life` = ok / animals false / people true / 4 files / 0 errors, console empty. Frames opened at full size: `h_past` (pasture: 3 coats of old horses grazing with heads down and legs visible, foals, cows in black / black-white / red / brown-white), `h_stock` (stable yard, round-pen lunge, livestock pens), `h_farm` (cows, sheep, hens, Tripo villagers on the fields), `h_yard` (town square, Tripo villagers).
- Numbers on the p49 kit: h_past 501 calls / 4.16 M tris · h_stock 229 / 1.57 M · h_farm 292 / 1.72 M · h_yard 362 / 2.97 M (median of 5 × 3 frames). Skinned meshes 92 (S4d had 71, the old kit 98), programs 165. These are not comparable with the S4d table (the castle and houses changed since), only with each other.

## NOT proven
- Phone fps / shader compile time (software GL only).
- Motion: I looked at stills, not video. The old animals are the same models and clips the game had before S4d; the legs are visible in the frames, but I did not measure foot sliding.
- Dogs / wolves (3 by day at the plaza, 4 at night) and the eagle / crows: not found in any of the four frames. The code path is the old one and runs without errors; I did not look at them.
- The mixed state "Tripo villagers + old animals" was never in the kit before; the in-game run above is the proof, not an old test.
- `tr2_s4d_test.sh` as a whole: sections 1–4 and the harness were run separately (one wrapper run hung in my sandbox because `PLAYWRIGHT_BROWSERS_PATH` was not exported; export it as `setup_kit.sh` does).

## For the mother
1. **Do not remove** the old animal models from `assets.js` (S4d's report listed `cow`, `wolf`, `eagle`, `crow`, `an_sheep`, `an_pig`, `peasant_*` = 2.07 MB as removable): the animals need them again; only `peasant_m / peasant_f` stay removable.
2. Apply `owned/client/src/tr2_life.js` whole (it is an S4d file; AN1 owns `fauna()`), copy `dev/an1_off*` and `dev/tr2_s4d/s4d.js`; run `bash dev/an1_off_test.sh` → `AN1 OFF OK` and the gate.
3. Later (Job 2): when rigged animals arrive the switch becomes per species (a species with a valid rig turns Tripo on, the others keep the old model). The checklist for the owner and the inventory are in `AN1_tripo_checklist_fa.md` / `AN1_inventory.md` (same inbox).
