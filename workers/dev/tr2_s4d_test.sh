#!/bin/bash
# TR2-S4d: Tripo animals + villagers (tr2_life.js and the five rewired life modules).  Last line: "TR2 S4D OK"   (S4D_NOBROWSER=1 skips the headless-browser part)
D=$(cd "$(dirname "$0")" && pwd); APP=/home/claude/bot/bluebot_v2/bluewall; FAIL=0
bad(){ echo "FAIL $1"; FAIL=1; }; ok(){ echo "ok   $1"; }
echo "== 1. shipped models: valid GLBs, small"
python3 - "$APP/web/assets/tr2" <<'PY' || FAIL=1
import sys, os, struct
d = sys.argv[1]; bad = 0; tot = 0
names = ['animal_cow','animal_calf','animal_horse_white','animal_horse_brown','animal_horse_black','animal_sheep','animal_lamb','animal_pig','animal_dog','animal_wolf','birds','poultry_fish_pack','villager_man','villager_woman','villager_youngman','villager_oldman']
for n in names:
    p = os.path.join(d, n + '.glb')
    if not os.path.exists(p): print('FAIL missing', n); bad = 1; continue
    b = open(p, 'rb').read(12); sz = os.path.getsize(p); tot += sz
    if b[:4] != b'glTF' or struct.unpack('<I', b[8:12])[0] != sz: print('FAIL bad header', n); bad = 1
    if sz > 700_000: print('FAIL too big', n, sz); bad = 1
print(('ok   ' if not bad else 'FAIL ') + '%d GLBs present, glTF headers + lengths fine, total %.2f MB (limit 3)' % (len(names), tot / 1e6))
if tot > 3e6: print('FAIL total'); bad = 1
sys.exit(bad)
PY
echo "== 2. the life modules compile for the browser (imports resolve, no syntax errors)"
cd $APP/client
for f in tr2_life pas_life wslife life units world; do NODE_PATH=$PWD/node_modules npx esbuild src/$f.js --bundle --platform=browser --format=esm --outfile=/tmp/tr2_s4d_$f.js --log-level=error && ok "$f.js bundles" || bad "$f.js bundle"; done
echo "== 3. the army is untouched; S4d's own changes are in the files of §1 only and world.js stays ≤ 6 marked lines"
python3 - <<'PY' || FAIL=1
import subprocess, re, sys
APP = '/home/claude/bot/bluebot_v2'
out = subprocess.run(['git', '-C', APP, 'status', '--porcelain', '--', 'bluewall/client/src', 'bluewall/web/assets/tr2'], capture_output=True, text=True).stdout.splitlines()
OWN = {'tr2_life.js','pas_life.js','pas_stable.js','life.js','water_life.js','peasanthead.js','crowd.js','wslife.js','world.js','units.js','creature.js','walk_kit.js'}   # AN1_R2: creature.js + walk_kit.js are the shared walking helpers of the life modules
ARMY = {'bunits.js','unitlook.js','battlesim.js','army.js','armyplan.js','armyui.js'}
bad = 0; files = []; other = []
for l in out:
    p = l[3:].strip(); f = p.split('/')[-1]
    if '/assets/tr2/' in p: continue
    files.append(f)
    if f in ARMY: print('FAIL army file changed:', p); bad = 1
    elif f not in OWN: other.append(f)
print(('ok   ' if not bad else 'FAIL ') + 'army files untouched; changed source files: ' + ', '.join(sorted(files)))
if other: print('note other files differ from the kit HEAD (other stages merged?): ' + ', '.join(sorted(other)))
d = subprocess.run(['git', '-C', APP, 'diff', '-U0', '--', 'bluewall/client/src/world.js'], capture_output=True, text=True).stdout
add = [x for x in d.splitlines() if x.startswith('+') and not x.startswith('+++')]
unm = [x for x in add if 'TR2-S4d' not in x]
if other:   # world.js carries other stages' lines too: only check ours
    print('note world.js has other stages\' lines too: S4d mark count = %d (expected 2)' % (len(add) - len(unm)))
    if len(add) - len(unm) != 2: bad = 1
else:
    print(('ok   ' if not unm and len(add) <= 6 else 'FAIL ') + 'world.js: %d added lines (limit 6), %d without the TR2-S4d mark' % (len(add), len(unm)))
    if unm or len(add) > 6: bad = 1
sys.exit(bad)
PY
echo "== 4. before preload every entry point says no (the old models / code stay in charge)"
NODE_PATH=$PWD/node_modules npx esbuild $D/tr2_s4d/node_test.js --bundle --platform=node --format=cjs --outfile=/tmp/tr2_s4d_node.cjs --log-level=error && node /tmp/tr2_s4d_node.cjs || FAIL=1
if [ -z "$S4D_NOBROWSER" ]; then
  echo "== 5. headless browser: models load, villagers calibrated, frame drawn"
  bash $D/tr2_s4d/make_root.sh >/dev/null 2>&1
  curl -s -o /dev/null http://127.0.0.1:8778/index.html || (cd /tmp/tr2_s4d_root && setsid nohup python3 -m http.server 8778 >/dev/null 2>&1 &) ; sleep 1
  python3 $D/tr2_s4d/check_harness.py || FAIL=1
fi
[ $FAIL = 0 ] && echo "TR2 S4D OK" || { echo "TR2 S4D FAILED"; exit 1; }
