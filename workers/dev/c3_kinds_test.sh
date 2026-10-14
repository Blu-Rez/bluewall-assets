#!/bin/bash
# C3 kinds test -> prints "C3 OK"  (every kind has fa/role/in/out/unlock, every piece exists in its kit, counts never decrease, BUILD deterministic, footprint <= 18 m, credits complete)
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/c3_kinds_test.mjs --bundle --format=esm --platform=node --outfile=/tmp/c3_kinds_test.bundle.mjs --log-level=error
node /tmp/c3_kinds_test.bundle.mjs
