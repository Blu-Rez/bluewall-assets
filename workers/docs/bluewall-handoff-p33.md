# Blue Wall — handoff after p33 (5 Oct 2026)

Package: `/home/claude/pkg/bluebot_bluewall_p33.tar.gz`. Install: `cd /root && tar xzf bluebot_bluewall_p33.tar.gz && bash bluebot_bluewall_p33/install.sh` (rollback = `bash rollback.sh` in the same folder).
After the owner confirms it works: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p33`.

## Owner (Wingless): Persian, casual, short messages from a phone, harsh when tired. Standing rules (unchanged)
Exactly what he describes, nothing extra · ONE sample image from the game's real code path before any visual / UI, then wait for his OK · HUD layout locked except his explicit requests · heroes manual · ONE package per round · never touch secrets / server config / `.env` · Persian, short, English digits, never «bot / ربات» shown to players · `📊 پیشرفت: N٪` at every 10 % · every new message of his is appended to `bluewall-owner-feedback-oct4.md` and pushed to the Project at once · rules / balance as ONE short Persian table · final report = proven / not proven / not done.
When he gets an art sample wrong he says «آشغال» without a reason: do NOT iterate blindly — ask ONE question (the 13:07 brief that worked: «مینیمال اما خوشگل و با کیفیت»).

## What p33 contains (details + how each was verified: `p33-progress.md`)
Block N (08:23): bead under soldier orbs removed, thinner health bars, axe rider axe in the right hand, attack dragon + baby = the home dragon in red, portraits of giant / hill / dragon / baby, ability buttons (minimal navy orbs: solid shield + thin-line pennant, NO text, his pick 13:12), thunder-flash fix in battle (N6 partly). Then: R1 contact-timed hits · R3 balance (new `TUNE` defaults) + smart-play harness · S4 attacker AI by `prefer` · R5 nav spike (labelled regions + node budget: worst route 30 → 5 ms) · S6 unmanned weapons hidden (verified).
**Built but switched OFF** in `client/src/features.js` (flip the default only after he says OK; dev override `?f=resultInfo,scout,squad`): `resultInfo` (S10 result card: damage by source + one hint), `scout` (S8 defence preview `threat.js`), `squad` (S9 half / focus buttons — the p34 ring scheme replaces them).

## NOT done / not proven (start here — the full list is `next-prompt-p34.md` §3)
See `next-prompt-p34.md` §3. First job of p34 = the ring control scheme (§1 Block C there), then his 9 requests (§2).

## Tooling notes (hard-won, p33 additions)
- Real-game session: `dev/s30/live.py` (start: `SEM_TIMEOUT=14000 nohup bash sem.sh python3 s30/live.py "http://127.0.0.1:8777/dev.html?q=high&w=clear&h=12&wa=1&f=scout,squad" 390 844 …`; load 8–10 min, a battle start another 5–8). Jobs = JSON step lists in `s30/cmd/<name>.json` (`{name, js, frames, wait, shot}`), shots `s30/t/<job>_<step>.png`, `touch s30/cmd/QUIT` to stop. Ready-made helpers in `dev/s33/jobs/*.json` (start a battle, scout, pointer-event taps, fire, giant / dragon fights). The browser renders ≈1–2 s per frame: make the sim run 4 ticks per frame with `setInterval(()=>{S.acc=Math.max(S.acc,0.14)},30)` (`__h.fast`), and after moving the camera wait for FRAMES (`__h.nf(n)`), never a fixed sleep.
- NEVER `pkill -f live.py` / `pkill -f chrom` inside a command line that contains those words (it kills your own shell, exit 144): use `touch QUIT` and `ps … | awk` + `kill PID`.
- DOM-only real-HUD lab (fast, no 3D): `bash dev/s33/hud.sh OUT W H "query"…` (real `createHUD`; `st=rdy,cd,off`, `still=1`, `scout=1|card`, `tools=half|focus`, `res=1|plain`).
- Balance: `dev/r7.sh`, `dev/bsm.sh`, `dev/s32/search/run3.sh NAME "k=v"` + `cmp.py`; defaults in `battlesim.js TUNE` (`TUNE_KV` env overrides). Nav: `dev/s33/nav_bench.js`, `dev/nav_prof.js`. S8 helpers test: `dev/s33/threat_test.js`.
- Gate: `bash dev/gate.sh` (only `bot_xfer_test` may fail on this machine: no sqlalchemy; it restarts the API server, so never run it while the live browser session needs the dev server). Install sandbox: `bash dev/instest_bot.sh bluebot_bluewall_p33 ok`.
- Max 2 browser jobs at a time; never run node matrix / R7 while a heavy browser session runs; never `scene.fog = null`.
