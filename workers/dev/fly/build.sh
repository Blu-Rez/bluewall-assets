#!/bin/bash
# build.sh name : bundle /home/claude/dev/fly/<name>.js -> <name>.bundle.js
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/fly/$1.js --bundle --format=iife --target=es2020 --log-level=warning --loader:.json=json --outfile=/home/claude/dev/fly/$1.bundle.js
