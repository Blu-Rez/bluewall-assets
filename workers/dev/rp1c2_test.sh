#!/bin/bash
# rp1c2_test.sh — RP1C-R2 (hero mode, round 4: face rule, ground contact, smoothness, governor in the underworld, sheet vs. controls, culling).  Prints "RP1C_R2 OK" or the failures.
#   Not part of dev/gate*.sh (the brief: nothing added there); run it by hand: bash dev/rp1c2_test.sh   (~1 min: no browser — the in-game proofs are rp1c2_page*.js / rp1c2_ground.js / rp1c2_smooth.js, see report_RP1C_R2.md)
#   1. static: every owned file parses; no Persian text / no «bot» word in the hero UI strings; no secret-looking string; main.js has <= 12 RP1C lines; nothing added to dev/gate*.sh; only the allowed files differ from the base
#   2. node: the face rule sweep (rp1c2_face.mjs), the governor on a fake clock incl. the underworld hooks (rp1c2_gov.js), the 2-bone solve (rp1c2_foot.mjs), the town cell split (rp1c2_cull.mjs)
R=/home/claude/bot/bluebot_v2/bluewall; A=$R/web/assets/rpg; MK=$( [ -f $R/web/assets/rpg/rp_marker.js ] && echo rp_marker.js );   # (rp_marker.js ships with RP1C_R3: absent here = skipped)
 B=/home/claude/base_8256556/bluewall; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash /home/claude/dev/rb.sh >/tmp/rp1c2_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
for f in rpg.js rpg_diet.js rpg_foot.js cull.js doors.js $MK; do node --input-type=module --check < $A/$f 2>/tmp/rp1c2_syn.log && ok "$f parses" || { bad "$f does not parse"; head -3 /tmp/rp1c2_syn.log; }; done
node --input-type=module --check < $R/client/src/reach.js 2>/tmp/rp1c2_syn.log && ok "reach.js parses" || bad "reach.js does not parse"
python3 - <<'PY' && ok "no Persian text in the hero UI (icons only): rpg.js rpg_diet.js rpg_foot.js cull.js doors.js" || bad "Persian text in the hero's code (icons only)"
import re, sys
bad = []
for f in ('rpg.js', 'rpg_diet.js', 'rpg_foot.js', 'cull.js', 'doors.js', 'rp_marker.js'):
    import os
    if not os.path.exists('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/' + f): continue
    for i, l in enumerate(open('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/' + f, encoding='utf-8'), 1):
        code = l.split('//')[0]
        if re.search('[؀-ۿ]', code): bad.append((f, i, l.strip()[:80]))
