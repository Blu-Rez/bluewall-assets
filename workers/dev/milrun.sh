#!/bin/bash
# milrun.sh OUT shot... : rebuild harness bundle then shoot
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/mil_dev.js --bundle --format=iife --outfile=/home/claude/dev/mil_dev.bundle.js 2>&1 | grep -E "error|ERROR" ; cd /home/claude/dev && python3 milshot.py "$@" 2>&1 | grep -v "warning\|sites"
