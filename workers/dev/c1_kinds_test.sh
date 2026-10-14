#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/c1_kinds_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/c1_kinds_test.cjs --log-level=error && node /home/claude/dev/c1_kinds_test.cjs
