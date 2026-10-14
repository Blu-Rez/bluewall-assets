# p31 — progress (Oct 4 2026, night) — p29 + p30 + barracks removal, ONE package `bluebot_bluewall_p31`

p31 = p30 (see `p30-progress.md`: attack camp = tents + standard, Training Ground yard gone, graphic health bars teal/orange, giants wade, flyers anywhere, dragonling = army unit from Lair 12, Tesla ≤ 4, new attack HUD top) **+ the Barracks hall removed**.

## Owner request 21:51 → done
1. «برش دار» — the white Barracks hall behind the tents is not drawn any more: `military.js` `const SHOW_BARRACKS = false` wraps the whole barracks block (model + `ctx.tgt` battle target + tap pick); the shared frame vars for forge/training stay; `client/src/basetargets.json` (dev-only dump of the real map for the harnesses) lost its barracks entry. The Barracks building and its level still exist in the rules, the Army sheet, housing and uniform tiers; bot bases keep their own barracks in `battlesim.js` / `bbase.js` (enemy side, unrelated). `camp.js` `BAR` clearing rect stays so the approved tent layout does not move.

## NOT done on purpose (owner 21:51: «خودت ننویس، بکن تو پرامپ استراتژیک»)
Giants' walk + club hits, dragon/baby dragon quality in attack, red dragons + orange breath, dragonling yellow fireballs, squad rings redesign → all written as **block V in `NEXT_PROMPT_ATTACK_STRATEGY.md` §0c** (first thing of the next round, ships as p32).

## Tests
`bash /home/claude/dev/gate.sh` (only `bot_xfer_test` may fail: no aiogram in the sandbox) · R7 `bash /home/claude/dev/bsr.sh` · live attack session `dev/s30/live.py` (step files in `dev/s30/*.json`).

## Install
`cd /root && rm -rf bluebot_bluewall_p31 && tar xzf bluebot_bluewall_p31.tar.gz && bash bluebot_bluewall_p31/install.sh` — after he confirms: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p31`. p31 supersedes p30 (never install both).
