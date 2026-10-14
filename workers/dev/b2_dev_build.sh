#!/bin/bash
# b2_dev_build.sh — bundles the B2 viewer (dev/b2_dev.js -> dev/b2_dev.bundle.js)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/b2_dev.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/b2_dev.bundle.js --log-level=error
