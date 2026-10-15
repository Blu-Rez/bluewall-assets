#!/bin/bash
cd /home/claude/work/an1_r2
P=$1; T=$2; L=out/strips_$T.log; : > $L
run(){ timeout 600 python3 strip.py $P $T "$@" >> $L 2>&1; }
run cartman 20 280 8 26 '{"span":18,"maxSteps":420}'
run carthorse 20 280 14 26 '{"span":18,"maxSteps":420}'
run cow 249 258 10 26 '{"span":14,"vmin":0.45,"maxSteps":1200}'
run trot 249 258 14 26 '{"span":18,"vmin":1.5,"maxSteps":1800}'
run dog 0 0 6 26 '{"span":10,"maxSteps":420}'
run gallop 0 0 18 26 '{"span":30,"mstep":2,"vmin":5,"maxSteps":900}'
echo ALLDONE >> $L
