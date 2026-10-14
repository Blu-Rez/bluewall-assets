#!/bin/bash
# build the pasture dev page bundle (three resolved from the client's node_modules)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/pas_dev.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/pas_dev.bundle.js
