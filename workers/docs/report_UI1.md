# report_UI1 — building sheet look (UI1, round 1 + 2)

> **UI1 = building sheet look. Review like any patch: every frame full size, GATE_W: ALL OK, T1 OK, no logic change (diff shows markup/CSS only), no change to main / world / battle / economy / server / pkg / gate files. Two files are mine (`client/src/bsheet.js`, new `client/src/ui_theme.js`); `ui.js`, `upgradeui.js`, `main.js` are byte-identical to the kit (the old sheet and the Kingdom page get the same look through a style tag that `ui_theme.js` injects — no edit in those files).**

## What it is
Owner's pick: look **C «Parchment & metal»** (round 1 had A/B/C; he said «the last one is not bad, make it your best and OK it»). Dark leather plate, brass hairline + rivets + stitched line, a round brass emblem per family (own SVG glyphs, no new request) with a brass level badge, parchment cards for the numbers / rows / unit cards, one embossed brass primary button (56 px), dark-leather secondary buttons (48+ px), resource chips in red when short, locked = lock + reason + cost, upgrading = progress bar + clock pill, Collect ready = gold pulse **once** (Web Animations, 900 ms, not endless). Texts English, short. Portrait 390 and landscape 844 (2-column grid so the actions stay in reach).

## Files
- `client/src/bsheet.js` (34 622 → 44 594 B), NEW `client/src/ui_theme.js` (8 146 B: icon set, emblem glyphs, the shared old-sheet / Kingdom CSS). Extra size **+5 454 B gzip** (limit 12 KB). DOM only: **0 new shader programs** (166 → 166 on the map; hero mode itself shows 168 as before), no new request, no web font.
- Dev: `dev/ui1_test.sh` (+ `ui1_test.py`, `ui1_entry.js`, `ui1_h.html`), `dev/ui1_shots.py` + `dev/ui1_rig_build.sh` (real-game rig, builds into `dev/app_ui1`, `web/app/wall.js` untouched). **Nothing added to `dev/gate*.sh`.**
- Shared-file edits: **none** (`git status`: only the two files above).

## Proven (I looked at every frame at full size)
- `bash dev/t1_test.sh` → **T1 OK** (60 checks; no rule in it blocked the design, I did not touch it). `bash dev/ui1_test.sh` → **UI1 OK** (static rules; 80 sheets = every kind × state at 390×844 and 844×390: no console error, every target ≥ 44 px, nothing outside the screen or cut off, tallest 546 px portrait / 308 px landscape). `bash dev/gate_w.sh` → **GATE_W: ALL OK** (noRoute 667).
- Rules kept: no `backdrop-filter`, no endless animation / `@keyframes` in my files, only `transform`/`opacity` transitions (open 320 ms, close 220 ms, `cubic-bezier(.22,1,.36,1)`), z-order sheet 45 / dialog 60 / toast 90, every rule scoped (`.bsh…`, `.k-glass`, `.k-plate`, `.bw-ui.bsh-on`), hold-to-confirm 600 ms linear + «Hold to confirm».
- Real game (software GL, 390×844): barracks (order sheet + unit cards), forge (upgrade → Rush hold → «Finish now?»), ruby mine (Collect pays: 1250 → 7555), fishery worksite, cottage, keep, ruby vault, wall; landscape barracks / mine / forge. Before/after pairs: 13 (10 portrait + 3 landscape) in `pairs_harness/`; real-game before/after in `real_before/` + `real_after/`.
- Timing: hold 250 ms and release → no dialog; hold 900 ms → dialog; cancel dialog; the Move «soon» toast (z 90); a disabled Upgrade shows its reason; Manage opens the Kingdom page with the row highlighted; empty-ground tap closes; the X closes; labels of decorations still work; old `.bw-sheet` kinds (church, treasury) keep working and wear the same tokens.
- **Over the hero view** (`hero_view/`): hero mode on, hero placed at the door of a barracks / ruby mine / forge with the dev API, tapped through the real tap path → the sheet opens and its primary button is the topmost element at its centre (portrait + landscape).

## One thing for the mother (RP1B / RP1C)
In this kit the hero HUD (`rpg.js`: `hudEl` z 40 incl. `.rp-touch`) is a sibling of `.bw-ui` (z 10), so a sheet open in hero mode was **under the joystick/buttons and its taps were eaten by `.rp-touch`** (my first hero frame showed it). I fixed it inside my own file with one scoped rule, `.bw-ui.bsh-on{z-index:45}` (the UI layer rises only while a sheet is open). The sheet is still visible in hero mode because `.bsh.on` / `.bsh-dlg.on` / `.bsh-lbl.on` set `visibility:visible` over the `.rp-on>*:not(canvas):not(.rp-k){visibility:hidden!important}` rule — RP1B's «narrow explicit exception» can build on that; class names `.bsh`, `.bsh-dlg`, `.bsh-lbl` and `bsh-on` are unchanged. RP1B should still hide the joystick while the sheet is open (not done here, not my file).
Also seen, not mine, not touched: `upgradeui.js` still has `@keyframes bwuGleam … infinite` on the corner Kingdom button (pre-existing).

## Changed in code (so the reviewer knows)
No rule, cost, call or server field changed: the sheet calls the same `econ` / `upgrade` / `army` functions with the same arguments, same ids / classes the tests use (`data-b`, `data-u`, `.bsh-go`, …). The JS changes are HTML-string builders (icons, chips, cards), a one-shot pulse (guarded so `refresh()` does not restart it) and `injectKit()`. Army body: housing meter with the training layer, queue pills, unit cards with portrait + cost chips + lock/check marks; the «Next» line is dropped on the army sheet (the Upgrade button carries it).

## Not proven / not done
- **Not proven:** the feel on the real phone (thumb reach, haptics, real fps); the pulse and the open/close motion were checked by timing and frames, not by eye on a device.
- **Not done (next round, only if the owner says go):** HUD, army screen (`armyui.js`) and shop screens. The hero button / door orb is RP1C's; hiding the joystick while the sheet is open is RP1B's.
- Known by design: in the barracks the unit row scrolls sideways, so the 4th card is half visible (its centre is under the sheet edge — the audit lists it as «covered»; swipe reveals it). In landscape the unit stats line is hidden to keep Train in reach.

## Re-run
`bash dev/ui1_test.sh` · `bash dev/ui1_rig_build.sh && bash dev/up.sh && python3 dev/ui1_shots.py` (modes `HEROONLY=1`, `LANDONLY=1`, `CLOSE=1`).
