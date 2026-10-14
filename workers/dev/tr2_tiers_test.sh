#!/bin/bash
# TR2-S2: levels -> tiers (tiers.js) + the structure modules at other level caps.  Last line: "TR2 TIERS OK"
set -e
D=$(cd "$(dirname "$0")" && pwd)
echo "== 0. bit-identical at cap 30 (hashes of civicPieces / homePieces / ringsAt / countAt vs the kit p45)"
node "$D/tr2_golden.mjs" 2>/dev/null | tail -1 > /tmp/tr2_golden_now.json
python3 - "$D/tr2_golden_cap30.json" /tmp/tr2_golden_now.json <<'PY'
import json,sys
a=json.load(open(sys.argv[1])); b=json.load(open(sys.argv[2]))
bad=[k for k in a if a[k]!=b.get(k)]
print(("ok   " if not bad else "FAIL ")+"cap 30 output of civic / homes / rings / counts / TIER_AT identical to the kit"+("" if not bad else "  DIFF: "+",".join(bad)))
sys.exit(1 if bad else 0)
PY
cd /home/claude/bot/bluebot_v2/bluewall/client
echo "== compile: tr2lib.js bundles for the browser (imports resolve, no syntax errors)"
NODE_PATH=$PWD/node_modules npx esbuild src/tr2lib.js --bundle --platform=browser --format=esm --outfile=/tmp/tr2lib_bundle.js --log-level=error && echo "ok   tr2lib.js bundles ($(wc -c < /tmp/tr2lib_bundle.js) bytes with three + GLTFLoader)"
NODE_PATH=$PWD/node_modules npx esbuild "$D/tr2_tiers_test.js" --bundle --platform=node --format=cjs --outfile=/tmp/tr2_tiers_test.cjs --log-level=error && node /tmp/tr2_tiers_test.cjs
