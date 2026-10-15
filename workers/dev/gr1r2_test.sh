#!/bin/bash
# GR1_R2: horizon table + far ranges (logic). prints "GR1_R2 TEST OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/gr1r2_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/gr1r2_test.cjs --log-level=error && node /home/claude/dev/gr1r2_test.cjs
