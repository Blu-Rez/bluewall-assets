#!/bin/bash
# rp1c3_test.sh — RP1C_R3 (hero mode, round 3b + round 4 A1): the whole thing in one go.  Prints "RP1C_R3 OK" or the failures.   usage:  bash dev/rp1c3_test.sh [page]
#   default (~1 min, no browser):  1 static  2 node
#     1. every owned file parses; no Persian text / no «bot» word in the hero UI strings; no secret-looking string; main.js has <= 12 RP1C lines; nothing added to dev/gate*.sh;
#        only the allowed files differ from git HEAD (the kit); cull.js untouched (the mxThaw line stays); no allocation in the per-frame functions (cull.tick, doors.tick, rp_goup.tick, rp_marker.tick)
#     2. node: marker above every character (rp1c2_marker.mjs), ramps / go-up / water-rule maths (rp1c3_node.mjs), face rule, 2-bone leg solve, town cell split, governor
#   with «page» (~10 min, software GL, ONE browser page, nothing else running): 3 rp1c3_page.py (programs, 10 ramps up + down with the real camera, go-up markers, jump table, collision 0/0/0, doors, water)
#     and the F9 warm-up numbers (rp1c_f9_test.py).  The shader-program count of the go-up markers and of the marker is asserted inside rp1c3_page.py (+0 programs).
R=/home/claude/bot/bluebot_v2; W=$R/bluewall; A=$W/web/assets/rpg; C=$W/client/src; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
FILES="rpg.js rpg_diet.js rpg_foot.js cull.js doors.js ramps.js rp_grid.js rp_marker.js rp_goup.js"
for f in $FILES; do [ -f $A/$f ] || continue; node --input-type=module --check < $A/$f 2>/tmp/rp1c3_syn.log && ok "$f parses" || { bad "$f does not parse"; head -3 /tmp/rp1c3_syn.log; }; done
for f in main.js water_life.js world.js; do node --input-type=module --check < $C/$f 2>/tmp/rp1c3_syn.log && ok "client/src/$f parses" || { bad "client/src/$f does not parse"; head -3 /tmp/rp1c3_syn.log; }; done
python3 - <<'PY' && ok "no Persian text in the hero's code (icons only)" || bad "Persian text in the hero's code (icons only)"
import re, sys, os
A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/'; bad = []
for f in 'rpg.js rpg_diet.js rpg_foot.js cull.js doors.js ramps.js rp_grid.js rp_marker.js rp_goup.js'.split():
    if not os.path.exists(A + f): continue
    for i, l in enumerate(open(A + f, encoding='utf-8'), 1):
        if re.search('[؀-ۿ]', l.split('//')[0]): bad.append((f, i, l.strip()[:80]))
print(bad[:5]); sys.exit(1 if bad else 0)
PY
FS=""; for f in $FILES; do [ -f $A/$f ] && FS="$FS $A/$f"; done
if grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $FS | grep -v "^\S*:[0-9]*:\s*//" | grep -q .; then bad "the word «bot» in a game string"; grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $FS | grep -v "^\S*:[0-9]*:\s*//" | head -3; else ok "no «bot» / «ربات» in the hero's strings"; fi
if grep -rnE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $FS $C/main.js $C/water_life.js $C/world.js | grep -q .; then bad "a secret-looking string"; else ok "no secret-looking string"; fi
N=$(grep -c "// RP1C" $C/main.js); [ "$N" -le 12 ] && ok "main.js: $N RP1C lines (<= 12)" || bad "main.js has $N RP1C lines (> 12)"
if grep -il "rp1c" /home/claude/dev/gate*.sh 2>/dev/null | grep -q .; then bad "RP1C was added to a dev/gate*.sh"; else ok "nothing added to dev/gate*.sh"; fi
D=$( cd $R && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -v "^bluewall/web/app/" | sort -u )
BADF=$(echo "$D" | grep -vE "^bluewall/(web/assets/rpg/(rpg|rpg_diet|rpg_foot|cull|doors|ramps|rp_grid|rp_marker|rp_goup)\.js|client/src/(main|water_life|world)\.js)$" | grep .)
[ -z "$BADF" ] && ok "only the allowed files differ from the kit: $(echo $D | sed 's#bluewall/##g' | tr '\n' ' ')" || bad "files outside the allowed set differ from the kit: $BADF"
( cd $R && git diff --quiet HEAD -- bluewall/web/assets/rpg/cull.js ) && grep -q "mxThaw" $A/cull.js && ok "cull.js untouched (the mxThaw line stays)" || bad "cull.js changed or its mxThaw line is gone"
python3 - <<'PY' && ok "no allocation in the per-frame functions (cull.tick, doors.tick, rp_goup.tick, rp_marker.tick)" || bad "an allocation inside a per-frame function"
import re, sys
A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/'; bad = []
for f in ('cull.js', 'doors.js', 'rp_goup.js', 'rp_marker.js'):
    s = open(A + f, encoding='utf-8').read()
    m = re.search(r'\n  function tick\(.*?\n  \}\n', s, re.S)
    if not m: bad.append((f, 'tick not found')); continue
    for mm in re.finditer(r'\bnew [A-Z]\w*|\.clone\(|\.map\(|\.filter\(|\.slice\(|\[\.\.\.|=> *\{|Object\.(keys|entries)', m.group(0)): bad.append((f, mm.group(0)))
