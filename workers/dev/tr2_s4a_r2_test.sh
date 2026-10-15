#!/bin/bash
# TR2-S4a data test: prints `TR2 S4A OK` (exit 0) or `TR2 S4A FAIL n`.
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/tr2_s4a_r2_test.mjs --bundle --platform=node --format=esm --outfile=/tmp/tr2_s4a_r2_test.out.mjs --log-level=error
node /tmp/tr2_s4a_r2_test.out.mjs
