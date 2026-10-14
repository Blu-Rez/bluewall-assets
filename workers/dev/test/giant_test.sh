#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/test/giant_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/test/giant_test.cjs --log-level=error --loader:.json=json && node /home/claude/dev/test/giant_test.cjs