print(bad[:5]); sys.exit(1 if bad else 0)
PY
if grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $A/rpg.js $A/rpg_diet.js $A/rpg_foot.js $A/cull.js $A/doors.js ${MK:+$A/$MK} | grep -v "^\S*:[0-9]*:\s*//" | grep -q .; then bad "the word «bot» in a hero string"; else ok "no «bot» word in a hero string"; fi
if grep -rnE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $A/rpg.js $A/rpg_diet.js $A/rpg_foot.js $A/cull.js $A/doors.js ${MK:+$A/$MK} $R/client/src/reach.js /home/claude/dev/rp1c2_*.js /home/claude/dev/rp1c2_test.sh 2>/dev/null | grep -q .; then bad "a secret-looking string"; else ok "no secret-looking string"; fi
N=$(grep -c "// RP1C:" $R/client/src/main.js); [ "$N" -le 12 ] && ok "main.js: $N RP1C lines (<= 12)" || bad "main.js has $N RP1C lines (> 12)"
if grep -il "rp1c" /home/claude/dev/gate*.sh 2>/dev/null | grep -q .; then bad "RP1C was added to a dev/gate*.sh"; else ok "nothing added to dev/gate*.sh"; fi
# only the allowed files differ from the base (everything else of the kit is the mother's)
D=$(cd $R && diff -rq --exclude=node_modules --exclude=app --exclude='*.bak*' $B/ $R/ 2>/dev/null | grep -v "^Only in" | sed -e "s#^Files $B/##" -e "s# and .*##" | sort)
BADF=$(echo "$D" | grep -vE "^(web/assets/rpg/(rpg|rpg_diet|rpg_foot|cull|doors|rp_marker|ramps)\.js|client/src/(reach|main|castle_tr2|tr2_life)\.js)$" | grep . )
[ -z "$BADF" ] && ok "only allowed files differ from the base: $(echo $D | tr '\n' ' ')" || { bad "files outside the allowed set differ from the base: $BADF"; }
[ "$(cmp -s $B/client/src/crowd.js $R/client/src/crowd.js && echo same)" = same ] && ok "crowd.js is the base's" || bad "crowd.js differs from the base"
# 2 node
node /home/claude/dev/rp1c2_face.mjs > /tmp/rp1c2_face.out 2>&1; grep -q "FACE_NODE OK" /tmp/rp1c2_face.out && ok "face rule sweep: $(grep -c . /tmp/rp1c2_face.out) lines, FACE_NODE OK" || { bad "face rule sweep"; tail -5 /tmp/rp1c2_face.out; }
( cd $R/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/rp1c2_gov.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/rp1c2_gov.cjs --log-level=error && node /home/claude/dev/rp1c2_gov.cjs > /tmp/rp1c2_gov.out 2>&1 ); grep -q "GOV2 OK" /tmp/rp1c2_gov.out && ok "governor on a fake clock (underworld hooks, pixel-ratio rule): GOV2 OK" || { bad "governor test"; grep FAIL /tmp/rp1c2_gov.out | head -5; }
( cd $R/client && node /home/claude/dev/rp1c2_foot.mjs > /tmp/rp1c2_foot.out 2>&1 ); grep -q "FOOT OK" /tmp/rp1c2_foot.out && ok "2-bone leg solve: FOOT OK" || { bad "leg solve test"; grep FAIL /tmp/rp1c2_foot.out | head -5; }
[ -n "$MK" ] && ( cd $R/client && node /home/claude/dev/rp1c2_marker.mjs > /tmp/rp1c2_marker.out 2>&1 ); [ -z "$MK" ] && echo "MARKER OK" > /tmp/rp1c2_marker.out; grep -q "MARKER OK" /tmp/rp1c2_marker.out && ok "marker above every character + its light (RP1C_R3; skipped while rp_marker.js is not in the tree): MARKER OK" || { bad "marker test"; grep FAIL /tmp/rp1c2_marker.out | head -5; }
( cd $R/client && node /home/claude/dev/rp1c2_cull.mjs > /tmp/rp1c2_cull.out 2>&1 ); grep -q "CULL OK" /tmp/rp1c2_cull.out && ok "town cell split: CULL OK" || { bad "cell split test"; grep FAIL /tmp/rp1c2_cull.out | head -5; }
python3 - <<'PY' && ok "no allocation in the per-frame functions (cull.tick, doors.tick)" || bad "an allocation inside a per-frame function"
import re, sys
bad = []
for f, name in (('cull.js', 'tick'), ('doors.js', 'tick')):
    s = open('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/' + f, encoding='utf-8').read()
    m = re.search(r'\n  function ' + name + r'\(.*?\n  \}\n', s, re.S)
    if not m: bad.append((f, 'tick not found')); continue
    for mm in re.finditer(r'\bnew [A-Z]\w*|\.clone\(|\.map\(|\.filter\(|\.slice\(|\[\.\.\.|=> *\{|Object\.(keys|entries)', m.group(0)): bad.append((f, mm.group(0)))
print(bad[:6]); sys.exit(1 if bad else 0)
PY
[ $FAIL = 0 ] && echo "RP1C_R2 OK" || echo "RP1C_R2 FAILED"
exit $FAIL
