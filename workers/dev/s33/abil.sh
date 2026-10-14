#!/bin/bash
# abil.sh [query] : build + render the ability emblems
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/s33/abil_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/s33/abil_lab.bundle.js || exit 1
cd /home/claude/dev && bash sem.sh python3 s33/abil_run.py "$1"
