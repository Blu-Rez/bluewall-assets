#!/bin/bash
# ui3_rig_build_before.sh — the light rig built from the KIT sources (git archive e35e072 -> /home/claude/kit_before) = the «BEFORE».  Page: dev/ui1r2_rigb.html (CDP tag rigb).  Then: CDPPORT=9223 python3 dev/ui3_rig_load.py rigb
set -e
cd /home/claude/kit_before/bluewall/client
mkdir -p /home/claude/dev/app_ui1r2_rigb
npx esbuild /home/claude/dev/ui3_rig_before.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"1\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/app_ui1r2_rigb/wall.js
sed 's#app_ui1r2_rig/wall.js#app_ui1r2_rigb/wall.js#' /home/claude/dev/ui1r2_rig.html > /home/claude/dev/ui1r2_rigb.html
echo "built -> http://127.0.0.1:8777/ui1r2_rigb.html"
