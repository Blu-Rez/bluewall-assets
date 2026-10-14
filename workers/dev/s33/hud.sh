#!/bin/bash
# hud.sh OUT W H "query"...: build + shoot the DOM-only battle HUD
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/s33/hud_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/s33/hud_lab.bundle.js --loader:.json=json || exit 1
cd /home/claude/dev && OUT=$1 W=$2 H=$3; shift 3; bash sem.sh python3 s33/hud_run.py "$OUT" "$W" "$H" "$@"
