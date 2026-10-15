#!/bin/bash
# AN1_R3: update-rate LOD (F6) + groundH/cart audit + the real-size table.  Last line: "AN1_R3 OK"   (client only; the browser measurements are in report_AN1_R3.md, tools in workers/dev/an1_r3/ and dev/an1_r3_*.py)
D=$(cd "$(dirname "$0")" && pwd); APP=/home/claude/bot/bluebot_v2/bluewall; FAIL=0
bad(){ echo "FAIL $1"; FAIL=1; }; ok(){ echo "ok   $1"; }
cd "$APP/client" || exit 1
echo "== 1. the files we touched bundle for the browser"
for f in walk_kit creature crowd tr2_life pas_life wslife life units patrol army; do NODE_PATH=$PWD/node_modules npx esbuild src/$f.js --bundle --platform=browser --format=esm --outfile=/tmp/an1r3_$f.js --log-level=error && ok "$f.js bundles" || bad "$f.js does not bundle"; done
echo "== 2. F6 LOD helper + the size table (unit)"
NODE_PATH=$PWD/node_modules npx esbuild $D/an1_r3/unit.js --bundle --platform=node --format=cjs --outfile=/tmp/an1r3_unit.cjs --log-level=error && node /tmp/an1r3_unit.cjs || FAIL=1
echo "== 3. source guards"
python3 - <<'PY' || FAIL=1
import re, subprocess, sys
S = '/home/claude/bot/bluebot_v2/bluewall/client/src/'
bad = 0
def ck(c, m):
    global bad; print(('ok   ' if c else 'FAIL ') + m)
    if not c: bad = 1
rd = lambda f: open(S + f).read()
wk, tl, pl, wl, lf, cr, cw = (rd(f) for f in ('walk_kit.js', 'tr2_life.js', 'pas_life.js', 'wslife.js', 'life.js', 'creature.js', 'crowd.js'))
ck('lodGate' in wk and 'lodLevel' in wk and 'an1lod' in wk, 'walk_kit has the F6 gate, the level function and the kill switch (?an1lod=0)')
ck('an1gain' in wk and 'export const SZ' in wk and 'lenOf' in wk, 'walk_kit has the one size table (SZ) with the ?an1gain= switch')
ck('lodF6' in cw and 'lodF6: true' in wl and 'lodF6' in pl, 'crowd.js F6 is opt-in (lodF6) and used by wslife / pas_life')
ck(len(re.findall(r'lodF6\s*:\s*true', ''.join(rd(f) for f in ('units.js', 'world.js', 'life.js', 'creature.js', 'tr2_life.js')))) == 0, 'nobody else switches the crowd skip on (units.js, world.js, life.js, creature.js, tr2_life.js)')
ck('sz(' in tl and 'sz(' in pl and 'lenOf' in wl and 'lenOf' in lf, 'tr2_life / pas_life / wslife / life take their sizes from the table')
ck(not re.search(r'5\.6\s*\*\s*HS|H_LEN\s*=\s*5\.6|const COW_LEN = 4\.9', pl + lf), 'the old 5.6 x 1.335 horse length and the 4.9 m cow are gone')
ck('walkY' in cr or 'walkY' in wl or 'makeGroundY' in wl, 'the movers still stand on the deck height (nav.js makeGroundY) and the cart routes know the decks')
txt = '\n'.join([tl, wl, pl, wk, lf, cr])
strs = re.findall(r"'([^'\n]{3,})'|\"([^\"\n]{3,})\"", txt)
hit = [a or b for a, b in strs if re.search(r'\bbot\b|ربات', a or b, re.I)]
ck(not hit, 'no «bot / ربات» in the strings of the files we touched' + ('' if not hit else ': ' + str(hit[:3])))
# every shared-file line we changed is marked
ch = {}
for f in ('units.js', 'patrol.js', 'army.js', 'world.js'):
    d = subprocess.run(['git', '-C', '/home/claude/bot/bluebot_v2', 'diff', '-U0', 'HEAD', '--', 'bluewall/client/src/' + f], capture_output=True, text=True).stdout.splitlines()
    add = [l for l in d if l.startswith('+') and not l.startswith('+++')]
    ch[f] = (len(add), len([l for l in add if 'AN1_R3' in l]))
    ck(add and len(add) == ch[f][1], f'{f}: every added line is marked // AN1_R3: ({ch[f][1]} of {ch[f][0]})')
# nothing outside the allowed files changed
out = subprocess.run(['git', '-C', '/home/claude/bot/bluebot_v2', 'status', '--porcelain'], capture_output=True, text=True).stdout.splitlines()
okf = re.compile(r'bluewall/client/src/(walk_kit|creature|life|pas_life|tr2_life|wslife|crowd|units|patrol|army|world)\.js$|^.. (workers/|dev/)|bluewall/web/app/wall\.js$')
forb = [l for l in out if not okf.search(l)]
ck(not forb, 'only our files changed (+ the shared ones marked above)' + ('' if not forb else ': ' + str(forb[:4])))
ck(not any('web/app/wall.js' in l for l in out), 'the release bundle web/app/wall.js is not modified (git checkout before packaging)')
sys.exit(bad)
PY
[ $FAIL = 0 ] && echo "AN1_R3 OK" || { echo "AN1_R3 FAILED"; exit 1; }
