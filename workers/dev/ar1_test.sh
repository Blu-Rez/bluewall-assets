#!/bin/bash
# AR1 test: static checks (node) + the browser checks on the harness page (390x844, 56 px simulated Telegram header).  Prints "AR1 OK" or the failures.
#   bash /home/claude/dev/ar1_test.sh            (needs the static server on :8777; set NOBROWSER=1 to skip the browser part)
#   the REAL game page is proven separately (software GL, ~25 min for all three soldiers; one at a time, never beside the gate):
#     cd /home/claude/dev/ar1 && bash ../agent_build.sh ar1 && SHOTS=1 DPR=2 python3 ar1_browser.py game      (OLD_ONLY=1 skips the per-soldier page checks)
#     SHOTS=1 DPR=2 python3 ar1_chars.py game                                                                (Part B in the real game page)
export PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers
C=/home/claude/bot/bluebot_v2/bluewall/client; D=/home/claude/dev/ar1; OUT=/home/claude/work/ar1; mkdir -p $OUT
cd $C && npx esbuild src/unitcards.js --bundle --platform=node --format=esm --outfile=$OUT/unitcards.node.mjs --log-level=error --loader:.json=json --define:__BUILD__=\"0\" --banner:js='globalThis.window=globalThis;' || { echo "AR1 FAIL: unitcards.js does not bundle"; exit 1; }
node $D/ar1_static.mjs $OUT/unitcards.node.mjs || exit 1
cd $C && npx esbuild src/armyui.js --bundle --platform=node --format=esm --outfile=$OUT/armyui.node.mjs --log-level=error --loader:.json=json --define:__BUILD__=\"0\" --banner:js='globalThis.window=globalThis;' || { echo "AR1 FAIL: armyui.js does not bundle"; exit 1; }
if [ -n "$NOBROWSER" ]; then echo "AR1 OK (static only)"; exit 0; fi
bash $D/build_harness.sh >/dev/null || { echo "AR1 FAIL: harness build"; exit 1; }
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8777/ar1/harness.html | grep -q 200 || { cd /home/claude/dev && (setsid nohup python3 -m http.server 8777 --bind 127.0.0.1 >/dev/null 2>&1 </dev/null &); sleep 2; }
timeout 300 python3 $D/ar1_browser.py harness || { echo "AR1 FAIL: browser part"; exit 1; }
timeout 240 python3 $D/ar1_chars.py harness || { echo "AR1 FAIL: characters gallery (Part B)"; exit 1; }
echo "AR1 OK"
