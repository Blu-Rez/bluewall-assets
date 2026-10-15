#!/bin/bash
# bt1r2_rig_build.sh <tag> — builds the CURRENT client source into dev/app_bt1r2_<tag>/wall.js and the page dev/bt1r2_<tag>.html (a copy of dev_s35.html that loads it).
# tag = before (kit as started) | after.   Needs the static server: bash dev/up.sh (port 8777).   web/app/wall.js stays untouched.
set -e
TAG=${1:?tag}
cd /home/claude/bot/bluebot_v2/bluewall/client
mkdir -p /home/claude/dev/app_bt1r2_$TAG
npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"${BUILDV:-1792011938}\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/app_bt1r2_$TAG/wall.js
sed "s#app_s35/wall.js#app_bt1r2_$TAG/wall.js#" /home/claude/dev/dev_s35.html > /home/claude/dev/bt1r2_$TAG.html
echo "built -> http://127.0.0.1:8777/bt1r2_$TAG.html"
