#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/ws_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/ws_test.cjs --log-level=error && node /home/claude/dev/ws_test.cjs
