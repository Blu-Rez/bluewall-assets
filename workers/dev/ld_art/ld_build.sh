#!/bin/bash
# build the offline key-art pages (three.js from the client's node_modules)
cd /home/claude/bot/bluebot_v2/bluewall/client
for n in "$@"; do NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/ld_art/$n.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/ld_art/$n.bundle.js --log-level=warning; done
