#!/bin/bash
# bal35.sh [args]: reference-army calibration (castle K army vs a base of power ratio x P_REF), 2 slices in parallel.  e.g. TAG=a bash dev/bal35.sh --ref 1 --levels 10,20,30 --ratios 0.9,1.2,1.5 --seeds 3 --style plan
set -e
ARGS=("$@"); TAG=${TAG:-run}; W=/home/claude/dev/s35/bal; mkdir -p $W
sed "s#'./ref_armies.json'#'/home/claude/dev/ref_armies.json'#" /home/claude/dev/bs_matrix35.js > $W/bm_$TAG.js
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild $W/bm_$TAG.js --bundle --platform=node --format=cjs --outfile=$W/bm_$TAG.cjs --log-level=error --loader:.json=json
cd /home/claude/dev
for i in 0 1; do node $W/bm_$TAG.cjs "${ARGS[@]}" --slice $i/2 --out $W/out_${TAG}_$i.json & done
wait
python3 /home/claude/dev/bal35_report.py $W/out_${TAG}_*.json
