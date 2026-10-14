#!/bin/bash
# p41 town test: bundles dev/p41_town_test.js with esbuild and runs it in node.  Last line: "P41 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/p41_town_test.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/p41_town_test.mjs --log-level=error --loader:.json=json && node /home/claude/dev/p41_town_test.mjs
