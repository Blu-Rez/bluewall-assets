#!/bin/bash
# TR2-S4c: the same views, new (s4c=1) and old (s4c=0), one after the other:  bash tr2_s4c_ab.sh TAG LV   (env VIEWS, CENSUS, URLQ_EXTRA passes through)
cd /home/claude/dev
TAG=${1:-ab}; LV=${2:-30}
for m in 1 0; do
  VIEWS=${VIEWS:-top,ctr,town,fields,lake} CENSUS=1 URLQ="s4c=$m${URLQ_EXTRA}" python3 tr2_s4c_run.py ${TAG}_s4c$m $LV > /home/claude/work/s4c/${TAG}_s4c$m.log 2>&1
done
echo AB_DONE >> /home/claude/work/s4c/${TAG}_s4c0.log
