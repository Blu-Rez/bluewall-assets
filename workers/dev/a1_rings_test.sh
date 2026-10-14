#!/bin/bash
# A1: wall rings by level (logic). prints "A1 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/a1_rings_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/a1_rings_test.cjs --log-level=error && node /home/claude/dev/a1_rings_test.cjs
