#!/bin/bash
# dlab.sh TAG "<js list>" [W H] : build dragon lab, run js, screenshot s33/TAG_a.png
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/dragon_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/dragon_lab.bundle.js || exit 1
cd /home/claude/dev; echo '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#111;overflow:hidden}</style></head><body><script src="dragon_lab.bundle.js"></script></body></html>' > dragon_lab.html
W=${W:-2000} H=${H:-560} bash sem.sh python3 lab_shot.py dragon_lab.html s33/$1 "a=$2"
