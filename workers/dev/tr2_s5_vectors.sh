#!/bin/bash
# TR2-S5: writes docs/tr2_s5_geom.json + docs/tr2_s5_vectors.json from the game code (OUTDIR default: workers/docs).  Re-run when the town data (plan, roads, terrain, stores, vaults) changes.
D="$(cd "$(dirname "$0")" && pwd)"; OUTJS=${TMPDIR:-/tmp}/tr2_s5_vectors.mjs; [ -n "$1" ] && export OUT="$1"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$D/tr2_s5_vectors.js" --bundle --format=esm --platform=node --outfile="$OUTJS" --log-level=error --loader:.json=json \
  --banner:js='globalThis.window = globalThis; globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), baseURI: "http://x/" };' && node "$OUTJS"
