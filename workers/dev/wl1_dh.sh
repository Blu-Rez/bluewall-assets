#!/bin/bash
# WL1: per-ring pixel counts of the home camera (844x390, level 50) for several keep-ring heights:  bash dev/wl1_dh.sh "16 20 24 28"  -> /tmp/wl1_dh<H>.log
for h in ${1:-"16 20 24 28"}; do cd /home/claude/dev && INNERH=$h LEVEL=50 N=3 W=844 H=390 python3 -I wl1_det.py > /tmp/wl1_dh$h.log 2>&1; done
