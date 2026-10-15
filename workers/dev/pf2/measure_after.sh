#!/bin/bash
# measure_after.sh <tag> — the 7-state program table (pf2/progs.py) + the instanceColor census (pf2/inst_census.py) for one build tag
cd /home/claude; T=${1:-after}
TAG=$T python3 dev/pf2/progs.py $T > work/pf2/$T.log 2>&1
TAG=$T python3 dev/pf2/inst_census.py $T > work/pf2/$T.inst.log 2>&1
echo done > work/pf2/$T.measure.done
