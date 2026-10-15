#!/bin/bash
# run_after.sh — the six sim spots on the 'after' page
cd /home/claude/work/an1_r2
declare -A SP=( [A]="20,280" [B]="244,-100" [C]="38,-340" [D]="249,258" [E]="-300,-125" [F]="-100,60" )
for k in A B C D E F; do
  (echo "const P={spots:[[${SP[$k]}]],secs:50,dt:0.0333,warm:4};"; cat sim_kin.js) > /tmp/simaf_$k.js
  EVT=900 ./ev.sh /tmp/simaf_$k.js ${PORT:-8790} > out/sim_after_$k.json
  echo "done $k $(wc -c < out/sim_after_$k.json)"
done
