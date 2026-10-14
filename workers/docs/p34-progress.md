# p34 progress (5 Oct 2026) — what was done and HOW it was verified
(written as the round goes; final section "proven / not proven / not done" at the end)

## Block C — the ring control scheme (owner 5 Oct 14:50, confirmed by him)
State at 18:30 (see Log): code written; his 16:32 feedback applied (no ×N pills / health bars, no ugly arrow → a road in the rings' own language `ringpath.js`); second sample of the real game being taken (waiting for his OK before anything else visual changes).
| id | what | state | notes |
|---|---|---|---|
| C1 | bottom soldier bar removed | code done (`bhud.js`: `.bwb-sq`, orbs, `onSelect`, scroll code, landscape rules gone) | NO count / health tags any more (his 16:32 order: «×N و هر کوفتی رو پاک کن») — `hud.tags` / `hud.lines` removed |
| C2 | rings are the controls | code done (`ringctl.js`, wired in `battle.js setupInput`) | press on a ring beats the camera pan; hit test on the ground with a ≥ 44 px footprint on the screen; unit-tested with mocks (`dev/s34/rc_test.mjs`, 17 checks) |
| C3 | hold on one ring = all rings | code done (0.6 s) | all rings light (`rc.lit`), drag moves all with their offsets |
| C4 | quick release vs hold on target | code done (0.8 s) | ghost ring + icon stays (`rc.staged`); a ground squad's target is snapped to the nearest dry ground (same rule as `sim.send`, `ringctl.place`) so the ghost shows the real spot; goes when the LAST live, un-launched squad has a target, or on a tap on its ring; tap on the ghost cancels |
| C5 | hero ability to the side | code done | `.bwb-ab .a.off{display:none}` + pop-in; shows only after the hero was sent (and while alive) |
| C6 | spells: older (static) look | NOT done: waits for his answer (which animation exactly) | today only the picked-spell gold ring pulses (`bwbPulse`), plus grow + glow on pick |
| C7 | S8 / S9 / S10 | stay OFF | S9 half / focus is dead code without a selected squad |

Design choices to confirm with him (sample message): the road (`ringpath.js`: terrain-draped, rails + rune band + diamonds + double-chevron head, squad colour, flows toward the target) replaces the dotted arrow · a squad that spreads out keeps a smaller, fainter ring (it is the handle; before it vanished) · a plain tap on a ring does nothing (unless that squad is waiting: then it goes) · holds: 0.6 s (all) / 0.8 s (stage).

## Log
- 16:32 owner: remove ×N pills / health bars (done); arrow «به شدت زشت» → replaced by the ring-style road (done, lab-checked; real-game check pending).
- 16:53 first real-game sample showed the ghost ring hidden under the river (target in water) → `ringctl.place` snaps to dry ground for ground squads (flyers keep the exact point).
- 17:10 owner: icons — more work per soldier, bigger, deeper, INSIDE the big ring circle, no small badge circle on top of group / target (done in code; first version = steel coin + 3D portrait: REJECTED 17:43).
- 17:43 owner: «طرح نئون‌طور کم‌رنگ» → `squadicon.js` redone: faint neon-line emblem per soldier (hand-drawn glyphs: crossed spears, sword, bow + arrow, horseshoe + lance, double axe, wing, dragon egg, dragon, club, shield + wings, crown, plain shield), pool of light, hair-line ring with ticks + 4 diamonds. Lies in the middle of the ring (grid of 6x6 vertices that follows the ground), turned to face the camera, stretched away from the camera so the low viewing angle does not squash it (`squadring.js placeIcon`).
- Bug found by the live test: if the game hiccups, «hold on the target» was lost (hold was read once per frame) and the squad went at once. `ringctl.js holds()` now reads the clock at release too (3 new mock tests, 20 ok).
- 18:23 owner: NEXT + spell column + hero buttons down to the floor (bottom strip of the old soldier bar is empty): `bhud.js` bottom offsets 98–116 px → 14 px (hint 70 px, hero buttons above NEXT only while NEXT shows), landscape rules too. HUD lab shots (portrait 390x844, landscape 844x390) fine.
- P2 (his 08:41 list) prepared early: the «بند» = the trainer's lunge line in the round pen (`pas_life.js`, was a 1 px THREE.Line). New `makeLungeLine()` = 6-sided rope with twisted-strand texture, soft sag, brass snap + hand loop (one mesh, no per-frame allocations). BEFORE / AFTER image = `dev/s34/p2_strip.png`. WAITING for his OK (backup of the old file: /tmp/pas_life.p33.js; revert before packaging if he says remove / keep).
- P1 scope found: winged-horse aerie tower of the stable (stable level 16, `pas_stable.js`), the resting winged horses of the pasture (`army.js`, `pas_life.js PEG_REST`) and the flock circling the town (`army.js`). The Pegasus UNIT in battle stays unless he says otherwise. ONE-line question sent.
- Noticed (not asked): the trainer in the round pen has NO HEAD in the real game and the lab (`life.js`/`pas_life.js person('m')`), asked him.

### Real-pointer-event tests in the real game (live session, 390x844, software GL), build 17:16–18:27
| test | result |
|---|---|
| press on ring + drag (sword) → ghost ring + road | ok (shots c5/d1/e1) |
| hold on the target ≥ 0.8 s + release → `staged`, battle NOT started | ok (`started:false`) |
| 3 squads staged at once, a 4th being dragged → 3 ghosts + roads | ok |
| tap on the ring of a waiting squad → only that squad goes (others keep waiting) | ok (`after_tap` = archer, spear, cavalry) |
| tap on a waiting target (ghost) → target cancelled | ok (archer removed) |
| drag on empty ground → camera pans, ring control stays inactive | ok (camera moved 18.1 m) |
| far zoom (distance 380): press 14 px beside a ring centre → ring taken | ok |
| hold 0.75 s on one ring → all 11 rings lit; drag → 11 squads move; release → all go | ok |
| hero sent by dragging its ring → ability button appears at the side (shield, then flag for the lord) | ok |
| last squad's target placed → all waiting squads go together | mock test only (`rc_test.mjs`), not run live |
| a spell selected + tap over a ring → casts the spell | not run live |

## Log, 5 Oct 19:00–20:15 (after his card answers)
- 18:34 owner: hero ability buttons neon with glow (only after the hero was sent), timer + bar + stars centred, cup chip `earned/full` in thirds → done in `bhud.js` + `social.py attacker_delta` (`WIN_FULL = 40`; 13 / 27 / 40 at ratio 1; `dev/social_test.py` asserts updated).
- 19:25 owner: spells stay as they are, only the NEW look → worn / aged (`spellart.js orbAged`, `SPELL_AGED`; art, sizes, positions untouched). Pegasus only out of the stable pasture (P1: `army.js` loop removed, `pas_life.js PEG_REST = []`; the flock around the town and the battle unit stay; the aerie tower of stable level 16 still stands). Resource vault ×2 / army ×2 / enemy defence ×2 → p35.
- 19:35 card: trainer / peasants get heads (`peasanthead.js`, one merged mesh on the 'Head' bone, used by `pas_life.js` crowd props and `units.js`); rope = slack (sag `0.4 + 0.24·len`); cup icon golden (`ui/cup_gold.webp`, `dev/s34/cup.sh`).
- 19:48 card: sample OK («همه رو بذار»); P3 curve C, P5 army ×2 + enemy defence ×2, P8 spread over 30 levels → all moved to p35 (`next-prompt-p35.md`).
- 19:51–20:01 owner: show the unit emblems with names, change the ones he dislikes, be creative, the bow was reversed, «پگاسوس همون بال قشنگ بود». `squadicon.js`: archer bow fixed; redrawn: cavalry (horse head), dragonling (front dragon head), troll (face with tusks), hill giant (fist), frost imp (horned face + snowflake), bone mage (skull in hat), catapult, battering ram (roofed log cart), cannon, trebuchet, werewolf (wolf head + crescent). Pegasus = the old feathered wing + sparkle (RESTORED, his words). Unchanged: spear, sword, guard, axe rider, baby dragon, dragon, shieldmaiden, lord. Sheet sent to him: `dev/s34/gl_G.png`.

### Gate (20:10, after the emblem change)
All OK: python compiles, client builds (release + debug), no «bot» word in player texts, credits, api_test 1–6, social_test, gift/clan/prem/econ tests, nomad camp plan, battle sim (no wall crossings), bot_xfer_test (`XFER OK` after `pip install fakeredis sqlalchemy aiogram aiosqlite` in this container — those are container packages, not part of the package).

### Proven / not proven
- Proven (labs + tests): ring control logic (mock 20 checks + live pointer tests above), HUD layout in portrait/landscape lab, cup rule 13/27/40, aged spell sheet, gold cup render, peasant head lab, rope shape, emblem sheet (21 units).
- NOT proven in the real game: a real battle with the new HUD (the live session died mid-battle, job f1), aged spells / gold cup / heads inside the real game (labs only), «last target placed → all go» and «spell selected + tap over a ring» live, hero button after sending in portrait AND landscape, phone safe-area values.
- NOT done (p35): P3 / P8 (30 levels, spread), P5 (×2 vault / army / defence), P4 bigger map + houses, P9 map colours, P6 / P7 three-headed dragons; the aerie tower of the stable; S8 / S9 / S10 still OFF.
