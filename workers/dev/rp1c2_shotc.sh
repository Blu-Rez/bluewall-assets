#!/bin/bash
# rp1c2_shotc.sh TAG NAME PX "x,y,w,h" DRAG LOOK [outdir] [LIGHT 0..2]  — one canvas crop (rp1c2_L_canvas.js) of the game in browser session TAG -> outdir/NAME.png  (the game must have the hero started)
TAG=$1; NAME=$2; PX=$3; CROP=$4; DRAG=${5:-0}; LOOK=${6:-0}; OUT=${7:-/home/claude/work/photos_r2}; LIGHT=${8:-\"\"}; mkdir -p $OUT
Q="python3 /home/claude/dev/rp1c2_q.py -t $TAG"
$Q eval "window.__PX=$PX; window.__CROP=[$CROP]; window.__DRAG=$DRAG; window.__LOOK=$LOOK; window.__LIGHT=$LIGHT; 1" > /dev/null
TMO=900 $Q evalf /home/claude/dev/rp1c2_L_canvas.js > /tmp/shotc_$NAME.json 2>&1
python3 /home/claude/dev/rp1c2_png.py /tmp/shotc_$NAME.json $OUT/$NAME.png
