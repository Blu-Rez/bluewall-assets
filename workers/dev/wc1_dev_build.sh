#!/bin/bash
# WC1 dev harness (sheets / frames / penetration): bundle dev/wc1_dev.js and set up the serve dir  /home/claude/work/wc1/serve  (assets/ -> the game's assets, packs/ -> the library weapon packs, the page + bundle),
# then serve it on :8778 if nothing answers there.   Needs /home/claude/lib (the library: lib/tripo/weapons).   Drivers: wc1_sheets.py, wc1_frames.py, wc1_pen.py, wc1_cmp.py
D=$(cd "$(dirname "$0")" && pwd); R=/home/claude/bot/bluebot_v2; S=/home/claude/work/wc1/serve
cd $R/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/wc1_dev.js" --bundle --format=iife --outfile="$D/wc1_dev.bundle.js" --log-level=warning && echo "built $D/wc1_dev.bundle.js"
mkdir -p $S /home/claude/work/wc1/out; ln -sfn $R/bluewall/web/assets $S/assets; ln -sfn /home/claude/lib/lib/tripo/weapons $S/packs; ln -sfn $D/wc1_dev.bundle.js $S/wc1_dev.bundle.js; ln -sfn $D/wc1_dev.html $S/wc1_dev.html
curl -s -o /dev/null http://127.0.0.1:8778/wc1_dev.html || { (cd $S && nohup python3 -m http.server 8778 >/dev/null 2>&1 &); sleep 1.5; }
curl -s -o /dev/null http://127.0.0.1:8778/wc1_dev.html && echo "serving http://127.0.0.1:8778/wc1_dev.html"
