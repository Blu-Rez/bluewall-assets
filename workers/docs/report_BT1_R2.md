# BT1_R2 — battle performance, camp slots, soldier → model pipeline, front/back, defender layout hook

**خلاصه (فارسی):** سه‌چهارم هزینهٔ مثلث‌های نبرد از «سربازهای دور» می‌آمد؛ LOD حالا بر اساس اندازهٔ روی صفحه است نه متر: مثلث‌های واحدها ۴٫۵۴M → ۱٫۰۰M، کل صحنه ۶٫۹۵M → ۳٫۱۹M، draw call ۵۰۳ → ۴۷۹، شیدر +۰. اردوگاه حالا لیستی از اسلات‌هاست (`camp_slots.json`)، هر نوع اسلات یک کلید مدل دارد (همه `null` = همان چادر فعلی)؛ سرباز→مدل هم یک جدول داده است (`unit_models.json`، ۳۷ ردیف، همه `null`). هیچ مدلی وارد بازی نشده. جهت‌گیری: سرباز حالا به سمتی که راه می‌رود نگاه می‌کند (انحراف >۴۵° از ۴٫۲٪ به ۱٫۸٪). `BT1R2 OK`، `BT1 OK`، `GATE_W: ALL OK` (noRoute 647، بدون تغییر). **اثبات‌نشده:** fps و GPU گوشی (فقط CPU و تعداد call/مثلث اندازه‌گیری شده).

Round 4 · block B6 · worker BT1 (attack chat) · kit `0574fdc` (WC1 + vault fix) · patch `patch_BT1_R2.tar.gz`.

---

## 0. What is in the patch

