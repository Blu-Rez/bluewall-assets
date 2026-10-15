#!/bin/bash
# ST1_R3: the yard builders on a recording batch + the source rules (node, ~10 s).  Last line: "ST1R3 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/st1r3_test.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/st1r3_test.mjs --log-level=error --banner:js="globalThis.window=globalThis;" && node /home/claude/dev/st1r3_test.mjs
