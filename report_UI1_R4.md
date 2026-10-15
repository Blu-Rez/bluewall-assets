# UI1_R4 — menus that really open in landscape (job B3)

Kit: branch `kit`, HEAD 0574fdc. Patch: `patch_UI1_R4.tar.gz` (new `ui_theme_r4.js`; edits in `ui_theme.js`, `bsheet.js`, `ui.js`; **2 shared lines in `main.js`**, both marked `// UI1_R4:`; tools under `workers/dev/`). Table: `UI1_R4_menus.md`. Frames: `photos_UI1_R4.tar.gz`.

## First block — for mother
1. **Result.** Every menu / sheet / dialog I could open by its real button now opens, fits, scrolls inside (never the page) and has a reachable ≥ 44 px close button at **844×390, 800×360 and 932×430 with Telegram margins**. `bash dev/ui1_menus_test.sh` (full run) printed **`UI1 MENUS OK`** — 159 cells ok, 0 fail, 0 error, 53 menus — then `43K PILL OK` and `TOAST OK`. The two confirmation dialogs (added to the test afterwards) ran alone on the same build: 6 cells ok. **BEFORE (kit as started) only 73 of 159 cells passed; 86 failed** — every list panel (Kingdom, Army, Shop, Rank, Clan, Friends, Log, Settings) left the list a 52–172 px sliver, the hero picker's close button was 42 px and under the margins, the hub ran under the home bar at 800×360, and the unit-training sheets cut off their queue chips and scrolled their own title away.
2. **Files.** New `ui_theme_r4.js` (7141 B, 2881 B gzip; one CSS string, injected last by `injectKit()` in `ui_theme.js`, +2 lines there). `bsheet.js`: 2 lines (queue chips wrap; sideways-only scroll). `ui.js`: `toast()` (2 timers, fade 0.4 s). **Shared: `main.js` +2 lines** (hide the mines' 3D gem pills while the hero is out; `T1 OK`). Nothing else shared; no `web/app/*` (restored after the gate), no `pkg/`, no `dev/gate*.sh`, no server `*.py`, no secrets; no new game text, the words «bot / ربات» do not appear.
3. **Budgets.** `bash dev/gate_w.sh` → **`GATE_W: ALL OK`**, noRoute **647** (< 700, same as the baseline), shader-program budget of the gate (`gr1_test`) OK, **+0 shader programs, +0 lights** (by construction: the diff has no 3D code except `sprite.visible` on existing sprites; draw calls were not measured separately). Bundle: +6 995 B raw / +2 225 B gzip (5 192 012 → 5 199 007 B). CSS rules: no `transition` / `animation` / `backdrop-filter` / `!important` in the new file (the test checks).
4. **Decisions I took (reverse any with one line):**
   - *Landscape = two panes.* A left rail (status + tabs, 178 px) and the list at full height on the right, instead of squeezing the stacked layout. One media query `(orientation:landscape) and (max-height:560px)`; the portrait layout is untouched.
   - *«Usable» = the list shows ≥ 45 % of the screen height* (my rule, in `dev/ui1r4_rules.py`). Shop at 844×390 was 172 px = 44 % BEFORE — a borderline failure.
   - *The «+43K ruby» toast* moved from `--st + 112 px` (a third of the screen) to the top strip between the two Telegram buttons; it fades after 2.1 s and its text is removed at 2.5 s.
   - *Gem pills (3D) are hidden in the hero mode* and come back when the hero leaves.
   - *The hero picker* (RP1C's) is touched by class names only: grid inside the side margins, close 44 px — no JS.
5. **For you.** (a) `dev/ui1_menus_test.sh` is not in `gate_w.sh` (workers do not edit gates) — please add it; `quick` takes ~12 min, the full run ~75 min on 2 cores, and it needs the static server (`bash dev/up.sh`) and the debug browser. (b) `dev/ui1r2_test.sh` has one `FAIL` that is by design: its last check says «only R2's files changed» and the working tree now holds R4's files (all its other checks pass). (c) `ui1_r3_test.sh` → `UI1R3 OK`, `ui1_test.sh` → `UI1 OK`, `t1_test.sh` → `T1 OK` on the final code.
6. **NOT proven (read this):** *the feel on a phone* — everything is headless Chromium on software GL with **emulated** Telegram margins (`--tg-content-safe-area-inset-top` 52, sides 47, bottom 21 + two mock Telegram pills), not a phone and not the Telegram WebView; scroll inertia, tap accuracy, real insets are unmeasured. *Which pill the owner saw* — I fixed both candidates (the toast and the 3D gem pill) but could not reproduce a pill over the hero's centre. *Battle panels that need a real opponent* (scout / confirm / result / replay), loading / error screens and owner-only server screens were not opened. *Portrait* was not re-measured (the game is landscape-only). Kingdom at 800×360 shows only 166 px of list (≈ 1.5 cards) — passes my rule, tight. The unit cards of the stable / workshop sheets are ~20 px cut at the sheet's bottom at 800×360 (reached by scrolling the sheet 35 px).

## What was wrong and what changed (details in `UI1_R4_menus.md`, frames in the photos)
| area | BEFORE | now |
|---|---|---|
| Kingdom (6 scenes) | list 56–102 px, category chips 26 px | rail (3 builder pips, 4 tabs as 2×2) + chips 44 px + list 196 px (166 at 800×360) |
| Army | list 52 px | rail (housing, tabs, Find a target) + list 253 px |
| Shop | 172 px (44 %) | 260 px |
| Rank / Clan / Friends / Log | 112–165 px | 253 px |
| Settings (+ owner tools) | 87 px (57 at 800×360) | 255 px |
| Assist hub | 800×360: bottom tile row under the home bar | 68 px tiles at ≤ 400 px, panel centred in the safe box, scrolls inside if needed |
| Hero picker | close 42×42, cards under the margins | inside the margins, close 44 px |
| Unit sheets (barracks, training, stable, workshop, lair) | queue chips cut sideways (the «+N» chip unreachable); **every redraw ran `scrollIntoView({block:'nearest'})` on the selected unit card and scrolled the whole sheet up** (title, ✕ and Train under the top edge at 800×360 and at 844×390 for stable / workshop) | chips wrap; the card scrolls sideways only |
| «+43K ruby» | toast mid-screen, text never removed; 3D gem pill stays in the hero view | see menus.md §5 |

## Tests (all on the final code)
- `bash dev/ui1_menus_test.sh` — static rules on `KIT4_CSS` (no keyframes / animation / transition / backdrop-filter / `!important`, every selector scoped, exactly 2 media queries, landscape only, rules for every panel, 44 px) + the real game: builds, loads (~2 min), opens every menu by its real button at the 3 sizes, fails on clipped / off-screen / unreachable content, then the 43K and toast tests → `UI1 MENUS OK`. Modes: `static` (seconds), `quick` (~12 min), default full. The static part was also run against a deliberately broken CSS (negative test) before I relied on it.
- `dev/ui1r4_43k.py` → `43K PILL OK`; `dev/ui1r4_toast.py` → `TOAST OK` (rect measured while the toast is on, text, 2.1 / 2.5 s, not over the hero or the screen centre).
- `GATE_W: ALL OK`, `T1 OK`, `UI1 OK`, `UI1R3 OK` (see the first block for the one by-design `ui1r2_test` line).
- The test was made to **catch real defects**: it failed on the unit sheets until `scrollIntoView` was fixed (found by the test, not by eye), and a first version of the toast test passed vacuously (it measured the box after it had faded) — rewritten.

## Frames (full size, headless SwiftShader — NOT a phone)
`photos_UI1_R4.tar.gz`: 86 `pair_<menu>_<size>.jpg` (BEFORE left | AFTER right, one for every cell that failed before) + `pair_toast_home_844x390.jpg`, `pair_43k_gem_pill_hero_844x390.jpg`, `pair_43k_gem_pill_hero_far_844x390.jpg`. Seen at full size by me: Kingdom, Army, Shop, Settings, Clan (mine), Friends, hub (800×360), hero picker (800×360), the info page of a unit, the old info card, the welcome card, the toast (home + hero), the 43K frames before / after, barracks and stable at 844×390 / 800×360 (before / after), both confirmation dialogs at 800×360. The other pairs were produced by the same script and checked by the probe, not looked at one by one.

## Findings for others / not fixed
- Welcome card (`ui.js`): the text says «+1 more» while hidden rows disagree with the count.
- `bsheet.js` `.bsh-dlg` covers the whole host, not the safe box. Both dialogs pass at the three sizes (the card sits in the middle); I did not test a longer dialog text.
- `upgradeui.js:261` uses `r.scrollIntoView({block:'center'})` on a Kingdom row: harmless now (the list is the scroller inside a grid panel) but the same class of bug as the sheet's — worth knowing.
- `web/app/wall.js` is rebuilt locally by the gate; it is NOT in the patch (`git checkout -- bluewall/web/app` done).

## Tools in the patch (`workers/dev/`)
`ui1_menus_test.sh` (+ `ui1_menus_verdict.py`), `ui1r4_probe.js`, `ui1r4_rules.py`, `ui1r4_scenes.py` (the scene table: every menu and how it is opened), `ui1r4_common.py`, `ui1r4_census.py`, `ui1r4_sheets.py`, `ui1r4_queue.py`, `ui1r4_table.py`, `ui1r4_menus_md.py`, `ui1r4_photos.py`, `ui1r4_photos_extra.py`, `ui1r4_43k.py`, `ui1r4_toast.py`, `ui1r4_toast_before.py`, `ui1r4_css.sh`, `ui1r4_before2.sh`, `ui1r4_before3q.sh`, `ui1r4_final.sh`, `ui1r4_mkdeliver.sh`. They use the same rig as UI1_R2 / R3 (`ui1r2_rig_build.sh`, `ui1r2_load.py`, `ui1r2_browser.sh`).
