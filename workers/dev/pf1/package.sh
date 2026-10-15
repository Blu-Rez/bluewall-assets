#!/bin/bash
# pf1/package.sh — builds patch_PF1.tar.gz (owned files + patch.diff of main.js; web/app/wall.js left out), photos_PF1.tar.gz, in the kit root.
set -e
K=/home/claude/bot/bluebot_v2; D=/home/claude/dev; S=bluewall/client/src; W=/home/claude/work/pf1; P=$(mktemp -d)
cd $K
mkdir -p $P/$S $P/workers/dev/pf1
cp $S/main.js $S/perf.js $S/perfhud.js $S/pf_probe.js $P/$S/
cp $D/pf1_dev.html $D/pf1_player.html $D/pf1_measure.py $D/pf1_cpuprof.py $D/pf1_bench_check.py $D/pf1_test.sh $P/workers/dev/
for f in aa_compare.py aa_crops.py cap_toggle.py cap_force.py door_count.py make_report.py mem_list.py mskip_diag.py mskip_toggle.py mskip_watch.py package.sh page.py progs.py table.py unit.mjs; do cp $D/pf1/$f $P/workers/dev/pf1/; done
{ git diff HEAD -- $S/main.js $S/perf.js $S/perfhud.js; git diff --no-index -- /dev/null $S/pf_probe.js || true; } > $P/patch.diff
cat > $P/APPLY.md <<'EOT'
# APPLY — patch_PF1.tar.gz (for the mother)
Base: kit `kit` branch (HEAD 24f78c7 at the time). Extract at the repo root: `bluewall/client/src/{main.js,perf.js,perfhud.js,pf_probe.js}`, `workers/dev/pf1_*`, `workers/dev/pf1/*`, `patch.diff` (main.js / perf.js / perfhud.js / new pf_probe.js, `patch -p1 < patch.diff`).
main.js is the only shared file: 18 lines marked `// PF1:` (listed in report_PF1.md section 6). `web/app/wall.js` is NOT in the patch: rebuild with `client/build.sh`.
Wire the owner button in ui.js (not touched): `BW_bench.run().then(...)`; `BW_bench.busy`.
Check: `bash dev/pf1_test.sh` -> PF1 OK; `bash dev/gate_w.sh` -> GATE_W: ALL OK (noRoute 614).
Kill switches: `?pfoff=1` (every PF1 behaviour off), `?nomskip=1` (matrix skip), `?aa=0` (MSAA off, for phone A/B only).
EOT
tar czf $K/patch_PF1.tar.gz -C $P .
rm -rf $P
ph=$(mktemp -d); for f in "$@"; do cp "$W/$f" $ph/; done; tar czf $K/photos_PF1.tar.gz -C $ph .; rm -rf $ph
ls -la $K/patch_PF1.tar.gz $K/photos_PF1.tar.gz; tar tzf $K/patch_PF1.tar.gz | head -50
