#!/bin/bash
# B1 town plan test: bundles dev/b1_town_test.js with esbuild and runs it in node.  Last line: "B1 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/b1_town_test.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/b1_town_test.mjs --log-level=error --loader:.json=json && node /home/claude/dev/b1_town_test.mjs
