#!/bin/bash
# BT1: the attack map IS the home map (same models, same LOD, same ground; only the battle layers differ).  Last line: "BT1 OK".  env BT1_LEVELS="1 30 50" (default).  About 6 min per level in software GL.
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
D=$(cd "$(dirname "$0")" && pwd)
[ -e "$D/app_s35" ] || ln -sfn app "$D/app_s35"
curl -s -o /dev/null http://127.0.0.1:8777/dev_s35.html || (cd "$D" && setsid nohup python3 -m http.server 8777 --bind 127.0.0.1 >/dev/null 2>&1 </dev/null &); sleep 1
mkdir -p /home/claude/work/bt1
timeout 3000 python3 "$D/bt1_test.py"
