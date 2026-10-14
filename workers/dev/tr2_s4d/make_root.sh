#!/bin/bash
# builds the static root for the S4d browser frames (symlinks + one bundle).   bash dev/tr2_s4d/make_root.sh ; cd /tmp/tr2_s4d_root && (setsid python3 -m http.server 8778 >/dev/null 2>&1 &)
set -e
D=$(cd "$(dirname "$0")" && pwd); R=${ROOT:-/tmp/tr2_s4d_root}; APP=${APP:-/home/claude/bot/bluebot_v2/bluewall}
mkdir -p "$R"; cd "$APP/client" && NODE_PATH=$PWD/node_modules npx esbuild "$D/s4d.js" --bundle --format=iife --outfile="$R/s4d.bundle.js" --log-level=warning 2>&1 | head -20
mkdir -p "$R/assets"; ln -sfn "$APP/web/assets/tr2" "$R/assets/tr2"; cp "$D/s4d.html" "$R/index.html"
echo "ready: $R"
