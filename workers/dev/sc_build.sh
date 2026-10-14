#!/bin/bash
# scatter lookdev bundle
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/sc_dev.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/sc_dev.bundle.js
