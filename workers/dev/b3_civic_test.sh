#!/bin/bash
# B3 logic + kit test: prints `B3 OK` (exit 0) or `B3 FAIL n`.  (seconds)
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/b3_civic_test.mjs --bundle --platform=node --format=esm --outfile=/tmp/b3_civic_test.out.mjs --log-level=error
node /tmp/b3_civic_test.out.mjs