| file | status | what |
|---|---|---|
| `client/src/unit_models.json` | new | the **swap table**: one row per unit key (37 = the 31 of `unitdefs.json` `order` + `e_guard e_archer e_hill e_baby e_dragon e_giant`); every `model` is `null` |
| `client/src/unit_swap.js` | new | row validator `checkRow`, `slotReport`, `applySwaps()` (loads a named model, checks its clips, scales it to `h`, points the unit's recipe at it; any failure keeps the body) |
| `client/src/camp_slots.json` | new | the **camp slot table**: 7 kinds, each with a model key (`null` now), size, notes = the needs-Tripo list; `byFam` (squad family → tent kind), `commandRule` |
| `client/src/camp_slots.js` | new | pure maths (no three.js): `checkCampTable`, `squadKinds`, `tentSlots`, `bannerSlot`, `palisadeSlots` → slot records `{kind, x, z, ry, …}` |
| `client/src/bunits.js` | own (model-slot / facing / LOD part only) | pixel LOD, facing rule, `yawOff`, swap hook, `views.slots()`, LOD2 for riders + imp, LOD2 colours calibrated |
| `client/src/bunits_ground.js` | own | 2 lines: the fallback soldier's LOD2 colours come from the same calibrated table |
| `client/src/camp.js` | own | builds the camp from slot records; model slots; far / near pavilion by size on screen; `update(t, camera)` |
| `client/src/camptents.js` | own | `pavilionGeo({lod: 1})` = the far pavilion (same silhouette / colours / UV, ≈ 1 100 triangles instead of ≈ 8 900) |
| `client/src/battle.js` | own, **2 marked lines** | (a) `world.applyLayout` hook (job 5), (b) `camp.update(s.t, camera)` |
| `client/src/world.js` | **shared**, 1 token | `campHome.update(t, camera)` (the home camp gets the same LOD), marked `// BT1_R2` |
| `dev/bt1r2_*` | new | `bt1r2_test.sh` (→ `BT1R2 OK`), static + runtime tests, the two dev pages (units, camp), the measuring rigs (perf / profile / probe / shot / LOD2 calibration) |

(`mkpatch.sh` copies `dev/<id lower-case>_*` = `bt1_r2_*`, which does not match `bt1r2_*`: the `dev/` folder of this patch was copied by hand; the generated rig pages `bt1r2_before|after|test.html` and the `app_bt1r2_*` bundles are NOT in it — `bt1r2_rig_build.sh` / `bt1r2_test.sh` make them.)

Not touched: `battlesim.js`, `armyplan.js`, `unitdefs.json`, `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`, secrets. (`bt1r2_test.sh` checks this with `git status`.)

---

## 1. Battle performance (job 1)

**How measured.** `?pf=1`, phone landscape 844 × 390, `q=low`, level 30, the dev save's army (29 unit types, 384 attackers vs 308 defenders, 130 buildings), software GL with the draw commands swallowed (`NODRAW`, as `pf1_measure.py`): this measures **CPU, draw calls, triangles and programs — NOT the phone's GPU**. Same rig for before (the kit as started) and after (this patch): `dev/bt1r2_rig_build.sh`, `bt1r2_perf.py`, `bt1r2_prof.py`.

| | before | after |
|---|---|---|
| draw calls (deploy) | 503 | **479** |
| draw calls (fight, camera 80 m from the gate) | 474 | **436** |
| triangles, whole scene (deploy) | 6 952 929 | **3 190 094** (−54 %) |
| triangles, unit crowds (`battleUnits`) | 4 541 967 | **1 005 225** (−78 %) |
| triangles, attacker camp (`attackerCamp`) | 257 964 (29 pavilions × ≈ 8 900) | **31 764** (≈ 1 100 each) |
| shader programs home → battle → end | 161 → 203 → 203 | **161 → 203 → 203** (+0) |
| load time of the battle | 30.9 s | 31.2 s |
| JS ms / frame, ×1 (deploy / fight) | 25.6 / 47.8 | 24.4 / 38.9 (noise: the run-to-run spread of this rig is ±10 %) |

CPU did not change (it was never the units' triangles); software GL cannot show the GPU gain. `crowd.js` self time went 0.72 → 0.23 ms/frame (LOD2 figures are not animated).

**Top 5 costs found (deploy, default battle camera) and who owns them**

1. **Unit crowds: 137 calls / 4.54 M triangles (65 % of the scene).** Cause: the far soldier (96-triangle capsule, `lod2`) began at 300 m from the camera, the default battle camera sees the army from ≈ 250 m, so it **never** used it — every soldier was drawn with ≈ 10 000 triangles at 8–16 px tall (a knight 23 000, no LOD at all). **Mine → fixed:** the LODs now follow the **picture size** (`bunits.js` `LOD2_PX = 30`, `LOD1_PX = 90` device px; the switch distance of each kind comes from its own figure height and the camera's fov / the real screen height), riders (`rider`, `rider2`, `rider3`) and the imp got a `lod2` figure. The far figure's colours are the *measured mean colours of the real soldier of the same forge tier* (head / body / legs, `dev/bt1r2_lod2cal.py`: worst channel difference 18 / 255 in the gallery light, ratio 1.00–1.08 in the game's own light, `bt1r2_lod2game.py`); the old fixed bright blue differed by 60–100.
2. **Late stage: 147 calls / 0.91 M triangles** (`late:wslife` 62 calls 456 k, `late:worksites` 48 calls 92 k). **Finding → AN1_R3 (F6).** Not mine.
3. **Attacker camp: 2 calls / 258 k triangles** (29 pavilions with piping, tassels, door frame, 5-segment ropes). **Mine → fixed** with the far pavilion (above): 32 k at the default camera; the near pavilion (full p30b geometry) is used when a tent is > 110 px on the screen.
4. **Castle (`castle-tr2`) 22 calls / 148 k, `static` 21 calls / 100 k, squad rings 4 calls / 120 k triangles + 1.4 ms CPU (`squadring.js place4`).** **Findings** (TR2_S3 / squadring owner). The rings' CPU is paid every frame, also while nobody drags.
5. **CPU in a fight: `battlesim.js` ≈ 10.6 ms/frame at ×1** (`pickDefenderTarget`, `attackerStep`, `defenderStep`, `moveTo`; at low fps the sim catches up to 4 steps per frame, which is what makes a slow phone slower), three `updateMatrixWorld / multiplyMatrices` passes ≈ 4.3 ms, `perf.js` `P11.updateMatrix` ≈ 2 ms (PF1). **Findings** (`battlesim.js` is not ours; the matrix passes belong to PF1 / TR2).

**Left in the unit crowds (next wins, not done — outside the slot / facing part of `bunits*.js`):** `horse` 46 instances × 3 000 triangles = 138 k, `pegasus` 99 k, baby dragons 97 k (10 calls for 5), `mage` 85 k, `maiden` 55 k — none has a LOD2. They are real models: a decimated LOD of the same file (`workers/tools/lod_geo.mjs`) is the honest way, not a hand-built stand-in.

---

## 2. Camp: slot system (job 2)

**Record.** `camp.js` no longer decides what a tent is; it builds a list of **slot records** `{ kind, x, z, ry }` (world position on the ground, world yaw; plus `squad`, `k`, `r`) made by `camp_slots.js` from the plan of `campplan.js` (the planner, the ground clearing and the layout are unchanged: same positions as before, checked by `info.tents`).

| kind | which slot | today (model = `null`) |
|---|---|---|
| `command` | the squad with the most heads (`commandRule: "biggest"`; `null` = none) | the pavilion |
| `barracks` / `supply` / `siege` / `healer` | by the squad's unit family in `byFam` (`barracks`,`training` → barracks · `stable` → supply · `workshop` → siege · `lair` → healer; **a placeholder mapping, the owner picks the real one**) | the pavilion in the squad's ring colour, size by head-count |
| `banner` | the pole of the plan | the standard with the **attacker's own crest** |
| `palisade` | end-to-end along the back and the two sides of the camp rect (`len` m per section), only when a model is set | nothing (no fence today) |

**A model enters by one JSON edit** in `camp_slots.json`: `"model": "<asset key>"` (`web/assets/<key>.glb`), `"h"` (height in metres, the file is scaled to it), `"r"` (footprint radius, the plan leaves that room), `"yaw"` (degrees so the door faces the enemy), palisade also `"len"`. A model that fails (file missing, no meshes, bad row) keeps the fallback and says why (`camp.info.kinds[kind] = {state: 'model' | 'fallback' | 'failed', why}`, console warning). One instanced mesh per mesh of the file, so a model costs `meshes` draw calls whatever the number of tents. A model tent does not take the squad colour (no recolouring — the colour stays on the ring and the card).

**Far / near pavilion.** `pavilionGeo({lod: 1})`: 4 × 5 roof cells instead of 10 × 12, no piping / tassels / door frame / flaps, 2 rope points; same silhouette, colours, UV. Each tent picks its version by its picture height (110 px, 20 % hysteresis), two instanced meshes share the **one** material (so +0 programs, checked). At the default battle camera all 29 tents are far (29 / 0), 22 m from a tent one turns near (28 / 1) — `bt1r2_test.py` asserts both.

**Dev page** `dev/bt1r2_camp.html` (real `createCamp` on a hill; `?stand=1` puts existing assets into the slots to prove a model enters with only the table: `tent_general` → command, `stall` → supply, `weaponstand` → siege, `banner` → banner, a crate fence with `&palisade=1`; `&broken=1` a missing file in `supply`: the 5 supply tents stay pavilions, state `failed`). Frames in `photos/camp_*`.

### Needs-Tripo list (camp) — nothing below exists as a model today

Budget I suggest (≈ 30 tents are in view at once): **≤ 3 000 triangles per tent, ≤ 4 materials, ≤ 400 KB**; the slot does not LOD a model, so 29 × 6 k would be 174 k triangles (today's far camp: 32 k). **Palisade: ≤ 500 triangles per section** — a camp rect takes up to ≈ 95 sections (static test), and the stand-in crate (1.6 k) already makes the dev frame 198 k triangles; a section is instanced, so it costs 1–2 calls whatever the count.

| piece | size (m) | look | slot kind |
|---|---|---|---|
| General's pavilion | ≈ 9 wide, 6 high; a front (door) and a back | the biggest tent, banner-bearing, open flap, a map table inside if it has a door | `command` |
| Troop tent | 8 × 5, 3.5 high, one door in the short side | long, low | `barracks` |
| Stores | 7 × 6, 3.5 high | open-sided canvas roof over crates, sacks, barrels | `supply` |
| Workshop | 9 × 6, 4 high | timber lean-to with a work bench, rope coils, spare beams | `siege` |
| Infirmary | 6 × 6, 3.5 high | pale tent, a cot inside the open flap, a small cross / herb sign | `healer` |
| Standard (pole) | 17 high, 0.5 thick | pole with a cross-arm or ring, **no cloth** (the game hangs the attacker's crest cloth) | `banner` |
| Palisade section | 4 long, 2.4 high, 0.4 thick, ends that meet | sharpened stakes tied with rope | `palisade` |

(`tent_general.glb` exists but is used only by `life.js` for the home camp creature; it is a possible `command` model **only with the owner's number**.)

---

## 3. Soldier → model pipeline (job 3)

**The table** `client/src/unit_models.json`, one row per unit key, no code per unit:

```json
"spear": { "model": null, "anims": null, "h": null, "yaw": 0, "clips": null, "ref": null, "lod2": null, "note": "today: …" }
```
`model` / `anims` = asset keys (`web/assets/<key>.glb`; `anims` only when the clips are in another file) · `h` = standing height in metres (the file is scaled to it) · `yaw` = degrees to turn the file so its front looks the way the unit walks · `clips` = the clip names of the file for `idle / run / walk / atk / hit` (a name or a list; missing slots keep today's names) · `ref` = the speed in m/s at which the run clip plays at its natural rate · `lod2` = `{cloth, legs, skin}` colours of the far figure.

**What happens** (`unit_swap.js`, once per battle, only for keys that are in the army): the file and its clips are loaded; every clip name the recipe needs must exist (a `Armature|` prefix is stripped, as the other loaders do), the model's height is measured and scaled to `h`, a crowd kind `swap_<key>` is made, the unit's recipe `TYPE[key]` points at it (with `yaw` as a render offset on spawn / walk / death). **Any failure** (file missing, no rig, a clip missing, a bad row) → the unit keeps today's body, `views.slots()[key] = {state: 'failed', why}` and one console warning. The swapped recipes are put back when the battle's views are disposed.

**Slots:** `views.slots()` → `{ key: { state: 'body' | 'model' | 'failed', model, why } }`, one entry for each of the 37 keys.

**Dev page** `dev/bt1r2_units.html` (`bt1r2_units.py`): the real `createUnitViews` with a fake sim, every key twice — left = today's body, right = the table's model (an empty slot says so); `?stand=1` fills four foot-soldier slots with the existing `ranger_m` (dev-only proof, clip map overridden per row), `?broken=1` names a missing file. Frames: `photos/units_p0…p9.png`, `units_stand_p0.png`.

**Test:** every unit key of the game has a valid row and a slot (static + runtime), a bad row is refused, a stand-in file takes its slot, a missing file keeps the body and says why, the recipes come back after a page change.

**To add a unit model (when the owner gives the number):** put the `.glb` in `web/assets/` (+ its `credits.json` entry — the gate checks it), edit the row, open `dev/bt1r2_units.html`. **Always give a `lod2` for a soldier-sized model:** a row without it is drawn at full detail at any distance (a 6 k-triangle body × 692 soldiers = 4 M); the capsule's colours should be the model's mean colours (`bt1r2_lod2cal.py` measures that).

**Not tested with a real Tripo file** — there is none yet; the stand-in is an existing rigged file.

---

## 4. Front / back (job 4) — which case it is

**Case B: every LOD is a real mesh** (LOD0 full figure, LOD1 = the same without the small accessories (`lod1Skip`), LOD2 = a 96-triangle capsule + head, lying in 3-D, not a sprite or an atlas tile). So there is **no two-view picker**; what the camera sees is decided by where a figure *looks*, and the job is that they **face their travel / target direction**.

The sim's `face` is the direction of the goal; a soldier's real displacement (pushed by its neighbours, sliding along a wall) can differ and then it walks sideways. Rule (`bunits.js` update): while a ground unit really moves (> 1 m/s, smoothed over ≈ 0.12 s) and is not mid-swing, it looks where it **goes**, with a 1.7× quicker turn than to a goal; standing, swinging or shooting it looks at its target (`u.face`). Flyers and siege engines keep the old rule. Measured on the same rig (83 000 moving samples, 240 frames, units > 1.2 m/s):

| | kit | after |
|---|---|---|
| looking > 45° off its way | 4.2 % | **1.8 %** (1.7–2.2 % in 3 runs) |
| > 70° | 2.3 % | **1.0 %** |
| backwards (> 120°) | 0.4 % | 0.3 % |

Halved, **not eliminated**: what remains is mostly the defenders (`e_archer` 26 % of 220 samples, `e_hill`, `e_guard` 6 %: they strafe along walls while aiming), the werewolf (17 %) and the lord's rider (8 %) mid-turn. The test limits are 2.6 % / 1.5 %.

---

## 5. Defender layout (job 5)

One marked line at the top of `build()` in `battle.js`, before `buildNav` / `createBattle` read the world:

```js
try { world.applyLayout && world.applyLayout(target.layout || null); } catch (e) { console.warn('layout', e); }   // BT1_R2 (TR2-S5 builds world.applyLayout) …
```
No-op while TR2_S5 is not merged (the guard) or when the record is missing. `bt1r2_test.py` installs a stub: called **once**, with exactly `target.layout`, **before** the battle session exists.

Notes for the mother / TR2_S5: (a) `layout_api.md` names the client call `world.layout.enterBattle(target.layout || null)`, ROUND4_JOBS names `world.applyLayout(rec)` — I used the second (it is what the job says); change this one line if TR2_S5 ships the first. (b) `world.setLevel(...)` runs later in `build()` (turn the map into the enemy's base); whether it keeps an applied layout is TR2_S5's to guarantee. (c) **Restoring the player's own layout after the fight** is not in this line — `restoreWorld()` should call `world.applyLayout(null)` (or the player's record); TR2_S5 to own it.

---

## 6. Proof

| | result |
|---|---|
| `bash dev/bt1r2_test.sh` | **`BT1R2 OK`** (static: 37 unit rows / 7 camp kinds / slot maths · source rules · gallery: 37 slots, stand-in, broken file, recipes restored, LOD2 colour ≤ 24 · game: layout hook once before the session, programs +42 = kit +42, 37 slots, camp 29 tents + 1 command + 1 banner + 0 palisade, far / near pavilion, unit triangles 1.0 M vs 4.54 M, calls ≤ kit, facing 1.8 % / 1.0 %) ≈ 7 min |
| `BT1_LEVELS=30 bash dev/bt1_test.sh` | **`BT1 OK`** (level 30: 120 groups, 130 targets, 0 differing outside the battle layers, 0 lost) ≈ 7 min |
| `bash dev/gate_w.sh` | **`GATE_W: ALL OK`**, battle sim: no wall crossings, **noRoute events 647 (< 700)** — unchanged from the kit |

Frames (all opened at full size): `photos/deploy_default_before|after.png` + `cmp_deploy_default2.png` (zoom, before above / after below), `lod2game_*` (real LOD0 | forced LOD2 in the game's light), `camp_*` (shipped / stand-in / palisade / broken, far + near), `units_p*.png`, `perf_after.png` (late fight).

---

## 7. Findings for others

* **AN1_R3:** `late:wslife` 62 calls / 456 k triangles + `late:worksites` 48 calls / 92 k in the battle scene (the battle does not need the worksite people at that detail).
* **squadring.js:** 4 calls / 120 k triangles and 1.4 ms/frame CPU (`place4`) even when idle.
* **battlesim.js owner:** ≈ 10.6 ms/frame at ×1 in a fight; catch-up of up to 4 sim steps per frame at low fps (a slow phone gets slower).
* **PF1 / TR2:** three matrix passes ≈ 4.3 ms and `perf.js P11.updateMatrix` ≈ 2 ms per frame in a battle scene.
* **bunits ground / fly owners:** no LOD2 for `horse` (46 × 3 k), `pegasus`, baby dragons (≈ 19 k each), `mage`, `maiden` — decimate the real files (`tools/lod_geo.mjs`), do not hand-build.
* **TR2_S5:** the three layout notes of §5.
* **The owner:** `byFam` (which squad pitches which tent) is a placeholder; every tent / unit model needs his number.

## 8. What is NOT proven / not done

* **Phone:** fps, GPU time, thermal — the rig swallows the draw commands, so only CPU, calls, triangles, programs are real. The pixel LOD thresholds (30 / 90 device px, the screen height clamped to ×2 DPR) are set from desktop frames; on a ×3 phone the capsule is drawn at the same *device*-pixel size, so it looks the same size but sharper — not checked on a device.
* The capsule's colours are measured for the dev save (forge tier 5 everywhere in the game frames) and in the gallery for tiers 0, 3, 5; tier 1, 2, 4 only in the gallery.
* No real Tripo file went through either pipeline (stand-ins only); a model with another rig / scale may need `yaw`, `h`, `clips`, `ref` tuning on the dev page.
* The camp frames are from the dev hill; in the game itself the camp is only visible close up when the player zooms in.
* The facing is halved, not solved (§4); no frame shows the difference — it is a number from 83 000 samples.
* Not done: LOD for horses / pegasus / dragons (§1, findings); the camp's palisade and banner models need `r`/`h` tuning when real files exist; `bt1r2_test.sh` is not added to `gate_w.sh` (≈ 7 min; the mother decides).
