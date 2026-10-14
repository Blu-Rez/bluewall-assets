# MERGE-3 report — C1 + C2 + C3 + C4 + PERF → package p42 (7 Oct 2026, merge chat)

**State (7 Oct 2026):** p42 = `bluewall_devkit_v4` (= p41, installed + committed) + five patches. Package `bluebot_bluewall_p42.tar.gz` built, `PKGCHECK: OK` (29 files, 1.8 MB gz, sha256 starts 9d6bd707). **Not installed yet; `mkpkg.sh --commit bluebot_bluewall_p42` runs only after the owner says «۴۲ نصب شد».** Nothing was pushed to git.
**Not delivered at the time of this merge: E1, U1–U5 → nothing from them is in p42.**
Install line: `cd /root && rm -rf bluebot_bluewall_p42 && tar xzf bluebot_bluewall_p42.tar.gz && bash bluebot_bluewall_p42/install.sh`

## Patch verdicts
| patch | verdict | what went in |
|---|---|---|
| C1 water | ✅ merged by hand | fishery improved (nets / drying / sluice), NEW panning + smokehouse (registered, not placed) |
| C2 timber / stone / metal | ✅ merged by hand | lumber +1 piece, iron +2 pieces, NEW sawmill / masonry / smelter (registered, not placed); `c2_kit.js` dropped (unused) |
| C3 gold / oil | ✅ merged by hand | gold + oil improved, NEW mint / refinery (registered, not placed) |
| C4 food | ✅ merged by hand | farm + slaughter improved (dark slaughter hall), NEW mill / bakery / butcher (registered, not placed) |
| PERF | ✅ applied clean (`applypatch.sh`) | light pad (6 point lights at ATTACK), sliced compile, idle compile ≤ 25 % busy, perf marks |
All five were clean: no secrets / tokens, no `web/app/*`, no `pkg/`, no `dev/gate*.sh`, no server `*.py`. The four C patches collided on `worksites.js` + `wsbuild.js` (four incompatible kit-loading / registration designs) → ONE hand-written design, both sides kept, hand-over lines: `world.js` 1, `assets.js` 1, `wslife.js` 3 (the merge itself is `worksites.js` 38 changed lines + `wsbuild.js` 74; details: `WIRING_TODO.md` → "Done in p42").

