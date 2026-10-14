# Blue Wall — handoff after p37 (6 Oct 2026, ≈ 17:00 Tehran)

Package: `/home/claude/pkg/bluebot_bluewall_p37.tar.gz` (71 files incl. `BUILD`; installer sandbox: install ok + rollback identical). Install line (the owner pastes it into his server shell):
`cd /root && rm -rf bluebot_bluewall_p37 && tar xzf bluebot_bluewall_p37.tar.gz && bash bluebot_bluewall_p37/install.sh`
**p37 is NOT confirmed installed.** Only after he says «۳۷ نصب شد»: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p37`. «نصب نشد» + error text → debug the installer / package first. `pkg/deployed.sha256` is still the 5 Oct 08:51 state: p33 + p34 + p35 + p36 + p37 are ONE package (delta against that manifest); never install two of them. The next round ships as `p38` (`mkpkg.sh bluebot_bluewall_p38 "title"` — the delta is then computed against whatever the manifest is at that time; if p37 was not committed, p38 again carries everything since p32).

## Start here
1. `NEXT_PROMPT.md` (= `docs/next-prompt-p37.md`): **§1 = the 12 things he said that are NOT done / not completely done, with his exact words** — the work list of the next round. §7 = the files he must hand over.
2. `docs/p37-progress.md` (proof table of this round, how each thing was measured), `docs/bluewall-owner-feedback-oct6.md` (his words, verbatim, newest at the end).
3. Run `bash /home/claude/dev/gate.sh` → `GATE: ALL OK` (24 checks, ≈ 4 min; needs `pip install --break-system-packages fakeredis sqlalchemy aiogram aiosqlite`, `setup.sh` does it).

## What p37 contains (one line each; details in p37-progress.md)
- Level 30: the kit houses get the towers' blue slate roofs → the whole home map is blue again (`world.js`, `theme.js`, `town.js`). Camera limits (`controls.js`): home maxD 415 / r 317, attack start r 303 / 317.
- «برفکی» / light jump (N6): two real causes fixed (canvas resize inside a frame → `main.js` resizes outside the frame; lost GPU context comes back with empty targets → repaint of the atlases `sc_cards.js`, lighting targets). NOT proven on his phone; ~14 % darker after a recovery (open).
- Army formation (`armyplan.js`): compact blocks (`compactBlock`), circle layout of the rings (`RING_GAP` 1.4 m), 3 groups (heroes + great ones → infantry → ranged / siege), wide army inside the muster plain (`PLAIN`), buildings as obstacles (`toFrame(solids, dp)`). The ring radius formula `ringMargin` is shared with `squadring.js`.
- Camp (`campplan.js`, `camp.js`): tents in a band behind the last rank on the mountain slope, constant gap 3.4 m; reads the same plan (`back1`).
- Buildings closed to ground units (`solids.js` → `nav.js buildNav({solids})`, `isBlocked` / `isSolid`; `battlesim.js` slides along walls; `ringctl.js` snaps a target out of a building).
- New tests in the gate: `ring_test.sh` (RINGS OK) and `nav_test.sh` (NAV OK).

## Measured (his full level-30 army = 384 soldiers, 29 squads; real game, Playwright)
rings: 29, smallest gap 1.42 m, overlaps 0 · soldiers inside buildings 0 of 358 (start) · army 170 × 105 m · 29 tents behind · mid army: gap 1.41 m, 0 of 170 in buildings · `GATE: ALL OK` · installer: 71 files, rollback identical.

## NOT done / not proven (full table with his words: `NEXT_PROMPT.md` §1)
1. The 10 rejected new units are still the hand-built models (he must bring real CC0 / CC-BY rigged models; I cannot download).
2. N6 on his phone not proven; 14 % darker after context recovery.
3. Wall layers 1 / 2 / 3 by level (12:35) — not built; ONE question to ask him first (which ring is layer 1).
4. Army order inside the infantry group is by ring size, not by level.
5. Tents are still round striped pavilions (not realistic army tents); a few stand alone.
6. Army 170 × 105 (aspect 1.6): side ground (farm fields, hillside) unused.
7. Only farmhouse / cottages / windmill are closed; trees, rocks, fences, lair rocks are not; never tested through a whole battle.
8. Rings can touch again at runtime (squads move).
9. Home / attack camera + blue colour not re-shot in the FINAL p37 build.
10. Headless `bsw.sh`: `noRoute` 5 → 20 with the new formation, cause unknown.
11. p37 install unconfirmed.

## Tooling notes (p37 additions)
- `dev/v37.py` — phone view 390 × 844 (env `SKIPINTRO=1`, `PH=A|H|B|C`, `ARMY=mid|small`, `ARMY2=1`): `SKIPINTRO=1 PH=B python3 -I dev/v37.py rN`. `dev/v37w.py` — 1100 × 620, prints `MEASURE {rings, minGap, overlaps, solid, n}` + `PLAN` + `CAM` (env `ARMY=mid|small|g4`), screenshots `_0_start`, `_1_top`, `_2_oblique` in `/home/claude/work/`. One browser job at a time (2 cores); a full battle shot run ≈ 10–14 min in software GL.
- `dev/ring_overlap_test.js` (via `ring_test.sh`): small / mid / giants / full / one / only-monsters, 300 random armies, 4 giants 2 × 2, 61 spearmen ranks, group order, wide-not-tall, inside plain, buildings obstacle (+150 random armies). `dev/nav_solids_test.js` (via `nav_test.sh`).
- `dev/cmp/*.mjs` — node scripts that import the client sources: `m3.mjs` (ring check → `/tmp/cmp/m3.json`), `cp.mjs` (camp ASCII map), `sol.mjs`, `nv.mjs`, `m4.mjs`. Bundle + run: `cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /tmp/cmp/m3.mjs --bundle --platform=node --format=esm --outfile=/tmp/cmp/m3.out.mjs && node /tmp/cmp/m3.out.mjs` (`setup.sh` copies `dev/cmp/*` to `/tmp/cmp`), then `python3 /home/claude/dev/ringmap.py ownerMax,mid,small` → `work/ringmap.png`.
- Backups of the files before the p37 rewrites: `dev/armyplan_before_compact.js`, `armyplan_before_rank.js`, `armyplan_rank_v1.js`, `armyplan_tier_v2.js`, `battlesim_before_p37.js`, `camp_before_p37*.js`, `squadring_before_compact.js`, `main_before_p37.js`.
- Facts of the battle frame: deploy point dp (182.419, 75.692), n = (0.8941542, 0.4477591) = «back» (away from the enemy), lateral t = (−nz, nx); the camera view is mirrored (screen right = −lat); `UR` = 2 in game and in the node tests.
- NEVER `pkill -f <text>` in a command that contains that text (kills your own shell, exit 144): kill by PID. Node can't import JSON modules directly → bundle with esbuild first.
- `setup.sh` (this archive) puts everything under `/home/claude` and `/tmp/ckorig` (the bot base `instest_bot.sh` needs), installs `npm` deps of the client, rebuilds the bundle.
