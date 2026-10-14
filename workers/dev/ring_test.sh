#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/ring_overlap_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/ring_overlap_test.cjs --log-level=error --loader:.json=json && node /home/claude/dev/ring_overlap_test.cjs
