#!/usr/bin/env bash
# AR1: bundle the harness page (the real armyui.js / ui.js / econ.js, offline, no 3D scene)
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
npx esbuild /home/claude/dev/ar1/harness.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"ar1\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/ar1/harness.bundle.js
echo "built -> http://127.0.0.1:8777/ar1/harness.html"
