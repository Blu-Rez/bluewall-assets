#!/bin/bash
# R7: owner army vs the real map (usage: [FULL=1] [NS=4] [TUNE_KV="k=v,..."] bash dev/r7.sh [ratios])
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/plan5/r7.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/plan5/r7.cjs --log-level=error --loader:.json=json && cd /home/claude/dev/plan5 && node r7.cjs "$@"
