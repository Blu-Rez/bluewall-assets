#!/bin/bash
# WL1: the home map at the phone size (844x390), wall levels + the per-ring pixel pass (IDS=1) and, with OCC=<ring>, the "what hides that ring" pass.
#   bash dev/wl1_run.sh TAG [SPEC]      default SPEC = L50=S:50,L25=S:25,L15=S:15,K50W20=M:50/20,K50W49=M:50/49
#   (≈ 10-15 min in software GL; log /tmp/wl1_TAG.log, frames /home/claude/work/wl1_TAG_*)   e.g.   OCC=inner bash dev/wl1_run.sh r4 "L50=S:50,L25=S:25"
TAG=${1:-r}; SPEC=${2:-"L50=S:50,L25=S:25,L15=S:15,K50W20=M:50/20,K50W49=M:50/49"}
cd /home/claude/dev && IDS=1 W=844 H=390 python3 -I wl1_shot.py "$TAG" "$SPEC" > /tmp/wl1_$TAG.log 2>&1
