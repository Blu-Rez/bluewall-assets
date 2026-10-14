#!/bin/bash
# RP4: bundle the test arena page (three + loader only; combat.js and combat/*.js stay real ES modules under assets/rpg/)
D=$(cd "$(dirname "$0")" && pwd)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/rp4_dev.js" --bundle --format=iife --outfile="$D/rp4_dev.bundle.js" --log-level=warning && echo "built $D/rp4_dev.bundle.js"
