#!/bin/bash
# cl1_test.sh — CL1 (ROUND6): «everything passes through her» + «extras in front of the doors».   usage:  bash dev/cl1_test.sh [page]
#   default (seconds, no browser): rp_grid.js / rp_clear.js / rpg.js parse; the CL1 markers are there; rp_clear.js touches only `minor` meshes (no building shell path in it)
#   with «page» (~8 min, software GL, ONE browser page, nothing else running): python3 dev/cl1_page.py  (instance layer, door keep-clear, lanes, walk-into every prop type, before -> after)
#   The RP1C collide test (bash dev/rp1c_collide_test.sh) stays the regression for «inside / stuck / pass-through = 0 / 0 / 0» (its inside-test reads both layers since CL1).
A=/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
for f in rp_grid.js rp_clear.js rpg.js; do node --input-type=module --check < $A/$f 2>/tmp/cl1_syn.log && ok "$f parses" || { bad "$f does not parse"; head -3 /tmp/cl1_syn.log; }; done
grep -q "CL1" $A/rp_grid.js && grep -q "CL1" $A/rpg.js && ok "CL1 markers in the shared files" || bad "CL1 markers missing"
grep -q "__rpNoClear" $A/rpg.js && ok "dev switch window.__rpNoClear (before / after measurement) is there" || bad "dev switch missing"
grep -v '^ *//' $A/rp_clear.js | grep -qE "tr2>|castle|homes-tr2|civic-tr2" && bad "rp_clear.js names a building shell path" || ok "rp_clear.js names no building shell path (only /minor/ decor meshes)"
grep -q "/minor/" $A/rp_clear.js && ok "rp_clear.js works on the worksites' decor (minor) meshes only" || bad "rp_clear.js is not limited to minor meshes"
if [ "$1" = "page" ]; then python3 /home/claude/dev/cl1_page.py 2>&1 | cut -c1-300; [ ${PIPESTATUS[0]} = 0 ] && ok "cl1_page.py" || bad "cl1_page.py"; fi
[ $FAIL = 0 ] && echo "CL1 OK" || echo "CL1 FAILED"; exit $FAIL
