#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/river_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/river_test.cjs --log-level=error && node /home/claude/dev/river_test.cjs
