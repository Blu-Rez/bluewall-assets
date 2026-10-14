#!/bin/bash
# build look_dev.bundle.js (gear worker lookdev)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/look_dev.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/look_dev.bundle.js --log-level=warning 2>&1 | grep -iv "^$" | head -20; true
