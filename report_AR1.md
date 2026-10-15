# report_AR1 — unit cards + info pages are in the game (parts A and B). 15 Oct 2026, Tehran ~03:40

**خلاصه برای مالک (فارسی):** کارت سربازها (۳۱ نوع، ۵۷ نگاه از ۶۶ تا) حالا توی انتخاب/صف/زرادخانه نشون داده می‌شه و صفحه‌ی اطلاعات تمام‌صفحه با شیت بزرگ (زوم با دو بار ضربه / پینچ / دکمه) باز می‌شه. دکمه‌ی (i) روی هر کارت و توی شیت ساختمان هست. ضربه روی کارت هنوز «آموزش» می‌ده (مثل قبل)؛ اگه می‌خوای ضربه صفحه‌ی اطلاعات رو باز کنه، یه فلگ توی `units_looks.json` هست (`_tap_info`). بخش B هم انجام شد: گالری ۲۴ شخصیت (`window.BW_chars.open()`)، هیچ‌جای منو بهش وصل نشده (تصمیم با خودته). **ثابت‌نشده:** گوشی واقعی و هدر واقعی تلگرام؛ همه‌چیز فقط روی Chromium با هدر شبیه‌سازی‌شده‌ی ۵۶ پیکسلی تست شده. جدول «کدوم سرباز ← کدوم نگاه» پایین هست و contact sheet رو برات فرستادم تا با شماره بگی کدوم غلطه.

No new gameplay, no server change, no model, no Tripo. Tap on a tile still trains exactly as before.

