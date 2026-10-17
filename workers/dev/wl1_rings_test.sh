#!/bin/bash
# WL1: wall rings from level 21 up (50 included) — the server -> levels.setMany -> wallLevel -> ringsAt chain at cap 50 and 30 (logic, node). prints "WL1 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/wl1_rings_test.js --bundle --platform=node --format=cjs --loader:.json=json --outfile=/home/claude/dev/wl1_rings_test.cjs --log-level=error && node /home/claude/dev/wl1_rings_test.cjs
