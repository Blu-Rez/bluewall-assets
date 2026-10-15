#!/bin/bash
# UI1-R2 test: look C on every screen that is not a building sheet (HUD, Assist hub, Kingdom, Army, Shop, Rank / Clan / Friends / Log, Settings, toasts).  Static rules only (the screens themselves are proven on the real game:
# dev/ui1r2_audit.py = every screen, both orientations, targets >= 44 px, nothing outside the screen, no endless animation / backdrop-filter in the computed styles).   Prints "UI1_R2 OK".
set -e
C=/home/claude/bot/bluebot_v2/bluewall/client; S=$C/src; D=/home/claude/dev
F=$S/ui_theme_r2.js; T=$S/ui_theme.js
chk() { if eval "$2"; then :; else echo "FAIL: $1"; exit 1; fi; }
chk "ui_theme_r2.js exists + exports KIT2_CSS / injectKit2 / badgeC / gearC" "[ -f $F ] && grep -q 'export const KIT2_CSS' $F && grep -q 'export function injectKit2' $F && grep -q 'export const badgeC' $F && grep -q 'export const gearC' $F"
chk "no backdrop-filter" "! grep -q 'backdrop-filter' $F"
chk "no endless animation / keyframes / transition of its own" "! grep -Eq 'infinite|@keyframes|transition' $F"
chk "animation only as 'animation:none' (it switches the old endless ones off)" "! grep -oE 'animation[a-z-]*:[^;}]*' $F | grep -Ev '^animation:none\$' | grep -q ."
chk "every KIT2_CSS rule starts with '.bw-ui ' (one class more than the original -> wins whatever the order)" "! sed -n '/^export const KIT2_CSS = /,/^\`;/p' $F | grep -E '^[.@#*]' | grep -Ev '^(\.bw-ui |@media \(orientation:landscape\) and \(max-height:560px\)\{\$)' | grep -q ."
chk "no web fonts / no new requests (system font stack only)" "! grep -Eq 'fonts.googleapis|@font-face|url\\(http' $F"
chk "ui_theme.js only gained the import + the injectKit2() call (<= 4 diff lines vs the kit it started from)" "[ \$(git -C $C diff --no-color -U0 -- src/ui_theme.js | grep -Ec '^[+-][^+-]') -le 4 ]"
chk "no endless animation left in the files this round touched (ui.js / upgradeui.js / armyui.js diff only removes them)" "! git -C $C diff --no-color -U0 -- src/ui.js src/upgradeui.js src/armyui.js | grep -E '^\+[^+]' | grep -Eq 'infinite|@keyframes'"
chk "the three removed animations are gone (bwuGleam / bwaGleam / bwFull)" "! grep -q 'bwuGleam' $S/upgradeui.js && ! grep -q 'bwaGleam' $S/armyui.js && ! grep -q 'bwFull' $S/ui.js"
chk "no function / export of ui.js / armyui.js / upgradeui.js / shopui.js / rankui.js was changed (diff has no export line)" "! git -C $C diff --no-color -U0 -- src/ui.js src/upgradeui.js src/armyui.js src/shopui.js src/rankui.js src/socialui.js src/assist.js | grep -E '^[+-]' | grep -Eq 'export |function '"
R=/home/claude/bot/bluebot_v2
chk "only my files changed: ui_theme_r2.js (new) + 4 small edits (ui_theme.js, ui.js, upgradeui.js, armyui.js) + dev/ui1r2_* (nothing in main.js / world / battle / economy / server / pkg / gate files; web/app/wall.js is only the local build)" "[ -z \"\$(git -C $R status --porcelain | awk '{print \$2}' | grep -Ev '^(bluewall/client/src/(ui_theme_r2|ui_theme|ui|upgradeui|armyui)\.js|workers/dev/ui1r2_[a-z0-9_.]+|bluewall/web/app/wall\.js)\$')\" ]"
# size budget: gzip of the round-2 theme (the round-1 budget of 12 KB is for bsheet.js + ui_theme.js; this one is on top, so keep it small as well)
G=$(gzip -9 -c $F | wc -c); echo "gzip ui_theme_r2.js: $G B  (raw $(wc -c < $F) B)"
chk "round-2 CSS+JS <= 12 KB gzip" "[ $G -le 12288 ]"
# the game bundle still builds with it
cd $C && npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"0\" --legal-comments=none --log-level=error --outfile=/tmp/ui1r2_bundle_check.js
chk "bundle contains the round-2 style id + look-C tokens" "grep -q 'k-kit2' /tmp/ui1r2_bundle_check.js && grep -q 'kLb1' /tmp/ui1r2_bundle_check.js"
echo "UI1_R2 OK"
