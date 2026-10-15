#!/bin/bash
# rp1c_collide_test.sh — RP1C_R3 (ROUND4 A1 item 1): the collision test.  Boots the real game (software GL), starts the hero and walks / runs / dodges her into EVERY door, castle wall / tower / gate / ballista box, disc collider and
# 160 free-standing surfaces (house walls, fences, tents, timber) at 8 approach angles (doors: the 8 angles of the half-plane in front; the dodge also at 20 fps = the longest frame the game allows) and counts
#   (a) frames with the hero centre inside a solid   (b) stuck >= 0.5 s while the stick pushes and a slide was possible   (c) pass-through events (+ «unstuck» teleports)
# Prints «RP1C COLLIDE OK» when all three are 0.  The test page itself: dev/rp1c_collide_page.js (window.__ctStart({grid:true|false}); grid:false = the boxes / discs only, i.e. the «before» numbers).   (~5 min)
python3 /home/claude/dev/rp1c3_page.py collide > /tmp/rp1c_collide.out 2>&1; R=$?
cat /tmp/rp1c_collide.out | cut -c1-300
[ $R = 0 ] && echo "RP1C COLLIDE OK" || echo "RP1C COLLIDE FAILED"
exit $R
