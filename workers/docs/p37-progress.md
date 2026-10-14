# p37 progress (6 Oct 2026, Tehran ~12:00–16:00) — the «5 bugs» round + army formation + camp + rings + buildings

Package: `bluebot_bluewall_p37` (supersedes `_p36`; = p33 + p34 + p35 + p36 + p37 — never install two of them).  Install line (his phone / server shell):
`cd /root && rm -rf bluebot_bluewall_p37 && tar xzf bluebot_bluewall_p37.tar.gz && bash bluebot_bluewall_p37/install.sh`

## What he asked this round (his words are in `bluewall-owner-feedback-oct6.md`)
| time | ask | state |
|---|---|---|
| 12:06 | 1. level 30: everything BLUE like the old level 20 | done (world.js: the kit houses get the towers' blue slate roofs at the top levels); seen in a real-game screenshot (home, level 30) |
| 12:06 | 2. home camera must go further back on the bigger map, sensible zoom / angle limits | done (controls.js; home maxD 415, r 317) |
| 12:06 | 3. attack camera went way too far back | done (start r 303 / 317 …) |
| 12:06 | 4. tents scattered, pretty, constant gap, groups IN FRONT of the tents, none inside | done — `campplan.js` / `camp.js`: tents in a band BEHIND the last rank, on the mountain slope, constant gap 3.4 m, never on a farm / building |
| 12:09 | 5. in the attack the picture suddenly goes «برفکی» + a light jump (old N6) | partly: found + fixed the two things that can do it (the resize re-allocation inside a frame; the context-loss recovery leaves empty targets) — see «not proven» |
| 12:35 | wall layers 1 / 2 / 3 by level | NOT built (parked, p38 question: which ring is layer 1 / 2 / 3) |
| 13:09 | army before the gate arranged like a real army: heroes + high level in front … ordinary soldiers last | done — three groups: heroes + great ones (dragons, giants, cavalry …) in front → infantry → archers / mages / siege behind |
| 14:16 | tents BEHIND the army as a horizontal band on the mountain; army WIDE not tall; soldiers never walk into buildings | done — see below (army 171 × 99 m, tents behind, `solids.js` + `nav.js`) |
| 15:03 | the rings (halos) must NEVER run into each other; optimise: 4 giants = 2 × 2 so the circle gets small | done — `armyplan.js` rewritten (compact blocks + circle layout), `squadring.js` uses the same ring formula |

## The army formation (armyplan.js, rewritten at 15:03–15:25)
- Every squad is one **compact block** (`compactBlock`): the number of ranks that makes the circle round it smallest, the ranks as equal as possible, the fuller ones in front. 4 giants = 2 × 2, 3 giants = 2 + 1, 61 spearmen = 8 ranks of 8–7, 20 archers = 5 × 4.
- Its **ring** = the farthest soldier from the middle + `ringMargin` (half the biggest body + 1.2 m) — `squadring.js` uses the very same formula (`ringMargin` exported from `armyplan.js`), so what is planned is what is drawn.
- The rings are laid out as **circles**: strongest group first, each at the free spot nearest the front and the middle (cost = depth + 0.1 × sideways), `RING_GAP` 1.4 m clear between rims, inside the muster plain (`PLAIN` table: left limit −92 keeps clear of the farmhouse, the right side narrows with depth).
- Order of a real army (3 groups): 0 heroes + great ones (castle level 15+: dragons, giants, big beasts, the cavalry) → 1 infantry (mid and ordinary) → 2 archers, mages, siege engines. A ring of a later group never stands in front of (the middle of) a ring of an earlier group. Heroes are placed first = the middle of the front.
- The width is chosen so that the army is about 2.1 × wider than deep, as far as the plain allows; then the whole army is centred on the deploy point.
- Measured (node, UR 2): small 72 × 35 m · mid 114 × 61 m · his full level-30 army (29 squads, 384 soldiers) 171 × 99 m (was 174 × 88 with huge overlapping rings, 146 deep before that) · smallest gap between any two rings 1.4 m, **0 overlaps in 300 random armies** (`dev/ring_test.sh`, part of the gate).
- Tents: `campplan.js` puts them right behind the last rank (front = 15 m clear), band as wide as the army, gap 3.4 m; his full army: 29 tents at 109–166 m behind the line, on the mountain slope.

## The army keeps clear of the buildings on the plain
First in-game measurement (15:38, his full army): 3 rams of the 358 ground soldiers stood INSIDE the windmill (lat −70, back 55: it is on the muster plain). `planArmy(army, UR, deployed, obstacles)` now takes the buildings in the army's own frame (`toFrame(solids, dp)`; `battlesim` gets them from `nav.solids`, `camp.js` from `staticSolids()` — the same list, so plan and camp agree) and no ring comes nearer than radius + 3.5 m to one (also the final sideways centring respects them). His full army with the windmill: 170 × 105 m, nearest ring 3.8 m from the mill. Tested: `ring_test.sh` (his army + 150 random armies with buildings).

## Buildings are closed (owner 14:16 «سرباز ها تو ساختمون نرن»)
`solids.js` (farmhouse + props, hamlet cottages, windmill) → `nav.js buildNav({ solids })` marks the cells under them closed to ground units (`isBlocked`, `isSolid`; `isWet` stays water only, so no wake / no wading rule changes), A* routes round them, a soldier standing inside is moved to the nearest free ground; `battlesim.js` slides along a building wall like along a shore (a wader — giant — keeps out of buildings only); `ringctl.js` snaps a dragged target out of a building. `dev/nav_test.sh` (gate).

## Proof (real game, Playwright 390 × 844 and 1100 × 620, software GL; his full level-30 army = 384 soldiers, 29 squads)
| what | measured in the running game | screenshot |
|---|---|---|
| rings never touch | 29 rings, smallest gap between two rims **1.42 m**, overlaps **0** (read from `rings.info()` of every squad) | `v37w_max_0_start.png`, `v37w_max_1_top.png` (wide, from above), `v37_r9_B2_far.png` / `B3_close.png` (phone) |
| compact blocks | 4 giants 2 × 2, spearmen 8 ranks of 8–7, biggest ring r 18.2 m (was spread over 30+ m) | same |
| soldiers in buildings | **0** of 358 ground soldiers at the start (the first build had 3 rams inside the windmill — fixed by `obstacles`) | — |
| army shape | 170 × 105 m (wide), elite row in front, infantry behind, archers / mages / siege last | `v37w_max_1_top.png` |
| tents | 29 tents behind the last rank in a horizontal band on the mountain slope, constant gap 3.4 m (8 tents on steeper ground than the usual limit) | `v37w_max_1_top.png`, `v37_r9_B1c_camp_low.png` |
| mid army (171 soldiers, 8 squads) | smallest gap **1.41 m**, overlaps 0, soldiers in buildings **0** of 170; tents 7, behind the army | `v37w_mid_0_start.png` |
| gate | `GATE: ALL OK` (24 checks, incl. ring_test and nav_solids_test) | — |
| installer sandbox | install ok (71 files), rollback → identical to before | — |

## Not proven / not done (be honest with him)
1. **N6 (snow-static + light jump)**: two real causes found and fixed (resize inside a frame; a lost GPU context coming back with empty targets), but the exact trigger on HIS phone is not provable here (software GL has no context loss). After recovery the picture is ~14 % darker than before (97.3 → 83.4 mean) — a known leftover. If it still happens: a 10–20 s screen recording + phone model + graphics quality.
2. **Phone performance** unmeasured (headless numbers only). The camp plan costs ~0.7 s in node for the full army (the in-game height lookup is faster); ring layout 0.1 s.
3. **Rings at runtime**: they follow the soldiers (the radius is live) — after the player sends squads they may touch again when squads meet; only the START formation is guaranteed.
4. **10 rejected units** (legionary, captain, ogre, gryphon, lich, treant, gryphonknight, darkrider, baby3, dragon3): still the old hand-built models — he must bring real models (table in `p36-progress.md`); the package does NOT change them. Open question: hide them until real models arrive?
5. Wall layers (12:35) — parked for p38.
6. **`noRoute` in the headless sim went 5 → 20** (`bsw.sh`, 5 mixes × 6 battles; with the pre-p37 formation it is 5, with the new one 20; with the intermediate wide-row formation also 20): late-battle stragglers (t 116–160 s) far from the muster, no wall crossings, no unit in water; cause not found — look at it in p38 if units idle in real battles.
7. Still open from before: `noRoute` 5 / 30 battles, pacing at castle 4 / 6 / 8, `S8 / S9 / S10` off.
