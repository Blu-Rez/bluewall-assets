#!/bin/bash
# ST1_R2: the halo caps + the source rules (node, ~5 s).  Last line: "ST1R2 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/st1r2_test.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/st1r2_test.mjs --log-level=error --banner:js="globalThis.window=globalThis;" && node /home/claude/dev/st1r2_test.mjs
