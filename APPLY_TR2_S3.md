# APPLY — patch_TR2_S3.tar.gz (for the mother)
Base: kit **p45 + TR2_S2 merged**. Extract at the repo root (`tar xzf patch_TR2_S3.tar.gz` → `bluewall/…`, `workers/dev/…`, `tools/…`, `patch.diff`). Either copy the full files or `cd <kit root> && patch -p1 < patch.diff` (dry-run tested on the S2-merged kit — text files incl. the new `castle_tr2.js`; the GLBs are binary and only in the tarball; if you merged other work on `castle.js` / `world.js` / `a1_rings.js` / `tr2lib.js`, use the diff and read the hunks).

| file | change |
|---|---|
| `bluewall/client/src/castle_tr2.js` | NEW (the castle from Tripo: register / bake / LOD / anchors) |
| `bluewall/client/src/castle.js` | T3 paths in `wallRun`, `tower`, `townGate`, gatehouse, `keep`; all `ctx.tgt` / weapon sites / picks kept |
| `bluewall/client/src/world.js` | import + preload / fallback before `buildCastle`, install + level hook after the ring tracker, throttled `lod(camera)`, `tr2c` exposed |
| `bluewall/client/src/a1_rings.js` | `rescan`, `visible`, `onChange` |
| `bluewall/client/src/tr2lib.js` | `tr2.rec`, `TBatcher` |
| `bluewall/web/assets/tr2/swap.json` | `fl` for castle wall / tower tiers + 28 `_lo` entries |
| `bluewall/web/assets/tr2/castle_*.glb` | 56 files, 5.3 MB (keep 1K, rest 512 px, `_lo` geometry-only) |
| `workers/dev/*` | `tr2_s3_test.sh/.js`, `tr2_s3_frames.py`, `tr2_s3_battle.py`, `tr2_budget.py`, `tr2_build_cap50.mjs`, `dev_s50.html` (dev only) |
| `tools/lod_geo.mjs`, `tools/tr2_retex.mjs` | how the GLBs were made |

Not touched: `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`, army modules. **Rebuild the release bundle** (`client/build.sh`) so `web/app/wall.js` carries the new code.

Check after applying (all on the kit):
1. `bash dev/gate_w.sh` → `GATE_W: ALL OK` (noRoute **667**).  2. `bash dev/tr2_tiers_test.sh` → `TR2 TIERS OK`.  3. `bash dev/tr2_s3_test.sh` → `TR2 S3 OK`.  4. open the game at lv 1 / 11 / 21 / 30: castle from Tripo; at lv 14 / 21 / 28 half / half.
Rollback / fallback: remove the 56 `castle_*.glb` (or set `window.__tr2Off = true` in a dev page) → `ctx.tr2c = null` → the old procedural castle is built, nothing else changes. No server change, no `balance.json` change (cap 30 works as is; cap 50 needs only the server's `max_level`).
