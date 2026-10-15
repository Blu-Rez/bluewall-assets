#!/bin/bash
# idle_all.sh — F2 proof: programs over 120 s of NO input after the first draw, before / after, at a pinned day hour (14) and with dusk near (16.8)
cd /home/claude
for T in before after; do for H in 14 16.8; do echo "== $T h=$H"; TAG=$T H=$H SECS=${SECS:-120} python3 dev/pf2/idle.py $T 2>&1 | tail -8; done; done
