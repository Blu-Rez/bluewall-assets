#!/bin/bash
# fbuild.sh : rebuild the flyers lab bundle (+ prints errors)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/fly/fly_lab.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"0\" --loader:.json=json --log-level=warning --outfile=/home/claude/dev/fly/fly_lab.bundle.js 2>&1 | head -30
