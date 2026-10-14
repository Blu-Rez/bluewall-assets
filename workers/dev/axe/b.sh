#!/bin/bash
# axe lookdev bundles: b.sh name  (axe/<name>.js -> axe/<name>.bundle.js)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/axe/$1.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/axe/$1.bundle.js
