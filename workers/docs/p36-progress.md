# p36 progress (6 Oct 2026, Tehran ~12:00) — round started with his message «لول منو بکن 30 و همه چیز داشته باشم در فول ترین حالت، ببینم مشکلات چین»

## Delivered: package `bluebot_bluewall_p36` (65 files; = p33 + p34 + p35 + p36; supersedes `_p35` — never install both; installer sandbox test: install ok + rollback identical)
- **Owner button** `Level 30: everything full` (Settings › OWNER TOOLS, `ui.js` + `main.js`) → `POST /api/dev {max:true}` (`state.py Store.dev`): every structure 30 (queues cleared), vaults full, fullest LEGAL army (`_max_army`: every hero ×3, every other unlocked unit ≥1, rest by the reference plan round-robin, never above the training ground nor any family building), spells filled to the forge housing (`_max_spells`, 32/32), sapphire / onyx ≥ 10 000, Tesla ×4 + dragonling. Kingdom is flagged `devu` = off the leaderboard (existing rule of every owner tool).
- Verified: `max_test.py` (scratchpad) all OK; real browser (Playwright, 390×844): button present, press → «Done», home shows level 30, vaults 307K/692K/230K full, sap / onyx 10.0K, no console error (only the GL warning); `dev/gate.sh` → GATE: ALL OK.

## Problems found while testing the "full" state
1. **FIXED** owner fill (`_start_army` owner branch, dev `army:'fill'`) overflowed the housing: 1061 of 872 space at level 30, workshop 318 of 310, gryphonknight / darkrider only 1 of 3 (it now uses `_max_army`).
2. **FIXED** `settings.js RANGE.previewLevel` was still [0, 20] (the game has 30 levels).
3. **OPEN — all 10 new p35 units REJECTED by the owner** (11:44 «بعضیاشون آشغالن، کاردستی»; 11:48 «هر ده تا … مدل درست نداره بگه برم پیدا کنم»): legionary, captain, ogre, gryphon, lich, treant, gryphonknight, darkrider, baby3, dragon3. They are kit-bashes / re-colours of models already in the assets (Quaternius knight, Sketchfab ogre / tree monster / gryphon, KayKit skeleton, prowler dragon). **Rule he set: when there is no proper model, SAY SO and ask him to find one; never fake it by hand.** From the sandbox only `raw.githubusercontent.com` is reachable (itch.io, OpenGameArt, Sketchfab, Poly Pizza, quaternius.com, kenney.nl all fail) → he must attach real rigged + animated CC0 / CC-BY .glb files. Integration + ONE sample image per unit only after the files arrive.
4. Still open from p35 (unchanged): `noRoute` events 5 / 30 battles, real-phone performance unmeasured, pacing at castle 4 / 6 / 8, N6 colour jump, all visual samples without his OK.
5. Not looked at in the real game this round: a battle with the full army (page load 160 s + battle start ≈ 5 min in software GL), the Army sheet at level 30, the first home frame (the 2nd screenshot was taken during the intro camera: hazy far view, not judged).

## What to ask him for (models) — per unit: rigged + animated (idle / walk or run / attack / death), glTF / GLB, licence CC0 or CC-BY (Sketchfab: filter «Downloadable», «Animated», licence CC0 / CC-BY; Poly Pizza: CC0 / CC-BY; Quaternius / KayKit = CC0)
| # | unit | search words |
|---|---|---|
| 1 | legionary (ordinary Roman soldier) | roman legionary / roman soldier low poly |
| 2 | captain (hero, banner) | knight captain / standard bearer |
| 3 | ogre | ogre rigged animated |
| 4 | gryphon | griffin / gryphon animated |
| 5 | lich | lich / skeleton king / necromancer |
| 6 | treant | treant / ent / tree golem animated |
| 7 | gryphon knight (hero) | griffin rider / knight on griffin |
| 8 | dark rider (hero) | dark knight on black dragon / wyvern rider |
| 9 | 3-head baby dragon | hydra / three-headed dragon (small) |
| 10 | 3-head dragon | three-headed dragon / hydra / ghidorah |
He may send fewer; each unit is independent. Existing credited models stay as they are.
