#!/bin/bash
# ui1_rig_build.sh — builds the CURRENT client source into dev/app_ui1/wall.js and the page dev/ui1_dev.html that loads it (web/app/wall.js stays untouched).
# Then:  python3 dev/ui1_shots.py   (full run)   |  HEROONLY=1 python3 dev/ui1_shots.py  |  LANDONLY=1 ...  |  CLOSE=1 ...   (needs: bash dev/up.sh  = static server on :8777)
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
mkdir -p /home/claude/dev/app_ui1
npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"$(date +%s)\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/app_ui1/wall.js
sed "s#app/wall.js#app_ui1/wall.js#" /home/claude/dev/rp1_dev.html > /home/claude/dev/ui1_dev.html
echo "built -> http://127.0.0.1:8777/ui1_dev.html"
