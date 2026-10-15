#!/bin/bash
# TR2-S5 layout test: bundles dev/tr2_layout_test.js with esbuild and runs it in node.  Last line: "TR2 LAYOUT OK"
D="$(cd "$(dirname "$0")" && pwd)"; OUT=${TMPDIR:-/tmp}/tr2_layout_test.mjs
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/tr2_layout_test.js" --bundle --format=esm --platform=node --outfile="$OUT" --log-level=error --loader:.json=json \
  --banner:js='globalThis.window = globalThis; globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), baseURI: "http://x/" };' && node "$OUT"
