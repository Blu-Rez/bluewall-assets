#!/bin/bash
# rp1c_r5_test.sh — RP1C_R5: (1) the hero-mode default camera 25 % farther, (2) water exit under the bridge parapets.  Prints "RP1C_R5 OK" or the failures.
#   usage: bash dev/rp1c_r5_test.sh [page]
#   default (seconds, no browser): rpg.js parses; CAM_FAR = 1.25 and look B = 3.4 * CAM_FAR, looks A / C and CAM_MIN / CAM_RISE untouched; the RP1C_R5 lines are few and marked; the face-rule node sweep; only rpg.js (+ dev tests) differ from the kit
#   with «page» (~5 min, software GL, nothing else running): rp1c3_page.py collide water  ->  collision 0 / 0 / 0 / 0 and «water exit» >= 44 of 48 (46 of 48 with R5; the kit had 43).  The 33 face scenarios of rp1c2_page.js (every frame <= 55°) need the persistent browser: see report_RP1C_R5.md.
R=/home/claude/bot/bluebot_v2; A=$R/bluewall/web/assets/rpg; D=/home/claude/dev; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
node --input-type=module --check < $A/rpg.js 2>/tmp/rp1c_r5_syn.log && ok "rpg.js parses" || { bad "rpg.js does not parse"; head -3 /tmp/rp1c_r5_syn.log; }
grep -q "^const CAM_FAR = 1.25;" $A/rpg.js && ok "CAM_FAR = 1.25" || bad "CAM_FAR is not 1.25"
grep -q "{ D: 3.4 \* CAM_FAR, ndc: 0.30, py: 0.95, pit: -1 }" $A/rpg.js && ok "look B (the default) = 3.4 * CAM_FAR (3.4 -> 4.25 before the HC scale)" || bad "look B is not 3.4 * CAM_FAR"
grep -q "{ D: 3.6, sh: 0.55, py: 1.45, pit: 0.2 }" $A/rpg.js && grep -q "{ D: 4.8, ndc: 0.12, py: 1.62, pit: 0.4 }" $A/rpg.js && ok "looks A (3.6) and C (4.8) unchanged" || bad "look A / C changed"
grep -q "^const CAM_MIN = 3.0, CAM_RISE = 3.2;" $A/rpg.js && ok "CAM_MIN = 3.0 and CAM_RISE = 3.2 unchanged" || bad "CAM_MIN / CAM_RISE changed"
N=$(grep -c "RP1C_R5" $A/rpg.js); [ "$N" -ge 5 ] && [ "$N" -le 12 ] && ok "rpg.js: $N lines marked RP1C_R5 (5..12)" || bad "rpg.js has $N RP1C_R5 lines (expected 5..12)"
grep -q "b.y0 !== undefined && S.rIn" $A/rpg.js && grep -q "function inRailStrip" $A/rpg.js && ok "bridge parapets: the swimmer / wader under the deck passes (S.rIn)" || bad "the parapet rule (S.rIn) is missing"
if grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $A/rpg.js | grep -v "^[0-9]*:\s*//" | grep -q .; then bad "the word «bot» in a game string"; else ok "no «bot» word in the game strings"; fi
if grep -nE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $A/rpg.js | grep -q .; then bad "a secret-looking string"; else ok "no secret-looking string"; fi
DF=$( cd $R && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -v "^bluewall/web/app/" | sort -u )
BADF=$(echo "$DF" | grep -vE "^bluewall/web/assets/rpg/rpg\.js$|^workers/dev/" | grep .)
[ -z "$BADF" ] && ok "only rpg.js differs from the kit (web/app/* = the build, not in the patch)" || bad "files outside the allowed set differ: $BADF"
( node $D/rp1c2_face.mjs 2>&1 | tail -1 | grep -q "FACE_NODE OK" ) && ok "face rule node sweep (hard 70° / lean 30°, body <= 55°)" || bad "face rule node sweep"
if [ "$1" = page ]; then
  python3 $D/rp1c3_page.py collide water > /tmp/rp1c_r5_page.out 2>&1
  grep -E "collision \(a\)|water exit|water entry: reaches" /tmp/rp1c_r5_page.out | cut -c1-200
  grep -q "^PAGE OK" /tmp/rp1c_r5_page.out && ok "browser: collision 0/0/0/0 and water exit >= 44 of 48 ($(grep -c '^ok ' /tmp/rp1c_r5_page.out) checks)" || { bad "browser part (see /tmp/rp1c_r5_page.out)"; grep "^FAIL\|^bad\|^NO " /tmp/rp1c_r5_page.out | head -5; }
fi
[ $FAIL = 0 ] && echo "RP1C_R5 OK" || echo "RP1C_R5 FAILED"; exit $FAIL
