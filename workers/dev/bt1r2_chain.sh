#!/bin/bash
# runs the heavy BT1_R2 checks one after the other (software GL: one at a time).  log: work/bt1r2/chain.log
cd /home/claude/dev; L=/home/claude/work/bt1r2/chain.log; : > $L
say() { echo "[$(date +%H:%M:%S)] $*" >> $L; }
say "after rig + perf"; bash bt1r2_rig_build.sh after >> $L 2>&1; (cd /home/claude/dev && SHOT=1 python3 bt1r2_perf.py after > /home/claude/work/bt1r2/perf_after.log 2>&1); say "perf done"
(cd /home/claude/dev && SECS=6 python3 bt1r2_prof.py after > /home/claude/work/bt1r2/prof_after.log 2>&1); say "prof done"
bash bt1r2_test.sh > /home/claude/work/bt1r2/test_run2.log 2>&1; say "bt1r2_test exit $?"
bash gate_w.sh > /home/claude/work/bt1r2/gate_run1.log 2>&1; say "gate exit $?"
bash rb.sh > /home/claude/work/bt1r2/rb.log 2>&1; say "rb exit $?"
BT1_LEVELS=30 bash bt1_test.sh > /home/claude/work/bt1r2/bt1_run1.log 2>&1; say "bt1 exit $?"
say ALLDONE
