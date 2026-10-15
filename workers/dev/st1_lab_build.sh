#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/st1_lab.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"0\" --outfile=/home/claude/dev/st1_lab.bundle.js --log-level=error --loader:.glb=file 2>&1 | tail -5
