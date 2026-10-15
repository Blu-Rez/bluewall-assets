#!/bin/bash
# ST1 structural numbers: the SAME fixed camera before (?st1=0) and after (default) — draw calls / triangles / programs. Starts when the shot runs are done.
cd /home/claude/dev
while [ ! -f /home/claude/work/st1/p_after_done.txt ]; do sleep 5; done
URLQ="st1=0" python3 st1_perf.py perf_before 30 > /home/claude/work/st1/p_perf_before.log 2>&1
python3 st1_perf.py perf_after 30 > /home/claude/work/st1/p_perf_after.log 2>&1
echo DONE > /home/claude/work/st1/p_perf_done.txt
