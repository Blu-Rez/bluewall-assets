#!/bin/bash
# pf2/package.sh <photo files in /home/claude/work/pf2/out>... — builds patch_PF2.tar.gz (owned files + patch.diff; web/app/wall.js left out) and photos_PF2.tar.gz in /home/claude/work/pf2/out
set -e
K=/home/claude/bot/bluebot_v2; D=/home/claude/dev; S=bluewall/client/src; O=/home/claude/work/pf2/out; P=$(mktemp -d)
cd $K
mkdir -p $P/$S $P/workers/dev/pf2 $P/workers/dev/pf1
cp $S/main.js $S/perf.js $S/pf_probe.js $P/$S/
cp $D/pf2_test.sh $D/pf2_rig_build.sh $D/pf1_dev.html $D/pf1_player.html $P/workers/dev/ 2>/dev/null || true
cp $D/pf1/page.py $P/workers/dev/pf1/page.py        # (the PF1 browser test: its benchmark checks now read the v2 result)
for f in progs.py boot_diff.py who.py idle.py idle_all.sh inst_census.py inst_who.py table.py measure_after.sh unit.mjs page.py bench.py bench_check.py od_try.py gh_try.py package.sh; do cp $D/pf2/$f $P/workers/dev/pf2/; done
{ git diff HEAD -- $S/main.js $S/perf.js $S/pf_probe.js; } > $P/patch.diff
cat > $P/APPLY.md <<'EOT'
# APPLY — patch_PF2.tar.gz (for the mother)
Base: branch `kit` (the commit named in the last line of workers/KIT_VERSION when PF2 started; PF1 merged). Extract at the repo root: `bluewall/client/src/{main.js,perf.js,pf_probe.js}`, `workers/dev/pf2_*`, `workers/dev/pf2/*`, `workers/dev/pf1/page.py` (updated: its bench checks read the v2 result), `patch.diff` (the same change as a diff).
main.js is the only shared file: 13 lines marked `// PF2` (listed in report_PF2.md §7; limit 30). `web/app/wall.js` is NOT in the patch: rebuild with `client/build.sh`.
Nothing else outside perf.js / pf_probe.js changed (no world.js / dragon*.js / weather.js / battle.js / assets.js / shaderwarm.js / perfhud.js line).
Check: `bash dev/pf2_test.sh` -> PF2 OK (PF1=1 also runs pf1_test.sh -> PF1 OK); `bash dev/gate_w.sh` -> GATE_W: ALL OK.
Switches: `?nres=0.7` (night path at 0.7 x resolution, A/B for BW_bench on a phone; default 1 = unchanged). `window.pf_overdraw(view)` (owner / ?pf=1 pages): pixels x blended layers.
EOT
tar czf $O/patch_PF2.tar.gz -C $P .
rm -rf $P
ph=$(mktemp -d); for f in "$@"; do cp "$O/$f" $ph/; done; tar czf $O/photos_PF2.tar.gz -C $ph .; rm -rf $ph
ls -la $O/patch_PF2.tar.gz $O/photos_PF2.tar.gz; tar tzf $O/patch_PF2.tar.gz | head -40
