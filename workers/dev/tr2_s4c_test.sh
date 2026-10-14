#!/bin/bash
# TR2-S4c test chain (software GL, NOT phone numbers).  bash dev/tr2_s4c_test.sh [LV]   (default 30)
#   1. build release + debug bundles (rb.sh)
#   2. A/B frames + perf + census at 5 strategic cameras: new (s4c=1) and old (s4c=0)  -> work/s4c/final_s4c{1,0}/*.png + .log
#   3. shader programs  Q=high  (p39_progs.py)   baseline 203, allowed +0..2
#   4. GATE_W (must print  GATE_W: ALL OK , noRoute < 700, baseline 667)
# one browser job at a time: this script runs them one after the other.
set -u
LV=${1:-30}
cd /home/claude/dev
bash rb.sh > /home/claude/work/s4c/final_build.log 2>&1 || { echo BUILD FAILED; tail -20 /home/claude/work/s4c/final_build.log; exit 1; }
bash tr2_s4c_ab.sh final $LV
for m in 1 0; do grep -E '^perf|^stats|^s4c' /home/claude/work/s4c/final_s4c$m.log; done
Q=high python3 p39_progs.py $LV 2>&1 | tail -5
bash gate_w.sh 2>&1 | tail -8
