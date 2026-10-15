# AN1 — Job 1: animal inventory (kit `8256556`, 15 Oct 2026)
Numbers come from the code (`tr2_life.js`, `life.js`, `pas_life.js`, `wslife.js`, `water_life.js`, `creature.js`, `worksites.js`) and from the GLB headers in `web/assets/tr2/` (tris = triangle count of the file; every file is 1 material, 0 skins, 0 clips). Nothing was run in a browser — counts are what the code spawns, not a frame measurement.

## خلاصه برای وینگلس
- **حیوان‌های Tripo همه ثابتن** (۱۰ فایل تکی + پک پرنده + پک مرغ‌وماهی)؛ حرکتشون فقط یه تکون ملایمِ کل بدنه (کد `tr2_life.js fauna()`)، پا نمی‌زنن.
- **اسب‌های مرتع قبل از S4d با پا راه می‌رفتن (مدل قدیمی m2m)** — الان ثابتن؛ یعنی مرتع یه قدم رفته عقب. بیشترین چیزی که تو حالت قهرمان می‌بینی: مرتع (۱۰ اسب+گاو)، حیاط اصطبل (۸ اسب)، آغل‌ها، اسب گاری، سگ‌های میدون شهر.
- **اسب‌های سواره (شوالیه‌ها) و ارتش مدل قدیمی با کلیپ واقعی‌ان** → تو چک‌لیست مالک نیستن.
- `animal_lamb` (۴k tri، ۸۳ KB) لود می‌شه ولی هیچ‌جای بازی استفاده نمی‌شه.
- مسیر پیاده‌سازی (Job 2): همون روشِ `crowd.js createKind` که برای روستایی‌ها هست (انیمیشنِ پخته‌شده تو تکسچر، instanced) → هر گونه ۱ draw، نه یه skinned mesh برای هر حیوان.

## 1. Table — every animal in the game

