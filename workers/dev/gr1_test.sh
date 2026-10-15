#!/bin/bash
# GR1: the roads (no dead ends / water / house overlaps, tier + surface on every road) and the near-ground map + shader budget (logic, no GPU). prints "GR1 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/gr1_test.js --bundle --platform=node --format=cjs --define:__BUILD__=\"0\" --outfile=/home/claude/dev/gr1_test.cjs --log-level=error && node -e "globalThis.window={}; globalThis.document={createElement:()=>({getContext:()=>({})})}; globalThis.location={search:''}; require('/home/claude/dev/gr1_test.cjs')"
