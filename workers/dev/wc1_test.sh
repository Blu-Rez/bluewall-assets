#!/bin/bash
# WC1: where the heroes carry their weapons (combat/carry.js).  Unit checks (carry classes, kit fields) + the REAL fx.js/carry.js in the RP4 arena for 5 fixtures
#      (short sword hip, big sword back, dagger pair hips, staff hand, bow back + quiver hip): at rest at the mount, the 0.12 s swap, in hand while fighting, 3 s linger, sheathed again, never two places at once.
# Needs: playwright + chromium (software GL).  Last line: "WC1 OK"
D=$(cd "$(dirname "$0")" && pwd); R=/home/claude/bot/bluebot_v2
mkdir -p /home/claude/work/wc1/out
echo "== unit"; (cd $R/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/wc1_unit.js" --bundle --platform=node --format=cjs --outfile=/tmp/wc1_unit.cjs --log-level=error) && node /tmp/wc1_unit.cjs | tee /tmp/wc1_unit.txt | tail -4
grep -q "^WC1 UNIT OK" /tmp/wc1_unit.txt || { echo "WC1 FAILED (unit)"; exit 1; }
echo "== arena bundle + server"; bash "$D/rp4_dev_build.sh" || { echo "WC1 FAILED (bundle)"; exit 1; }
if ! curl -s -o /dev/null http://127.0.0.1:8777/rp4_dev.html; then (cd "$D" && nohup python3 -m http.server 8777 >/dev/null 2>&1 &) ; sleep 1.5; fi
curl -s -o /dev/null http://127.0.0.1:8777/rp4_dev.html || { echo "WC1 FAILED (no server on 8777)"; exit 1; }
echo "== in-game (5 fixtures)"; python3 "$D/wc1_game.py" | tee /tmp/wc1_game.txt | grep -E "FAIL|calls|WC1 GAME"
grep -q "^WC1 GAME OK" /tmp/wc1_game.txt || { echo "WC1 FAILED (game)"; exit 1; }
echo "WC1 OK"
