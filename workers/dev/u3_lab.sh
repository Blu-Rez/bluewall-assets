#!/bin/bash
# u3_lab.sh : rebuild the U3 lab bundle (esbuild, like batrun.sh).  Shot:  python3 dev/u3_shot.py OUT.png "u=lich&t=3" [W H]
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/u3_lab.js --bundle --format=iife --outfile=/home/claude/dev/u3_lab.bundle.js --log-level=warning 2>&1 | head -20
