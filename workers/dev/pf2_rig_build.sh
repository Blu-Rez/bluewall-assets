#!/bin/bash
# pf2_rig_build.sh <tag> — builds the CURRENT client source into dev/app_pf2_<tag>/wall.js and the page dev/pf2_<tag>.html that loads it (web/app/wall.js stays untouched).
# tag = before (kit as started) | after.   Then:  python3 dev/pf2/progs.py <tag>   (static server: bash dev/up.sh, port 8777)
set -e
TAG=${1:?tag}
cd /home/claude/bot/bluebot_v2/bluewall/client
mkdir -p /home/claude/dev/app_pf2_$TAG
npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"${BUILDV:-1792011938}\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/app_pf2_$TAG/wall.js
sed "s#app/wall.js#app_pf2_$TAG/wall.js#" /home/claude/dev/rp1_dev.html > /home/claude/dev/pf2_$TAG.html
echo "built -> http://127.0.0.1:8777/pf2_$TAG.html"
