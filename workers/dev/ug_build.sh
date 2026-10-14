#!/bin/bash
# rebuild the p35 ground-unit lab bundle
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/ug_lab.js --bundle --format=iife --define:__BUILD__=\"0\" --outfile=/home/claude/dev/ug_lab.bundle.js --log-level=warning 2>&1 | head -20
