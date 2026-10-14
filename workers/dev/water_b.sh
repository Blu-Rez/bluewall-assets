#!/bin/bash
# build water_dev.bundle.js (water worker lookdev)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/water_dev.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/water_dev.bundle.js --log-level=warning 2>&1 | head -20; true
