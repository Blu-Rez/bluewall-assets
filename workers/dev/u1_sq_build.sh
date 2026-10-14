#!/bin/bash
# u1_sq_build.sh : bundle the squad-icon page (sq_dev.js paints the ring-atlas emblems through the real squadicon.js) -> u1_sq.bundle.js, then open u1_sq.html?t=legionary,captain on the dev server (bash dev/up.sh)
C=/home/claude/bot/bluebot_v2/bluewall/client
cd $C && NODE_PATH=$C/node_modules npx esbuild /home/claude/dev/sq_dev.js --bundle --format=iife --define:__BUILD__=\"0\" --outfile=/home/claude/dev/u1_sq.bundle.js --log-level=warning
