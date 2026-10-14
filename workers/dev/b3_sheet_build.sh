#!/bin/bash
# bundles the B3 sample-sheet viewer (real b3_civic.js + village.js bakePieces + the real kit)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/b3_sheet.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/b3_sheet.bundle.js --log-level=error
