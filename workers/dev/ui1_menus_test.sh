#!/bin/bash
# ui1_menus_test.sh — UI1_R4: EVERY menu / sheet / dialog is opened by its real button in the real game (headless Chromium, software GL) at 844x390, 800x360 and 932x430 WITH Telegram's margins (--tg-*)
# and must (1) open, (2) fit inside the screen, (3) scroll INSIDE (the page never scrolls), (4) keep a close button of >= 44 px that is not under a Telegram button, (5) have no target < 40 px (UI3), nothing under the notch / rounded
# corners / home bar, no clipped text or unreachable content, and a list that gets >= 30 % of the screen height (UI3).  Then the «43K» bug (dev/ui1r4_43k.py: no ruby gem pill in the sky of hero mode; dev/ui1r4_toast.py: the gift toast lives <= 2.5 s,
# its text is removed, it sits in the top strip and never over the hero).  Prints «UI1 MENUS OK».
#   bash dev/ui1_menus_test.sh static          static rules on ui_theme_r4.js only (seconds)
#   bash dev/ui1_menus_test.sh                 static + the real game: builds it, loads it (~2.5 min), opens ~50 menus x 3 sizes (~35 min on 2 CPU cores) — the proof run
#   bash dev/ui1_menus_test.sh quick           static + the real game, but only the hub, one Kingdom / Army / Shop / Rank / Settings scene and 5 building sheets (~12 min)
# Needs the static server (bash dev/up.sh) and a headless chromium with a debugging port (bash dev/ui1r2_browser.sh).
set -u
SRC=${SRC:-/home/claude/bot/bluebot_v2/bluewall/client/src}; D=/home/claude/dev; MODE=${1:-full}; F=0
bad() { echo "FAIL $1"; F=1; }
f=$SRC/ui_theme_r4.js
[ -f "$f" ] || { echo "FAIL no ui_theme_r4.js"; exit 1; }
sz=$(stat -c %s "$f"); [ "$sz" -le 16000 ] || bad "ui_theme_r4.js is $sz B (> 16000)"     # UI3: 9000 -> 16000 (the army card tile and the panel sizing live here now)
sed 's/\${[^}]*}//g' "$f" | grep -Ev '^\s*(//|/\*)' | grep -Eq '#[0-9a-fA-F]{3,8}\b' && bad "a literal hex colour in ui_theme_r4.js: colours come from ui_tokens.js (UI3)"
grep -q 'injectKit4' $SRC/ui_theme.js || bad "ui_theme.js does not inject ui_theme_r4.js"
grep -Eq '\.bwh-pan\{[^}]*max-height:(6[0-9]|70)%' $SRC/assist.js || bad "assist.js: .bwh-pan must have max-height <= 70% (UI3)"
node --input-type=module -e "
import('file://$f').then((m) => { const css = m.KIT4_CSS; let bad = 0;
  // every selector of every rule starts with the double-class prefix (one class more than rounds 2 / 3)
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
  if (/@keyframes|animation|transition/.test(body)) { console.log('FAIL keyframes / animation / transition in the CSS (CSS only, nothing that moves)'); bad++; }
  if (/backdrop-filter/.test(body)) { console.log('FAIL backdrop-filter in the CSS'); bad++; }
  if (/!important/.test(body)) { console.log('FAIL !important in the CSS (the .bw-ui.bw-ui prefix must win by specificity)'); bad++; }
  for (const rule of body.split('}')) { const i = rule.lastIndexOf('{'); if (i < 0) continue; const sel = rule.slice(rule.lastIndexOf('\n', i) + 1, i).trim(); if (!sel || sel.startsWith('@media')) continue;
    for (const s of sel.split(',')) if (!s.trim().startsWith('.bw-ui.bw-ui') && !s.trim().startsWith('html .rp-pick.rp-pick')) { console.log('FAIL selector without the .bw-ui.bw-ui (or html .rp-pick.rp-pick) prefix: ' + s.trim().slice(0, 80)); bad++; } }
  if ((body.match(/@media/g) || []).length < 1) { console.log('FAIL expected the landscape media query'); bad++; }                    // UI3: one query (the hub is sized by assist.js)
  if (!/orientation:landscape/.test(body)) { console.log('FAIL not landscape-scoped'); bad++; }
  for (const k of ['.bwu-pan', '.bwa-pan', '.bws-pan', '.bwk-pan', '.bw-panel']) if (!body.includes(k)) { console.log('FAIL no rule for ' + k); bad++; }
  if (!/min-height:44px/.test(body)) { console.log('FAIL no 44 px target rule'); bad++; }
  // UI3: the owner's size rule — every list panel <= 70 % of the height and <= 75 % of the width at 844x390 (the two variables that size them)
  const h = /--r4h:\s*(\d+)%/.exec(body), w = /--r4w:\s*min\((\d+)%/.exec(body);
  if (!h || +h[1] > 70) { console.log('FAIL --r4h must be <= 70% (found ' + (h && h[1]) + ')'); bad++; }
  if (!w || +w[1] > 75) { console.log('FAIL --r4w must be <= 75% (found ' + (w && w[1]) + ')'); bad++; }
  process.exit(bad ? 1 : 0); });" 2>/dev/null || F=1
# the files this round must NOT touch
R=$(cd $SRC/../.. && git rev-parse --show-toplevel 2>/dev/null); [ -n "$R" ] && { c=$(cd $R && git status --porcelain -- bluewall/web/app bluewall/pkg bluewall/server 2>/dev/null | grep -c .); [ "$c" = 0 ] || echo "note: $c file(s) under web/app / pkg / server differ from the kit (the gate rebuilds web/app/wall.js; restore it before the patch: git checkout -- bluewall/web/app)"; }
[ $F = 0 ] || { echo "UI1 MENUS FAILED (static)"; exit 1; }
echo "static rules ok"
[ "$MODE" = static ] && { echo "UI1 MENUS OK (static rules only; the real-game run was NOT done)"; exit 0; }
cd $D || exit 1
bash ui1r2_rig_build.sh r4test > /tmp/ui1r4_build.log 2>&1 || { cat /tmp/ui1r4_build.log; echo "UI1 MENUS FAILED (build)"; exit 1; }
curl -s -o /dev/null http://127.0.0.1:8777/ui1r2_r4test.html || { echo "UI1 MENUS FAILED (static server: bash dev/up.sh)"; exit 1; }
curl -s http://127.0.0.1:9222/json/version >/dev/null || bash ui1r2_browser.sh >/dev/null
python3 ui1r2_load.py r4test || { echo "UI1 MENUS FAILED (page did not load)"; exit 1; }
# one game tab only: a tab behind another one is throttled and its screenshots time out
for id in $(curl -s http://127.0.0.1:9222/json/list | python3 -c "import sys,json; [print(t['id']) for t in json.load(sys.stdin) if t['type']=='page' and 'r4test' not in t['url']]"); do curl -s http://127.0.0.1:9222/json/close/$id >/dev/null; done
OUTD=/tmp/ui1r4_testrun; rm -rf $OUTD; mkdir -p $OUTD
if [ "$MODE" = quick ]; then
  OUT=$OUTD/ python3 ui1r4_census.py r4test census '^(hub|kingdom_owned|army_troops|army_unit_info_common|shop_boosts|rank_leaderboard|settings_sound|hero_picker)$' 844x390,800x360,932x430 || F=1
  OUT=$OUTD/ python3 ui1r4_sheets.py r4test sheets '^sheet_(keep|barracks|mine_ruby|vault_ruby|ws_farm)$' 844x390,800x360,932x430 || F=1
  MINOK=${MINOK:-30} python3 ui1_menus_verdict.py $OUTD/census/results.json $OUTD/sheets/results.json || F=1
else
  OUT=$OUTD/ python3 ui1r4_census.py r4test census '^(?!sheet_)' 844x390,800x360,932x430 || F=1
  OUT=$OUTD/ python3 ui1r4_sheets.py r4test sheets '' 844x390,800x360,932x430 || F=1
  python3 ui1_menus_verdict.py $OUTD/census/results.json $OUTD/sheets/results.json || F=1
fi
# the «43K» bug: the gem pills of the mines are hidden while the hero is out (and back after), and the gift toast lives <= 2.5 s, is removed and sits in the top strip, never over the hero
FAST=1 python3 ui1r4_43k.py r4test 43k > $OUTD/43k.log 2>&1; tail -2 $OUTD/43k.log; grep -q '43K PILL OK' $OUTD/43k.log || F=1
python3 ui1r4_toast.py r4test > $OUTD/toast.log 2>&1; cat $OUTD/toast.log | cut -c1-200; grep -q 'TOAST OK' $OUTD/toast.log || F=1
echo "frames + results: $OUTD"
[ $F = 0 ] && echo "UI1 MENUS OK" || { echo "UI1 MENUS FAILED"; exit 1; }
