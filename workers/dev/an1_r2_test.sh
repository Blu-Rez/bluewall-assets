#!/bin/bash
# AN1_R2: animals + villagers walk right.  Last line: "AN1_R2 OK"   (client only; the browser measurements are in report_AN1_R2.md, tools in workers/dev/an1_r2/)
D=$(cd "$(dirname "$0")" && pwd); APP=/home/claude/bot/bluebot_v2/bluewall; FAIL=0
bad(){ echo "FAIL $1"; FAIL=1; }; ok(){ echo "ok   $1"; }
cd "$APP/client" || exit 1
echo "== 1. the life modules and the walking kit compile for the browser"
for f in walk_kit creature tr2_life pas_life wslife life; do NODE_PATH=$PWD/node_modules npx esbuild src/$f.js --bundle --platform=browser --format=esm --outfile=/tmp/an1r2_$f.js --log-level=error && ok "$f.js bundles" || bad "$f.js does not bundle"; done
echo "== 2. walking kit: turn rate, ramps, guard, grid, route"
NODE_PATH=$PWD/node_modules npx esbuild $D/an1_r2/unit.js --bundle --platform=node --format=cjs --outfile=/tmp/an1r2_unit.cjs --log-level=error && node /tmp/an1r2_unit.cjs || FAIL=1
echo "== 3. source guards"
python3 - <<'PY' || FAIL=1
import re, subprocess, sys
S = '/home/claude/bot/bluebot_v2/bluewall/client/src/'
bad = 0
def ck(c, m):
    global bad; print(('ok   ' if c else 'FAIL ') + m)
    if not c: bad = 1
tl = open(S + 'tr2_life.js').read(); wl = open(S + 'wslife.js').read(); pl = open(S + 'pas_life.js').read(); lf = open(S + 'life.js').read(); wk = open(S + 'walk_kit.js').read(); cr = open(S + 'creature.js').read()
ck('stripRoot' in tl and 'Hips' in tl or 'Hip' in tl, 'tr2_life strips the clip root travel of the villager walk')
ck('walk_kit' in wl and 'walk_kit' in pl and 'walk_kit' in lf and 'walk_kit' in cr, 'wslife, pas_life, life and creature use the shared walking kit')
ck('stanceSpeed' in wk and 'makeGrid' in wk and 'steer' in wk, 'walk_kit has the speed estimator, the grid and the mover')
ck(wl.count('setSpeed') >= 1 or 'rate' in wl, 'wslife sets the clip rate from the speed it moves at')
# no «bot» / «ربات» in any game text we added
txt = '\n'.join([tl, wl, pl, wk])
strs = re.findall(r"'([^'\n]{3,})'|\"([^\"\n]{3,})\"", txt)
hit = [a or b for a, b in strs if re.search(r'\bbot\b|ربات', a or b, re.I)]
ck(not hit, 'no «bot / ربات» in the strings of the files we touched' + ('' if not hit else ': ' + str(hit[:3])))
# nothing outside the allowed files changed
out = subprocess.run(['git', '-C', '/home/claude/bot/bluebot_v2', 'status', '--porcelain'], capture_output=True, text=True).stdout.splitlines()
forb = [l for l in out if re.search(r'bluewall/web/app/|(^|/)pkg/|dev/gate|\.py$', l[3:]) and 'bluewall/web/app/wall.js' not in l and 'web/app/wall.js' not in l and not l[3:].startswith('workers/') ]
forb = [l for l in forb if not re.search(r'workers/|\bdev/', l)]
ck(not forb, 'no forbidden file changed (web/app, pkg, gate, server py)' + ('' if not forb else ': ' + str(forb[:3])))
sys.exit(bad)
PY
[ $FAIL = 0 ] && echo "AN1_R2 OK" || { echo "AN1_R2 FAILED"; exit 1; }
