# p32 — MASTER PLAN: everything the owner asked, in one list (4 Oct 15:59 → 5 Oct 03:29)

Written 5 Oct 01:45 at the owner's request («همه‌ی اینا رو بنویس و یادت باشه»). Everything ships as ONE package `bluebot_bluewall_p32`.
Legend: ✅ done · 🟡 in progress / built but not yet seen in the game · ⬜ not started.  Every new owner message is appended to `bluewall-owner-feedback-oct4.md` (+ Project copy).
Standing rules (unchanged): exactly what he describes, nothing extra · sample image (from the game's real code path) before any visual/UI, one at a time · HUD layout locked except his explicit requests ·
heroes manual · ONE package · never touch secrets/server config · Persian, short, English digits · `📊 پیشرفت: N٪` at every 10 %.

## A. Block V — owner 4 Oct 21:51
| id | what | state |
|---|---|---|
| V1 | giants: natural walk (real alternating stride, no sliding) + club hits where the hit is counted | ✅ `bgiant.js`, `GIANT_SWING`, `dev/test/giant_test.sh` |
| V2 | big dragons: same quality as the home sky dragons | ✅ `bdragon.js` |
| V3 | dragon + baby dragon = aged attractive RED, breath ORANGE (home blue guardian stays blue) | ✅ |
| V4 | dragonling stays green, shoots yellow fireballs one after another | ✅ |
| V5 | squad rings under the army: realistic, beautiful | ✅ `squadring.js` |

## B. Block W — owner 5 Oct 01:05
| id | what | state |
|---|---|---|
| W1 | top-right trophy chip: prettier cup, gem-sized, gems + cup in ONE row | 🟡 REDONE 5 Oct 04:30 (round sockets + number plaques, `bhud.js .bwb-loot`) — seen in the DOM harness, not yet in the real battle |
| W2 | NEXT button: much more attractive, old/medieval, better graphics + quality | 🟡 REDONE as a baked forged plate (`dev/hudart/out/next2.png`) — seen in the DOM harness |
| W3 | unit bar: close-up face + sword portraits, clear, real health ring behind, old style | 🟡 REDONE as spell-style orbs (`unitorb.js`) with a real health ring; new busts rendering (`dev/s32/port`) |
| W4 | giants: ground cracks while they walk, heals after they pass, real cracks | 🟡 coded (`cracks.js`, `terrain.js`, hooks in `battle.js`) — not yet seen in the real game |
| W5 | fire (dragon breath, fireballs) sets structures on fire; ice (freeze spell / ice breath) freezes them | 🟡 coded (`battle.js` burners, `spellfx.js frozen()` ice shell, sim `freezeB`) — not yet seen in the real game |
| W6 | every single soldier walks / fights naturally, real, pretty (run playback = ground speed, attack contact = hit time, hit reactions) | 🟡 run playback = ground speed DONE (`bunits.js runPlay`); attack contact = hit time + hit reactions ⬜ |
| W7 | cavalry on the HOME map: real sword resting on the shoulder, pretty | ✅ code (`life.js`, `gear_sword.js RideShoulder`) — home view not yet seen in the real game |
| W8 | cavalry in battle: draws the sword and strikes properly | ✅ seen in the real battle crowd (`s30/t/axe1_*.png`) |
| W9 | «پلن‌های قبلی فراموش نشه» — nothing from older plans is dropped (plan5 A–F, master plan v5, p31 handoff) | standing |

## C. Block X — owner 5 Oct 01:26–01:38 (more defences, unlocked by level)
| id | what | state |
|---|---|---|
| X1 | **Wizard Tower**: the little mage (our `mage` model) stands on a tower top and helps; small blast, both layers | 🟡 coded (`castle.js`, `wizards.js`, sim `orb`) — not yet seen in the real game |
| X2 | **Quad cannon house** (4 barrels, volley, ground only) | 🟡 coded (`quadhouse.js`, sim salvo) — not yet seen in the real game |
| X3 | every 2–3 levels a NEW defence opens together with a new attack unit; manned sites grow with the level | ✅ rules + sim gating (`DEFENCE_PAIRS`, `battlesim.js`) |

Unlock table: **L1 arrow tower** (spear, archer) · **L3 cannon** (sword, imp) · **L5 wizard tower** (mage, cavalry) · **L8 ballista** (pegasus) · **L10 quad cannon** (siege cannon) ·
**L13 giant guardian** · **L16 baby-dragon guardian + hill-giant guardian** · **L18 dragon guardian** · **L20 second slot** for giant / baby dragon. (Tesla stays the premium item.)
Answer given to him: the base today has 15 arrow towers, 6 ballistas, 6 cannons, keep, Tesla (≤4), 31 walls + 3 gates, ≈150 garrison soldiers at L20.

## D. Block Y — owner 5 Oct 01:35–01:38 (guardians)
| id | what | state |
|---|---|---|
| Y1 | giants (L13), hill giants (L16), baby dragons (L16), dragons (L18) can be stationed in HIS castle as guardians — Army-sheet «guardian» toggle, assigned units leave the attack roster, slots by level (`guardian_slots`) | ✅ server (`set_guard`, op `guard`, `dev/guard_test.py`) + Army-sheet row; home display of the guardian not yet seen |
| Y2 | made-up kingdoms get guardians by their level; real players' bases bring the victim's guardians | ✅ code (`bot_target` / `player_target` / sim) |
| Y3 | attackers can target and kill the guardians (they are real defenders: giants smash, dragons fly + breathe) | ✅ sim; not yet seen on screen |
| Y4 | giant-vs-giant and dragon-vs-dragon fights are visible (spectacle) | 🟡 same code path as every fight; not yet seen |
| Y5 | colours: enemy giants' armour + bracers orange/red, ours blue; enemy dragons dark charcoal with orange fire (ours stay aged red) | ✅ code (`troll_e`, `e_hill`, `dragon_e`, `baby_e`); not yet seen — tell him «اگه نمی‌خوای بگو» |

## E. Owner's standing strategy wish (01:05 + 4 Oct)
The player must fight SMART: units, spells AND heroes all matter strategically (counters, spell spot/timing, hero position); a smart plan must clearly beat lazy play (pass criterion (h)).
Realism: armies ≈ 150 bodies at L20 (both sides); proportions per level.

## F. Strategy brief S1–S13 (`NEXT_PROMPT_ATTACK_STRATEGY.md`)
| id | what | state |
|---|---|---|
| S1 | counter-matrix harness `dev/bs_matrix.js` + `bsm.sh` | ✅ |
| S2 | data model (layer / size / prefer / defences table / `wk` per site / `sim.stats`) | ✅ |
| S3 | defence rules ON in the sim (layers, class multipliers, cannon blind spot + splash on the densest group, ballista air-first) | ✅ code; numbers still being tuned |
| S13 | realism: garrison 10/35/75/115/150 (55 % guard / 25 archer / 10 heavy / 10 reserve), spatial grid | ✅; nav A* spike (worst step ≈ 200 ms) ⬜ |
| S5/S7 | time-to-kill retune + matrix to the pass criteria, keep R7 | 🟡 (`dev/s32/search/*`; R7 and "no dominant army" pull against each other: guardians + new defences will re-balance it) |
| S6 | base profiles (balanced / AA-heavy / artillery-heavy / arrows-only), seeded | ✅ sim; hide unmanned weapon models in battle ⬜ |
| S4 | attacker AI by `prefer` (ram → gate, siege stand-off, raiders → outskirts, air → AA first) | ⬜ |
| S8 | scout intel UI (range rings, defence card, % chips) — sample first | ⬜ |
| S9 | squad tools (focus-target, split) — sample first | ⬜ |
| S10 | result card: damage by source + one hint, coach tips | ⬜ |
| S11 | reactive guard posts (only if still needed) | ⬜ |
| S12 | defence choice per site at home — owner OK required | ⬜ (not asked) |

## G. Order of work
1. Defence data + sim for X/Y (levels gating, wizard, quad, guardians as defenders, attackers kill them) → re-run R7 + matrix → ONE Persian counter table to the owner (§6.4).
2. W1–W3: rebuild, screenshots 390×844 / 844×390 / 360×640, portraits → ONE sample image to him.
3. Y5 colours + guardians on screen (enemy giants/dragons), then X1/X2 models (wizard tower with the mage, quad cannon), home display of guardians + Army-sheet toggle.
4. W4 cracks, W5 fire/ice, W6 soldiers, W7/W8 cavalry sword.
5. S4, S8 (sample), S9 (sample), S10.
6. Verification (gate, bsw, giant_test, R7, matrix, determinism, perf) → `instest_bot.sh` → `mkpkg.sh bluebot_bluewall_p32` → Persian summary (numbers before/after, what is unproven on the phone).

## H. Block Z — owner 5 Oct 03:06 → 03:29 (the owner went to sleep at ≈03:30; he installs what is ready in the morning)
- **Z1 HUD art REJECTED (03:08 «چقدر زشت… کج سلیقه»)** — W1 (gems + cup row), W2 (NEXT), W3 (unit medallions + portraits) all redone from scratch. 03:10: «عکس نیرو ها خیلی بد! دایره ها دورشون خیلی خیلی بدتر! دایره دور اسپل ها باز قشنگ تره».
  → medallions = the SPELL-button orb style (silver glass rim, dark channel with the real HEALTH ring, glossy bowl, the blue count badge of the spell buttons), new tight face/weapon busts for every unit;
  gems + cup each in a round socket with a number plaque (readable on any background); NEXT = a forged-iron + gold plate with a red enamel inlay, rivets, engraved lettering. ONE sample image only when it looks good.
- **Z2 knight helmet + hair (03:06)** — `gear_helm.js` (new): the model's plain bucket helm and its wisps of hair are replaced. 03:21: «مثل کلاه رومی ها نمیتونی بسازی؟» → Roman helm (galea) with a face under it
  (the model has no head): bowl, brow band, comb + cross band, cheek plates, flared neck guard, gold trim; crest = five solid horsehair lobes with a frayed tip. DONE in the lab; to be seen in the real game.
- **Z3 two cavalry models (03:22–03:24)** — (1) the SWORD knight (unit `cavalry`): beautiful, realistic, great helm + FULL plate armour (cuirass, pauldrons, arm / leg plates, gauntlets), WHITE or BLACK horse (the lord stays the black hero).
  (2) NEW unit **Axe Rider** (`axerider`, Stable, ~Lv 11): Roman helmet + long-handled axe, heavier horse (dark), imposing (bigger, armoured) AND STRONGER than the cavalry (hp ≈ ×2, dps ≈ ×1.8, housing 5).
  Wiring list: military.py UNITS/_PREFER/plan, state.py plan, unitdefs.json, armyui NAME/DESC/icon, rarity, squadring colour, bunits TYPE + kinds (clone of the K3 gltf with its own Kit geometry), battlesim ORDER, econ plan, portraits, i18n, assets need-list, balance matrix, tests.
- **Z4 sword on the shoulder / drawn / strike (W7, W8)** — `gear_sword.js`: three new clips made from `Ride` with a per-frame two-bone arm solver (RideShoulder at home, RideDrawn + RideStrike in battle, 1 s loop). Seen in the lab: OK. Wired into life.js (home riders) and bunits.js (cavalry + lord); not yet seen in the real battle.
  The axe rider needs the same with the axe haft (own clips AxeShoulder / AxeDrawn / AxeStrike).
- **Z5 order of work for the night**: (1) full plate for the sword knight + variant clone for the axe rider → (2) axe rider unit end to end (server + client) → (3) white/dark horses → (4) HUD art redo (NEXT, plaques, orb medallions, portraits) → (5) W4/W5 cracks/fire/ice and X/Y visuals in the real game (hud2 shots) → (6) W6 soldiers' walk/fight → (7) S4/S8/S9/S10 + calibration → (8) verification, gate, package. If something is not finished by morning the package says so plainly (nothing is shipped half-working: it is switched off or left out and listed).

## I. Status 5 Oct 07:45 (package built: `bluebot_bluewall_p32`, 35 files, 1.4 MB, install sandbox OK, gate OK except bot_xfer_test = no sqlalchemy on this machine)
DONE and seen in the real game (390×844): Z1 HUD (gems + cup sockets, NEXT plate, unit orbs with health ring), Z2 Roman helm, Z3 sword knight + Axe Rider (battle crowd + home patrols), Z4 sword / axe clips, X1 wizard tower (+ orb shot), X2 quad house (barrels, volley events), Y1/Y2/Y5 guardians (foe giants orange, guardian baby dragon dark), W5 ice shell (direct call), W4 cracks (small version seen, enlarged afterwards), W6 run-speed.
BUILT but not looked at closely: W5 flames on a burning building, Y4 giant-vs-giant / dragon-vs-dragon spectacle, bigger cracks, darker quad-house walls.
NOT DONE (honest list): W6 attack-contact timing for soldiers (sim damage lands at swing start; only giants have `GIANT_SWING`), S4 attacker AI by `prefer`, S8 scout UI, S9 squad tools, S10 result card + coach, S11, nav A* spike (worst step ≈ 140–230 ms), smart-play harness (criterion h), counter table in Persian, portraits of dragon / baby (weak: crouched pose), 844×390 / 360×640 in the real game.
BALANCE tonight: defaults in `battlesim.js TUNE` = the `d2` search result + `hp 12` (tower .55, ballista ×2.2 w + class multipliers, bm_* build-damage multipliers). R7 (owner's full army, ratio 1.0, 4 seeds × spells yes/no): 3★ in 4/8 before → 7/8 now. Matrix (`s32/search/e1.txt`): air / arch / siege / mixed armies win 3★ in every profile, siege with 0 % losses (stand-off: no counter yet), pure infantry loses (0–1★) → «no dominant army» is NOT met; next round: counter-fire for siege, AA that really hurts air, sorties (S11).
