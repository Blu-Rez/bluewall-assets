#!/bin/bash
# rp1b_test.sh — RP1B (the owner's hero mode, round 2).  Prints "RP1B OK" or the failures.   Not part of dev/gate*.sh (the brief: nothing added there); run it by hand: bash dev/rp1b_test.sh   (~8-12 min: the real game loads twice in software GL)
#   1. static: no Persian text / no «bot» word in the hero's own UI strings; crowd.js is the base's; no secret-looking string
#   2. rp1b_gov.js (node, fake clock): governor steps down / up / hysteresis / relock / stall; the diet's enter / apply / exit leave REACH, the shadow box and every hidden mesh as they were
#   3. rp1b_page.py (browser): gate-off page fetches nothing of the hero; the owner's page: reach % above the old value and above 97 %, farthest mill / gem mine / hamlet / shore / every bridge / every gate walked
#      with the real physics, walls climbed, water waded and swum, a button id for every building with a sheet, the sheet opens and closes, the diet hides things, everything is back after exit
R=/home/claude/bot/bluebot_v2/bluewall; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash /home/claude/dev/rb.sh >/tmp/rp1b_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
# 1 static
python3 - <<'PY' && ok "no Persian text in the hero UI (icons only)" || bad "Persian text in the hero's code (icons only)"
import re, sys
bad = []
for f in ('rpg.js', 'rpg_diet.js'):
    for i, l in enumerate(open('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/' + f, encoding='utf-8'), 1):
        code = l.split('//')[0]
        if re.search('[\u0600-\u06FF]', code): bad.append((f, i, l.strip()[:80]))
print(bad[:5]); sys.exit(1 if bad else 0)
PY
if grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $R/web/assets/rpg/rpg.js $R/web/assets/rpg/rpg_diet.js | grep -v "^\S*:[0-9]*:\s*//" | grep -q .; then bad "the word «bot» in a hero string"; else ok "no «bot» word in hero strings"; fi
[ "$(cmp -s /home/claude/base_snapshot/client/src/crowd.js $R/client/src/crowd.js && echo same)" = same ] && ok "crowd.js is the base's (D1 needs it untouched)" || bad "crowd.js differs from the base"
if grep -rnE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $R/web/assets/rpg/*.js $R/client/src/reach.js $R/client/src/bsheet.js /home/claude/dev/rp1b_test.sh /home/claude/dev/rp1b_page.js /home/claude/dev/rp1b_page.py /home/claude/dev/rp1b_gov.js 2>/dev/null | grep -q .; then bad "a secret-looking string"; else ok "no secret in the new files"; fi
# 2 logic with a fake clock
( cd $R/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/rp1b_gov.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/rp1b_gov.cjs --log-level=error && node /home/claude/dev/rp1b_gov.cjs > /tmp/rp1b_gov.out 2>&1; tail -1 /tmp/rp1b_gov.out | grep -q "GOV OK" ) && ok "governor + diet logic with a fake clock ($(grep -c '^ok' /tmp/rp1b_gov.out) checks)" || { bad "governor / diet logic"; grep FAIL /tmp/rp1b_gov.out | head -5; }
# 3 the browser part
python3 /home/claude/dev/rp1b_page.py > /tmp/rp1b_page.out 2>&1; PR=$?
cat /tmp/rp1b_page.out | cut -c1-230
[ $PR = 0 ] && ok "browser part ($(grep -c '^ok' /tmp/rp1b_page.out) checks)" || bad "browser part"
[ $FAIL = 0 ] && echo "RP1B OK" || echo "RP1B FAILED"
exit $FAIL
