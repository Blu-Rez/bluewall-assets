#!/bin/bash
# pf4_test.sh — PF4.  Prints "PF4 OK" or the failures.  Not part of dev/gate*.sh; run by hand: bash dev/pf4_test.sh  (~6 min, software GL for part 3)
#   1. static: the client builds; marked `// PF4` lines per file stay few; the changed files are the ones PF4 may touch (against /home/claude/base_snapshot); no secret-looking string
#   2. pf4/unit_cap.mjs (node): the adaptive frame cap (perf.js createCap) climbs back for phones whose JS time is 12-14 ms; the hero governor does not step down on a clean 30 fps cap
#   3. pf4/page_check.py (browser rig): the REAL governor + REACH.capMs; the owner's bench still posts < 3400 bytes and carries cp / dt / wf
R=/home/claude/bot/bluebot_v2/bluewall; D=/home/claude/dev; B=/home/claude/base_snapshot; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash $D/rb.sh >/tmp/pf4_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
for spec in "client/src/main.js 3" "client/src/perf.js 3" "web/assets/rpg/rpg_diet.js 3" "client/src/pf_probe.js 12"; do set -- $spec; N=$(grep -c "PF4" $R/$1); [ "$N" -le "$2" ] 2>/dev/null && ok "$1 has $N marked PF4 lines (<= $2)" || { [ "$1" = client/src/pf_probe.js ] && [ "$N" -le 12 ] && ok "$1 has $N marked PF4 lines (<= 12, diagnostics only)" || bad "$1 has $N marked PF4 lines (> $2)"; }; done
if [ -d $B ]; then
  CH=$(diff -rq $B $R 2>/dev/null | grep -v "node_modules\|/dist\|web/app\|__pycache__" | sed -E "s/^Files .*bluewall\/([^ ]+) and .*/\1/; s/^Only in .*: //" | sort | tr "\n" " ")
  echo "NOTE files in client/ that differ from base_snapshot: $CH"
fi
if grep -nE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $R/client/src/perf.js $R/client/src/pf_probe.js $R/client/src/main.js $R/web/assets/rpg/rpg_diet.js $D/pf4/*.py $D/pf4/*.mjs $D/pf4/*.js $D/pf4/*.sh >/dev/null 2>&1; then bad "a secret-looking string in my files"; else ok "no secret-looking string in my files"; fi
# --- 2. node unit
mkdir -p $D/pf4/b && cd $R/client && npx esbuild src/perf.js --bundle --format=esm --log-level=error --outfile=$D/pf4/b/perf_new.mjs && git -C /home/claude/bluewall-assets show HEAD:bluewall/client/src/perf.js > /tmp/perf_old_src.js && cp /tmp/perf_old_src.js src/__perf_old_tmp.js && npx esbuild src/__perf_old_tmp.js --bundle --format=esm --log-level=error --outfile=$D/pf4/b/perf_old.mjs; rm -f src/__perf_old_tmp.js
npx esbuild ../web/assets/rpg/rpg_diet.js --bundle --format=esm --log-level=error --outfile=$D/pf4/b/diet.mjs
node $D/pf4/unit_cap.mjs > /tmp/pf4_unit.out 2>&1; tail -1 /tmp/pf4_unit.out | grep -q "PF4 UNIT OK" && ok "unit_cap.mjs" || { bad "unit_cap.mjs"; grep FAIL /tmp/pf4_unit.out | head -5; }
# --- 3. browser rig
bash $D/pf2_rig_build.sh after >/tmp/pf4_rig.log 2>&1 || bad "rig page build"
python3 $D/pf4/page_check.py > /tmp/pf4_page.out 2>&1; tail -1 /tmp/pf4_page.out | grep -q "PF4 PAGE OK" && ok "page_check.py" || { bad "page_check.py"; grep -E "FAIL|Error|Traceback" /tmp/pf4_page.out | head -6; }
[ $FAIL = 0 ] && echo "PF4 OK" || echo "PF4 FAIL"; exit $FAIL
