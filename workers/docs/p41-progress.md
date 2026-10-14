# MERGE-2 report — stage 2 (the town shows B1's plan) → package p41 (7 Oct 2026, merge chat)

**State (7 Oct 2026):** p41 (`bluebot_bluewall_p41.tar.gz`, `PKGCHECK: OK`) is **INSTALLED by the owner** («نصب شد») and **committed** (`mkpkg.sh --commit`: `pkg/deployed.sha256` now 443 entries = the server state after p41). `bluewall_devkit_v4.tar.xz` = clone of code-p38 + overlay of **28 files** (= p41) + the new `deployed.sha256` + the new tests + this report. Nothing was pushed to git (branch `code-p38` is shared; do not delete it).
Install line (done): `cd /root && rm -rf bluebot_bluewall_p41 && tar xzf bluebot_bluewall_p41.tar.gz && bash bluebot_bluewall_p41/install.sh`
**Not delivered at the time of this merge: C1–C4, U1–U5, E1, PERF → nothing from them is in p41.** When they arrive: take each patch through `applypatch.sh`; reject (and explain) anything that touches secrets, `web/app/*`, `pkg/`, `dev/gate*.sh` or server `*.py`.

## What p41 contains (package = 11 files, 1.1 MB)
`town_plan.js` (new) · `town_build.js` (new) · `world.js` · `town.js` · `assets.js` · `solids.js` · `b1_layout.js` · `b1_townplan.js` · `web/assets/credits.json` · `bluewall/BUILD` · rebuilt `web/app/wall.js`. Details of each file: `WIRING_TODO.md` → "Done in p41".
- The town builds **planned homes** (B2 kit, ≤ 40 per `bakePieces` call) and **planned civic lots** (B3 kit, ONE call) at the lots `planTown` chose; generic houses only fill what is left. Planned meshes are staged hidden and swapped in when the last chunk is baked. Chimney smoke and tap boxes are wired; battle targets are registered once at load.
- Plan phase: `startTownPlan()` runs in 12 ms slices with `await tick()` before `buildTown`; the 5 late jobs (create / 3 ticks / drain) build the meshes; `levelHooks` + `anim` rebuild when the castle level changes what stands.
- `civicCap` 15 on the low tier, 30 otherwise. `BUILT_ROLES = {H, C}` — production lots (P) are planned but **not built** yet (they wait for the C1–C4 kinds).

## Verified myself (software GL, q=low unless noted; same cameras before/after)
- `dev/p41_town_test.sh` → `P41 OK` (new, a line in `gate_w.sh`); `b1_town_test` tolerance +6 (real footprints). **`bash dev/gate_w.sh` re-run on the final tree at the devkit-v4 build (7 Oct, 1 m 12 s): every line OK — client builds, no 'bot' word, credits, nomad plan, rules, ring, nav_solids, river, cam, ws, wsroute, def, `A1 OK`, `A2 OK`, `B1 OK`, `B2 OK`, `B3 OK`, `P41 OK`, rc_test; battle sim 0 wall crossings, noRoute events 622 (< 700) → `GATE_W: ALL OK`.** (The sim uses the old `basetargets.json`, see below.)
- Density, node replay of `buildTown` + in-game probe (`__bw.world.ctx.town.houses.length`): old town **109 generic houses at every level**; new town at level 30 = **49 planned homes (15 cottage, 4 craftsman, 15 merchant, 15 noble) + 13 civic lots + 30 generic = 79 houses + 13 civic**; at level 1 = **15 planned + 30 generic = 45** (locked lots stay empty grass). 12 000 / 40 000 generic-fill tries give 36 / 47: it is space, not tries. → **owner decision still open** (B1's question: keep / denser).
- Draw calls / tris (`p38_perf.py perf 30`, q=low, before → after, without worksites): top 394 → 394 · ctr 374 → 370 · town 370 → 370 · fields 441 → 440 · lake 170 → 174 calls; tris +6 k … +18 k (top +8 k, ctr +6 k, town +18 k, fields +8 k, lake +14 k) → ±4 calls, ≤ +18 k tris. With worksites (moves with worksite life): top 474 → 475, fields 484 → 516, lake 291 → 271.
- Nav: `townSolids(30)` added to `staticSolids()`; `nav_solids_test` OK; battle sim (`bsw.sh`, in the gate) 0 wall crossings and noRoute 622 (limit 700), same as p40 — but **`basetargets.json` was NOT regenerated**, so the sim does not yet see the planned homes as targets (`python3 dev/gen_targets.py` needs the browser) → do it with the next town change, then re-check `noRoute < 700`.
- Shader programs, Q=high, lv 30 (`p39_progs.py 30`): p40 base 206 ×3 → p41 222, 222, 233, 233. Not a new shader type — existing programs with `numPointLights` 5 instead of 6. Bisect and the unverified `reflect.js tagLights()` lead: `WIRING_TODO.md`. **Caveat:** the p40 report saw the *base* flicker 206 ↔ 222 once; 233/234 is above anything seen on the base. Load-time compile cost only.
- Screenshots (evidence, in the Project / chat): `p41_before_after_home`, `p41_roles`, `p41_closeups`, plus `a1_before1_*` vs `a1_p41i_*` (levels 1/15/30, both booted at level 1).

## Not verifiable here (needs the bot's private code or a phone)
Full `dev/gate.sh`, the server tests, the installer sandbox (`instest`), real-phone frame time. `PKGCHECK: OK` was run on the package.

## Pitfalls hit in this chat (save yourself the time)
1. **Before/after screenshots must boot both builds at the same level** (`LV0=1 python3 dev/a1_shot.py …`). Booting at level 30 and then `setLevel(1)` keeps the high-level build and understates the town (I redid `before1` / `p41i` for that reason).
2. `ctx.houses` is the **kit-village** pieces (11), not the town. Generic houses = `__bw.world.ctx.town.houses.length`.
3. `p38_perf.py` waits up to 900 s for the camera intro: run it with `SKIPINTRO=1`.
4. Never `pgrep -f <script>` / `pkill -f <script>` inside a job-chain script: the pattern matches the launching shell's own command line (the chain hung ~15 min; `pkill -f` killed my own shell, exit 144). Use `ps | awk` + `kill`.
5. One browser job at a time (software GL).
6. Before/after of the baseline: `bash dev/mkbase.sh` builds the BEFORE bundle from `/home/claude/base_snapshot` (= the clone right after overlay, i.e. **p41**, not p38 — to compare against an older state, make a snapshot before you change anything). `p38_perf_base.py` / `p39_progs_base.py` run the same measures on that bundle.
7. Node replay of `buildTown` needs a throwaway debug module in `src/`; delete it before `mkpkg` (a stray `town_dbgtmp.js` would otherwise ship).

## Open (owner / next merge)
- Density decision (above). E1 placeholders: all `(ph)` numbers in `b1_townplan.js KINDS`; **no market at castle levels 1–2** until E1 moves the unlock.
- Production lots: one more `bakePieces` call in `town_build.js`, `P` in `BUILT_ROLES`, their targets (`townTargetSpecs`), once C1–C4 exist. `levelOf('keep')` is the stretched 1..20 scale; B2/B3 go through `castleLevel()` (1..30).
- Targets registered once at load (a house that unlocks later in the same session has target id 0 until the next load). Reflections (`tagReflected`) not applied to the new meshes. Shader +16…+29 lead.
- A1/A2 follow-ups: see the end of `WIRING_TODO.md`.
