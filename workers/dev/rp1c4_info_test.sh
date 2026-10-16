#!/bin/bash
# rp1c4_info_test.sh — RP1C_R4: the hero «i» page.  Prints "RP1C_R4_INFO OK" or the failures.   usage: bash dev/rp1c4_info_test.sh [page]
#   default (seconds, no browser): files parse; the word «ربات» / «bot» is nowhere in the table or the code strings; only allowed files differ from the kit; rpg.js lines are marked; node: table + kit reader (rp1c4_info_node.mjs)
#   with «page» (~2 min after the 90 s boot, software GL): rp1c4_info_page.js in the persistent browser (rp1c2_drv.py, TAG r4t): 6 «i» buttons (44 px hit area), open -> text -> close by X / edge / Esc / back / Telegram back, pick intact, hero start, HUD «i», pause + give back, no console error
R=/home/claude/bot/bluebot_v2; W=$R/bluewall; A=$W/web/assets/rpg; D=/home/claude/dev; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
for f in hero_info.js rpg.js; do node --input-type=module --check < $A/$f 2>/tmp/rp1c4_syn.log && ok "$f parses" || { bad "$f does not parse"; head -3 /tmp/rp1c4_syn.log; }; done
N=$(grep -c "RP1C-R4" $A/rpg.js); [ "$N" -ge 5 ] && [ "$N" -le 16 ] && ok "rpg.js: $N lines marked RP1C-R4" || bad "rpg.js has $N RP1C-R4 lines (expected 5..16)"
grep -nE "'[^']*(ربات|\bbot\b)[^']*'" $A/rpg.js $A/hero_info.js | grep -vE "^\S+:[0-9]+:\s*//" | grep -q . && bad "the word bot / ربات in a string" || ok "no bot / ربات word in the strings"
D2=$( cd $R && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -v "^bluewall/web/app/" | sort -u )
BADF=$(echo "$D2" | grep -vE "^bluewall/web/assets/rpg/(rpg|hero_info|ramps|doors|rp_[a-z]+|cull|rpg_[a-z]+)\.js$|^bluewall/client/src/(main|water_life|world)\.js$|^workers/dev/" | grep .)
[ -z "$BADF" ] && ok "only allowed files differ from the kit" || bad "files outside the allowed set differ: $BADF"
node $D/rp1c4_info_node.mjs > /tmp/rp1c4_node.out 2>&1; tail -1 /tmp/rp1c4_node.out | grep -q "INFO_NODE OK" && ok "table + kit reader: INFO_NODE OK" || { bad "node test"; head -8 /tmp/rp1c4_node.out; }
if [ "$1" = page ]; then
  Q="python3 $D/rp1c2_q.py -t r4t"; mkdir -p /home/claude/work/r4t
  if [ ! -f /home/claude/work/r4t/ready ]; then ( cd $D && W=844 H=390 TAG=r4t URL='rp1_dev.html?q=low&w=clear&h=14&wa=0.1' nohup python3 rp1c2_drv.py > /home/claude/work/r4t/drv.log 2>&1 & ); for i in $(seq 1 120); do [ -f /home/claude/work/r4t/ready ] && break; sleep 5; done; fi
  TMO=900 $Q evalf $D/rp1c4_info_page.js > /tmp/rp1c4_page.out 2>&1; tail -1 /tmp/rp1c4_page.out | cut -c1-400
  grep -q '"ok": true' /tmp/rp1c4_page.out && ok "browser: open -> text -> close (5 ways) -> pick usable -> hero start -> HUD «i» -> pause" || bad "browser battery"
  $Q logs 2>/dev/null | grep -i '"error\|uncaught\|pageerror' | head -3 | grep -q . && bad "console error" || ok "no console error"
fi
[ $FAIL = 0 ] && echo "RP1C_R4_INFO OK" || echo "RP1C_R4_INFO FAILED"; exit $FAIL
