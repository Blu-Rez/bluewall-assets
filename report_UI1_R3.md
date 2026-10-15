# report_UI1_R3 — HUD and button placement for the landscape-only game

**For the mother (first block):** UI1_R3 = ONE new file `client/src/ui_theme_r3.js` (CSS only, 6.5 KB, no JS in the frame loop) + 3 lines in `ui.js` (an import, one call `injectHudR3()`, and the removal of the dead `@media (max-width:340px)` rule). **No shared-file edit** (`main.js`, `rpg.js`, `index.html`, `assist.js` are untouched; the buttons of main.js / rpg.js are placed by class name from the new CSS). `web/app/wall.js` shows as modified in the tree only because the gate rebuilds it — it is **not** in the patch. Default layout = **3** (owner picks 1/2/3 on the sheet; the pick is one number: `HUD_DEFAULT` in `ui_theme_r3.js`).

> **Correction to the job text:** «the crown (Assist)» — the crown is **not** Assist. The crown is `.rp-open` (main.js l.404-409: the owner's hero-mode entry, inline styles, hidden by JS while in hero / battle). Assist is `.bwh-btn` (hub, bottom-right). Both are placed here; the sheet shows both.

## The 3 layouts (sheet `UI1_R3_sheet.png`, cell 0 = today)
| # | name | crown (`.rp-open`) | resources | Assist |
|---|------|--------------------|-----------|--------|
| 1 | Left rail | left edge, centred between the badge and the joystick zone | all 5 gems in ONE column top-right (the 2 special gems as a half-width pair under the 3) | bottom-right |
| 2 | Under the badge | directly under the level badge, the 2 special gems beside it (one cluster top-left) | the 3 mined gems alone top-right | bottom-right |
| 3 (default) | Right stack | right above Assist: both game buttons under the right thumb | 3 gems top-right; 2 special gems under the badge | bottom-right |

Common to all: level badge + name top-left under Telegram's Close; resources top-right under ⌄ ⋮; bottom-left 200×170 = movement zone, nothing of the HUD enters it; every margin is `max(env(safe-area-inset-*), --tg-safe-area-inset-* + --tg-content-safe-area-inset-*)` (one variable set `--hl --hr --ht --hb`, also fed into `.bw-ui`'s `--sl --sr --st --sb`, so panels / sheets / the hub follow); crown 48 px, brass ring (reads on the world); premium pills keep their ≥ 44 px hit area from R2's `::before`.

## Hero mode (rpg.js touch layer, by class names only)
`rpg.js` was NOT edited. `.rp-on>*:not(canvas):not(.rp-k){visibility:hidden}` already hides the whole normal HUD and the crown in hero mode, so the two never show together (checked in the real game: crown `display:none` in hero, `block` again after exit). The seven buttons are re-placed with `!important` (only on `.rp-*` selectors, to beat the inline styles):
- thumb arc round the bottom-right corner: jump 78 (right 16 / bottom 22), dodge 62, sprint 58, contextual «use» 62; all ≥ 44 px, 8+ px apart (circles checked, not boxes)
- exit / camera / gate moved from a left COLUMN (it ran down into the joystick area) to ONE ROW under Telegram's Close (x 12 / 66 / 120, 46 px) → the left half stays free for the floating joystick
- safe insets on all of them; `backdrop-filter` removed from `.rp-b` (cheaper on phones, same look on the dark ring); `.rp-perf` margin made safe too
- **If RP1C-R2 / R3 adds a new hero button** it keeps its own position (my overrides cover only the 7 known ids: jump, dodge, sprint, act, exit, cam, gate). Merge order has RP1C_R2 first → look at the hero frame once after the merge.

## Dead portrait tables
Searched `ui.js`, `ui_theme*.js`, `assist.js`, `bsheet.js`: the only dead portrait-only rule was `@media (max-width:340px){.bw-ui{--hs:.56}}` (320 px phones) — **removed**. NOT removed (not dead or not mine): `.bw-sheet / .bw-panel / .bsh` base rules (they are the non-phone / desktop base, the landscape media block overrides them on phones); `#bw-rot` rotate card and the loader `LAY.P / LAY.L` tables in `index.html` (the mother's loader lines — the mother can drop `LAY.P` if she agrees the game never shows portrait).

## Proven (what I looked at, full size)
- **Real game frames** (the real bundle, headless, software GL), world captured ONCE per size and the HUD layers composited over it, so cells differ only in the HUD: 844×390 (cells 0-3), 800×360 (0-3), 932×430 (3), notch case (Telegram side inset 47 px) at 844×390 (3, 1, 2). Telegram header mock: Close top-left, ⌄ ⋮ top-right, content-safe-top 56 px.
- **Hero frames, real game:** before (kit as it was) vs after at 844×390; after at 800×360 and 932×430, with the «use» button forced visible so all 7 buttons show (rects printed: no overlap, none under Close / ⌄ ⋮).
- **`dev/ui1_r3_test.sh` → `UI1R3 OK`:** static rules (CSS only, no keyframes / transitions, `backdrop-filter` only as `none`, every `!important` on a `.rp-*` selector, all 7 hero ids + 3 crown rules present, ui.js changed ≤ 8 lines and lost no export, the 340 px rule is gone) + geometry on the light rig: 3 layouts × 3 sizes × safe-area cases (none / notch / home bar / both) × home and hero → every target ≥ 44 px, no HUD-vs-HUD or HUD-vs-hero-control overlap, nothing inside a safe margin or the joystick zone.
- `dev/t1_test.sh` → `T1 OK` (60 checks); `dev/gate_w.sh` → **`GATE_W: ALL OK`, noRoute events 614 (< 700)**, unchanged.

## NOT proven (say it)
- **The feel on a real phone:** thumb reach, accidental taps at the arc, the crown's distance from Assist (layout 3) were judged by geometry and frames, not by a thumb.
- **Real Telegram insets:** the Telegram header and the notch are mocked (Close / ⌄ ⋮ pills, `--tg-*` set by script). Real values on iOS / Android landscape are not measured.
- **Hero GPU / device rendering:** the hero frames come from software GL; the real hero GLB look and fps on a phone are RP1C's / PF1's business.
- **Building sheet (`.bsh`, pinned right, ~590 px) over layout 1/3:** the sheet covers the right column while open — same as today, not changed here; the crown (layout 3) is under it too, by design (the sheet takes the thumb zone).
- **Layouts at 800×360:** layout 1's crown ends exactly at the joystick zone edge (top ≤ 100% − 218 px − bottom inset); layout 3 is tight but not overlapping.

## Needs Tripo
none.

## Files
`patch_UI1_R3.tar.gz` (owned: `client/src/ui_theme_r3.js`, `client/src/ui.js`; `dev/ui1_r3_*` tools; no shared diffs) · `photos_UI1_R3.tar.gz` (sheet, before / after frames, hero before / after, sizes, notch) · this report.
