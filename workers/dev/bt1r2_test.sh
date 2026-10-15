#!/bin/bash
# BT1_R2 - the soldier -> model table, the camp slot table, the pixel LOD, the front / back rule, the defender's layout hook.  Last line "BT1R2 OK".
#   static (node, seconds)  ->  rig build of the current source (esbuild, ~1 min)  ->  gallery page + the game in software GL (~6 min).   env PARTS=units,game (default)  Q=low  LV=30
D=$(cd "$(dirname "$0")" && pwd); C=/home/claude/bot/bluebot_v2/bluewall/client
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
curl -s -o /dev/null http://127.0.0.1:8777/dev_s35.html || (cd "$D" && setsid nohup python3 -m http.server 8777 --bind 127.0.0.1 >/dev/null 2>&1 </dev/null &); sleep 1
echo "== static"; OUT=$(bash "$D/bt1r2_static.sh") || { echo "$OUT"; echo "BT1R2 FAIL (static)"; exit 1; }
echo "$OUT" | python3 -c "import json,sys; r=json.loads(sys.stdin.read()); [print('FAIL:',f) for f in r['fails']]; print(r['info']); sys.exit(1 if r['fails'] else 0)" || { echo "BT1R2 FAIL (static)"; exit 1; }
echo "== source rules"
( cd /home/claude/bot/bluebot_v2 && python3 - <<'PY'
import re, subprocess, sys
S = 'bluewall/client/src/'; fails = []
ch = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True).stdout.split('\n')
files = [l[3:] for l in ch if l.strip()]
for f in files:
    if f.startswith('bluewall/web/app/'): continue            # (rb.sh rebuilds the bundle; mkpatch ignores it)
    if f.endswith('battlesim.js') or f.endswith('armyplan.js') or f.endswith('unitdefs.json'): fails.append('touched a file that is not ours: ' + f)
    if f.startswith('pkg/') or '/gate' in f and f.endswith('.sh') or (f.endswith('.py') and 'server' in f): fails.append('touched a forbidden file: ' + f)
b = open(S + 'battle.js').read(); m = re.findall(r'^.*world\.layout\.enterBattle.*$', b, re.M)      # (mother: the defender's layout hook is TR2-S5's world.layout.enterBattle line; BT1_R2's own applyLayout line was dropped at the merge)
if len(m) != 1: fails.append('battle.js must hold exactly ONE world.layout.enterBattle line, found %d' % len(m))
elif 'target.layout' not in m[0]: fails.append('the enterBattle line does not read target.layout')
if 'applyLayout' in b: fails.append('battle.js still calls applyLayout (S5 enterBattle is the one hook)')
for f in ('camp.js', 'bunits.js', 'unit_swap.js', 'camp_slots.js'):
    t = open(S + f).read()
    if re.search(r'\bbot\b|ربات', t.split('\n', 1)[0] + ''.join(re.findall(r"'[^'\n]*'", t))): fails.append(f + ': the word bot in a player text')
for x in fails: print('FAIL:', x)
print('source rules:', 'OK' if not fails else '%d fails' % len(fails)); sys.exit(1 if fails else 0)
PY
) || { echo "BT1R2 FAIL (source rules)"; exit 1; }
echo "== rig"; bash "$D/bt1r2_rig_build.sh" test 2>&1 | tail -1
( cd $C && NODE_PATH=$C/node_modules npx esbuild "$D/bt1r2_units.js" --bundle --format=iife --log-level=error --outfile="$D/app_bt1r2_units.js" ) || { echo "BT1R2 FAIL (units page build)"; exit 1; }
echo "== runtime"; timeout 3000 python3 "$D/bt1r2_test.py" && echo "BT1R2 OK" || { echo "BT1R2 FAIL"; exit 1; }
