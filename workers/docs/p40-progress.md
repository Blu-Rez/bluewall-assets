# MERGE-1 report — wave-1 merge → package p40 (7 Oct 2026, merge chat)

**State (7 Oct 2026, ~03:45):** p40 (`bluebot_bluewall_p40.tar.gz`, `PKGCHECK: OK`) is **INSTALLED by the owner** («نصب کردم») and **committed** (`mkpkg.sh --commit`: `pkg/deployed.sha256` now 441 entries = the server state after p40). `bluewall_devkit_v3.tar.xz` = code-p38 clone + overlay of 22 files (= p40) + the new `deployed.sha256` + the 5 new tests, `gate_w.sh`, `WIRING_TODO.md`, this report; checked on a fresh clone: `overlay.sh` is idempotent and `diff -rq` against the working tree shows no difference. Prompt for the next chat: `MERGE2_stage2.md`.
Install line (done): `cd /root && rm -rf bluebot_bluewall_p40 && tar xzf bluebot_bluewall_p40.tar.gz && bash bluebot_bluewall_p40/install.sh`

## What was merged (order B2 → B3 → B1 → A2 → A1; all applied clean, no CONFLICT, no hand edits)
| patch | result | what the owner sees in p40 |
|---|---|---|
| A1 wall rows | ✅ merged | level 1–10 one wall row (keep ring, now 16 m), 11–20 two, 21–30 three |
| A2 mountain streams | ✅ merged | twin waterfalls + two streams (stream_w wide k=1.8, stream_e k=1) from the mountain to the moat, bridges, meadow strip |
| B1 town-plan engine | ✅ merged (dev flag only) | nothing; `?b1town=1` draws plan boxes on the dev page |
| B2 house kit | ✅ merged (files only) | nothing — not wired |
| B3 civic kit | ✅ merged (files only) | nothing — not wired |
Not delivered: C1–C4, U1–U5, E1, PERF → nothing merged.
Package = 20 files: 13 client sources, `web/app/wall.js`, `BUILD`, `kit_homes.glb`, `kit_civic.glb`, `kit_civic.report.json`, `credits_b2.json`, `credits_b3.json`. No `.py`.

## Verified myself (merged tree)
- Own tests re-run: `A1 OK`, `A2 OK`, `B1 OK` (168 checks, 0 FAIL), `B2 OK`, `B3 OK` (47 checks). Their numbers equal the reports.
- `GATE_W: ALL OK` (baseline p39 and merged; the 5 new tests are now lines in `dev/gate_w.sh`). Battle sim: 0 wall crossings; noRoute events **317 → 622** (limit 700; A2 predicted 622).
- `p39_gate.py` → `GATE OK`. `pkgcheck` → `PKGCHECK: OK` (only warning: 3 source URLs inside `credits_b3.json`, plain text).
- Shader programs (Q=high, lv 30): baseline 222, merged 206 (≤ +15; the count moves ±16 from load to load on the base itself — do not read it as a saving).
- Draw calls / triangles (`p38_perf.py perf 30`, with worksites, before → after): top 475/3.08M → 481/3.09M · ctr 436/2.53M → 445/2.55M · town 475/2.52M → 472/2.51M · fields 501/3.26M → 503/3.29M · lake 267/1.49M → 246/1.45M. Without worksites: +6 / +8 / +3 / +6 / +4 calls. So **not exactly +0**: ≈ +2…+9 calls (≈ +1–2 %), tris ≈ 0…+27k; all from A2 (A1/B1/B2/B3 add no mesh). Within A2's own budget (≤ +10 calls, ≤ +40k tris), not within the workers' "≤ +0".
- Bundle (same esbuild flags): p39 1,013,284 B gzip → p40 1,024,763 B (+11.2 KB; raw +27.6 KB). B1's planner is ~6 KB of that and unused until stage 2.
- Real-game screenshots (software GL, q=low, 1100×620), before (p39 build) vs after, same cameras: A1 levels 10/11/20/21/30 show 1/2/2/3/3 rows; p39 showed 3 walls at level 10. A2: twin falls and both streams from the mountain to the moat (high / west / east cameras). No page errors in the logs.
- Extra check (A2 × B1): 0 stream points inside the town wall (closest 13.0 m), none of B1's 141 records touches a stream (closest 11.7 m effective). Script: `dev/m1_streams_vs_town.js`.

## Decisions / deviations (tell the owner)
- `kit_homes` / `kit_civic` were deliberately **not** added to `assets.js` `LATE`: nothing reads them yet and `LATE` models are prefetched + parsed for every player (~596 KB). Add them together with the stage-2 consumer. Credits (`credits_b2/b3.json`) are likewise not merged into `credits.json` (the About screen reads only that; different shape in b3) — stage 2.
- No wiring beyond the patches. Full list of what is open: `WIRING_TODO.md` (in `dev_tests_p40.tar.gz`).

## Not proven / honest limits
- From the owner's own camera for A2 (`home`: azim 1.191, dist 257.6) only the twin falls are visible; the stream course is hidden behind a ridge / the wall. The course is visible only from higher / side cameras.
- Defaults not confirmed by the owner (no answer arrived): A1 option 1 (keep ring 16 m, castle grows outward; option 2 `window.__a1InnerH = 7.5`, option 3 `layout.RING_ORDER = ['town','outer','inner']`); B1 option 1 (102 homes at lv 30); B2 all 12 cells; B3 default (gold roofs from lv 18).
- Forest re-rolled (A2 meadow strip) — individual trees moved. At low levels the town-gate bridge, citadel moat and the dark bank lining still stand where the missing wall will be (A1 §6). A battle still shows all three rings.
- Not run here (needs the bot's private code): full `dev/gate.sh`, server tests, installer sandbox (`instest`). Phone frame time not measured (software GL only).
- Worker-reported screenshots/sheets were not attached to the merge chat; proof shots above were taken fresh.

## Next
Stage 2 (p41, only after «ادامه بده»): `town.js` builds lots from `planTown` (B1) with B2 homes + B3 civic lots; see `WIRING_TODO.md`. B1 gives 102 homes at lv 30 — owner decision on density still open.
