#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/a2_water_test.js --bundle --platform=node --format=cjs --outfile=/tmp/a2_water_test.cjs --log-level=error && node /tmp/a2_water_test.cjs
