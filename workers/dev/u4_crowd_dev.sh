#!/bin/bash
# u4_crowd_dev.sh : rebuild the gryphon crowd harness bundle
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/u4_crowd_dev.js --bundle --format=iife --outfile=/home/claude/dev/u4_crowd_dev.bundle.js --log-level=warning 2>&1 | head -20
