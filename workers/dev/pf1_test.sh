#!/bin/bash
# pf1_test.sh — PF1 (performance chat).  Prints "PF1 OK" or the failures.  Not part of dev/gate*.sh; run by hand:  bash dev/pf1_test.sh   (~4-6 min, software GL)
#   1. static: the client builds (release + debug); main.js carries <= 30 marked `// PF1:` lines; pf_probe.js is only imported by main.js; no secret-looking string in my files
#   2. pf1/unit.mjs (node): the adaptive frame cap on synthetic frame sequences (down after 3 s > 20 ms, up only after 10 s of headroom, doubling wait after a flip-back, stalls are not a trend, 60 / 90 Hz);
#      the matrix skip against the original three.js code on a random scene graph with moving / re-parented / added / frozen / pivoted objects: bit-for-bit equal matrices
#   3. pf1/page.py (browser): a player page has no probe / benchmark / hooks; the owner page: matrix-skip invariant on the live scene (map + hero), HUD readout in map and hero mode, BW_bench.run() result + ONE POST < 3.5 KB
R=/home/claude/bot/bluebot_v2/bluewall; D=/home/claude/dev; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash $D/rb.sh >/tmp/pf1_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
N=$(grep -c "// PF1" $R/client/src/main.js); [ "$N" -le 30 ] && ok "main.js has $N marked // PF1 lines (<= 30)" || bad "main.js has $N // PF1 lines (> 30)"
if grep -ln "pf_probe" $R/client/src/*.js | grep -v "main.js\|pf_probe.js" | grep -q .; then bad "pf_probe.js imported outside main.js"; else ok "pf_probe.js is only imported by main.js"; fi
if grep -nE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $R/client/src/pf_probe.js $R/client/src/perf.js $R/client/src/perfhud.js $D/pf1_*.py $D/pf1/*.py $D/pf1/*.mjs >/dev/null 2>&1; then bad "a secret-looking string in my files"; else ok "no secret-looking string in my files"; fi
( cd $R/client && npx esbuild src/perf.js --bundle --format=esm --log-level=error --outfile=$D/pf1/perf_bundle.mjs ) && node $D/pf1/unit.mjs > /tmp/pf1_unit.out 2>&1; UR=$?
cut -c1-200 /tmp/pf1_unit.out; [ $UR = 0 ] && ok "unit tests ($(grep -c '^ok' /tmp/pf1_unit.out) checks)" || bad "unit tests"
python3 $D/pf1/page.py > /tmp/pf1_page.out 2>&1; PR=$?
cut -c1-260 /tmp/pf1_page.out
[ $PR = 0 ] && ok "browser part ($(grep -c '^ok' /tmp/pf1_page.out) checks)" || bad "browser part"
[ $FAIL = 0 ] && echo "PF1 OK" || echo "PF1 FAILED"
exit $FAIL
