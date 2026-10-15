#!/bin/bash
# ST1 test: the Treasury Quarter plan (nine yards): places, fit, doors, identity, skin ids, B1 oracle.  Last line: "ST1 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/st1_test.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/st1_test.mjs --log-level=error --loader:.json=json --banner:js="globalThis.window=globalThis;" && node /home/claude/dev/st1_test.mjs
