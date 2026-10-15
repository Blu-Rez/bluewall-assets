#!/bin/bash
# TR2_H data test: prints `TR2 H OK` (exit 0) or `TR2 H FAIL n`.
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/tr2_h_test.mjs --bundle --platform=node --format=esm --outfile=/tmp/tr2_h_test.out.mjs --log-level=error
node /tmp/tr2_h_test.out.mjs
