#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/bs_wall.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/bs_wall.cjs --log-level=error --loader:.json=json && cd /home/claude/dev && node bs_wall.cjs "$@"
