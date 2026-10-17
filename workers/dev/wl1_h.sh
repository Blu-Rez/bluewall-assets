#!/bin/bash
# WL1: try several keep-ring heights on the home map at level 50 (phone size) — frames + per-ring pixel pass.   bash dev/wl1_h.sh "24 32"   -> /tmp/wl1_h<H>.log, /home/claude/work/wl1_h<H>_L50_*
for h in ${1:-"24 32"}; do cd /home/claude/dev && INNERH=$h IDS=1 W=844 H=390 python3 -I wl1_shot.py h$h "L50=S:50" > /tmp/wl1_h$h.log 2>&1; done
