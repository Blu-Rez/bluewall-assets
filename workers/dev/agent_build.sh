#!/usr/bin/env bash
# agent_build.sh <name> : bundle the CURRENT shared source into /home/claude/dev/app_<name>/wall.js
# and create /home/claude/dev/dev_<name>.html that loads it (assets/pub are shared).
set -e
N=${1:?name}
cd /home/claude/bot/bluebot_v2/bluewall/client
mkdir -p /home/claude/dev/app_$N
npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"$(date +%s)\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/app_$N/wall.js
sed "s#app/wall.js#app_$N/wall.js#" /home/claude/dev/dev.html > /home/claude/dev/dev_$N.html
echo "built -> http://127.0.0.1:8777/dev_$N.html"
