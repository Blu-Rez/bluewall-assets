#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/spell_dev.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/spell_dev.bundle.js 2>&1 | grep -i "error" ; true
