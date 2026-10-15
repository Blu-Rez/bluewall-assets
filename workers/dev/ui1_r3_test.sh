#!/bin/bash
# ui1_r3_test.sh — UI1-R3 (landscape HUD placement): static rules on ui_theme_r3.js / ui.js + geometry of the real HUD on the light rig (3 layouts x 844x390 / 800x360 / 932x430 x safe-area cases, home + hero).
# Needs the static server (bash dev/up.sh).  Prints «UI1R3 OK».   The real-game frames: dev/ui1_r3_shots.py / ui1_r3_layers.py / ui1_r3_hero.py (slow, not part of this test).
set -u
SRC=/home/claude/bot/bluebot_v2/bluewall/client/src; BASE=/home/claude/base_snapshot/client/src; F=0
bad() { echo "FAIL $1"; F=1; }
f=$SRC/ui_theme_r3.js
[ -f "$f" ] || { echo "FAIL no ui_theme_r3.js"; exit 1; }
sz=$(stat -c %s "$f"); [ "$sz" -le 7500 ] || bad "ui_theme_r3.js is $sz B (> 7500)"
grep -qE '@keyframes|animation|transition' "$f" && bad "ui_theme_r3.js has keyframes / animation / transition (CSS only, nothing that moves)"
grep -E 'backdrop-filter' "$f" | grep -vE 'backdrop-filter:none' | grep -q . && bad "backdrop-filter with a value"
# every !important belongs to a .rp-* selector (the inline styles of main.js / rpg.js are the only thing it has to beat)
node --input-type=module -e "
import fs from 'fs'; import('file://$f').then((m) => { const css = m.HUD3_CSS; let bad = 0;
  for (const line of css.split('\n')) { if (/!important/.test(line) && !/\.rp-/.test(line.split('{')[0])) { console.log('FAIL !important outside .rp-*: ' + line.slice(0, 90)); bad++; } }
  for (const n of [1, 2, 3]) if (!css.includes('html[data-hud=\"' + n + '\"] .rp-open')) { console.log('FAIL layout ' + n + ' has no crown rule'); bad++; }
  if (!(m.HUD_DEFAULT >= 1 && m.HUD_DEFAULT <= 3)) { console.log('FAIL HUD_DEFAULT'); bad++; }
  for (const id of ['jump', 'dodge', 'sprint', 'act', 'exit', 'cam', 'gate']) if (!css.includes('data-rp=\"' + id + '\"')) { console.log('FAIL no hero rule for ' + id); bad++; }
  process.exit(bad ? 1 : 0); });" 2>/dev/null || F=1
# ui.js: only the import, the call, and the removed 320 px media rule changed; its public surface is intact
n=$(diff <(cat $BASE/ui.js) <(cat $SRC/ui.js) | grep -cE '^[<>]'); [ "$n" -le 8 ] || bad "ui.js changed on $n lines (expected <= 8)"
grep -q 'export const GEMS' $SRC/ui.js && grep -q 'export class UI' $SRC/ui.js && grep -q 'export function raidReport' $SRC/ui.js || bad "ui.js lost an export"
grep -q 'max-width:340px' $SRC/ui.js && bad "dead portrait rule (max-width:340px) still in ui.js"
cmp -s $BASE/assist.js $SRC/assist.js || echo "note: assist.js differs from the base (expected: unchanged)"
# geometry on the light rig
( cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/ui1_r3_rig.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"1\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/ui1_r3_rig.bundle.js ) || bad "rig build"
python3 /home/claude/dev/ui1_r3_geom.py || F=1
[ $F = 0 ] && echo "UI1R3 OK" || { echo "UI1R3 FAILED"; exit 1; }