| # | animal | library model (tris · file) | where used (file · function) | on screen typical / max | today's motion | what it needs |
|---|---|---|---|---|---|---|
| 1 | **Horse, 3 coats** (bay / black / grey) | `animal_horse_brown` 5.0k·113 KB / `_black` 5.0k·93 KB / `_white` 5.0k·87 KB — three separate models | `pas_life.js buildPastureLife` via `tr2_life.js horses()` (len 7.5 m) · `wslife.js makeAnimals` `kinds.horse` (len 3.4 m; cart horses + pens) | pasture **8 adults + 2 foals (0.6×)** · stable yard **8** (3 stall heads, tied grey at the rail, black at the hay, bay at the trough, bay lunged in the round pen, grey led by the stable boy) · carts **1–4 per site** · pen horses ≤ 4 (livestock) / ≤ 2 (farm). Kind capacity 28 / 40 | static. Procedural: walk bob 1.2 %, trot 2.2 %, graze = body pitch 0.1 rad, standing = 0.5 % breath. **Legs never move** (old m2m horses did) | Quadruped rig **per coat** + `idle · graze · walk · trot` (code's `gaitV` = walk 3.1 / trot 6.4 m/s at full clip speed; the herd moves at 0.72× / 0.8× of that; the lunge uses trot 4.6 and walk 2.0 m/s) |
| 2 | **Cow** | `animal_cow` 6.0k·120 KB (one hide) | `pas_life.js addCows` (len 4.9 m) · `wslife.js` `kinds.cow` (len 3.3 m) | pasture **5** · livestock pen ≤ 5 · farm ≤ 4 → ≈ 9 if both sites in view. Capacity 10 / 40 | static; walk bob / graze pitch only | Quadruped rig + `idle · graze · walk` (cow walk speed 1.6 m/s in code) |
| 3 | **Calf** | `animal_calf` 5.0k·84 KB | `pas_life.js addCows` (len 0.62 × cow) | **1** (pasture) | static | rig + `idle · graze · walk` (+ run optional: it follows the mother at trot speed) |
| 4 | **Sheep** | `animal_sheep` 5.0k·91 KB | `wslife.js` `kinds.sheep` (len 1.6 m) | livestock pen ≤ 10 · farm ≤ 6 · slaughter ≤ 3 → typical ≤ 10 in one view, 19 if all three. Capacity 40 | static; today only `Idle` + a hop (`Jump`) | rig + `idle · graze · walk` (the pen brain only uses idle / walk) |
| 5 | **Pig** | `animal_pig` 4.5k·79 KB | `wslife.js` `kinds.pig` (len 1.8 m) | livestock ≤ 8 · slaughter ≤ 4. Capacity 40 | static | rig + `idle · walk` |
| 6 | **Dog** | `animal_dog` 5.0k·92 KB | `life.js wolf()` → `creature.js herd()` (size 2.2 m, speed 2.2 m/s) | **3**, town plaza (radius 14 m), day. 3 separate meshes (3 draws) | static; walk = bob 0.05 m + sway 0.03 rad | rig + `idle · walk` (+ `run` as a free extra; `herd()` finds clips by regex `walk` and `idle|graz` and uses only those two today) |
| 7 | **Wolf** | `animal_wolf` 5.0k·100 KB | `life.js wolf()` → `herd()` (size 2.8 m, speed 1.8 m/s) | **4**, forest edge (60, −300), night only. 4 draws | static; same bob + sway | rig + `idle · walk · run` |
| 8 | **Lamb** | `animal_lamb` 4.0k·83 KB | **nowhere** (only in `ANIMAL_FILES`, loaded for nothing) | 0 | – | not needed now; could join the sheep pens after sheep works |
| 9 | **Eagle** | `birds/eagle` 3.0k (pack node, wingspan 4 m, flight pose) | `life.js eagle()` | **2**, circling radius 90 / 130 m at ≈ 70–100 m height, bank −0.32 rad, day only | static pose, circles | `fly` (flap loop) + `glide`; it is a pack node → see note A |
| 10 | **Crow** | `birds/crow` 3.0k (pack node, flight pose) | `life.js crow()` | **6**, gliding rings (r 22–46 m, altitude 16–26 m) over the fields, day only. 6 draws | static pose | `fly` + `glide` (note A) |
| 11 | **Dove** | `birds/dove` 3.0k | **nowhere** | 0 | – | not needed now |
| 12 | **Hen / rooster / chick** | `poultry_fish_pack/hen` 2.5k · `rooster` 2.5k · `chick` 1.8k (pack nodes) | `life.js _hensT` (via `tr2_life.js dyn()`) | **7 hens + 1 rooster + 3 chicks** near the coop (caps 8 / 2 / 4). 3 instanced draws | static; walk = bob + roll, peck = whole body pitch 0.5 rad | `walk · peck` per bird (note A) |
| 13 | **Carp (leaping)** | `poultry_fish_pack/carp` 2.4k | `water_life.js` leaping fish | 1 at a time, 0.85 s every ≈ 20 s | static, tumbles along the arc | **nothing** — a 0.85 s jump reads fine |
| 14 | Trout, fish_small | `poultry_fish_pack/trout`, `fish_small` | nowhere | 0 | – | not needed |
| 15 | Swans / mallards | **no Tripo model** (procedural geometry in `water_life.js`) | `water_life.js` waterfowl | lake: 2 swans + mallard hen + 4 ducklings; moat: 2 mallards | procedural glide + neck sway | gap 14c — a model first, no rig job now |
| 16 | Fish school under the water | shader silhouettes | `water_life.js` | many | shader | nothing |

**Not in AN1 (other owners / already animated):** the knights' horses with riders (`life.js _knights`: 6 old Mesh2Motion horses — grey, black, bay, barded war-horse — K3 knights seated on the saddle bone, real clips `Walk / Gallop / Idle`), the army's cavalry / axe riders / lord / pegasus (`bunits.js`, `army.js`), camels in the oil site (baked in `kit_ws`), dragons / giants / gryphons, all villagers (`animal_donkey`, `animal_camel` are in the library but no slot uses them).

**Note A — pack nodes.** Eagle, crow, dove, hen, rooster, chick, carp, trout live as nodes inside two pack GLBs (`birds`, `poultry_fish_pack`) that were cut from one Tripo generation each. Tripo rigs a generated model, so the owner may not be able to rig one node of a pack. If he can't, I build a single-node GLB per bird from the library (centred, feet at y = 0) for him to upload — or he regenerates it from the single-object image.

## 2. What the game side needs (so the checklist is enough)
- **One GLB per animal** named `<animal>.glb` (my merge, Job 2) with clips named exactly: quadrupeds `idle · graze · walk · run` (horses: `trot` instead of / besides `run`), birds `fly · glide`, hens `walk · peck`. `creature.js herd()` finds clips by regex (`walk`, `idle|graz`; `run|gallop|trot` is defined but unused), `tr2_life.js` has a `MODE` map from the old clip names (`Idle / Eating / Walk / Trot / Jump`) — I keep those working for the old call sites.
- **Draw budget** (target ≤ +30 calls for a full pasture): 9 quadruped kinds (3 horse coats, cow, calf, sheep, pig, dog, wolf) = ~9 draws, ×2 with shadows; birds / hens 5–8 more. Fits when every kind is one instanced baked-animation mesh; it does NOT fit if every animal were its own skinned mesh (pasture + yard alone are 20+ animals).
- **Culling:** beyond ~45 m or hidden by hero-mode culling the animal stays on a static frame (no texture lookup for the clip).
- **Fallback:** a missing / invalid rig keeps today's procedural gait for that species (nothing breaks).
- **Order of work after the files arrive** (what he sees most): horses → cows → sheep → dogs → pigs → wolf → calf → birds → hens. Each animal is merged, validated (Khronos 0 errors, ≤ 3 MB, 1 material, feet y = 0, +Z forward) and wired separately, so he can see the first one before the rest are done.

## 3. Open questions for the owner (none blocks Job 1)
1. Three horse coats = three separate models = three rigs. If Tripo credit is tight: rig brown + white first; black keeps the procedural gait until it is done.
2. Cow hides: still ONE cow model (gap 14b). Not an AN1 job.
3. «Horses with riders»: the only riders in the game today sit on the old m2m horses (already animated). There is no Tripo horse with a rider in the paddock; the nearest scenes are the lunged horse with the trainer and the horse led by the stable boy. For the Job 3 frames I will use those.
