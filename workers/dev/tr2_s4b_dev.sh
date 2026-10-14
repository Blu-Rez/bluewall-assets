#!/bin/bash
# TR2-S4b: bundle the worksite preview (real wsbuild + ws_tr2 + the Tripo models); the static server on :8777 serves /home/claude/dev
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/tr2_s4b/ws_dev.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/tr2_s4b/ws_dev.bundle.js --log-level=error
