# Blue Wall — handoff after p32 (5 Oct 2026, 07:45)

Package: `/home/claude/pkg/bluebot_bluewall_p32.tar.gz` (35 files, 1.4 MB). Install: `cd /root && tar xzf bluebot_bluewall_p32.tar.gz && bash bluebot_bluewall_p32/install.sh` (rollback = `bash rollback.sh` in the same folder).
After the owner confirms it works: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p32`.

## Owner (Wingless): Persian, casual, short messages from a phone, sleeps at night. Standing rules
Exactly what he describes, nothing extra · a sample image from the game's real code path before any visual/UI, one at a time · HUD layout locked except his explicit requests · heroes manual · ONE package per round ·
never touch secrets / server config · Persian, short, English digits · `📊 پیشرفت: N٪` at every 10 % · every new message of his is appended to `bluewall-owner-feedback-oct4.md`.

## What p32 contains (all in `p32-plan.md` + `p32-progress.md`)
HUD redo (unit orbs `unitorb.js`, gem / cup sockets, NEXT plate) · 21 new portraits (`portraits.js`) · sword knight (great helm, full plate, white horse) + NEW unit **Axe Rider** (`axerider`, Stable Lv 11, Roman helm, long axe) · Roman helm + crest · wizard tower + mage · quad cannon house ·
castle guardians (giant L13 / hill + baby L16 / dragon L18, Army-sheet toggle, foe colours) · giant ground cracks · fire sets structures alight · freeze spell = ice shell · soldiers' run playback follows ground speed · balance default tune (R7 3★ 7/8).

## NOT done / not proven (start here)
1. Balance: «no dominant army» is NOT met (matrix `dev/s32/search/e1.txt`): air / archers / siege / mixed win 3★ in every base profile, siege with 0 % losses (out-ranges everything), AA profile does not stop air, infantry-only loses. Needs: counter-fire for siege (cannon / trebuchet counter-battery or sorties = S11), AA that hurts air, then the smart-play harness (criterion h) and one Persian counter table for the owner.
2. W6 contact timing: soldiers' damage lands at swing start (only giants have `GIANT_SWING`); hit reactions exist (`hitUntil`).
3. S4 attacker AI by `prefer`, S8 scout UI, S9 squad tools, S10 result card + coach (samples first!), nav A* spike (140–230 ms worst step).
4. Not looked at closely: flames on a burning building, giant-vs-giant / dragon-vs-dragon, the enlarged cracks, 844×390 and 360×640 in the real game, phone performance of the new gear.
5. Weak art: dragon / baby portraits (battle model rests crouched at spawn), guardian dragon is dark on dark stone, quad-house walls still light.
6. `axerider` is NOT in `_PLAN` (military.py) on purpose (`_PLAN` feeds the calibrated defence budgets).

## Tooling notes (hard-won)
- Real-game session: `dev/s30/live.py` (persistent browser; step json → `s30/cmd/`, shots `s30/t/`); page load 3–6 min; the browser is ≈20× slower than real time → advance the sim with `sim.step(0.1)` loops, never wait for events in real time; a cast must go through `__bw.battle.cast` (events pushed outside a step are cleared).
  Stop it with `touch s30/cmd/QUIT`; if it hangs kill the whole tree BY PID (an orphaned chromium kept eating the CPU for an hour). Never run matrix / R7 jobs while a browser session runs. Never set `scene.fog = null`.
- Home riders: `scene.traverse` → `userData.farRef` (horse root with `bwCull 380`); wrap `__bw.ctl.update` to place a free camera next to a rider (see `dev/s32/live/v10.json`).
- Portraits: `dev/s32/port` (`pd.py` daemon, `shoot3.py <types> 768`, `cfg3.json`: `dy` + = subject moves DOWN, `final.py` writes `client/src/portraits.js`); transparent alpha from a black + white background pair; `GHOST` set in `mkport3.py` cuts the spawn-fade double.
- Balance: `dev/r7.sh` (`FULL=1 NS=4 TUNE_KV="k=v,..."`), `dev/s32/search/run.sh NAME "k=v"` (R7 + matrix), defaults live in `battlesim.js TUNE`.
- Gate: `bash dev/gate.sh` (only `bot_xfer_test` may fail on this machine: no sqlalchemy). Install sandbox: `bash dev/instest_bot.sh bluebot_bluewall_p32 ok`.
