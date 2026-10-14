#!/bin/bash
# rebuild release + debug bundles
C=/home/claude/bot/bluebot_v2/bluewall/client
cd $C && bash build.sh 2>&1 | tail -1 && npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"0\" --legal-comments=none --outfile=/home/claude/dev/app_dbg.js 2>&1 | tail -1
