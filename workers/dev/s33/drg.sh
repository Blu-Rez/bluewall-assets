#!/bin/bash
# drg.sh OUT 'json variants' : build the dragon portrait lab and render the variants
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/s33/drg_port.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/s33/drg_port.bundle.js || exit 1
cd /home/claude/dev && bash sem.sh python3 s33/drg_run.py "$1" "$2"
