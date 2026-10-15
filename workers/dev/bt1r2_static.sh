#!/bin/bash
# bt1r2_static.sh - the static half of BT1R2 (node): bundles bt1r2_static.mjs with esbuild from the client's node_modules and runs it.  Prints the JSON line; exit 1 when it has fails.
C=/home/claude/bot/bluebot_v2/bluewall/client
( cd $C && npx esbuild /home/claude/dev/bt1r2_static.mjs --bundle --platform=node --format=cjs --outfile=/tmp/bt1r2_static.cjs --log-level=error ) || { echo '{"fails":["esbuild failed"]}'; exit 1; }
node /tmp/bt1r2_static.cjs
