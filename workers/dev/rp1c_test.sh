#!/bin/bash
# rp1c_test.sh — RP1C (hero mode round 3: frame culling + door orbs).  Prints "RP1C OK" or the failures.   Not part of dev/gate*.sh (the brief: nothing added there); run it by hand: bash dev/rp1c_test.sh   (~8-10 min: the real game loads twice in software GL)
#   1. static: the new files parse, no Persian text / no «bot» word in the hero UI strings, no secret, main.js has <= 12 RP1C lines, nothing added to dev/gate*.sh, no allocation in the per-frame functions, crowd.js untouched
#   2. rp1c_page.py (browser): gate-off page fetches 0 things from assets/rpg/ and has no more programs than the base; the owner page: culling A/B (calls and triangles down, picture the same), the door orbs (3 Points, <= 6 calls,
#      gold / green / blue), icon sprites, the door button icon, tap an orb from 13 m -> she walks by herself, sheet opens, interact plays, joystick cancels, exit leaves nothing, a second session leaks nothing, programs +0
R=/home/claude/bot/bluebot_v2/bluewall; A=$R/web/assets/rpg; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash /home/claude/dev/rb.sh >/tmp/rp1c_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
for f in cull.js doors.js rpg.js rpg_diet.js; do node --input-type=module --check < $A/$f 2>/tmp/rp1c_syn.log && ok "$f parses" || { bad "$f does not parse"; head -3 /tmp/rp1c_syn.log; }; done
python3 - <<'PY' && ok "no Persian text in the hero UI (icons only): cull.js, doors.js" || bad "Persian text in cull.js / doors.js (icons only)"
import re, sys
bad = []
for f in ('cull.js', 'doors.js'):
    for i, l in enumerate(open('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/' + f, encoding='utf-8'), 1):
        code = l.split('//')[0]
        if re.search('[؀-ۿ]', code): bad.append((f, i, l.strip()[:80]))
print(bad[:5]); sys.exit(1 if bad else 0)
PY
if grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $A/cull.js $A/doors.js | grep -v "^\S*:[0-9]*:\s*//" | grep -q .; then bad "the word «bot» in a hero string"; else ok "no «bot» word in hero strings (cull.js, doors.js)"; fi
[ "$(cmp -s /home/claude/base_snapshot/client/src/crowd.js $R/client/src/crowd.js && echo same)" = same ] && ok "crowd.js is the base's" || bad "crowd.js differs from the base"
if grep -rnE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $A/cull.js $A/doors.js $A/rpg.js $A/rpg_diet.js $R/client/src/bsheet.js /home/claude/dev/rp1c_test.sh /home/claude/dev/rp1c_page.py /home/claude/dev/rp1c_page.js 2>/dev/null | grep -q .; then bad "a secret-looking string"; else ok "no secret in the new files"; fi
N=$(grep -c "// RP1C:" $R/client/src/main.js); [ "$N" -le 12 ] && ok "main.js: $N RP1C lines (<= 12)" || bad "main.js has $N RP1C lines (> 12)"
if grep -il "rp1c" /home/claude/dev/gate*.sh 2>/dev/null | grep -q .; then bad "RP1C was added to a dev/gate*.sh"; else ok "nothing added to dev/gate*.sh"; fi
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
python3 /home/claude/dev/rp1c_page.py > /tmp/rp1c_page.out 2>&1; PR=$?
cat /tmp/rp1c_page.out | cut -c1-260
[ $PR = 0 ] && ok "browser part ($(grep -c '^ok' /tmp/rp1c_page.out) checks)" || bad "browser part"
[ $FAIL = 0 ] && echo "RP1C OK" || echo "RP1C FAILED"
exit $FAIL
