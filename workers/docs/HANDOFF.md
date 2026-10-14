> **7 Oct 2026 (merge chat, stage 2): p41 (the town shows what B1 plans: B2 homes + B3 civic lots at the planned positions; gates + one package) is now INSTALLED on the owner's server and is the base of this kit (devkit v4). Read `docs/p41-progress.md` and `docs/WIRING_TODO.md` FIRST. `MERGE2_stage2.md` is DONE (kept for the record). C1–C4, U1–U5, E1, PERF patches are NOT merged yet.**

> **7 Oct 2026 (merge chat): p40 (wave-1 merge: A1 wall rows, A2 mountain streams, B1 town-plan engine, B2 house kit, B3 civic kit) is now INSTALLED on the owner's server and is the base of this kit (devkit v3). Read `docs/p40-progress.md` and `docs/WIRING_TODO.md` FIRST; the prompt for the next round is `MERGE2_stage2.md` (also in `docs/`).**

> **7 Oct 2026 note (mother chat): this file was written at p38. p39 (loader stall fix) is now INSTALLED on the owner's server and is the base of this kit. Read `docs/p39-progress.md` FIRST (state + the owner's phone log); where it disagrees with this file, p39-progress wins. Worker packages (A1…U5, E1) are being delivered as patches and merged by a separate merge chat.**

# Blue Wall + BlueBot — handoff #11 (state after package p38, 6 Oct 2026 ≈ 20:50 Tehran; §A000000 is new, §A00000 = handoff #10 (p37), §A0000 = #9 (p35), §A000 = #8 (p34), §A00 = #7, §A0 = #6)

Written by the previous session (Claude Sonnet 5.5 in Claude Code on claude.ai). **Read §A000000 (p38) first, then §A00000 (p37), then §A0000 (p35), §A000 (p34), §A00 (p33), §A0 (p32), §A (p28–p31)**, then §A-old2 (p27) and §A-old (p22) where §A is silent, then the rest of the file (rules, architecture, gotchas). Where an older section disagrees with a newer one, **the newer wins**. Then read `NEXT_PROMPT.md` (= `docs/next-prompt-p38.md`: his words that are NOT done after p38).

---

## A000000. p38 update (handoff #11, 6 Oct 2026 ≈ 20:50) — READ THIS BEFORE §A00000

