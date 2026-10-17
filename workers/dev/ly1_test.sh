#!/bin/bash
# LY1 test: the REAL client modules (layout_rules / live / sync / wire / text) against the REAL local server (dev/ly1_server.py, memory state) on its own port.  Last line: "LY1 OK (n checks)"
D="$(cd "$(dirname "$0")" && pwd)"; PORT=${LY1_PORT:-8597}; OUT=${TMPDIR:-/tmp}/ly1_test.mjs
python3 "$D/ly1_server.py" $PORT "${LY1_BUNDLE:-$D/app_dbg.js}" > ${TMPDIR:-/tmp}/ly1_srv.log 2>&1 & SP=$!
trap 'kill $SP 2>/dev/null' EXIT
for i in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:$PORT/rig/log && break; sleep 0.3; done
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/ly1_test.js" --bundle --format=esm --platform=node --outfile="$OUT" --log-level=error --loader:.json=json \
  --banner:js='globalThis.window = globalThis; globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), baseURI: "http://x/" };' && LY1_BASE=http://127.0.0.1:$PORT node "$OUT"