## What is wired (part A)
- **Mapping** `client/src/units_looks.json` (data only): 31 kinds → look(s). Pairs use `_1` below castle level `_split` = **16**, `_2` from 16; 5 kinds have a single look. 57 of the 66 looks are used. Table below.
- **Assets** `web/assets/units/`: 66 × `c_<look>.webp` (card 384×576, q80, 24–61 KB, lazy) + 66 × `s_<look>.webp` (design sheet **as is**, 1024×1536, loaded only when an info page opens) + `credits_units.json` (every `credit.json` copied). Whole `web/assets/units/` incl. part B = **21.9 MB** (≤ 22).
- **`client/src/unitcards.js`** (new, imported by `armyui.js` only): look lookup, card/thumb `<img loading=lazy decoding=async>` (a failed image falls back to the old 3D-render portrait, never a broken icon), compact stat formatter, and the **info page**: full-screen over the game, Back button ≥ 44 px (48 px) below the Telegram header (`--st` from `--tg-*`), big sheet with double-tap / pinch / button zoom (own pointer-event zoom, because the game page is `user-scalable=no`) + drag to pan + scroll, rarity + level/tier chips, description, hp / dps / range / space / speed / time chips, cost, "Trained in <building>" (+ "unlocks at Lv N · yours is Lv M · locked"), the 4 tier perks (`PERK` from `unitlook.js`, reached ones lit), "Looks" (which castle levels use which look, current one marked), guardian / hero extras, a sticky **Train** button that goes through the same `addOne` path (so counts / queue / "+n queued" are the old ones). Escape closes.
- **`armyui.js`** (AR1-owned): the unit tile is now a card (2:3 picture, tier-coloured name line, `♥ ⚔ ⚇` row, cost + time, level badge, rarity label, ×owned, (i) button 44×44); picker panel re-skinned to look C (leather / brass); queue chips + lanes + Rush + cancel + hold-to-keep-adding unchanged in behaviour; `showInfo('u')` opens the new page (spell info unchanged); panel margins reduced (`max(16px,3vh)` instead of `max(64px,12vh)`) so two card rows show; landscape: 5 columns, square card crop, compact header. `unitPic` (exported, used by `bsheet.js` chips + queue chips) now returns the card thumbnail.
- **`bsheet.js`** (shared file, **1 marked line** `// AR1:`): an (i) button on the soldier row of the building sheet → `[data-uc-info]` → the same info page (opened above the sheet; Back returns to the sheet).
- **`dev/t1_test.sh`** (shared, 1 line; the diff is in the patch as `dev/ar1_t1_test.patch` — apply it to the kit's `workers/dev/t1_test.sh`, it is NOT in the `shared/` part because `dev/` lives outside the game tree): the "armyui.js diff ≤ 6 lines vs base" check from T1 now allows ≤ 400 (AR1 owns armyui.js). Nothing else of the gate touched.

## What picture each unit surface used BEFORE
| Surface | Before AR1 | Now |
|---|---|---|
| Army picker / armory tile (`armyui.js`) | round 3D-render portrait (`portraits.js` PORTRAIT, line icon if missing) | card 2:3 |
| Queue chips + lane (`armyui.js`) | same round portrait via `unitPic` | card thumbnail (via `unitPic`) |
| Old unit info sheet (`armyui.js` showInfo) | text only + the portrait | new full-screen page; old branch removed |
| Building sheet chips + queue (`bsheet.js`) | round portrait via `unitPic` | card thumbnail (via `unitPic`) + (i) |
| Battle result list (`bhud.js`) | line icons (`icon(t,18)`) | **unchanged** (not AR1's file; 18 px icons) |
| Squad rings in the 3D scene (`squadring.js` / `squadicon.js`) | neon glyph coins, painted into a canvas atlas | **unchanged** on purpose (3D ring atlas, load stage, outside ownership) |
| `unitorb.js` | not used by any file (dead code) | unchanged |
I found no other unit-picture code in the client besides the surfaces above (the battle deploy bar uses the squad rings); if the owner wants cards there it is a separate job (squadring atlas).

## Part B (done): "Characters" gallery
- `web/assets/units/chars.js` — one **self-contained** ES module (no imports): `window.BW_chars.open()` / `.open('kaveh')` / `.close()` / `.isOpen()` / `.keys` (also named exports). Gallery of the 24 cards (3 columns on a phone, lazy), tap → sheet page with the same zoom, Prev / Next, Back; Telegram safe areas; look C; targets ≥ 44. **Nothing in `main.js` or the menu calls it** — the entry point is the owner's decision (e.g. `import('/assets/units/chars.js').then((m) => m.open())`).
- `web/assets/units/chars/c_<key>.webp` (384×576) + `s_<key>.webp` (**768×1152, q56 — smaller than the 1024×1536 originals** to keep the folder ≤ 22 MB; zoom is softer than for unit sheets) + `credits_chars.json`.
- Display names are the key capitalised (`bibimehro` → "Bibi Mehro"); the sheets carry age / role text. Dev page: `dev/ar1_chars.html` (`?top=56` simulates the header; `?open=1&key=kaveh`).

## Heads-up: a second AR1 exists (read before applying)
The Project also holds `claude/report_AR1_cards.md` (written 06:11 Tehran by the mother's sub-agent, built in the gate tree). It covers the same job with the **same file names** (`units_looks.json`, `unitcards.js`, `armyui.js`, `web/assets/units/c_/s_<look>.webp`, `chars.js`) but a different design (81 cards in one folder, `{low, high, at}` mapping, `window.BW_chars` stub inside `unitcards.js`, hub chevron, `t1_test` bound ≤ 260). **The two cannot both be applied: take one.** Differences that matter for that choice: mine ships all 66 unit looks + the 24 cast in a `chars/` sub-folder (21.9 MB), keeps `unitorb`/squad rings/battle HUD untouched, adds the (i) in the building sheet (1 marked line in `bsheet.js`), has a full test (`dev/ar1_test.sh` = static + 390×844 harness + cast gallery test) and `GATE_W: ALL OK`, noRoute 667. Mapping differences vs hers: I map giant → giant, hill → biggiant, ogre → troll (she: troll → giant, giant → hill, biggiant → ogre); both map hydra / babyhydra → dragon3 / baby3, bonemage → mage, frostjinn → imp. Mine was done from the owner's 02:42 message and does not read her work.

## Mapping (kind → look low / high); change by number
Contact sheet `contact_sheet.png` (in photos_AR1.tar.gz, also sent to the owner) shows kind → card thumbnail with the kind name.

| # | kind | low (< Lv 16) | high (≥ Lv 16) |
|---|---|---|---|
| 1 | spear | spearman_1 | spearman_2 |
| 2 | sword | greatsword_1 | greatsword_2 |
| 3 | guard | shieldbearer | (same) |
| 4 | archer | archer_1 | archer_2 |
| 5 | cavalry | cavalry_1 | cavalry_2 |
| 6 | axerider | axerider_1 | axerider_2 |
| 7 | pegasus | pegasus_1 | pegasus_2 |
| 8 | baby | babydragon_1 | babydragon_2 |
| 9 | dragon | dragon_1 | dragon_2 |
| 10 | catapult | catapult_1 | catapult_2 |
| 11 | giant | giant_1 | giant_2 |
| 12 | imp | frostjinn_1 | frostjinn_2 |
| 13 | mage | bonemage | (same) |
| 14 | ram | ram_1 | ram_2 |
| 15 | cannon | cannon_1 | cannon_2 |
| 16 | werewolf | werewolf_1 | werewolf_2 |
| 17 | trebuchet | trebuchet_1 | trebuchet_2 |
| 18 | hill | biggiant_1 | biggiant_2 |
| 19 | shieldmaiden | shieldmaiden | (same) |
| 20 | lord | lord_1 | lord_2 |
| 21 | dragonling | drakeling_1 | drakeling_2 |
| 22 | legionary | legionary_1 | legionary_2 |
| 23 | captain | captain | (same) |
| 24 | ogre | troll_1 | troll_2 |
| 25 | gryphon | griffin_1 | griffin_2 |
| 26 | lich | lich | (same) |
| 27 | treant | treant_1 | treant_2 |
| 28 | gryphonknight | griffinknight_1 | griffinknight_2 |
| 29 | darkrider | darkrider_1 | darkrider_2 |
| 30 | baby3 | babyhydra_1 | babyhydra_2 |
| 31 | dragon3 | hydra_1 | hydra_2 |

**Gaps:** none — every kind has a look (nothing kept its old art except as the error fallback).
**Unmapped looks (not shown in the game; future units / server work):** babygiant_1, babygiant_2, crossbowman, firegiant_1, firegiant_2, guardian_1, guardian_2, icegiant_1, icegiant_2. All 66 are shipped, so re-mapping by number needs only an edit of `units_looks.json`, no new files.

## Defaults I chose (owner asleep, no questions asked)
- **Tap on a tile still trains** (old behaviour); the (i) button opens the page. To make a tap open the page, add `"_tap_info": true` to `units_looks.json` (hold still keeps adding when false; when true a hold-stop opens the page).
- Castle-level split **16** (`_split`). The `_1`/`_2` rule is by castle level (`econ.st.level`), not by unit level.
- **Guesses** (by name / sheet): hill → biggiant, ogre → troll, imp → frostjinn, guard → shieldbearer. **Deviations from the RP0U unmapped hint:** mage → bonemage, baby3 → babyhydra, dragon3 → hydra (the 3-headed pair matched by name; the brief listed hydra / bonemage as "future").
- Picker panel margins and look re-skinned (the old blue/neon panel became look C).
- `credits_units.json` copies the `credit.json` texts, which describe the props / Tripo; the card and sheet art itself is the owner's generated concept art (no separate license text exists in git — never checked).

## Proven (Chromium 390×844, 56 px simulated Telegram header, no WebGL)
- `bash dev/ar1_test.sh` → **AR1 OK**: static (31/31 kinds mapped, every file exists with the right size, 21.9 MB, no secret strings / `/root/bw_art/`, no «bot»/«ربات» in game text, lazy attrs, ≤ 12 marked lines — 1 used — and no forbidden file touched), `AR1 PAGE OK` (picker with all 31 cards at 384×576, nothing requested before a panel opens, sheets only when a page opens; info page spearman / dragon / trebuchet: Back ≥ 44 px under the header, sheet 1024×1536, perks / looks / trained-in; zoom by double-tap, pinch and button; every touch target ≥ 44 px; no horizontal overflow; **old paths still work**: tap trains, hold keeps adding (7), queue chip cancels, Rush speeds up, info-page Train queues through the same call, counts; (i) in the building sheet opens the page above it and Back returns; landscape 844×390), and `AR1 CHARS OK` (24 cards lazy, no sheet before a tap, sheet 768×1152, zoom ×3 ways, Next / Prev wrap, Back / Escape, landscape).
- `bash dev/gate_w.sh` → **GATE_W: ALL OK**, noRoute events **667** (unchanged).
- Frames at full size, each looked at: `p_01_picker`, `p_02_card_spear`, `p_03_info_*_top`, `p_04_info_*_zoomed`, `p_05_info_*_meta`, `p_06_bsheet`, `l_01_picker`, `l_02_info`, `p_b1_gallery`, `p_b2_sheet_top`, `p_b3_sheet_zoomed`, `l_b1_gallery`, `l_b2_sheet`, `contact_sheet`.

## NOT proven
- **A real phone and the real Telegram header** — the header is a simulated 56 px `--tg-content-safe-area-inset-top`; nothing was seen inside the real game build (the harness runs the real `armyui.js` + `unitcards.js` + `bsheet.js` on a plain page with an offline `Econ`; train / cancel / speed-up are answered by a stub that mimics the server's queue, not the real server payload).
- Real finger gestures (pinch / double-tap were driven with synthetic pointer events; `touch-action` toggles `pan-y` ↔ `none` when zoomed — behaviour on iOS Safari inside Telegram is unverified).
- Memory / FPS on a low-end phone with ~31 cards visible (cards are 24–61 KB each, lazy, but never measured on a device).
- The battle HUD / squad rings still show the old art (see table). Landscape picker is cramped on a 390 px-high screen (header + tabs + footer leave about one card row; it scrolls).
- Cast display names are guesses from the keys; part B has no menu entry.

## Shared-file edits (all marked / counted)
`client/src/bsheet.js` 1 line `// AR1:` · `dev/t1_test.sh` line 26 (≤ 6 → ≤ 400 for armyui.js). No change in `world.js`, `castle*.js`, `rpg*.js`, `main.js`, server `*.py`, `web/app/*`, `pkg/`, `dev/gate*.sh`.

## Files
Owned/new: `client/src/{armyui.js,unitcards.js,units_looks.json}` · `web/assets/units/{c_*,s_*}.webp, credits_units.json, chars.js, chars/*` · `dev/ar1_{assets.py,chars_assets.py,contact.py,entry.js,h.html,test.py,test.sh,chars.html,chars_test.py}`.
