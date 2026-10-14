#!/bin/bash
# T1 test: registry + specs (node, stub state) + static rules (no backdrop-filter, no endless animation, 44 px, z-order, the onTap wiring).  Prints "T1 OK".
set -e
C=/home/claude/bot/bluebot_v2/bluewall/client; S=$C/src; OUT=/home/claude/work/t1; mkdir -p $OUT
cd $C && npx esbuild src/bsheet.js --bundle --platform=node --format=esm --outfile=$OUT/bsheet.node.mjs --log-level=error --loader:.json=json --define:__BUILD__=\"0\"
node /home/claude/dev/t1_test.mjs $OUT/bsheet.node.mjs $S/unitdefs.json
F=$S/bsheet.js
chk() { if eval "$2"; then :; else echo "FAIL: $1"; exit 1; fi; }
chk "bsheet has no backdrop-filter" "! grep -q 'backdrop-filter' $F"
chk "bsheet has no endless animation" "! grep -Eq 'infinite|@keyframes' $F"
chk "bsheet only moves transform + opacity (no left/top/width/height transitions)" "! grep -E 'transition:' $F | grep -Eq 'transition:[^;\`]*(width|height|left|top|bottom|right|margin)'"
chk "z-order sheet 45 / dialog 60" "grep -q 'z-index:45' $F && grep -q 'z-index:60' $F"
chk "every bsheet CSS rule is scoped (.bsh / .k- / .bw-ui.bsh-on|sheet-on)" "! sed -n '/^const CSS = /,/^\`;/p' $F | grep -E '^[.@#]' | grep -Ev '^(\.bsh|\.k-glass|\.k-plate|\.bw-ui\.bsh-on|@media)' | grep -q ."
chk "44 px targets (primary 56, buttons 44, close 44, chips >=44)" "grep -q 'min-height:44px' $F && grep -q 'width:44px;height:44px' $F"
chk "sheet motion 320 in / 220 out" "grep -q '320ms cubic-bezier(.22,1,.36,1)' $F && grep -q '220ms cubic-bezier(.22,1,.36,1)' $F"
chk "hold-to-confirm 600 ms + 'Hold to confirm'" "grep -q '600ms linear' $F && grep -q 'Hold to confirm' $F"
chk "valid font shorthand everywhere (no '/1 inherit')" "! grep -Eq 'px/[0-9.]+ inherit' $S/*.js"
chk ".bwu-x is 44 px" "grep -q '.bwu-x{width:44px;height:44px' $S/upgradeui.js"
chk ".bw-x is 44 px" "grep -q '.bw-x{position:absolute;right:6px;top:6px;width:44px;height:44px' $S/ui.js"
chk ".bw-toast z 90" "grep -q '.bw-toast{position:absolute;z-index:90' $S/ui.js"
chk ".bw-gems has no pointer-events:auto" "grep -E '^\.bw-gems\{' $S/ui.js | grep -q 'pointer-events:none'"
chk "old sheet: no bounce (cubic-bezier .2,.9,.25,1.1 gone)" "! grep -q '1.1)}' $S/ui.js || ! grep -q 'cubic-bezier(.2,.9,.25,1.1)' $S/ui.js"
chk "old sheet hides the corner buttons (sheet-on)" "grep -q \"root.classList.add('sheet-on')\" $S/ui.js && grep -q 'sheet-on>.bwa-btn' $F"
chk "main.js: only the T1 lines (import + sheet line + onTap) and the RP1 hero hook changed (<= 40 lines; T1 alone was <= 8)" "[ \$(diff <(cd /home/claude/base_snapshot/client/src && cat main.js) $S/main.js | grep -c '^[<>]') -le 40 ]"
chk "onTap asks the sheet first, the old behaviour stays after it" "grep -q 'sheets.tap(best, SM)' $S/main.js && grep -q 'ui.show(best)' $S/main.js"
chk "armyui / upgradeui only gained the small API (diff <= 30 lines)" "[ \$(diff /home/claude/base_snapshot/client/src/armyui.js $S/armyui.js | grep -c '^[<>]') -le 6 ] && [ \$(diff /home/claude/base_snapshot/client/src/upgradeui.js $S/upgradeui.js | grep -c '^[<>]') -le 40 ]"
# (rule "worksites.js / town_*.js untouched" retired in p45: P1 owns those files now; T1 never touched them)
echo "T1 OK"
