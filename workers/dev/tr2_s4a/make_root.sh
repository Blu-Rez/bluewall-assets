#!/bin/bash
# builds the static root of the S4a browser proof (symlinks only): /tmp/s4a_root  ->  serve it on :8778
set -e
D=$(cd "$(dirname "$0")" && pwd); R=${ROOT:-/tmp/s4a_root}; APP=${APP:-/home/claude/bot/bluebot_v2/bluewall}
mkdir -p "$R"; cd "$R"
ln -sfn "$APP/client/node_modules/three" three; ln -sfn "$APP/client/src" src; ln -sfn "$APP/web/assets" assets
cp "$D"/s4a.html "$D"/s4a.py "$D"/stage_*.js .
echo "ready: $R  (cd $R && python3 -m http.server 8778)"
