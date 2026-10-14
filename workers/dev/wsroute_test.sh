#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/wsroute_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/wsroute_test.cjs --log-level=error --inject:/home/claude/dev/stub_dom.js && node /home/claude/dev/wsroute_test.cjs
