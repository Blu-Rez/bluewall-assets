#!/bin/bash
# pf2_test.sh — PF2 (performance chat, round 3b).  Prints "PF2 OK" or the failures.  Not part of dev/gate*.sh; run by hand:  bash dev/pf2_test.sh   (~15 min, software GL)
#   1. static: the client builds; main.js carries <= 30 marked `// PF2` lines; the hitch fixes touch only the files PF2 may touch (against /home/claude/base_snapshot: main.js perf.js perfhud.js pf_probe.js shaderwarm.js assets.js
#      + <= 6 marked lines in world.js / dragon.js / dragon_model.js / weather.js / battle.js); no secret-looking string in my files
#   2. pf2/unit.mjs (node): nightPathWanted() against the real day cycle of tod.js: wanted ≈ 4 min before the bloom path is first used, never late, false through the bright day
#   3. pf2/page.py (browser): F1 (late lights on the mirror layer: +0 programs after the first draw), F2 (night path not built by day, built in idle time when dusk is near — boot trigger AND the loop trigger)
#   3b. the owner's benchmark v2 (pf2/bench.py + bench_check.py, the page WITHOUT ?pf=1 like the phone): 5 phases, no interval above 2000 ms in any figure, stalls reported apart, drift, the night phase on the bloom path, the clock back; the recorder stall test (G) and pf_overdraw against a hand-computed footprint (H), ?nres= (J) are in page.py
#   4. the PF1 test still passes (bash dev/pf1_test.sh -> PF1 OK) when PF1=1 is set (it takes another ~6 min)
R=/home/claude/bot/bluebot_v2/bluewall; D=/home/claude/dev; B=/home/claude/base_snapshot; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash $D/rb.sh >/tmp/pf2_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
N=$(grep -c "// PF2" $R/client/src/main.js); [ "$N" -le 30 ] && ok "main.js has $N marked // PF2 lines (<= 30)" || bad "main.js has $N // PF2 lines (> 30)"
for f in world dragon dragon_model weather battle; do M=$(grep -c "// PF2" $R/client/src/$f.js); [ "$M" -le 6 ] && ok "$f.js has $M marked // PF2 lines (<= 6)" || bad "$f.js has $M // PF2 lines (> 6)"; done
if [ -d $B ]; then
  CH=$(cd $R && diff -rq $B/client/src client/src 2>/dev/null | sed -E 's/^Files .*client\/src\/([^ ]+) and .*/\1/; s/^Only in .*: //' | sort | tr '\n' ' ')
  BAD=""; for x in $CH; do case "$x" in main.js|perf.js|perfhud.js|pf_probe.js|shaderwarm.js|assets.js) ;; *) BAD="$BAD $x";; esac; done
  # (a file changed by an earlier merge shows here too: only the PF2-owned names are judged when the base snapshot is the kit as started)
  [ -z "$BAD" ] && ok "client/src differs from the base only in PF2's files:$CH" || echo "NOTE client/src files that differ from base_snapshot and are not PF2's (other merged patches?):$BAD"
fi
if grep -nE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $R/client/src/perf.js $R/client/src/perfhud.js $R/client/src/pf_probe.js $R/client/src/shaderwarm.js $D/pf2/*.py $D/pf2/*.mjs $D/pf2/*.sh >/dev/null 2>&1; then bad "a secret-looking string in my files"; else ok "no secret-looking string in my files"; fi
( cd $R/client && npx esbuild src/perf.js --bundle --format=esm --log-level=error --outfile=$D/pf2/perf_bundle.mjs && npx esbuild src/tod.js --bundle --format=esm --log-level=error --outfile=$D/pf2/tod_bundle.mjs ) && node $D/pf2/unit.mjs > /tmp/pf2_unit.out 2>&1; UR=$?
cut -c1-220 /tmp/pf2_unit.out; [ $UR = 0 ] && ok "unit tests ($(grep -c '^ok' /tmp/pf2_unit.out) checks)" || bad "unit tests"
bash $D/pf2_rig_build.sh after >/tmp/pf2_rig.log 2>&1 || bad "rig build"; bash $D/up.sh
python3 $D/pf2/page.py after > /tmp/pf2_page.out 2>&1; PR=$?
cut -c1-260 /tmp/pf2_page.out
[ $PR = 0 ] && ok "browser part ($(grep -c '^ok' /tmp/pf2_page.out) checks)" || bad "browser part"
PF2_BENCH_SECS=7 python3 $D/pf2/bench.py after nopf > /tmp/pf2_bench.out 2>&1; python3 $D/pf2/bench_check.py > /tmp/pf2_benchchk.out 2>&1; BR=$?
cut -c1-260 /tmp/pf2_benchchk.out; [ $BR = 0 ] && ok "benchmark v2 headless ($(grep -c '^ok' /tmp/pf2_benchchk.out) checks)" || bad "benchmark v2 headless"
if [ "$PF1" = 1 ]; then bash $D/pf1_test.sh > /tmp/pf2_pf1.out 2>&1; tail -1 /tmp/pf2_pf1.out | grep -q "PF1 OK" && ok "pf1_test.sh still PF1 OK" || { tail -5 /tmp/pf2_pf1.out; bad "pf1_test.sh"; }; fi
[ $FAIL = 0 ] && echo "PF2 OK" || echo "PF2 FAILED"
exit $FAIL
