#!/bin/bash
# ui2_test.sh — UI2 (hero mode: the head marker + the distance chip + the go-up icon in ONE blue / silver language).  Prints "UI2 OK" or the failures.   usage:  bash dev/ui2_test.sh [page]
#   default (~20 s, no browser):  1 files parse   2 shared lines (<= 4 per file, marked // UI2:)   3 only the allowed files differ from the kit   4 node: dev/ui2_node.mjs (looks, gap, colours, markup) + dev/rp1c2_marker.mjs
#   with «page» (~5 min, ONE browser page, software GL, nothing else running): dev/ui2_page.py  -> +0 shader programs when the looks change, the chip never overlaps her marker, all three chip looks fit the top row
R=/home/claude/bot/bluebot_v2; W=$R/bluewall; A=$W/web/assets/rpg; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
for f in rpg.js rp_goup.js rp_marker.js rp_ui2.js; do node --input-type=module --check < $A/$f 2>/tmp/ui2_syn.log && ok "$f parses" || { bad "$f does not parse"; head -3 /tmp/ui2_syn.log; }; done
N1=$(grep -c "// UI2:" $A/rpg.js); N2=$(grep -c "// UI2:" $A/rp_goup.js)
[ "$N1" -le 4 ] && [ "$N1" -ge 1 ] && ok "rpg.js: $N1 shared lines marked // UI2: (<= 4)" || bad "rpg.js has $N1 // UI2: lines (expected 1..4)"
[ "$N2" -le 4 ] && [ "$N2" -ge 1 ] && ok "rp_goup.js: $N2 shared lines marked // UI2: (<= 4)" || bad "rp_goup.js has $N2 // UI2: lines (expected 1..4)"
D=$( cd $R && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -v "^bluewall/web/app/" | sort -u )
BADF=$(echo "$D" | grep -vE "^bluewall/web/assets/rpg/(rpg|rp_goup|rp_marker|rp_ui2|rp_sisters)\.js$|^workers/dev/|^workers/docs/UI2_|^workers/report_UI2" | grep .)
[ -z "$BADF" ] && ok "only the allowed files differ from the kit: $(echo $D | sed 's#bluewall/web/assets/rpg/##g' | tr '\n' ' ')" || bad "files outside the allowed set differ from the kit: $BADF"
( cd $W/client && node /home/claude/dev/ui2_node.mjs 2>&1 | tail -1 | grep -q "UI2_NODE OK" ) && ok "ui2_node (looks, gap, colours, markup)" || bad "ui2_node"
( cd $W/client && node /home/claude/dev/rp1c2_marker.mjs 2>&1 | tail -1 | grep -q "MARKER OK" ) && ok "rp1c2_marker (3 calls, own colour, ring, first person, enter/exit x5)" || bad "rp1c2_marker"
if [ "$1" = "page" ]; then python3 /home/claude/dev/ui2_page.py 2>&1 | tail -30 | tee /tmp/ui2_page.log; grep -q "PAGE OK" /tmp/ui2_page.log && ok "ui2_page" || bad "ui2_page"; fi
[ $FAIL -eq 0 ] && echo "UI2 OK" || echo "UI2 FAILED"; exit $FAIL