print(bad[:6]); sys.exit(1 if bad else 0)
PY
cd $W/client
node /home/claude/dev/rp1c2_marker.mjs > /tmp/rp1c3_marker.out 2>&1; grep -q "MARKER OK" /tmp/rp1c3_marker.out && ok "marker above every character + its light: MARKER OK" || { bad "marker test"; grep FAIL /tmp/rp1c3_marker.out | head -5; }
node /home/claude/dev/rp1c3_node.mjs > /tmp/rp1c3_node.out 2>&1; grep -q "NODE OK" /tmp/rp1c3_node.out && ok "ramp / go-up / water-rule maths: NODE OK" || { bad "node test"; grep FAIL /tmp/rp1c3_node.out | head -5; }
node /home/claude/dev/rp1c2_face.mjs > /tmp/rp1c3_face.out 2>&1; grep -q "FACE_NODE OK" /tmp/rp1c3_face.out && ok "face rule sweep: FACE_NODE OK" || { bad "face rule sweep"; tail -3 /tmp/rp1c3_face.out; }
node /home/claude/dev/rp1c2_foot.mjs > /tmp/rp1c3_foot.out 2>&1; grep -q "FOOT OK" /tmp/rp1c3_foot.out && ok "2-bone leg solve: FOOT OK" || { bad "leg solve test"; grep FAIL /tmp/rp1c3_foot.out | head -3; }
node /home/claude/dev/rp1c2_cull.mjs > /tmp/rp1c3_cull.out 2>&1; grep -q "CULL OK" /tmp/rp1c3_cull.out && ok "town cell split: CULL OK" || { bad "cell split test"; grep FAIL /tmp/rp1c3_cull.out | head -3; }
( NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/rp1c2_gov.js --bundle --platform=node --format=cjs --outfile=/tmp/rp1c3_gov.cjs --log-level=error && node /tmp/rp1c3_gov.cjs > /tmp/rp1c3_gov.out 2>&1 ); grep -q "GOV2 OK" /tmp/rp1c3_gov.out && ok "governor on a fake clock: GOV2 OK" || { bad "governor test"; grep FAIL /tmp/rp1c3_gov.out | head -3; }
if [ "$1" = page ]; then
  python3 /home/claude/dev/rp1c3_page.py > /tmp/rp1c3_page_run.out 2>&1; tail -3 /tmp/rp1c3_page_run.out | cut -c1-300; grep -q "^PAGE OK" /tmp/rp1c3_page_run.out && ok "browser battery: PAGE OK ($(grep -c '^ok ' /tmp/rp1c3_page_run.out) checks)" || { bad "browser battery"; grep '^FAIL' /tmp/rp1c3_page_run.out | head -5; }
  python3 /home/claude/dev/rp1c_f9_test.py both low > /tmp/rp1c3_f9.out 2>&1; tail -4 /tmp/rp1c3_f9.out | cut -c1-300
fi
[ $FAIL = 0 ] && echo "RP1C_R3 OK" || echo "RP1C_R3 FAILED"
exit $FAIL
