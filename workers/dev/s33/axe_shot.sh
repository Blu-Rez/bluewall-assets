#!/bin/bash
# axe_shot.sh TAG [clip] [phases csv] [gait] [W H] : rider lab grid: one column per phase, rows = side(right) / 3/4 front-right / rear-right ; writes s33/TAG_a.png
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/rider_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/rider_lab.bundle.js || exit 1
cd /home/claude/dev
CL=${2:-AxeStrike}; PH=${3:-0,0.2,0.34,0.45,0.58,0.8}; GT=${4:-Gallop}; RT=${RT:--1.5708,-0.7,-2.4}
W=${W:-2400} H=${H:-1300} bash sem.sh python3 lab_shot.py rider_lab.html s33/$1 "a=window.__sp=9;window.__view={grid:1,rots:[$RT],dist:60,ty:3.0,span:8.4}; window.__build([$PH].map(u=>['bay','axe','$CL',u,'$GT'])); 1" 2>&1 | grep -v "^shot\|^JS\|^err \$\|^info"
