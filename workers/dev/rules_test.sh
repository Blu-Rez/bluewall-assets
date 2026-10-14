#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/rules_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/rules_test.cjs --log-level=error --loader:.json=json && node /home/claude/dev/rules_test.cjs
