#!/bin/bash
# UI1 test: the new look of the building sheets.  Static rules (no backdrop-filter, no endless animation, only transform/opacity motion, scoped CSS, 44 px, size budget) + every sheet kind in every state
# renders on the real bsheet.js without console errors, with >= 44 px targets, nothing outside the screen (390x844 and 844x390).   Prints "UI1 OK".
set -e
C=/home/claude/bot/bluebot_v2/bluewall/client; S=$C/src; D=/home/claude/dev
F=$S/bsheet.js; T=$S/ui_theme.js
chk() { if eval "$2"; then :; else echo "FAIL: $1"; exit 1; fi; }
chk "ui_theme.js exists" "[ -f $T ]"
chk "no backdrop-filter in the new look" "! grep -q 'backdrop-filter' $F $T"
chk "no endless animation / keyframes in the new look" "! grep -Eq 'infinite|@keyframes' $F $T"
chk "bsheet motion: only transform / opacity / filter / visibility transitions" "! grep -oE 'transition:[^;\`]*' $F $T | grep -Eq '(width|height|left|top|bottom|right|margin|padding|color|background|border|shadow)'"
chk "the shared old-sheet / Kingdom CSS: every rule starts with '.bw-ui '" "! sed -n '/^export const KIT_CSS = /,/^\`;/p' $T | grep -E '^[.@#]' | grep -v '^\.bw-ui ' | grep -q ."
chk "the shared CSS has no transitions / animations" "! sed -n '/^export const KIT_CSS = /,/^\`;/p' $T | grep -Eq 'transition|animation'"
chk "bsheet CSS rules scoped (.bsh / .k- / .bw-ui.bsh-on)" "! sed -n '/^const CSS = /,/^\`;/p' $F | grep -E '^[.@#]' | grep -Ev '^(\.bsh|\.k-glass|\.k-plate|\.bw-ui\.bsh-on|@media)' | grep -q ."
chk "hold-to-confirm 600 ms stays" "grep -q '600ms linear' $F && grep -q 'Hold to confirm' $F"
chk "gold pulse runs ONCE (a single 900 ms Web-Animations call, no repeat)" "grep -q 'duration: 900' $F && ! grep -q 'iterations' $F"
chk "no web fonts / no new requests (system stack only)" "! grep -Eq 'fonts.googleapis|@font-face|url\\(http' $F $T"
chk "no function / export of bsheet.js was renamed (T1 API)" "grep -q 'export function registerSheet' $F && grep -q 'export function resolveSheet' $F && grep -q 'export function createSheetUI' $F"
# size budget: the extra CSS+JS (gzip) of the new look vs the kit it started from
BASE=/home/claude/dev/ui1_base_bsheet.js   # mother: frozen pre-UI1 bsheet.js (kit state after RP1B)
G0=$(gzip -9 -c $BASE | wc -c); G1=$(cat $F $T | gzip -9 -c | wc -c); echo "gzip bsheet: $G0 -> $G1 (+$((G1-G0)) B)"
chk "extra size <= 12 KB gzip" "[ $((G1-G0)) -le 12288 ]"
cd $C && npx esbuild $D/ui1_entry.js --bundle --platform=browser --format=iife --global-name=H --outfile=$D/ui1_h.bundle.js --log-level=error --loader:.json=json --define:__BUILD__=\"0\"
python3 $D/ui1_test.py
echo "UI1 OK"