Package: `/home/claude/pkg/bluebot_bluewall_p38.tar.gz` (88 files incl. `BUILD`, 6.2 MB; installer sandbox: install ok + rollback identical; `GATE: ALL OK`). Install line (the owner pastes it into his server shell):
`cd /root && rm -rf bluebot_bluewall_p38 && tar xzf bluebot_bluewall_p38.tar.gz && bash bluebot_bluewall_p38/install.sh`
**p38 is NOT confirmed installed.** Only after he says «۳۸ نصب شد»: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p38`. «نصب نشد» + error text → debug the installer / package first. `pkg/deployed.sha256` is still the 5 Oct 08:51 state (p33–p38 ship together; never install two of the packages).

### Start here
1. `NEXT_PROMPT.md` (= `docs/next-prompt-p38.md`): §1 = work list of the next round, incl. his 19:44 rule (everything movable, only gem mines on the mountain fixed, fisheries near water) → the **layout editor** is the next chat's main job. §7 = files he hands over.
2. `docs/p38-progress.md` (what is done + proof), `docs/bluewall-owner-feedback-oct6.md` (his words, verbatim, newest at the end).
3. Run `bash /home/claude/dev/gate.sh` → `GATE: ALL OK` (≈ 5 min).

### What p38 contains (details + proof: p38-progress.md)
- River through the middle of the map (`layout.js` RIVER, quays, water gates, 6 new bridges), `river_test.sh`.
- 12 worksites (`worksites.js` data / `wsbuild.js` / `wslife.js` / `kit_ws.glb`): each kind has its own unlock level (placeholders) and grows with the level (boats, pens, animals, workers, carts); horse carts with real loads on haul roads to the six storehouses (`stores.js`).
- Defence field (`defplan.js` / `defbuild.js` / `kit_def.glb`): 10 traps (+ grenade) and 5 defensive buildings in front of the two town gates (east = the army's gate, strongest). Visual only: no gameplay.
- Everything reads `sites()` / `planDefs()` — no position is hard-wired (`worksites.placeRule`) so the editor can move them.
- Buildings of the worksites and defence field are closed to ground units (`solids.js`).
- Bug fix `nav.js`: roads are built before the bridge list (river bridges were unknown to the headless battle nav: noRoute 3187 → 317).
- Camera wide / never behind a mountain (`cam_test.sh`).

### Measured
Gate 26 checks green · battle (real game, small army): rings 4, min gap 1.6 m, overlaps 0, soldiers in buildings 0 of 78 · worksites + life cost (headless): overview +62 draw calls / +160 k tris, close to the farm +101 / +346 k · late jobs ≤ 206 ms each in own frame · headless sim noRoute 317 (p37: 20 — not fully explained), pinned 73.

### NOT done / not proven
Phone performance unmeasured · Telegram «Wait / OK» unresolved (needs his `journalctl -u bluebot-wall --since "90 min ago" | grep perf | tail -40`) · unlock levels / counts are placeholders (server rules → p39) · traps / defence / heroes have no gameplay · hero models prepared (sheets + clip lists) but not wired · 10 rejected unit models · distinct buildings, citizens + taxes, layout editor, per-building panels → next chats · noRoute 317 vs 20.
**Reminder to the owner (not done yet): rotate the Sketchfab token and delete the GitHub deploy key.**

---

## A00000. p37 update (handoff #10, 6 Oct 2026 ≈ 17:00) — READ THIS BEFORE §A0000
- Round p37 (= his «5 bugs» of 12:06 + army formation + camp + rings + buildings) is finished and packaged: `pkg/bluebot_bluewall_p37/` (71 files; `pkg/bluebot_bluewall_p37.tar.gz` is what the owner installs; installer sandbox: install ok + rollback identical; `GATE: ALL OK`, 24 checks). It supersedes p36 and carries p33–p37 together (`pkg/deployed.sha256` is still the 5 Oct 08:51 state). **p37 is NOT confirmed installed**: if he says «۳۷ نصب شد» → `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p37`; if not → debug first. Never install two of the packages.
- **Start with `NEXT_PROMPT.md` (= `docs/next-prompt-p37.md`): §1 is the list of everything he said that is NOT done / not fully done (12 rows, his exact words), §7 the files he hands over.** What p37 contains, measurements, tooling: `docs/bluewall-handoff-p37.md`, `docs/p37-progress.md`. His words: `docs/bluewall-owner-feedback-oct6.md`.
- Biggest open items: real models for the 10 rejected units (he must find them), wall layers 1 / 2 / 3, N6 on his phone, order inside the infantry group, realistic tents, army depth, more buildings / trees closed, rings at runtime.
- Archives: `bluewall_handoff_p37.tar.xz` (replaces `_p35`) + `bluewall_assets_p37.tar.xz` (ALL current assets; replaces `bluewall_assets_p22.tar.xz` + the overlay). Setup: `cd /home/claude && tar xJf bluewall_handoff_p37.tar.xz && tar xJf bluewall_assets_p37.tar.xz && bash bluewall_handoff/setup.sh`. Screenshots of the p37 sessions are NOT included (regenerate with `dev/v37.py` / `dev/v37w.py`).
- Rules learned this round: never `pkill -f <text>` in a command containing that text (exit 144) → kill by PID; judge the screenshot he sees (390 × 844 portrait AND wide) before saying «done»; measure inside the running game (the first in-game run found 3 rams inside the windmill that no node test had seen).

---

## A0000. p35 update (handoff #9, 6 Oct 2026 ≈ 10:30) — READ THIS BEFORE §A000
- Round p35 is finished and packaged: `pkg/bluebot_bluewall_p35/` (63 files; `pkg/bluebot_bluewall_p35.tar.gz` is what the owner installs; installer sandbox test: install ok + rollback ok). `pkg/deployed.sha256` is still the older state (5 Oct 08:51): p33 + p34 + p35 ship together in this one package. If he says «۳۵ نصب شد» → `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p35`; if not → debug first. Never install the old p33 / p34 packages after it.
- p35 = 30 levels, ×2 vault / army / enemy defence / loot, K1 one send, K2 heroes ≤ 3, 10 new units + 3 new defences, bigger map, level palette, new pacing. **Details, evidence, tooling: `docs/bluewall-handoff-p35.md`, `docs/p35-progress.md`, `docs/p35-plan.md`.** Owner words: `docs/bluewall-owner-feedback-oct5.md`.
- **Start with `NEXT_PROMPT.md` (= `docs/next-prompt-p36.md`).** Open: his OK of the visual samples (models, map, palette, art, K1 / K2 UI), the tail choice, real-phone performance (unmeasured), pacing residuals at castle 4 / 6 / 8.
- Tools added in p35: `dev/fit5.py` + `bake_curve.py` + `days_table.py` (pacing), `dev/bal35.sh` + `bs_matrix35.js` (balance), `dev/s35/port/` (portrait pipeline: `pd.py`, `shoot3.py`, `mkport3.py`, `sheet3.py`), `dev/bt_live.py` (live K1 / K2 test with real pointer events), `dev/sq_dev.js` / `ab_dev.js` (emblem / power sheets).
- Archives: this one (`bluewall_handoff_p35.tar.xz`, replaces `_p34`) + `bluewall_assets_p22.tar.xz` (unchanged; newer assets in `overlay/`). Large screenshots / bundles / the flyer work copy of the p35 sessions are NOT included (regenerate with the tools above). Setup: `cd /home/claude && tar xJf bluewall_handoff_p35.tar.xz && tar xJf bluewall_assets_p22.tar.xz && bash bluewall_handoff/setup.sh`.
- Built but OFF until the owner says OK (`client/src/features.js`): S8 scout, S9 squad tools, S10 result card.
- Container note: `dev/gate.sh` needs `pip install --break-system-packages fakeredis sqlalchemy aiogram aiosqlite` in a fresh workspace.

---

## A000. p34 update (handoff #8, 5 Oct 2026 ≈ 20:30) — READ THIS BEFORE §A00
- Round p34 is finished and packaged: `pkg/bluebot_bluewall_p34/` (28 files; `pkg/bluebot_bluewall_p34.tar.gz` is what the owner installs; installer sandbox test: install ok + rollback ok). If he says «۳۴ نصب شد» → `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p34`; if not → debug first.
- p34 contains: Block C ring control (`ringctl.js`, `ringpath.js`, `squadicon.js` neon emblems for all 21 units, HUD at the floor, cup chip `earned/full` 13/27/40), aged spells (`spellart.js`), gold cup icon, trainer / peasant heads (`peasanthead.js`), slack lunge rope, no pegasus in the stable pasture. How each was verified, what was NOT proven in the real game: `docs/p34-progress.md`. Owner words: `docs/bluewall-owner-feedback-oct5.md`.
- **Start with `NEXT_PROMPT.md` (= `docs/next-prompt-p35.md`).** The tools added in p34: `dev/s34/gl.sh` (emblem sheet), `dev/s34/hd.sh` (head lab), `dev/s34/cup.sh` (cup render), `dev/s34/sp.sh` (spell sheet), `dev/s33/hud.sh` (DOM HUD lab).
- Container note: `dev/gate.sh` needs `pip install --break-system-packages fakeredis sqlalchemy aiogram aiosqlite` in a fresh workspace (for `bot_xfer_test`). `setup.sh` installs only the basics.
- Archives: this one (`bluewall_handoff_p34.tar.xz`, replaces `_p33`) + `bluewall_assets_p22.tar.xz` (unchanged; newer assets incl. the new `ui/cup_gold.webp` are in `overlay/`). Setup: `cd /home/claude && tar xJf bluewall_handoff_p34.tar.xz && tar xJf bluewall_assets_p22.tar.xz && bash bluewall_handoff/setup.sh`.
- Still OFF until the owner says OK (`client/src/features.js`): S8 scout, S9 squad tools, S10 result card.

---

## A00. p33 update (handoff #7, 5 Oct 2026 ≈ 15:50) — READ THIS BEFORE §A0
- Round p33 is finished and packaged: `pkg/bluebot_bluewall_p33/` (17 files; `pkg/bluebot_bluewall_p33.tar.gz` is what the owner installs; installer sandbox test ok). If he says it is installed → `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p33`; if not → debug first.
- **Start with `docs/next-prompt-p34.md`** (= `NEXT_PROMPT.md` in this archive): §1 Block C = his 14:50 ring control scheme (drag the squad rings, no bottom soldier bar), §2 Block P = his 9 requests of 08:41 (no Pegasus in the stable, tether, level 30, bigger map, 2 storages, 3-headed dragon + baby, new units, new colours), §3 what p33 did NOT finish, §6 the files he must hand over.
- What p33 contains and how each item was verified: `docs/bluewall-handoff-p33.md`, `docs/p33-progress.md`. Owner words: `docs/bluewall-owner-feedback-oct4.md` (newest at the end).
- Archives: this one (`bluewall_handoff_p33.tar.xz`, replaces `_p32`) + `bluewall_assets_p22.tar.xz` (unchanged). Setup: `cd /home/claude && tar xJf bluewall_handoff_p33.tar.xz && tar xJf bluewall_assets_p22.tar.xz && bash bluewall_handoff/setup.sh`.
- Built but OFF until the owner says OK (`client/src/features.js`): S8 scout, S9 squad tools, S10 result card.

---

## A0. p32 update (handoff #6, 5 Oct 2026 ≈ 08:30) — READ THIS BEFORE §A
- Round p32 is finished and packaged: `pkg/bluebot_bluewall_p32/` (35 files; `pkg/bluebot_bluewall_p32.tar.gz` is what the owner installs). If he says it is installed → `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p32` (p29–p32 are all in that one package; `deployed.sha256` still = server after p28).
- **Start with `docs/next-prompt-p33.md`** (= `NEXT_PROMPT.md` in this archive): his 8 new requests (§2) + everything p32 did NOT do (§3) + the files he must hand over (§6). The previous strategy brief is kept as `docs/NEXT_PROMPT_ATTACK_STRATEGY.md` (S1–S13 definitions).
- What p32 contains, how it was verified, tooling notes: `docs/bluewall-handoff-p32.md`, `docs/p32-plan.md`, `docs/p32-progress.md`. Owner words: `docs/bluewall-owner-feedback-oct4.md` (newest at the end).
- Archives: this one (`bluewall_handoff_p32.tar.xz`, replaces `_p31`) + `bluewall_assets_p22.tar.xz` (unchanged). Newer assets than p22 are in `overlay/` (`ui/assist_icon.webp`, `ui/build_hammer.webp`, `ui/cup_gold.webp`, `crow.glb`). Screenshots of the p32 dev sessions are NOT included (regenerate with `dev/s30/live.py`); one HUD sample: `dev/s32/sample_hud_p32.png`.
- Setup command: `cd /home/claude && tar xJf bluewall_handoff_p32.tar.xz && tar xJf bluewall_assets_p22.tar.xz && bash bluewall_handoff/setup.sh`.

## A. p28–p31 update (handoff #5) — READ FIRST

### A1. Where things stand
- Installed + committed on the server: p23 … p28 (`pkg/deployed.sha256` = the server after p28). **p29, p30 and p31 were NEVER committed**: they ship together as ONE package, `bluebot_bluewall_p31` (its folder is in `pkg/`, so `mkpkg.sh --commit bluebot_bluewall_p31` works after the owner confirms the install: ask him ONCE «p31 نصب شد؟»; `bluebot_bluewall_p30` is superseded and not in `pkg/` any more — never install both). The next round ships as **p32** (`mkpkg.sh bluebot_bluewall_p32`, delta against the committed state).
- The bot code is unchanged (`code/bot/bluebot_v2` = what his server has); everything is Blue Wall (`code/bluewall`, no `node_modules`, no `web/assets`; assets = `bluewall_assets_p22.tar.xz` + the 3 files of `overlay/`: `ui/assist_icon.webp`, `ui/build_hammer.webp`, `crow.glb` (patched in p28)).
- Gate: `bash /home/claude/dev/gate.sh` → all green except `bot_xfer_test` (no sqlalchemy in the sandbox — ignore). R7 (`bash dev/bsr.sh`): every roster 3★ at ratio 0.9–1.5.
- Nothing was ever measured on a real phone except the owner's own overlay screenshots (ultra: battle 52 fps, home 30 fps idle cap).

### A2. What p28 / p29 / p30 / p31 contain (details: `docs/p28-progress.md`, `p29-progress.md`, `p30-progress.md`, `p31-progress.md`, owner messages: `docs/bluewall-owner-feedback-oct4.md`)
- **p28** crows/hens fix, loader title aged, profiler + overlay + thermal governor + "cool mode".
- **p29** Tesla max 4, loader art aged + dragon static, meadow LOD, loader title centred.
- **p30** (the owner's evening): (1) **Army camp** behind the army: ONE real tent per squad (canvas stripes in the squad ring colour `SQUAD_COLOR` alternating with cream, size by head-count k 1.1–1.55, a natural cluster around the standard: same gap between tents, random facing, never in rows or a line — `client/src/camp.js` + `camptents.js`) + ONE standard with the attacker's crest; the same camp stands in the HOME map (`world.setCamp`). **The Training Ground's yard/tower is NOT drawn any more** (`military.js SHOW_TRAINING=false`; the building still exists in the rules, it just has no model and no battle target) — he hates anything else behind the army. (2) Giant: club in hand (baked prop bone, relation measured and hard-coded), navy loincloth, royal-blue pauldrons + bracers; giants WADE through the moat (`battlesim.js wade`) and leave ripples (`wake.js`). (3) Bridge flow re-tested (no stuck units). (4) **Health bars = graphic capsule: teal-green mine, ORANGE enemy** (`bhud.js` CSS `.hb`; only damaged buildings + big units get one; ordinary soldiers have none). (5) Dragonling = normal army unit, Lair ≥ 12, colour per Lair level (`dlcolor.js`), no egg. (6) Flyers can be sent anywhere incl. the middle of the map. (7) Attack HUD top: 2×2 loot under the enemy plate + trophy "+N".

- **p31** (night): the white **Barracks hall behind the camp is gone** (`military.js SHOW_BARRACKS = false`: no model, no battle target, `basetargets.json` lost its barracks entry; the building/level still exist in the rules, Army sheet, housing and uniform tiers). The owner's 21:51 list (giants' walk + club hits, dragon/baby quality + RED with ORANGE breath, dragonling yellow fireballs, redesigned squad rings) was deliberately NOT built: it is **block V in `NEXT_PROMPT.md` §0c**, first job of the next round (owner: «خودت ننویس، بکن تو پرامپ استراتژیک»).

### A3. Rules and lessons of this evening (add to §1)
- **Do EXACTLY what he describes, nothing extra.** The camp was over-built twice (command tent, wagon, fires…) → anger. The final spec is only "tents (colour of the squad ring, size by head-count) + my flag".
- He judges from his phone screenshots of the REAL game: always send real in-game screenshots (default attack view 390×844, home view), not just harness renders. He does not read long text.
- Colours he chose himself override the "red = danger only" taste rule: health bar teal-green / orange, camp tents = ring colours.
- Samples before any new visual; but when he states the look explicitly, build it and show ONE real screenshot.
- `pkill -f` kills your own shell (twice!) — stop the live session with `touch dev/s30/cmd/QUIT`.
- When he says «خودت ننویس / بکن تو پرامپ» he wants the item WRITTEN into the next prompt, not built — obey literally (p31: barracks removed, everything else of the 21:51 list only documented).

### A4. Tools of this evening (in `dev/s30/`)
- `live.py` = ONE persistent browser session on the dev page; drop `s30/cmd/<name>.json` (list of `{name, js, frames, wait, shot}`) and read `<name>.out` + `s30/t/<name>_<step>.png`. Launch: `export SEM_TIMEOUT=14000; setsid nohup bash sem.sh python3 s30/live.py "http://127.0.0.1:8777/dev.html?q=high&w=clear&h=12&wa=1" 390 844 > s30/live.log 2>&1 & disown`. Page load 3–6 min, battle start ≈5 min (software GL). Stop: `touch s30/cmd/QUIT`, wait until no `live.py` process, then `rm -f s30/cmd/{QUIT,READY,*.done,*.out,*.run,*.json}`. Step examples: `p7.json`, `r11.json`, `r11.json` copied to `cmd/s31.json` (home camp, battle start, camp close-ups: the p31 check); `__bw.battle.start(T)`; `S=__bw.battle.session` (`S.cam.{tx,tz,dist,az,pitch}`, `S.sim`, `S.hud`).
- `camp/entry2.js` (+`build2.sh`, `shot2.py name:view[:w:h:dpr]`) = the REAL `createCamp` in a bare three.js scene (views wide/mid/close/door/top) — 10 s per render, the quick way to judge tents.
- `bar/b2_entry.js` (+`b2.html`, `shotb2.py`) = the REAL `createHUD` bars in a DOM page (both colours, 4 fill levels).
- Build: `bash dev/rb.sh` (release `web/app/wall.js` + `dev/app_dbg.js`); small harness bundles: `NODE_PATH=…/client/node_modules npx esbuild … --bundle`.
- three r186: the `color_vertex` chunk's `vColor` is **vec4**; baked-animation props (`crowd.js`) need geometry in the bone-local frame at the ANIMATED pose (troll: bind pose ≠ animated pose).

### A5. Packaging recipe (unchanged)
```bash
bash /home/claude/dev/gate.sh
cd /home/claude/pkg && bash mkpkg.sh bluebot_bluewall_p32 "title"      # ships files whose sha256 differs from deployed.sha256
FRESH=/home/claude/work/bot_base bash /home/claude/dev/instest_bot.sh bluebot_bluewall_p32 ok     # install + rollback tested
```
Send `/home/claude/pkg/<name>.tar.gz` (SendUserFile) + ONE line: `cd /root && rm -rf <name> && tar xzf <name>.tar.gz && bash <name>/install.sh`. After he confirms: `bash mkpkg.sh --commit <name>` (needs `pkg/<name>/files`).

### A6. Open items
1. **Block V first (owner 21:51, `NEXT_PROMPT.md` §0c)**: giants' walk + club hits, dragon/baby dragon quality (battle path vs the home sky's `buildModelDragon`) + RED bodies with ORANGE breath, dragonling YELLOW fireballs, squad rings redesign (sample images first). **Then the attack-strategy round** — `NEXT_PROMPT.md` (= `docs/NEXT_PROMPT_ATTACK_STRATEGY.md`) is the brief; it is the owner's main wish.
2. Ask: did p31 install; do the tents / health bars / giant colours please him. Offer (don't do unasked): bars for ordinary soldiers. The Training Ground and the Barracks have NO visual now (tell him if he asks where they went: both still work from the build panel / Army sheet).
3. Older open items: A-old2 §A6 and A-old §A6.

---

## A-old2. p27 update (handoff #4) — still valid where §A above is silent

### A1. Where things stand
- Packages **p23, p24, p25, p26 are installed** by the owner (he confirmed each; `pkg/deployed.sha256` = the server after p26). **p27 is delivered but its install is NOT confirmed** (his 13:15 screenshot shows 59 FPS and no screen-rain, so it is most likely installed). Ask; when he says yes: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p27`. Until then `deployed.sha256` lacks p27's 3 files (wall.js, weather.js, controls.js) — a new package will simply re-ship them, which is harmless.
- Bot code: unchanged since p22 (`code/bot/bluebot_v2` of the p22 handoff = his server). p23–p27 touched Blue Wall only (plus `state.py` in p24/p25: owner-only visual flag).
- This archive (`bluewall_handoff_p27.tar.xz`) holds the **current Blue Wall tree** in `code/bluewall` (no `node_modules`, no `web/assets`). The big assets stay in `bluewall_assets_p22.tar.xz` (unchanged, the owner already has it); the two assets that are newer than that archive (`assist_icon.webp`, `build_hammer.webp`) are in `overlay/` and `setup.sh` copies them over. **Both archives are needed** (sentinel: `code/bluewall/web/assets/horse.glb`).
- Gate: `bash /home/claude/dev/gate.sh` → everything green except `bot_xfer_test` (the sandbox has no aiogram; unrelated, ignore).
- **Nothing here was ever verified on a real phone** — only in the sandbox (software GL, relative costs only). Say so honestly; get his FPS screenshots (he sends them; the FPS counter is the game's own).

### A2. What p23–p27 contain (full lists: `docs/p23-progress.md … p27-progress.md`)
- **p23** loader made light: 57 composited layers → ~12 (GPU-memory tile loss on Android). Only `web/index.html`.
- **p24** gem-mine jewel environment; hammer "B" Build tile; **owner-only Tesla / dragonling display** (flag `vis`, server `state.py`); battle audio mutes the ambience.
- **p25** Assist button icon = the hammer B **crossed with a sword** (variant 2 "match": silver/navy, soft shadow; `assist_icon.webp?v=3`; renders from `dev/s23/icon4.js`). Loader title shimmer + the 3 twinkle stars removed.
- **p26** loader sword **aged** (dull gunmetal, scratches, pits, faint cyan runes, deep-blue worn grip, softened bar glow) by `dev/s27/age_sword.py` on the path-traced `ld_sword.webp` (geometry identical, so the progress mask `ld_sword_m.webp` still fits). Camera limits: home zoom 90..310 portrait / 280 landscape; battle 60..300; tilt follows the zoom (`CamCtl.zoomPolar`), the valley-ring clamp pushes the *target* back instead of squeezing the camera (root cause of "things look broken at some angles": squeeze + camera sinking into roofs).
- **p27** zoom-out raised to **345 portrait / 300 landscape** (default open distance stays 300, so the default view is unchanged); **screen-space rain sheet removed** (`weather.js`: `SH.uA.value = 0; sheet.visible = false` — he said the "downpour on the screen" is not nice); 3-D rain streaks thinner/fainter far from the camera. Ground splashes, lightning, thunder, snow untouched — he loves those ("عالی").

### A3. Rules and lessons (add to §1 / §A3-old)
- **Change only what he asked. Never drop a part of an element he already picked.** (p24 removed the sword from the Assist icon he had chosen → "خیلی احمقی … اون خوب بود". Fixed in p25.) If a redesign touches something he chose, keep it and ask.
- **Token thrift is a standing order** ("خواهشاً بهینه کار کن توکنم در حال نابودی"): grep + `sed -n a,bp`, never `cat` big files; no inspector agents unless they clearly pay off; ONE package for all items of a round; one image per sample.
- **Report `📊 پیشرفت: N٪` during long work — for the optimisation task every 10 %.** He asks for it; never go silent.
- One-letter / one-word answers from him are decisions — act, don't re-ask. He types short and harsh when tired; stay calm.
- The word "bot"/«ربات» is never shown to players inside Blue Wall.

### A4. Tools (all in `dev/`; `dev/s27/` = this round's scratch tools, copied here)
- `sem.sh` (2-slot browser semaphore): **`export SEM_TIMEOUT=3000` first, then `bash sem.sh python3 …`** — putting the variable after `sem.sh` (or via `env`) only applies to the inner command.
- `pkill -f` matches its own command line (exit 144): use the bracket trick (`pkill -f "[u]p.sh"`) in a **separate** Bash call.
- esbuild for dev bundles outside the client folder: `NODE_PATH=/home/claude/bot/bluebot_v2/bluewall/client/node_modules npx esbuild …` (else "Could not resolve three").
- Dev static server: `bash up.sh` (port 8777); `bash rb.sh` rebuilds release + debug bundles. Dev page `dev.html` exposes `window.__bw` (`ctl`, `scene`, `renderer`, `world`, `settings`, `Q`, `refl`, …) and `__cam`. **`ctl.intro = null` before setting `dist/azim`** — otherwise `startIntro` holds the camera at dist ≈ 859 and every screenshot is useless.
- `dev/s27/camshot.py` (env `CAMURL`, `CAMJS`; cases JSON `[name, dist, azim, [minD,maxD,pNear,pFar]|null]`) = camera/weather screenshots; `camtest.mjs` = CamCtl fake-camera sweep (24 azimuths × 3 targets × 3 zooms; must print no violations); `camdbg.mjs`; `layers.py` = CDP LayerTree (counts compositor layers/Mpx of the loader); `shot.py` = the real loader at 3 sizes; `stress.py`; `audtest.js`; `castleshot.py`, `mineshots.py`.
- `dev/s27/age_sword.py SRC DST [strength]` = 2-D "ageing" post-process (numpy/scipy/PIL) of a path-traced RGBA still (fade/desaturate, tarnish, brushed streaks, scratches, pits, rust blotches, edge nicks in alpha, light grain). Regions are found from the sword's geometry (`B0` = blade start) — **for the title (task 2) write a title variant** (same ideas: lacquer wear, micro-scratches, edge chips, soft dust; keep the glyph shapes and the alpha silhouette so nothing else needs re-fitting).
- `dev/s23/icon4.js` (+`icon4.html`) = hammer B + sword renders (procedural three.js); `dev/s24/` path tracing (see A-old A4).

### A5. Packaging recipe (unchanged)
```bash
bash /home/claude/dev/gate.sh
cd /home/claude/pkg && bash mkpkg.sh bluebot_bluewall_p28 "title"      # ships files whose sha256 differs from deployed.sha256
FRESH=/home/claude/work/bot_base bash /home/claude/dev/instest_bot.sh bluebot_bluewall_p28 ok     # install + rollback tested
```
Send `/home/claude/pkg/<name>.tar.gz` (SendUserFile) + ONE line: `cd /root && rm -rf <name> && tar xzf <name>.tar.gz && bash <name>/install.sh`. After he confirms: `bash mkpkg.sh --commit <name>`. Bot files only if truly needed (`addbot.sh`, see A-old A5).

### A6. Open items
1. **The 3 tasks of `NEXT_PROMPT.md`** (white birds hover in the air; age the loader title; **optimise + stop the phone overheating at high FPS and high graphics**).
2. Ask: did p27 install; how do the new zoom-out and the rain feel; does the camera still show broken things at any angle (he cared a lot).
3. Frost spire / fire brazier defence visuals — only samples first. Pale ground blotches near the mines — unchanged. Taste switches still unanswered (A-old A6). Variant 1 (old gold sword) of the Assist icon exists if he asks.
4. Real-device numbers: **never measured**. His storm screenshot = 30 FPS vs clear weather 59 FPS (same phone). `journalctl -u bluebot-wall --since "30 min ago" | grep perf | tail -50` is how he can give you `perf.js` reports (no secrets in them).

---

## A-old. p22 update (handoff #3) — still valid where §A above is silent

### A1. Where things stand
- **Last package: `bluebot_bluewall_p22`** (Blue Wall + 12 bot files, one install). Built on the owner's bot archive of 4 Oct 03:48 and sandbox-tested (install ✅, rollback identical ✅, bot base-hash guard ✅). Delivered 4 Oct ≈03:55; **install not yet confirmed**. When he confirms: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p22` (then `deployed.sha256` = server). If his install prints the "bot files changed on the server" refusal again, ask for a fresh bot archive (§12 command), rebase the edits (see A5) and rebuild.
- `pkg/deployed.sha256` still describes the server **after p21** (p21 was confirmed + committed). p22 is a delta over it.
- **Bot code is included**: `code/bot/bluebot_v2` = his 03:48 archive **plus** the 12 p22 edits = exactly what his server has after p22 (runtime `data/*.json` and `data/webpanel` left out on purpose — user data). No `.env`/secrets are in it; never ask for them.
- Docs: `docs/p21-progress.md`, `docs/p22-progress.md` (complete lists of what p21/p22 contain), owner messages in `docs/bluewall-owner-feedback-oct3*.md` (Project: `claude/bluewall-owner-feedback-oct3-part2.md` is the newest). Project "آپدیت ربات" has the same files.

### A2. What p21 + p22 contain (details in the progress docs)
- **p21:** economy v6 (castle 20 ≈ 16 months free / 8 months best), boosts (sapphire), shop (Boosts · Defense · Army · Gems), **BlueBot → Blue Wall conversions** (bot store › تبدیل › Blue Wall, ledger table `bluewall_transfers`, resend loop, idempotent apply), unit levels/tiers/perks, Tesla coil, Dragonling, admin prices in the bot.
- **p22 ("soul pass"):** new loading screen (moonlit castle key-art, rotating light rays/rings, dragon glide, **path-traced title "Blue Wall"** — Cormorant Garamond 700, deep sapphire lacquer, black-chrome rim — subtitle "— RISE OF THE KINGDOM —", **progress bar = a path-traced rune sword**: blade B on hilt C, sapphires on both guard arms, domed onyx in the wheel pommel, **deep-blue leather grip**, blue light fills the blade, no %); moat waves/fish + lake + night; heraldry (crests, real flags, the player's name over his gate); **shields fixed** (face forward with the realm crest — gear_shield.js; **the army/battle portraits of spearman, guard, shieldmaiden were re-rendered with the fixed shields**, `dev/mkport_part.py`); pegasus look, knight plume; pasture/stable fixes (animals used to play "Death"), nomad tents; scatter (rocks/bushes/trees/mines) realism; cannons on towers, archer sentries, dragonlings at home; Assist button + hub redesign + **Back navigation** (‹ in panels + Telegram BackButton); heat work (30 fps idle after 3.5 s, ~16 fps behind panels, dpr 1.25 high, shadows every 5th frame when idle); attacks open to everyone (+ server minimum-loss floor); **bot game-level system switched off** (`modules/game/services/level.py LEVELS_ENABLED=False`, hidden everywhere incl. group profile card and admin panels).
- **p22 final round (4 Oct 01:00–03:50):** war axes (`client/src/gear_axe.js`, procedural, ~5k tris): gate giants hold a forged bearded axe (their own wooden club `Puglin_Stick` removed, the bronze `axe.glb` no longer loaded); **the shieldmaiden hero now carries a blued war axe** instead of the sword (home + battle; `sword_mw.glb` no longer loaded); the haft sits **in the closed fist**: `AXE_GRIP = { pos: [-0.025, 0.09, 0], rotDeg: [90, -90, 0] }` measured on the UAL hand rig (knuckles y≈0.12, fingers curl −x, knuckle line z) — the old sword attachment `[0,0,-90]` ran through the wrist. **Shieldmaiden hair = deep blue** (`client/src/gear_maiden.js`, `MAIDEN_HAIR = 0x2445c8`) — he was shown 4 options (0 silver, 1 ice `a9cbff`, 2 light `4d7cff`, 3 deep `2445c8`) and had not answered; 3 shipped. If he names another number, change that one constant (+ re-render her portrait: `dev/axe/port_dev.html?u=hero` → `python3 dev/mkport_part.py shieldmaiden`).

### A3. Rules learned in this session (add to §1)
- **Samples before anything taste-related, and before every package that changes looks.** He says "نشون بده قبلش" — show it, then build. When he asks for "one photo", send exactly ONE image (an options sheet with numbered panels counts as one).
- He hates long silences: answer within minutes, send drafts early; say in one line what you're doing. Hours-long agent runs without a message made him angry.
- Taste: **real / photoreal** over stylised ("واقعی"); **deep blue** ("آبی پررنگ"), black borders/rims, steel/silver; **no crown** on the loader; he hated the old crown, title colour, bar and the percentage font.
- **Shields must face forward with the crest everywhere** (models, portraits, icons). Before showing any render with shields/weapons use the game's own code path (`shieldModel`, `AXE_GRIP`, crowd kinds) — a raw-model test render with a reversed shield cost trust.
- Copyrighted designs (e.g. Frostmourne, game logos) → decline politely and offer an original in the same spirit.
- He writes harshly when tired; stay calm, short, and fix the thing.

### A4. Tools added this session (all in `dev/`)
- `sem.sh` — 2-slot browser semaphore (`SEM_TIMEOUT` env). Wrap every playwright run: `bash sem.sh python3 …`. Bash tool calls time out at 10 min → run long renders with `nohup … &` and poll the log.
- **Path tracing (photoreal stills):** `dev/s24/` (`npm i` there: three 0.186.1, three-gpu-pathtracer 0.0.26, three-mesh-bvh). `sword_pt.js` (loader sword; `?mask=1` = blade mask), `title_pt.js` (title; needs `/tmp/fnt/node_modules/opentype.js` — setup.sh installs it). Build: `cd dev/s24 && npx --yes esbuild@0.24.0 sword_pt.js --bundle --format=iife --outfile=sword_pt.bundle.js`. Shoot: `SEM_TIMEOUT=2400 PX=2800 PY=600 LIM=2300 bash ../sem.sh python3 ptshot.py out.png "w=2800&h=600&spp=112&tx=2&ty=1"` (≈15 min on 2 CPUs; 1400×300 at 24 spp ≈ 1 min for previews). Gotchas: one material per mesh (split ExtrudeGeometry groups), textures always REPEAT (clamp UVs in the geometry), `scene.background=null` → transparent PNG via `toDataURL`, `readPixels` once per sample keeps the page responsive. Loader assets: `web/pub/ld_sword.webp` 1400×300 + `ld_sword_m.webp` (mask), `index.html` `SW = {w:1400,h:300,b0:.222,b1:.9857}` (fill starts 22.2 %); `ld_title3.webp` 1000×210 (`T3`). Bump `?v=` on every change.
- `dev/s23/` — raster versions (title3d.js, sword5.js, icon tools, HDRIs from the three.js repo = Poly Haven CC0, fonts), `realshot.py` = screenshots of the REAL loader at 390×844 / 844×390 / 320×640.
- `dev/axe/` — `axe_dev.html` (prop / giant / `maiden=1` / `crowd=1` = the battle crowd path with the game's shield + axe; `hc=1` hand close-up; `hair=hex`), `port_dev.html?u=spear|guard|hero` (portrait renders with `army.js makeKinds`), `run.py` (prints `window.__out`), `b.sh` (bundle with the client's node_modules).
- `dev/mkport_part.py unit…` — rebuild only those portraits in `client/src/portraits.js` (same framing as mkport.py; source PNGs in `dev/port/`, navy bg `(12,31,68)`).
- `dev/e2e_hero.py` — real app: army with a shieldmaiden → attack → battle loaded, console errors listed.
- `dev/instest_bot.sh <pkg> ok` — installer sandbox with a full bot tree; `FRESH=<bot tree>` copies the newest bot code into the sandbox first (needed whenever the bot base changed).
- `pkg/addbot.sh` — adds bot files to a package; **`BOTBASE=<dir>`** = the copies your edits were made on; the installer refuses (touching nothing) if the server's file differs from that base. For the next bot edits the base is `code/bot/bluebot_v2` of this archive (setup.sh copies it to `/home/claude/work/bot_base`, and the working copy to `/home/claude/work/bot/bluebot_v2`).

### A5. Packaging recipe now (Blue Wall + bot)
```bash
bash /home/claude/dev/gate.sh                       # GATE: ALL OK (rebuilds the client)
cd /home/claude/pkg && bash mkpkg.sh bluebot_bluewall_p23 "title"
BOTBASE=/home/claude/work/bot_base bash addbot.sh bluebot_bluewall_p23 <bot files relative to bluebot_v2/>   # only if bot files changed
FRESH=/home/claude/work/bot_base bash /home/claude/dev/instest_bot.sh bluebot_bluewall_p23 ok                 # install ✅ + rollback identical
```
Send `/home/claude/pkg/<name>.tar.gz` (SendUserFile) + ONE line: `cd /root && rm -rf <name> && tar xzf <name>.tar.gz && bash <name>/install.sh`.

### A6. Open items (nothing here is started)
1. Confirm p22 install → `mkpkg.sh --commit bluebot_bluewall_p22`; ask how the loader, sword, axes, shields, hair look on his phone.
2. Hair colour answer (A2). Taste switches still waiting for him: `LOOK` (loader A/B), `WATER_LOOK`, `CREST_STYLE`/`CLOTH`/`PLAQUE_STYLE`, `PEG_LOOK`, `STABLE_LOOK`, `ROCK_LOOK` (see p22-progress "Open / next").
3. Real-device heat/FPS: after he plays, `journalctl -u bluebot-wall --since "30 min ago" | grep perf | tail -50` (no secrets) → compare with the p22 heat changes.
4. Known: pegasus folded wing bulky (model's Rest pose); swans simple up close; fairies float over the stable yard at night; the shieldmaiden's axe is seen edge-on in some attack frames.
5. Percentage on the loader: removed "for now" ("درصد هم بردار فعلا") — he may want it back in a new font later (sample first).
6. Phase 4 of the old plan (bot shop ⇄ Blue Wall gem **sync**, §8) is only partly covered by p21's one-way conversions; ask before building more.

---


Written 2026-10-03 ≈12:00 (Tehran, +03:30) by the previous session (Claude Sonnet 5.5 in Claude Code on claude.ai). It **replaces** the older handoff (`claude/bluewall-handoff.md`, 1 Oct, written for p5; that file is history only: its §5/§6 are obsolete, its §4 "locked decisions" and §11 "staged asset inventory" are still mostly valid and are repeated/updated here).

Read this whole file, then `NEXT_OPUS_PROMPT.md` (the mission, in 4 phases). Everything the owner has ever asked for is tracked in `docs/` (copied from the claude.ai Project "آپدیت ربات", which holds the same files).

---

## 0. Start here (10 minutes)

1. **Where things are.**
   - If this session has the Project "آپدیت ربات" attached: read the docs with the Projects tool, not the filesystem. The newest ones are `claude/bluewall-handoff-p20.md` (this file), `claude/next-opus-prompt.md`, `claude/p19-progress.md` (what p19/p20 contain), `claude/plan5-G-oct3.md` + `claude/bluewall-owner-feedback-oct3.md` (the last owner messages), `claude/bluewall-master-plan-v5.md` (master plan) and `claude/plan5-A…F` (six detailed plans).
   - If not, everything is also inside this archive: `docs/` and `plan5/`.
2. **Unpack and set up** (2–3 min; creates the fixed paths every script uses):
   ```bash
   tar xJf bluewall_handoff_p22.tar.xz && tar xJf bluewall_assets_p22.tar.xz && bash bluewall_handoff/setup.sh
   ```
   | path | contents |
   |---|---|
   | `/home/claude/bot/bluebot_v2/bluewall` | THE CODE: server (python), client source, web (built bundle + assets) |
   | `/home/claude/dev` | test harness: dev pages, shot/e2e scripts, `gate.sh`, `srv.sh`, `rb.sh`, `up.sh`, `stubcfg/` |
   | `/home/claude/pkg` | `mkpkg.sh` (package builder) + `deployed.sha256` (what the server has right now) |
   | `/home/claude/staged` | approved-but-not-all-integrated 3D assets (horses, pegasus, knights, troops, buildings, loader logo). **Optional second archive** `bluewall_staged_p20.tar.xz` (the main one is under the 30 MB upload limit without it): `tar xJf bluewall_staged_p20.tar.xz -C /home/claude`. Phases 1–4 do not need it; only new-asset integration does |
   Then run `bash /home/claude/dev/gate.sh` once (≈3 min). Expected last line: `GATE: ALL OK`. If it is not OK, fix the environment before touching code.
3. **(p20 text — superseded: the bot's code IS now in this archive, `code/bot/`, see §A)** ~~The bot's own code is NOT in this archive~~ (BlueBot v2, `/root/bluebot_v2` on the owner's server). Phases 1–3 do not need it. **Phase 4 does** (shop ⇄ Blue Wall gem sync). Ask the owner for it early using the secret-free backup command in §12.
4. **First message to the owner** (Persian, short): say you took over, that you'll work in 4 phases (bugs → smoothness → graphics → shop sync), and that you'll post "📊 N%" progress. Template in §14.

---

## 1. The owner and the rules (mandatory — each one was learned the hard way)

**Who.** Wingless (Telegram owner of @Blue_Hearts_Bot). Persian speaker, types fast and tersely, works from his phone. The game runs inside Telegram on his phone (Poco-class Android; also tests on others).

**Talking to him**
- **Persian, casual, short, English digits.** No essays. A few lines, then the package/screenshot.
- Long jobs: post `📊 پیشرفت: N٪` roughly every 5–10 %. When he says he is going to sleep / "منتظرم": work uninterrupted to 100 %, then ONE final message with screenshots (he wants to "enjoy" the finished thing). Never go silent for hours; never stop "because of access"; never skim.
- **Read his exact words twice.** He got angry (10:11–10:22, 3 Oct) after two wrong readings of the HUD layout (see §5). If a layout/taste instruction is ambiguous, mirror it literally, and when still unsure show a screenshot/mock before building the big thing.
- **Every new request he makes must be ADDED to the plans** (he said so on 2 Oct 18:34: "هر چی بهت میگم اضافه کن به اون پلن ها"). Append it immediately to `bluewall-owner-feedback-*.md` and map it to a plan item in `plan5-G-*.md` (and write both to the Project). Nothing old is ever deleted from the plans.

**Taste and approval**
- Anything taste-based (new characters/models, colours, logos, fonts, UI looks, layouts) needs **samples first** (screenshots via SendUserFile) and his choice. Items listed as approved in §5 don't need re-approval; just show the result.
- Colours: **light blue, navy, black, steel/silver**. Strongest = **blue** (rarity top tier is blue). Red only for danger.
- Quality bar: Clash of Clans / Siegefall / Rise of Kingdoms level, semi-realistic. **≥55–60 FPS** on his phone; draw calls < 300 (high quality), no frame > 50 ms after the welcome tap, no phone overheating.
- Fonts: UI = Libre Baskerville (bold, upright). Persian text (tutorial only) = **Noto Naskh Arabic** (OFL) — he asked for "Nazanin" but B Nazanin has no free licence.
- Game language is **English** (player-visible), except the first-run Persian tutorial. Messages to the owner are Persian.
- **The word "BOT"/«ربات» is never shown to players** (gate plaque says BLUE WALL, About says Blue Hearts, enemy names come from a human-looking name list). **One explicit exception:** the placeholder label "bot" on the shop's buy buttons (he asked for it until he decides what "buy" connects to).

**Process**
- **Sequential, small, verified steps.** He complained that parallel agents burned tokens with nothing shipped. Subagents are allowed now (he asked for "چنتا بازرس قوی" in each phase) but only as **read-only inspectors with a narrow scope and a strict report format**; ONE writer (the lead) fixes, verifies every claim before acting (several inspector claims were wrong in the past, e.g. the "ANR cause" hypotheses), runs the gate after each batch, ships a package after each phase (see NEXT_OPUS_PROMPT.md).
- **Verify visually.** Every UI/graphics change: screenshots at 390×844, 360×640, 320×568 and landscape 844×390; LOOK at them (Read the png), don't assume.
- **Never edit his server by hand.** Changes reach the server ONLY through packages (`mkpkg.sh`). He may run cleanup/backup commands that you give him.
- **Security (absolute):** never ask for, paste or echo tokens/secrets/API keys/sessions in chat. If a secret must reach the server, give him a command using `read -rsp` so he types it into his own terminal. Any backup command you give him must exclude `.env`, sessions, keys, venv, logs (§12).
- **Deliveries:** `.tar.gz` package via SendUserFile + **ONE pasteable install command** (he uploads to `/root`). Never ask him to run files that aren't in the package.
- **Assets:** only CC0 or CC-BY (OFL for fonts). Add credits to `web/assets/credits.json`; every new glb's `extras.author` must match it (the gate checks the credits file exists). Quaternius packs are OK. **Never** use ripped/copyrighted game assets (Siegefall, Gameloft, …).
- Keep `python3 -m py_compile bluewall/*.py` passing; run `gate.sh` before every package.

---

## 2. Mission for the next session — four phases, in this order  _(OLD, written for p20: superseded by `NEXT_PROMPT.md` — the current mission is its three tasks)_

(Full operating instructions for each phase, inspector scopes and acceptance criteria are in `NEXT_OPUS_PROMPT.md`. This is the summary.)

1. **Hunt bugs and fix them.** Strong inspectors (battle flow & sim; server data/economy safety; UI at all viewports; home-scene lifecycle/audio/tutorial) → findings with file:line and repro → lead verifies → fixes in small batches → gate → package.
2. **Optimization and smoothness.** Real-device data first (the black box `perf.js` → `/api/perf` → service log), then GPU / CPU / network+loading / thermal inspectors. Goal: steady ≥55–60 FPS, no hitches, cool phone.
3. **Graphics upgrade.** Art-director inspectors (terrain/water/sky/night; buildings/walls/tiers; characters/creatures; UI/VFX/logos). Samples first, owner picks, perf budget measured per change. Pending taste item: **choose the attack-button logo** (sheet A–F; code default `PICK='B'` in `logos.js`) — show him the sheet at the END of the graphics work.
4. **Shop ⇄ Blue Wall sync with the bot's game section.** When people win or buy a **blue gem** in the bot's game section, **10× that amount appears in Blue Wall**; when they **use** it in Blue Wall, **÷10 is deducted from their gems in the bot's game section**. Design in §8 (it needs the owner's answers to 6 questions and the bot's code).

---

## 3. Product, deployment, packages

**Hosting.** Telegram bot **@Blue_Hearts_Bot** (BlueBot v2: Python 3.11, aiogram 3, SQLAlchemy async, MySQL 8 + alembic, Redis) on server **blue18**, app root `/root/bluebot_v2`. Game 7 "**Blue Wall**" = Telegram Mini App at **https://game.bluhearts.com** → nginx + Cloudflare → aiohttp on `127.0.0.1:8590`; systemd unit **`bluebot-wall`** (`python -m bluewall`, lives inside the bot's tree as `/root/bluebot_v2/bluewall`, imports the bot's `config.settings`). **Owner-only for now**: allow-list `BLUEWALL_ALLOW` + `SUPER_ADMIN_UID`, `BLUEWALL_PUBLIC=false`; battles (`BLUEWALL_ATTACK`) owner-only until the server can simulate battles.

**Routes** (`server.py`): `GET /` (loader `web/index.html`), `GET /tg.js`, `/pub/{name}`, `/assets/{tail}`, `/healthz` (`?deep=1` from 127.0.0.1 only: reports `build`), `POST /api/auth` (Telegram initData HMAC → token; `start_param` `ref_<uid>` = invite), `GET /api/bundle` (**wall.js only with a Bearer token**), `GET /api/state`, `POST /api/collect`, `GET /api/catalog`, `GET /api/rank`, `GET /api/log`, `GET /api/friends`, `GET|POST /api/clan`, `POST /api/upgrade/{op}`, `POST /api/army/{op}`, `POST /api/scout`, `POST /api/battle/end`, `POST /api/dev` (owner-only test hooks), `POST /api/perf` (black box → service log).

**Env/config** (all optional except the first two): `SUPER_ADMIN_UID` (settings or env), `BOT_TOKEN` (auth HMAC; settings), `BLUEWALL_ALLOW`, `BLUEWALL_PUBLIC`, `BLUEWALL_ATTACK=public`, `BLUEWALL_URL`, `BLUEWALL_APP_LINK` (invite base, e.g. `https://t.me/Blue_Hearts_Bot/<short>`), `BLUEBOT_REDIS_URL`, `BLUEBOT_QUEUE_DB` (**same Redis DB as the bot's queue — the bridge depends on it**), `BLUEWALL_STATE=memory` (tests without Redis), `BLUEWALL_PORT`, `BLUEWALL_NAMES_FILE`, `BLUEBOT_ENV`. ⚠ `BLUEWALL_ATTACK` is read with `os.getenv` while the others come from `config.settings`; if the systemd unit has no EnvironmentFile, putting it in `.env` does nothing (known, documented in plan D1).

**Redis keys**: `bluewall:st:<uid>` (player JSON), `bluewall:inbox:<uid>` (gifts from the bot), `bluewall:lb:tro` (cups leaderboard ZSET), `bluewall:bad:<uid>:<t>` (backup of corrupt data, 30 d). Clans/social keys: see `clan.py`, `social.py`, plan D.

**Packages — history.** p1–p4 original, p5 … p14 installed and committed (see `docs/_p5-progress.md`), **p15 installed**, then **p16, p17, p18, p19 were all installed by the owner** (p19 confirmed 3 Oct 11:29: "✅ bluebot-wall up (build bluebot_bluewall_p19) — gems/mines API ok"). `deployed.sha256` = the p19 state (committed 3 Oct). **p20 = p19 + «+» removed from the two special-gem capsules + a comment fix; it is built/gated by the previous session and waiting for the owner to install** (status in §6).

**Building a package**
```bash
bash /home/claude/dev/gate.sh                                   # must end with: GATE: ALL OK
bash /home/claude/pkg/mkpkg.sh bluebot_bluewall_p21 "short title"   # delta vs deployed.sha256, rebuilds wall.js
```
Send `/home/claude/pkg/bluebot_bluewall_p21.tar.gz` with SendUserFile + this one line for him:
```
cd /root && tar xzf bluebot_bluewall_p21.tar.gz && bash bluebot_bluewall_p21/install.sh
```
The installer (v2): verifies SHA256SUMS, backs up replaced files to `/root/bluebot_v2/_backups/<name>`, copies, `py_compile` (auto-rollback on failure), restarts `bluebot-wall`, proves the NEW process answers (`/healthz?deep=1` build == package name), checks API/page, prints ✅/❌. Re-running the same package is idempotent (keeps the original backup). Rollback: `bash /root/<name>/rollback.sh`. **After he confirms the install:** `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p21` (updates `deployed.sha256`; the next package is then a delta). Use a NEW package name each time (the build id = name; re-using a name defeats the "new process" check). Package files never delete files on the server. Audio mp3s and old unreferenced GLBs are already on the server (not in this archive's assets delta).

---

## 4. Architecture

### 4.1 Server (`bluewall/*.py`, ≈3200 lines)
| file | role |
|---|---|
| `server.py` | aiohttp app, routes above, per-request deadlines, auth gate, bundle delivery with content ETag, `/api/perf` log, `/api/dev` (owner only) |
| `state.py` | `Store`: load/save/lock per uid (asyncio lock), **`StateUnavailable` → HTTP 503 (never a fresh castle over a real one when Redis hiccups)**, corrupt-data backup, `_drain_inbox` (gifts), collect, upgrade, army, scout, battle_end, leaderboard, history, friends, invite (`refer`), `dev` hooks. Gem wallet `st["gems"] = {ruby, emerald, turq}`, special gems `st["prem"] = {sap, onyx}`; vault caps per level |
| `progress.py` | structure levels 1–20, upgrade cost/time tables, builders (2 from start, 3rd from castle L7), reserve queue, Rush price, mine rate/cap (`rate/h = 12/20/30·(1+0.15(L−1))`, mine storage 8 h) |
| `military.py` | unit table (`UNITS`, unlock levels by rarity: Common L1–4, Rare 5–8, Epic 9–12, Legendary 13–16, Mythic 17–20), training lanes (one soldier at a time), housing, power formula `sqrt(hp·dps)/3`, scout (50 % offline real players / 50 % invented kingdoms), `settle_battle` (validates the client's report; ★ needs ≥50 % destruction, ★★★ needs 99.95 %; loot = share of the **castle-level** mine output ×3 h, clamped), spells, shield 4 h |
| `social.py` | cups/leagues (6 leagues Steel→Blue Crown; +18/+28/+40 for 1/2/3★, −10 for 0★, no loss under 60 cups), invite rule (1000 turquoise when the invitee reaches castle 3, cap 50 rewards) |
| `clan.py` | clans up to 30 kingdoms, name + tag, member cups total |
| `bridge.py` | **bot → Blue Wall gifts** (`credit()`, `credit_sync()`, CLI `--grant/--grant-prem/--peek`), Redis list `bluewall:inbox:<uid>`; 1 blue gem = 10 turquoise; `sap`/`onyx` prizes; idempotent by `gid` |
| `access.py`, `auth.py` | who may enter (shared with the bot), Telegram initData verification (`compare_digest`) |
| `names.py` | enemy display names (from the bot game's name list + file) |
| `sim.py` | progression simulator (how long to max everything) |
| `docs/BOT_HOOK.md` | how the bot calls `credit()` (not yet added on the bot side) |

### 4.2 Client (`bluewall/client/src`, ES modules → esbuild → `web/app/wall.js`, IIFE ≈1.7 MB, three.js r186)
Build: `bash client/build.sh` (release) / `bash /home/claude/dev/rb.sh` (release + debug bundle `dev/app_dbg.js`). Entry `main.js`: `BlueWall.start({root, token, uid, name, owner, tg,…})`; debug handle `window.__bw = {THREE, scene, camera, ctl, world, renderer, ui, Q, settings, audio, t, frames, pause, P()}`; also `__assist`, `__ui`, `__shop` in the HUD harness.
| group | files |
|---|---|
| boot / loop | `main.js` (renderer, quality presets, dynamic resolution, 12 s idle → 30 fps, shadows every 3rd frame, PMREM ≤ every 8 s, welcome card, `ready()`/late content), `settings.js`, `i18n.js`, `perf.js` (flight recorder), `tod.js` (Jalali era −655), `controls.js`, `assets.js` |
| world | `world.js` (assembly, `startLate`, `setLevel`, `OWN`), `layout.js`, `terrain.js` (baked ground splat, `fastHeight`), `castle.js`, `buildings.js`, `town.js`, `roads.js`, `hamlets.js`, `nomads.js` (tent camps), `village.js`, `moat.js`, `reflect.js` (planar reflection, high/ultra), `falls.js`, `sky.js`, `weather.js`, `fx.js`, `fairies.js`, `trees.js`, `crops.js`, `noise.js`, `textures.js`, `materials.js`, `util.js`, `skin.js` + `levels.js` (tier look wood→stone→iron→gold→diamond→blue crystal), `vault.js`, `mines.js`, `gems.js`, `gemgeo.js`, `defense.js`, `ballista.js` |
| life | `life.js` (horses, pasture, **stable yard with trainer/groom/ring**, dragons, pegasi, birds), `army.js` (home army camp), `units.js`, `patrol.js` + `crowd.js` (GPU-instanced baked crowd: wall archers), `creature.js`, `giant.js`, `dragon.js`/`dragon_model.js`, `military.js` (barracks/estates) |
| economy / progress UI | `econ.js` (client mirror of server rules), `upgradeui.js` (kingdom/build panel, builders, reserve), `armyui.js` (army panel, training), `shopui.js` (Bundles / Gems / Boxes, buy = "bot" placeholder), `rankui.js`, `cups.js`, `socialui.js` (Rank/Clan/Friends/Log tabs), `emblems.js` (24 heraldic crests), `logos.js` (attack-button logo sheet A–F, `PICK`), `portraits.js`, `rarity.js` |
| HUD | `ui.js` (HUD v5, settings panel, welcome card, toast, info sheets), `assist.js` (the ONE HUD button + hub), `coach.js` (first-run tutorial, Persian), `hud_art.json` |
| battle | `battle.js` (state machine/flow; **the enemy base IS the home scene re-skinned**), `battlesim.js` (pure JS deterministic sim: collisions, targets, spells; runs in node for balancing), `bbase.js`, `bunits.js`, `bhud.js`, `bfx.js`, `spellfx.js`, `spells.js`, `spellart.js`, `bsfx.js`, `warscore.js`, `brigs.js`, `destruct.js`, `ruins.js`, `nav.js` (walkable grid, bridges, A*), `camblock.js`, `squadring.js`, `search.js` (opponent search, logic only) |
| audio | `audio.js` (music playlists day/night/storm, ambience, sfx; first `pointerdown` unlocks), `bsfx.js`, `warscore.js` |

Gotcha map in §9.

---

## 5. Locked decisions (don't re-ask; show results)

- **HUD v5 (owner-specified, final):**
  - TOP-LEFT: crystal-hex **level badge** (tap = settings) + **name box** (fixed width 150) with cups under the name.
  - TOP-RIGHT: the three mined gems **ruby / emerald / turquoise** (gauge + count + % or FULL).
  - **Directly under the level badge and name box, side by side: the two special gems** — deep-blue **sapphire** and black **onyx** (capsules with NO "+"; tap opens the shop). Their total width equals the name-box width and their right edge equals the name box's right edge ("طول جفتشون از باکس اسم بیشتر نباشه").
  - BOTTOM-RIGHT: **only the Assist button** (medium circle, no text). **No other button on the HUD.** Attack, Army, Build, Shop, Rank, Clan, Friends, Log, Settings, Banner all live in the Assist hub.
  - No date/time on the game screen (only on the welcome card and in settings, never the weekday).
- **Assist hub:** wide **Attack** tile on top (readiness ring + sword + "N % ready"), then 3 columns (landscape 5): Build (free builders / next finish time), Army (training queue or readiness), Shop, Rank, Clan, Friends, Log, Settings, Banner. Tiles are built once; only their text/timers are patched each second (rebuilding every second lost the player's finger — fixed).
- **Welcome card:** style C (cinematic), "WELCOME, My Lord" + date/time; the lord **always** speaks on tap (speechSynthesis en-GB); if you were raided it shows who, how many cups, which gems.
- **Two special gems:** sapphire (bought only), onyx (bought or prize). No mine, no vault, no cap. Prize path = bridge `credit(..., sap=, onyx=)`.
- **Gems:** 1 blue gem of the bot = 10 Blue Wall turquoise (already coded one-way; see §8 for the new two-way request). Invite reward 1000 turquoise is **Blue Wall's own** turquoise, not the bot's firoozeh.
- **Economy:** 20 levels ≈ 1 year at ~3 h/day (plan C); rate/cap formulas in §4.1; owner starts at level 20 maxed (to look around); attack owner-only.
- **Rarity colours:** Common steel, Rare green, Epic purple, Legendary gold, Mythic **blue**. Stronger units unlock later.
- **Spell icons = style A (glass orbs)**; spells: thunder, heal, freeze, rage, earthquake. **Dragons are army units, not spells** (no summon-dragon spell — he doesn't want it).
- **Battle:** the enemy map is the home map with the enemy's level/crest; 3 min; ★ at 50 %, ★★★ only at 100 %; deploy by selecting a squad then tapping the ground; NEXT = next opponent (hidden once the first soldier is sent); HOME free before the first send; ✕ mid-battle asks "Cancel / Yes" (Yes ends right there and shows the result).
- **Cups/leagues, clans, friends, history (Log), invite link** exist (see p17/p18/p19 docs). Owner-only until the server can simulate battles (plan E20).
- **Heroes:** shield-maiden (ability Shield Wall) and mounted lord (Rally Charge): stay where sent (max 15 m chase), ability button + cool-down.
- **Stable:** wooden frame, half-open doors with lanterns, hay barn, trough, hitching rail, round sand training ring; trainer lunges a horse with a long rope, groom brushes the grey, black horse eats at the trough; all on flat ground.
- **Persian first-run tutorial** (4 steps on HOME + battle tutorial), Noto Naskh Arabic. Rest of the game English.
- **Fonts/assets:** see §1. The loader (`web/index.html`) shows the approved dragon-over-crown over the glowing title (assets `web/pub/dragon.webp`, `crown.webp`; title = one metallic layer, the owner's H1/N2 choice); it drives a % bar for the whole boot.
- **Pegasus:** B wings (navy fade tips) + fully white body (shipped as `web/assets/pegasus.glb`); fly in front of the army. Dragon = Prowler model, blue, "attractive", flight fixed (ping-pong the first 1.05 s of the clip). Baby dragon = same model smaller and red-orange.
- **Wall/castle progression** by level: wood → stone → iron → gold → diamond → **blue crystal at level 20** (6 tiers, GPU-skinned in `skin.js`; `levels.js` owns the levels; mapping: L1–3 wood, 4–7 stone, 8–11 iron, 12–15 gold, 16–19 diamond, 20 blue crystal).

---

## 6. State at handoff — what is DONE

All of this is in the code and (except the very last bullet group) installed on his phone.

**p16** — NEXT + beautiful loot, % on every wait (`search.js`), no trees under the army + smart deployment, squad rings, spell icon style A, bottom battle bar = circles with "×N" badges and a health ring, rarity system + later unlocks, A1 fix (result card never locks), "Bot" word removed (plaque/loader), data safety (`StateUnavailable`), toast above everything, flash on keep collapse dimmed, black box v1, night less glossy.
**p17** — destruction v4 + ruins kit (`ruins.js`, `destruct.js`: buildings become dark rubble heaps), economy v5-lite (`progress.py`, `military.py`, `balance.json`, loot = share of a pool), security/ops (corrupt-data backup, `_clean_name`, deep health + build id), **installer v2**, **cups + leagues + leaderboard** (`social.py`, `rankui.js`), **invite links**, **bot gem bridge** (`bridge.py`), 24 crests (`emblems.js`), shoreline vegetation, one loading screen for the whole attack flow.
**p18** — all panels (army, build, settings, cups) centered, ≤ 440 px wide, ≈ 76 % height, tap outside closes; landscape ≤ 560.
**p19** (installed, confirmed 3 Oct 11:29)
- HUD v5 + Assist hub (above), first-run tutorial in Persian, trustworthy welcome lord + raid report, logo sheet (A–F), shop in Assist, two special gems, hub stability fix.
- Owner's 02:01 screenshots: page no longer jumps when something opens (UI root clipped, scroll reset); soldiers/knights never in the moat (gate posts 25 m further out, bridge deck height, `nav.js`); stable redesign + trainer; battle camera ground/mountain clearance; heroes hold position + special abilities; ✕ → Cancel/Yes dialog.
- **Two inspection rounds (4 strict inspectors: FPS / graphics / heat / bugs; then bug-hunters / graphics / ideas)** and their fixes: shadows every 3rd frame; 30 fps after 12 s idle; 90 Hz phones no longer capped at 45; GPU memory leak after each battle closed (≈15–20 MB/battle); frozen trainer/grooms on the enemy map fixed; CSS animations → opacity-only; stable ground flattened; hero-ability label clipped; NEXT under ability; loot row on 360 px; "Yes" really ends at once; stars = server rule; 15 s result fallback; Persian battle tutorial visible; lord voice timer; gift toast under loading; net deadlines (15 s; state 10 s ×3 retries) + "Connection lost — retrying…" instead of a fake level-20 castle; re-read state after > 60 s in background; "Saving the result…"; PMREM ≤ every 8 s; server: lock never deleted while held, stale memory dropped after save, long gift ids hashed, `compare_digest` on bytes, `/api/dev` bad numbers can't 500, bridge CLI clamps, battle report with damage but no soldier/spell rejected.
**p20 (built, gate-verified, NOT yet installed)** — the owner's 11:29 request: **the «+» is removed from the two special-gem capsules** (capsule = gem + right-aligned count; whole capsule still taps to the shop; width/right-edge rule unchanged; `.bw-p .pl` and `.sm` CSS gone) + a comment fix in `shopui.js`. Verified: harness screenshots 390/360/844×390, gate "ALL OK", and the real game (e2e_hud.py, 390×844, swiftshader): name box x 41–191, special-gem pair x 8–191 (same right edge), no console errors, tutorial step 3 reads correctly. Install line: `cd /root && tar xzf bluebot_bluewall_p20.tar.gz && bash bluebot_bluewall_p20/install.sh`; after he confirms: `mkpkg.sh --commit bluebot_bluewall_p20`.

**Tests that pass** (gate): py_compile, client build (release + debug), no 'bot' word in player strings, credits file, `api_test.py … api_test6.py`, `social_test.py`, `gift_test.py`, `clan_test.py`, `prem_test.py`, nomad-camp plan, battle sim "0 wall crossings" (`bsw.sh`).

---

## 7. What REMAINS (priority order inside each block; phases refer to §2)

### 7.1 Known defects / risks (feed Phase 1 + 2)
1. **`military.py` accepts the battle report from the client** (only a power-based sanity clamp). Fine while attacks are owner-only. **Before `BLUEWALL_ATTACK=public`:** server battle start/min-duration (`/api/battle/start`, plan A28/E19) and ideally a server re-simulation (E20; the sim is pure JS and deterministic but float determinism differs V8 vs JavaScriptCore). Abandoned battles still cost nothing.
2. `battlesim` O(N²) for ~300 soldiers: 3–6 ms/step on a mid phone; `nav.route` lazy A* up to ~48 k nodes × up to 4 sim steps per frame can spike (candidate cause of "Telegram isn't responding" in battle) → plan A27 (precomputed nav field, one route per step, slow-down instead of 4 steps).
3. PBR textures not halved for low quality (≈150 MB GPU); no per-tier texture regime (plan B13).
4. **No real-phone FPS/heat data exists.** The black box exists (`perf.js` → `POST /api/perf` → service log line `perf uid=… {…}`); read it with `journalctl -u bluebot-wall | grep perf` (owner runs it; give him the exact command) after he plays a few minutes, and tune from numbers. Real-device FPS was 59 day / 47–50 night at p4; nothing newer measured.
5. Water reflection only on high/ultra; no new music (he wants: calm start, epic in rain, even more epic in battle — implemented synth war score + playlists, **not confirmed on the phone**).
6. `scout` leaks `kind: bot|player` in history reports to the client (`MI.view reports`) — plan D (hide).
7. `state._candidates` scans Redis (shared with the bot's queue) — will not scale to thousands of players (plan D2: ZSET indexes).
8. Three different "owner" sources (`access.allowed_uids`, `state._owner_ids`, `server._is_owner`) — unify (plan D1).
9. Settings cache / Redis per-process assumptions: Blue Wall runs ONE process with per-uid asyncio locks; a second worker would break atomicity (needed for Phase 4 design: keep one process or move locks to Redis).

### 7.2 Owner requests not fully done (all are in `docs/` and the plans)
- **Hokm → Blue Wall gem hook on the BOT side** (needs the bot's award file; superseded by the §8 design).
- **Shop purchase wiring** ("bot" buttons): he has not said what "buy" connects to (Toman wallet? bot shop?) → §8 question Q5.
- **Logo choice** for the Attack tile (show sheet at the end of Phase 3; `PICK='B'` default).
- Sword "real, otherworldly" for the Attack button + a small top attack button idea (superseded by Assist hub — confirm logo only).
- Water reflection everywhere, LOD, stronger spell VFX ("like Clash"), map "no empty space / empty area in front of the map", nomad tents (done: `nomads.js`; owner hasn't confirmed), mountains/water/plants/night quality ("خیلی خیلی خیلی بهتر"), flags/crests on walls (24 crests exist), vault looks (H2), music.
- **Clan features** (siege, gifts), defense history/replay, daily missions — partly built (Rank/Clan/Friends/Log tabs exist); see plan D.
- 20 levels ≈ 1 year economy calibration with real data (plan C5), tutorial hour-one flow (C13).

### 7.3 Idea backlog (from the idea inspectors; NOT approved — ask before building; HUD is locked)
Collect-all in one tap, real haptics, "suggested upgrade" chip, tip of the day, gems flying to the HUD when collected, personal-best ribbon, battle replay, placeable defences/traps, clan wars, daily missions, comeback gift, seasonal events/skins. Details: `plan5/MASTER_v5.md` §8, `plan5/*`.

### 7.4 The big plans (already written; do not rewrite)
`plan5/MASTER_v5.md` + A (attack) / B (visuals & perf) / C (progression & economy) / D (social & meta) / E (quality, security, ops) / F (UX polish) / `plan5-G-oct3.md` (3 Oct requests). Their "phase 0 … phase 5" order in MASTER_v5 §5 is the long-range roadmap; **this handoff's four phases take priority** (owner's latest instruction) and should pull items from those plans (bugs → E/A; smoothness → B; graphics → B/F; sync → D + §8).

---

## 8. Phase 4 — shop ⇄ Blue Wall gem sync (design to confirm, then build)

**Owner's words (3 Oct 11:29):** "سیستم فروشگاه بخش گیم ربات رو با بازی هماهنگ، مردم از ربات مثلاً جم آبی برنده شدن یا خریدن، مثلاً ده برابرش تو بلو وال اضافه بشه! و استفاده هم کردن، تقسیم بر ده از جم ها تو بخش گیم."

**What exists today:** one-way, additive gift only. `bridge.credit(redis, uid, blue, src, gid, sap, onyx)` pushes into `bluewall:inbox:<uid>`; `state._drain_inbox` turns `blue × 10` into turquoise (above vault cap if needed), once per `gid`. **The bot-side call was never added** (the bot code was never available). Nothing in Blue Wall ever touches the bot's balances.

### 8.1 Why the simple version is dangerous
If "bot wins 5 gems → +50 in Blue Wall" is implemented as a *copy* (the player keeps the 5 gems in the bot AND gets 50 turquoise), the player can spend the gems in the bot shop **and** the turquoise in Blue Wall → value created from nothing. Bot gems cost real money (the owner sells them) so this is a real exploit. Also, **Blue Wall mines produce turquoise by themselves**; if "÷10 from the bot on spend" applied to *all* turquoise, mining would drain players' bot gems; if mining *credited* the bot, mining would print bot gems. The design must keep **mined** and **bot-linked** turquoise separate.

### 8.2 Recommended model: "linked pocket" (bot = source of truth)
- A player's Blue Wall turquoise = **mined** (the existing vault balance, Blue Wall's own, unchanged) + **linked** (a live *view* of `10 × bot_blue_gems(uid)`) + **change** (< 10 turquoise, see rounding). The bot's balance is never copied; Blue Wall *reads* it (cache a few seconds; refresh after every Blue Wall spend and on app open). Win/buy in the bot → the view grows 10× automatically; spend in the bot shop → the view shrinks (no duplication possible).
- **Spend order in Blue Wall (to confirm, Q3):** mined/vault first, then linked (so mining isn't wasted), or linked first. Only the linked part ever debits the bot.
- **Debit:** to spend `t` turquoise from the linked pocket: `need = max(0, t − change)`; `g = ceil(need/10)`; call `bot.debit(uid, g, ref)`; `change = change + 10·g − t` (always < 10). Never lose value to rounding. `change` is Blue Wall's own and is not mirrored back.
- **Atomic and idempotent (two-phase):** (1) under the per-uid lock write `pend = {txid, g}` into the player's state **before** calling the bot; (2) `bot.debit(uid, g, ref="bw:<txid>")` — the bot's ledger must have a UNIQUE ref so a retry never double-debits; (3) on OK apply the Blue Wall spend and clear `pend`; on "insufficient" reject the spend ("Not enough gems"); on timeout/unknown keep `pend`, retry the **same** txid, and if it still fails reject the spend and let a reconcile pass (on next load) either apply or refund. **Never apply a Blue Wall spend without a confirmed debit; never leave a confirmed debit without applying/refunding.**
- **Refunds** (cancelled upgrade, rush refund, etc.): refund to the same pocket they came from (`bot.credit(uid, g, ref="bwr:<txid>")`).
- **Mining never credits the bot.** Only the explicit bridge (prizes: sapphire/onyx; one-offs) writes into Blue Wall; Blue Wall only ever *debits* (and refunds) the bot's blue gems.
- **Where the bot's wallet code lives:** `bluewall` is inside the bot's tree and already imports the bot's `config.settings`, so the real adapter can call the bot's own ledger/wallet service in-process (same MySQL, same audit rows) instead of raw SQL. **Implement an adapter interface** `bluewall/botwallet.py` with `balance(uid)`, `debit(uid, n, ref)`, `credit(uid, n, ref)` and ship (a) an in-memory fake for tests, (b) the real implementation once the bot code is in hand. Fallback if in-process calls are impossible: a Redis request/response queue answered by a bot-side worker (more moving parts, extra latency).
- **Safety rails:** kill switch env `BLUEWALL_GEMSYNC=off|shadow|on` (start in **shadow**: compute and log what *would* be debited, debit nothing, for a few days, owner-only); per-user allow-list first (owner + testers); audit log line per movement; rate limit per uid; reconcile job; a CLI to inspect/repair one uid; tests with concurrent spends (×50 parallel), crash between each step, duplicate txid, bot unreachable, insufficient funds, rounding table (1…99 turquoise), refund; the existing gate stays green.
- **Display:** the HUD gem counts are owner-locked. Proposal (ask Q4): HUD gauge keeps showing the mined vault; the shop and the build/army cost sheets show a combined "available" figure including the linked pocket.

### 8.3 Questions for the owner (ask in ONE short Persian message with options; he answers fast)
- **Q1 mapping:** only the **blue gem → turquoise**? Or **by colour** (bot red gem → ruby, green gem → emerald, blue gem → turquoise), all ×10? And what exactly are the bot's game-section currencies called (firoozeh/yaghoot/zomorrod/"blue gem"/tokens)? (The bot code will show it.)
- **Q2 duplication:** confirm the **mirror** model (the same gems are shown ×10 in Blue Wall; spending them in Blue Wall removes them from the bot) — NOT "bonus copy" (keep the bot gems and also get Blue Wall gems).
- **Q3 spend order:** use mined turquoise first, or the linked ones first?
- **Q4 existing holdings:** do gems players **already hold** in the bot count immediately (everyone suddenly has 10× in Blue Wall) or only gems won/bought after launch?
- **Q5 shop "bot" buttons:** what should buying in the Blue Wall shop do — pay with the bot's Toman wallet? open the bot's shop? pay with bot gems?
- **Q6 scope:** who can use it first — owner only, then testers, then everybody (it follows `BLUEWALL_PUBLIC`)?

### 8.4 Order of work for Phase 4
Get the bot code (§12) → read its gem/ledger/wallet code and the Hokm award path → write the adapter + fake + tests → shadow mode → owner-only live → add the bot-side prize hook for sapphire/onyx (`credit(...sap=,onyx=)`, see `docs/BOT_HOOK.md`) → package + install + watch logs → widen.

---

## 9. Gotchas (these bit us)

**Process / sandbox**
- **Never** use `pkill -f` or kill patterns that match your own command line (exit 144). Run kills in their own Bash call with the bracket trick: `ps -eo pid,args | grep '[x]yz' | awk '{print $1}' | xargs -r kill`.
- No single `sleep` > 100 s. The real-game e2e (swiftshader) takes 5–10 min: start it in the background (`nohup … &`) and poll the log.
- Swiftshader is ~3.5 s/frame at high quality; after the HUD intro the HUD can be invisible ≈40 s; the Build panel needs ≈25 s to become visible. That is the sandbox, not a bug.
- Relative `local_path` fails in the Projects tool; use absolute paths.
- Late models stream in after the first frame: wait ≈40 s before creature screenshots.

**Rendering**
- Skinned merges with different `boneInverses` explode (use `mergeSkinned` bind-pose correction; use the saved `host`). Always `trimClips`; set loop modes explicitly.
- `ph_*` textures are sRGB — don't convert twice in the terrain bake.
- RTL page flips the HUD: keep `.bw-ui{direction:ltr}`; `dev.html` is `lang=en dir=ltr`.
- A `CSS` const in `ui.js` shadows `window.CSS` — use `window.CSS.supports`.
- Shadow map with `autoUpdate=false`: a new battle light has no map → `GL_INVALID_OPERATION` on every instanced draw; keep the `needsUpdate` warm-up (test with `Q=high`).
- After entering a battle, a full-screen invisible veil can eat all taps (fixed: removed after build + `pointer-events:none`); always sweep buttons with `elementFromPoint`.
- Don't animate `box-shadow`/`filter` (WebView heat); use opacity/transform only.
- Every battle must `dispose` fx/shadow/geometries/materials (leak.py tracks textures/geometries over repeated battles).

**UI**
- Keep Assist hub tiles stable (patch text only); rebuilding on a timer loses fingers.
- Panels: centered, ≤ 440 px, ≈ 76 % height (owner request); the HUD must not exceed the screen on 320 px (HUD scale `--hs` .56 below 340 px).
- Player counts ≥ 10 000 shorten to `79.6K`.

**Server**
- Redis read errors must raise `StateUnavailable` (503), never create a fresh castle and save it.
- Gift ids > 48 chars are hashed, not cut. Locks are never deleted while held.
- `python -m bluewall` needs `config.settings` (the bot's config); tests use `PYTHONPATH=/home/claude/dev/stubcfg`.

---

## 10. Test harness (`/home/claude/dev`)

- **Static server:** `bash up.sh` (port 8777 serves /home/claude/dev; `dev.html` = game with `dev:true`, query `q=low|medium|high|ultra`, `h=hour`, `w=weather`, `s=season&sp=progress`, `wa=seconds`).
- **Build:** `bash rb.sh` (release `web/app/wall.js` + debug `dev/app_dbg.js`).
- **Test API server:** `bash srv.sh start|stop` (port 8591, memory store, owner uid 777, stub config).
- **Gate:** `bash gate.sh` (≈3 min) → `GATE: ALL OK`. It runs py_compile, build, 'bot'-word check, credits, `api_test*.py`, `social/gift/clan/prem` tests, nomad plan, battle sim; stops the test server at the end.
- **Screenshots of the dev page:** `PAGE=dev.html python3 shot.py W H out.png QUALITY "<js after ready>" WAITSEC HOUR` (env `WX`, `EXTRA`, `DPR`); camera helpers in `cam.js`. `q.py "<expr>" WAIT` evaluates JS. `perf.py high` = draw calls/tris/ms per frame.
- **HUD harness (fast, no server):** `home_hud_dev.js` + `home_hud_dev.html`; `hhshot.py OUT "query" [js]` (env `W,H,DPR,WAIT`); query: `ready busy train un sap onyx name lv full wel`. Rebuild its bundle: `cd client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/home_hud_dev.js --bundle --format=iife --outfile=/home/claude/dev/home_hud_dev.bundle.js --loader:.json=json --loader:.webp=dataurl`.
- **Real-game e2e (needs `srv.sh start`; slow):** `e2e_hud.py` (HUD + tutorial + welcome), `e2e_home.py`, `e2e_panels.py/2`, `e2e_hubclick.py` (hub tiles/Build/Attack), `e2e_battle2.py`, `e2e_final.py`, `e2e_attack.py` (written, not yet run). Usage: `W=390 H=844 python3 e2e_hud.py /tmp/out/prefix`.
- **Battle balance / safety:** `bsw.sh` (walls/water crossings), `bsb.sh`/`bsr.sh` (balance), `leak.py`, `nav_test.cjs`, `scan_deploy.cjs`.
- **Always check:** no `PAGEERR`; day (h=12) and night (h=22); winter preview; portrait 390×844 + 360×640 + 320×568; landscape 844×390.

---

## 11. Before shipping a package (checklist)
1. `gate.sh` → ALL OK. 2. Screenshots day + night, looked at critically. 3. `perf.py high`: draw calls < 300, no regression. 4. Server changed → local server + `api_test*.py`. 5. New assets → `credits.json`. 6. Docs: update `p<N>-progress.md` (what changed, what is left) + owner-feedback/plan files, write them to the Project. 7. `mkpkg.sh <new name> "title"` → SendUserFile + one install line + 2–4 Persian bullets + screenshots. 8. After he confirms: `--commit`.

---

## 12. Giving the owner a secret-free backup of the BOT (needed for Phase 4)

Ask him to run this ONE command on the server (it never prints secrets; excludes `.env`, sessions, keys, venv, logs, git history, Blue Wall itself, databases), then upload the resulting file to the chat/Project:
```bash
cd /root && tar czf bluebot_code_$(date +%Y%m%d).tar.gz --exclude-vcs --exclude='bluebot_v2/.env' --exclude='bluebot_v2/.env.*' --exclude='*.env' --exclude='bluebot_v2/.venv' --exclude='bluebot_v2/venv' --exclude='__pycache__' --exclude='*.pyc' --exclude='bluebot_v2/logs' --exclude='bluebot_v2/_backups' --exclude='bluebot_v2/bluewall' --exclude='bluebot_v2/node_modules' --exclude='*.session' --exclude='*.session-journal' --exclude='*.pem' --exclude='*.key' --exclude='*.sqlite*' --exclude='*.db' bluebot_v2 && ls -lh bluebot_code_*.tar.gz && mkdir -p /tmp/chk && tar xzf bluebot_code_$(date +%Y%m%d).tar.gz -C /tmp/chk && echo "--- فایل‌هایی که شبیه راز هستن (فقط اسم):" && (grep -rlEI '[0-9]{8,10}:[A-Za-z0-9_-]{30,}|sk-[A-Za-z0-9]{20,}|BEGIN (RSA|OPENSSH|PRIVATE)' /tmp/chk | head -20; true) && rm -rf /tmp/chk
```
If the last section lists any file, he must delete/clean it from the tarball (or tell you) before uploading. Do NOT ask for a database dump; the model/migration files in the code show the schema. If it is still too large, add more `--exclude` for media folders.

---

## 13. Project docs index (claude.ai Project "آپدیت ربات", also in `docs/` + `plan5/`)
Blue Wall: `bluewall-handoff-p20` (this), `next-opus-prompt`, `bluewall-master-plan-v5`, `plan5-A-attack`, `plan5-B-visuals-perf`, `plan5-C-progression-economy`, `plan5-D-social-meta`, `plan5-E-quality-security-ops`, `plan5-F-ux-polish`, `plan5-G-oct3`, `bluewall-owner-feedback-oct2` / `-part3` / `-part4` / `-oct3`, `p5-progress`, `p16/p17/p18/p19-progress`, `bluewall-master-plan-v3/v4`, `bluewall-plan-v2`, `bluewall-roster-v13` (all 19 troops), `bluewall-progress-military-design`, `bluewall-assets`, `bluewall-handoff` (old).
The bot (needed for Phase 4): `game-overhaul-plan`, `game-overhaul-owner-requests`, `game6-handoff`, `hokm-game-spec`, `shop-fix-requests`, `migrate-helperbots`, `eye-game-spec`, `web-panel-prompt`, `web-panel-texts`.

---

## 14. First message to the owner (template, Persian)
«سلام Wingless 👋 پروژه رو تحویل گرفتم. چهار فاز می‌رم: ۱) باگ‌یابی و فیکس ۲) روون‌سازی/بهینه‌سازی ۳) ارتقای گرافیک ۴) سینک فروشگاه ربات با بلو وال (×10 / ÷10). هر پنج درصد «📊 پیشرفت» می‌دم. برای فاز ۴ کد ربات لازمه — یه دستور امن (بدون توکن) می‌دم که بکاپ بگیری. اگه p20 هنوز نصب نشده، همین الان: `cd /root && tar xzf bluebot_bluewall_p20.tar.gz && bash bluebot_bluewall_p20/install.sh`»
