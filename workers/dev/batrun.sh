#!/bin/bash
# batrun.sh : rebuild harness bundle
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/bat_dev.js --bundle --format=iife --outfile=/home/claude/dev/bat_dev.bundle.js --log-level=warning 2>&1 | head -20
