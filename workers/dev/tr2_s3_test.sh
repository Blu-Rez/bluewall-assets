#!/bin/bash
# TR2-S3: castle_tr2.js logic.  Last line: "TR2 S3 OK"
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
D=/home/claude/dev
NODE_PATH=$PWD/node_modules npx esbuild "$D/tr2_s3_test.js" --bundle --platform=node --format=cjs --outfile=/tmp/tr2_s3_test.cjs --log-level=error --banner:js="globalThis.window=globalThis.window||{};globalThis.document=globalThis.document||{createElement:()=>({getContext:()=>null}),baseURI:'http://x/'};globalThis.navigator=globalThis.navigator||{};" && node /tmp/tr2_s3_test.cjs
