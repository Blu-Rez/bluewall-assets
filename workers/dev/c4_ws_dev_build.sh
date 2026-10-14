#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/c4_ws_dev.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/c4_ws_dev.bundle.js --log-level=error