## What the player SEES / does NOT see
- **Sees:** the 8 map sites that already existed change (farm, both fisheries, gold, iron, both lumber camps, oil, slaughter); greenhouse, livestock, quarry unchanged. Smoke of the stacks is wired.
- **Does not see yet:** the 10 NEW kinds (panning, smokehouse, sawmill, masonry, smelter, mint, refinery, mill, bakery, butcher) — nothing places them on the map (they are B1's role-P production lots; `BUILT_ROLES = {H, C}`). Flames of the C kinds are not wired (`Flames` cannot take late points). Workers / carts of the new kinds exist in `wslife` but have no site to live at.

## Verified myself (software GL; same cameras / same scripts before = p41 base → after = p42)
- **Gate:** `bash dev/gate_w.sh` on the final tree: every line OK incl. `C1 OK`, `C2 OK` (1 501 checks), `C3 OK`, `C4 OK`, `A1/A2/B1/B2/B3/P41 OK`, ws_test (12 sites), battle sim 0 wall crossings, **noRoute 622 (< 700)** → `GATE_W: ALL OK` (1 m 33 s).
- **Pictures of the merged code** (real builder, real terrain, real kits, levels 1 / 15 / 30; I opened each at full size): `m42_c1_sheet.png`, `m42_c2_sheet.png`, `m42_c3_sheet.png`, `m42_c4_sheet.png.png`; in-game before/after of the 8 worksite cameras `m42_cmp_ws_*.png` (the slaughter hall is clearly visible; the other sites are small at that camera distance — that is why the per-site table below exists).
- **Per-site, from the real game** (`dev/m42_sites.py`, lv 30, q=low): the 12 sites changed by **+3 draw calls (main group: oil +1, slaughter +2) and +2 (near group: farm +1, iron +1)**, tris within ±6 k per site (table in `WIRING_TODO.md`). C1 + C2 kits merge into the main bake by material signature → +0 draws and +0 programs; C3 and C4 add their own bake (that is the +3).
- **Draw calls / tris** (`p38_perf.py perf 30`, q=low, with worksites): top 476 / 3.074 M → 474 / 3.058 M · ctr 446 / 2.609 M → 447 / 2.591 M · town 456 / 2.551 M → 457 / 2.546 M · fields 515 / 3.327 M → 514 / 3.304 M · lake 263 / 1.477 M → 261 / 1.473 M. Without worksites: 394 / 372 / 370 / 440 / 173 → 394 / 372 / 371 / 440 / 173 calls, tris ±0.01 M. → **no measurable change in these overview cameras** (the cost sits in the near view of a site, see the per-site table).
- **Shader programs, home, Q=high, lv 30** (`p39_progs.py 30`): p41 base **206** → p42 **204** (meshes 1 018 → 1 023, materials 547 → 550). (p41's own report saw 222 / 233 here; not reproduced — the PERF light pad is the likely reason, not proven.)
- **ATTACK (the 23-second freeze), Q=high, same script and seed (`pf_battle_progs.py`, `NOBLOOM=1`):** p41 base 204 → **429 (+225)**, **213 programs in ONE main-thread task**; p41 + PERF only (scratch bundle) 204 → 254 (+50), most 2 in a task; **p42 204 → 254 (+50), most 3 in a task** (five p42 runs of this script: +77 once, +50 four times; `pf_battle_gate.py` Q=high +50). `pf_battle_gate.py`: **`PF OK` at Q=high (204 → 254, +50, `n:progs` 48, most 3 in a task, back home 254 → 206) and at Q=low (167 → 215, +48, most 2)**; `p39_gate.py` → `GATE OK`; `pf_sw_unit.py` → `PF_SW_UNIT OK` (idle compile: most in one task 18 → 1, busy share 0.51 → 0.17, late frames 5 → 0).
  **Run-to-run variation (read this):** in ONE of the five p42 runs the attack showed +77 and 27 programs in one task (a 42 s task in software GL). In that run the tap came while the home scene still had 27 programs uncompiled (programs at the tap 204); in another run those 27 were already compiled at the tap (231) and the attack added +50 — both end at 281 in total. So the 27 are **home-scene programs** that compile either at home idle or at the first attack, i.e. the same 206 ↔ 222 / 233 home flicker the p40 / p41 reports describe (lead from p41, unverified: `reflect.js tagLights()` gives the reflection pass 5 of the 6 lights; the 5-light variants compile at the first reflection render). It is **not caused by the C merge** (p41 + PERF alone: +50 in both runs, programs at the tap 204 both times; I cannot exclude that it also happens there). On a phone it would mean: tapping ATTACK within the first seconds at home can still compile up to ~27 programs in one task once (≈ 3 s). PERF did not target it; left as is, listed in `WIRING_TODO.md`.
- Package: `mkpkg.sh` delta vs `pkg/deployed.sha256` = 29 files / 4.1 MB, only p42 files (listed in the install log). `pkgcheck.sh` → `PKGCHECK: OK`.

## NOT proven
- Anything on a phone: frame time, the real compile cost (PERF's phone numbers are predictions: `n:progs` ≈ 50, `n:slice` ≲ 400 ms, no `loaf` > 500 ms in `battle:load`).
- In-game close-ups of the C changes at a game camera for fishery / gold / oil / lumber / iron / farm (the sheets and the per-site table are the proof, not a screenshot at the site).
- The new kinds in the town (they are not placed); flames; smoke of kinds that have no site.
- Full `dev/gate.sh`, the server tests, the installer sandbox (`instest`) — need the private code.

## Pitfalls hit in this chat (save yourself the time)
1. **Never normalise `WS_KINDS[k].in/out`** (strings vs arrays): `c2_kinds_test` fails 7 of 1 501 checks. Keep the raw shapes until E1 picks one.
2. New kinds must stay **non-enumerable** in `WS_KINDS`, or `ws_test` ("exactly 12 sites, one per enumerable kind") fails.
3. The dev viewers (`dev/c*_ws_dev.js`) must use the REAL `wslife.js` now; `c1_mk_wslife.sh` would duplicate the C1 import.
4. `pkill -f <script>` kills your own shell (exit 144) — use `ps | awk` + `kill <pid>`.
5. One browser job at a time (software GL). A page load is ~2 min at q=low, ~4 min at q=high.
6. A program-count run can vary by one load: repeat a surprising number before believing it (see "Run-to-run variation" above).
7. To isolate a merge from a patch: apply the patch alone onto `base_snapshot` into a scratch tree (`applypatch.sh <patch> <tree>`), build with esbuild, run the same script on that bundle (`dev/dev_bp.html`).

## Open (owner / next merge) — full list in `WIRING_TODO.md` → "Open after p42"
Production lots (next package: place the P kinds, `ws_test`, `basetargets.json`, noRoute) · density decision (since p41) · E1: `in/out` shape + all `(ph)` numbers · flames · C2 / C4 defaults flagged (slaughter dark hall) · C3 finding: soup winding renders dark under the game's shadow bias · rotate the Sketchfab token + GitHub deploy key.
