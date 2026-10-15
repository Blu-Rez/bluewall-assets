# report_AR1 — soldier cards + info pages (built by the mother's sub-agent, 15 Oct 2026 night; NOT a worker chat)
Everything edited in place in the gate tree; frames viewed by the mother: /home/claude/work/ar1/frames (390×844 @2×) + contact_sheet.png.

## Wired
- `client/src/units_looks.json` (new, data): each of the 31 kinds → `{low, high, at}` (look 1 below `at`, look 2 from `at`; `at` = 16, or unlock level + 6 for late kinds). The level used = the level of the soldier's training building.
- `client/src/unitcards.js` (new): mapping helpers, lazy `<img>` card + round-face helpers, style sheet, `createUnitPage` (full-screen info page: 44 px back button under the header, zoom viewer = pinch / double-tap / wheel / ± buttons), `window.BW_chars` stub.
- `client/src/armyui.js` (changed): the soldier tile is a 2:3 card (name, tier, count, hp / dps / space, cost, time); a 44×44 `i` button opens the info page; tapping the card still TRAINS (old behaviour); `unitPic()` returns the card face, so the bsheet chips + queue get it with 0 lines changed in `bsheet.js`; hub back chevron 44 px; rarity tags no longer overlap.
- `web/assets/units/`: 81 cards 384×576 (`c_<look>.webp`) + 81 sheets (`s_<look>.webp`), 57 unit looks + 24 characters, `chars.js` (Part B gallery, `window.BW_chars.open()` / `.open('aram')`), `web/assets/credits_units.json`. Total 21.6 MB. Cards lazy; the sheet is fetched only when the page opens.
- Unchanged on purpose: battle deploy bar, result card, `unitorb.js` 3D orbs. A card that fails to load falls back to the old portrait.
- `life.js` (mother, separate): the raw Treant at the lake (bare pink stump) is OFF by default; `?treant=1` brings it back.
- Gate: `dev/t1_test.sh` armyui rule rebased (≤ 260 changed lines, AR1 owns the file).

## Mapping differences (owner decides by contact-sheet number)
troll→giant · giant→hill · biggiant→ogre · hydra→dragon3 · babyhydra→baby3 · bonemage→mage · frostjinn→imp (**weak match, #12**). Looks with art but no kind (not shown): crossbowman, babygiant_1/2, icegiant_1/2, firegiant_1/2, guardian_1/2.
## Not proven
Phone fps / memory; real Telegram header + landscape; real fingers (synthesized touch); server (army requests answered by an in-page stub in the runs); packaging; file names have no version suffix (a replaced card can stay cached on phones). Part B role lines for 13 characters are short / read off the pictures (`DATA` in chars.js is editable); entry point for the gallery = owner's call.
## Tests
`bash dev/ar1_test.sh` → `AR1 OK` (static + harness); `NOBROWSER=1` for static only; real-game runs `dev/ar1/ar1_browser.py game`, `ar1_chars.py game` (~25 min each); `python3 dev/ar1/contact_sheet.py`.
