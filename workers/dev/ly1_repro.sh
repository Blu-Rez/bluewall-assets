#!/bin/bash
# ly1_repro.sh [SRC_DIR] — the owner's «moved house removed later» (E1) against the real server.  Needs:  python3 dev/ly1_server.py 8591 &
#   SRC_DIR = the client src of the kit BEFORE LY1 (default: this tree).  Before: cottage_02 disappears from the screen during the slow POST, the next move deletes it on the server.
D="$(cd "$(dirname "$0")" && pwd)"; SRC=${1:-/home/claude/bot/bluebot_v2/bluewall/client/src}; OUT=${TMPDIR:-/tmp}/ly1_repro.mjs
sed "s#/home/claude/bot/bluebot_v2/bluewall/client/src#$SRC#g" "$D/ly1_repro.js" > ${TMPDIR:-/tmp}/ly1_repro_x.js
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild ${TMPDIR:-/tmp}/ly1_repro_x.js --bundle --format=esm --platform=node --outfile="$OUT" --log-level=error --loader:.json=json \
  --banner:js='globalThis.window = globalThis; globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), baseURI: "http://x/" };' && node "$OUT"
