#!/bin/bash
# RP4: combat core logic (pure engine: timings, i-frames, combo cancel windows, element multipliers, lock-on, deterministic replay).  Last line: "RP4 OK"
D=$(cd "$(dirname "$0")" && pwd)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/rp4_test.js" --bundle --platform=node --format=cjs --outfile=/tmp/rp4_test.cjs --log-level=error && node /tmp/rp4_test.cjs
