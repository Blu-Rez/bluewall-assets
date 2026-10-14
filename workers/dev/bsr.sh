#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/bs_real.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/bs_real.cjs --log-level=error --loader:.json=json && cd /home/claude/dev && node bs_real.cjs "$@"
