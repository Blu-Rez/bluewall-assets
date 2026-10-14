# p35 progress (updated 6 Oct 2026 ~10:10 Tehran, ≈ 95 % — package built, installer test ok, handoff written)

## Done (and how it was checked)
- **M1 30 levels**: `progress.MAX_LEVEL 30`; every hard-coded 20 → MAX_LEVEL / `MAXL` (server + client); balance.json / unitdefs.json regenerated. Time curve fitted anew (`dev/fit5.py` → `T_HOURS` / `COST_K`): good player, castle → day: 2→4, 3→6, 4→16, 5→28, 6→49, 7→55, 8→100, 9→107, 10→152 (his list 3/7/12/25/40/60/85/115/150: the round rule makes every second round cheap, the pairs average out to his list), 20→428 (14 months), 30→717 (23.5 months). Best player (boosts + gems + rush): 5→13, 10→80, 20→260 (8.5 months), 30→453. Boost only: −19 %. Idle: 20→466, 30→849. Table: `bw/p35_days_final.txt` (`dev/days_table.py`).
- **M2 ×2**: vault ×2, army housing ×2 (army_cap 60 → 592 at 20 → 872 at 30), enemy garrison ×2, loot ×2; guardians / defence unlocks stretched to 30 levels.
- **M3 K1 one send**: `battlesim.send/focus` only move unsent soldiers; heroes unlimited; `sim.canSend(type)`; `ringctl.js` (a sent squad has no handle); `squadring.js` thin dim ring for a sent soldier squad. Test `dev/rules_test.js` (in the gate) + real-pointer live test `dev/bt_live.py` (see below).
- **M4 K2 heroes ×3**: `military.HEROES / hero_slots / hero_next / held_of`; army card `×n/3`; one ring + one ability button per hero type (button fires every copy, badge `×n`). Test `dev/hero_cap_test.py`; live: one ring + one button per hero type, badge ×3 (bt_live.py).
- **New units** (server rules + sim): legionary (2), captain (7, hero), shieldmaiden (15), lord (20), ogre (22), gryphon (23), gryphonknight (25, hero), lich (25), treant (26), dragon (27), darkrider (28, hero), baby3 (29), dragon3 (30); models: lich (3.3), treant (crown on Head_012), 3-head dragon = runtime skinned-mesh surgery on prowler.glb ×1.35 (the flyer agent's `bdragon_live.js` line that removes the rig's 15 invisible control widgets is KEPT: opacity-0 non-skinned meshes only, −draw calls).
- **New art this round**: portraits of the 10 new units (`dev/s35/port/`: frozen-frame pair, `__bw.pause`, alpha from black/white renders → `portraits.js`, +75 KB), neon squad emblems (`squadicon.js` GLYPH: legionary helm, captain banner, ogre club, gryphon head, lich skull + crown + staff, treant, gryphonknight, darkrider horned helm, baby3 / dragon3 three heads), hero power buttons (`spellart.js` NEON: banner / dive / shadow) and per-hero ring / flash / sound / word table in `battle.js` (`ABIL_FX`). ONE sample sheet sent (waiting for OK).
- **New defences**: frost spire (unlock 18), flame tower (22), dragonbane ballista (23), each n=(1,3,30); `spires.js`, castle.js, world.js, battle.js / bfx.js shot FX; `basetargets.json` regenerated.
- **P4 map**: `layout.js` GROW/PUSH (+20 % town), `roads.js` ring2 + lanes, `town.js` quota (61 → 96 house blocks, +8 % draw calls). Before / after sample sent (waiting for OK).
- **P9 palette**: `theme.js` (6 mood bands 1 / 6 / 12 / 18 / 24 / 30, level 30 = today's level-20 look); hooks in tod / terrain / water / town; level hint = sign-in answer (`state.touch` → keep level, `server.h_auth`, `web/index.html`) > localStorage > 30; `?lv=N` for dev. Sample sheet sent (waiting for OK).
- **Skin / unit tiers on 30 levels**: wood 1 / stone 6 / iron 12 / gold 18 / diamond 24 / crystal 30 (`skin.js to20`, `upgradeui.js`, `military.TIER_AT`, `unitdefs.json`).
- **Balance (M6)**: harness `bs_matrix35.js` (`bal35.sh`, `bal35_report.py`): parity with p34 (new L15 ≈ old L10, new L30 ≈ old L20, slightly harder at L30 / ratio 1.5), no collapse of any archetype; economy sim uses the real price of the reference army (`MI.ref_price_per_space`); raids: loot / need ratio ≈ p34 up to 20, richer at 25–30.
- **Gate** (`dev/gate.sh`, run 1 after the pacing bake and the art): `GATE: ALL OK` (python compiles, client builds, no 'bot' word, credits, api_test 1–6, social / gift / clan / prem / econ / hero_cap, nomad plan, rules_test, rc_test, bot_xfer_test, battle sim 0 wall crossings; noRoute events 5 in 30 battles (p34: 1) — archers sent across the whole bigger map, the sim retries after 2 s).

## Open / waiting for him
- OK / changes on: model sheet, map before / after, palette sheet, K1 / K2 UI sample, art sheet (portraits / emblems / powers), tail choice (short / medium / long; current = medium ≈ 29 days per castle level above 20), roster + hero tables.
- Pacing: levels 4 / 6 / 8 are 20–25 % over his list (sawtooth of the round rule); 3 / 7 / 9 slightly under.

## Package + docs (done)
- `pkg/mkpkg.sh bluebot_bluewall_p35` → `pkg/bluebot_bluewall_p35.tar.gz` (63 files incl. `BUILD`, 1.7 MB). `bash dev/instest_bot.sh bluebot_bluewall_p35 ok`: install ok (files copied, python check, service restart, API answers), rollback ok («after rollback identical to before: YES»).
- Not committed (`--commit` only after he says «۳۵ نصب شد»).
- Handoff `bluewall-handoff-p35.md`, next prompt `next-prompt-p36.md`, archive `bluewall_handoff_p35.tar.xz` (see handoff doc).
- S8 scout / S9 squad tools / S10 result card stay OFF in `features.js`.

## Final report (proven / not proven / not done)
- **Proven**: `GATE: ALL OK` (compiles, client build, no 'bot' word, credits, api_test 1–6, social / gift / clan / prem / econ / hero_cap, nomad plan, rules_test, rc_test, bot_xfer_test, battle sim: 0 wall crossings); live K1 / K2 with real pointer events (`bt_live.py`); installer install + rollback in the sandbox; pacing table from the real rules (`dev/s35/days_final.txt`).
- **Not proven**: real-phone performance at ×2 / bigger map / 3-head dragons; his OK of every visual sample (models, map, palette, art, K1 / K2 UI) and of the tail choice; individual tuning of the 3 new defences; pacing at levels 4 / 6 / 8 (±20–25 % against his list); best-vs-good at early levels −45…−52 %; noRoute 5 / 30 battles.
- **Not done**: nothing he asked for is left except his answers.
