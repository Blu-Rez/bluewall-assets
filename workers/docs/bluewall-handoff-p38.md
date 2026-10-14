# Blue Wall — handoff after p38 (6 Oct 2026, ≈ 20:50 Tehran)

Package: `/home/claude/pkg/bluebot_bluewall_p38.tar.gz` (88 files incl. `BUILD`, 6.2 MB; installer sandbox: install ok + rollback identical; `GATE: ALL OK`). Install line (the owner pastes it into his server shell):
`cd /root && rm -rf bluebot_bluewall_p38 && tar xzf bluebot_bluewall_p38.tar.gz && bash bluebot_bluewall_p38/install.sh`
**p38 is NOT confirmed installed.** Only after he says «۳۸ نصب شد»: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p38`. «نصب نشد» + error text → debug the installer / package first. `pkg/deployed.sha256` is still the 5 Oct 08:51 state (p33–p38 ship together; never install two of the packages).

## Start here
1. `NEXT_PROMPT.md` (= `docs/next-prompt-p38.md`): §1 = work list of the next round, incl. his 19:44 rule (everything movable, only gem mines on the mountain fixed, fisheries near water) → the **layout editor** is the next chat's main job. §7 = files he hands over.
2. `docs/p38-progress.md` (what is done + proof), `docs/bluewall-owner-feedback-oct6.md` (his words, verbatim, newest at the end).
3. Run `bash /home/claude/dev/gate.sh` → `GATE: ALL OK` (≈ 5 min).

## What p38 contains (details + proof: p38-progress.md)
- River through the middle of the map (`layout.js` RIVER, quays, water gates, 6 new bridges), `river_test.sh`.
- 12 worksites (`worksites.js` data / `wsbuild.js` / `wslife.js` / `kit_ws.glb`): each kind has its own unlock level (placeholders) and grows with the level (boats, pens, animals, workers, carts); horse carts with real loads on haul roads to the six storehouses (`stores.js`).
- Defence field (`defplan.js` / `defbuild.js` / `kit_def.glb`): 10 traps (+ grenade) and 5 defensive buildings in front of the two town gates (east = the army's gate, strongest). Visual only: no gameplay.
- Everything reads `sites()` / `planDefs()` — no position is hard-wired (`worksites.placeRule`) so the editor can move them.
- Buildings of the worksites and defence field are closed to ground units (`solids.js`).
- Bug fix `nav.js`: roads are built before the bridge list (river bridges were unknown to the headless battle nav: noRoute 3187 → 317).
- Camera wide / never behind a mountain (`cam_test.sh`).

## Measured
Gate 26 checks green · battle (real game, small army): rings 4, min gap 1.6 m, overlaps 0, soldiers in buildings 0 of 78 · worksites + life cost (headless): overview +62 draw calls / +160 k tris, close to the farm +101 / +346 k · late jobs ≤ 206 ms each in own frame · headless sim noRoute 317 (p37: 20 — not fully explained), pinned 73.

## NOT done / not proven
Phone performance unmeasured · Telegram «Wait / OK» unresolved (needs his `journalctl -u bluebot-wall --since "90 min ago" | grep perf | tail -40`) · unlock levels / counts are placeholders (server rules → p39) · traps / defence / heroes have no gameplay · hero models prepared (sheets + clip lists) but not wired · 10 rejected unit models · distinct buildings, citizens + taxes, layout editor, per-building panels → next chats · noRoute 317 vs 20.
**Reminder to the owner (not done yet): rotate the Sketchfab token and delete the GitHub deploy key.**
