#!/bin/bash
# TR2-S4b: plan() invariants of ws_tr2.js (+ the level-cap clamps).  Last line: "S4B OK"
D=$(cd "$(dirname "$0")" && pwd)
cd /home/claude/bot/bluebot_v2/bluewall/client
NODE_PATH=$PWD/node_modules npx esbuild "$D/tr2_s4b_test.js" --bundle --platform=node --format=cjs --outfile=/tmp/tr2_s4b_test.cjs --log-level=error && node /tmp/tr2_s4b_test.cjs
