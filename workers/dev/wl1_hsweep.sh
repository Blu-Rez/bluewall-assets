#!/bin/bash
# WL1: re-run the node tests that know the keep ring (a1_rings_test, tr2_s3_test, tr2_s4a/b/c/d) with another keep-ring height (a1_rings.js reads window.__a1InnerH at load):   bash dev/wl1_hsweep.sh 24
H=${1:-24}; cd /home/claude/bot/bluebot_v2/bluewall/client || exit 1
for t in a1_rings_test tr2_s3_test tr2_s4a_test tr2_s4b_test tr2_s4c_test tr2_s4d_test; do
  [ -f /home/claude/dev/$t.js ] || continue
  NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/$t.js --bundle --platform=node --format=cjs --loader:.json=json --banner:js="globalThis.window={__a1InnerH:$H};" --outfile=/tmp/wl1_hs_$t.cjs --log-level=error 2>&1 | tail -2
  echo "== $t @ INNER_H=$H: $(node /tmp/wl1_hs_$t.cjs 2>&1 | grep -E 'FAIL|OK|FAILED' | tail -4 | tr '\n' ' ')"
done
