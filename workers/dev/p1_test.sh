#!/bin/bash
# P1: the 10 processing kinds on the map (node only).  Last line: "P1 OK".  (esbuild bundle: layout.js / the plan import json)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/p1_test.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/p1_test.mjs --log-level=error --loader:.json=json && node /home/claude/dev/p1_test.mjs 2>&1 | grep -v "Warning\|Reparsing\|To eliminate\|trace-warnings"
