#!/bin/bash
# Counter-matrix runner: bash dev/bsm.sh [--sim /path/battlesim.js] [harness args...]   (2 slices in parallel, merged + printed by bsm_report.py)
set -e
SIM=/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js; ARGS=()
while [ $# -gt 0 ]; do if [ "$1" = "--sim" ]; then SIM="$2"; shift 2; else ARGS+=("$1"); shift; fi; done
TAG=${TAG:-run}; W=/home/claude/dev/s32/mx; mkdir -p $W
sed "s#/home/claude/bot/bluebot_v2/bluewall/client/src/battlesim.js#$SIM#" /home/claude/dev/bs_matrix.js > $W/bs_matrix_$TAG.js
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild $W/bs_matrix_$TAG.js --bundle --platform=node --format=cjs --outfile=$W/bs_matrix_$TAG.cjs --log-level=error --loader:.json=json
cd /home/claude/dev
N=${NSLICE:-2}
for i in $(seq 0 $((N-1))); do node $W/bs_matrix_$TAG.cjs "${ARGS[@]}" --slice $i/$N --out $W/out_${TAG}_$i.json & done
wait
python3 /home/claude/dev/bsm_report.py $W/out_${TAG}_*.json
