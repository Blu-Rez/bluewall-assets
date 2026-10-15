#!/bin/bash
# AN1: the Tripo animals are OFF by default (the old animated animals stay).  Last line: "AN1 OFF OK"
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
D=$(cd "$(dirname "$0")" && pwd); APP=/home/claude/bot/bluebot_v2/bluewall; R=/tmp/an1_root; FAIL=0
mkdir -p "$R/assets"; (cd "$APP/client" && NODE_PATH=$PWD/node_modules npx esbuild "$D/an1_off/off.js" --bundle --format=iife --outfile="$R/off.bundle.js" --log-level=warning) || FAIL=1
ln -sfn "$APP/web/assets/tr2" "$R/assets/tr2"; echo '<!doctype html><html><body><script src="off.bundle.js"></script></body></html>' > "$R/index.html"
curl -s -o /dev/null http://127.0.0.1:8779/index.html || (cd "$R" && setsid nohup python3 -m http.server 8779 >/dev/null 2>&1 </dev/null &); sleep 1
timeout 240 python3 "$D/an1_off/check.py" || FAIL=1
[ $FAIL = 0 ] && echo "AN1 OFF OK" || { echo "AN1 OFF FAILED"; exit 1; }
