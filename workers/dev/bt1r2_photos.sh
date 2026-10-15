#!/bin/bash
# regenerates the BT1_R2 photo set (gallery pages + camp frames) one at a time; log work/bt1r2/photos.log
cd /home/claude/dev; L=/home/claude/work/bt1r2/photos.log; : > $L
say() { echo "[$(date +%H:%M:%S)] $*" >> $L; }
TAG= python3 bt1r2_units.py all >> $L 2>&1; say "units done"
STAND=1 TAG=_stand python3 bt1r2_units.py 0 >> $L 2>&1; say "units stand done"
python3 bt1r2_camp.py shipped,stand,palisade,broken >> $L 2>&1; say "camp done"
say ALLDONE
