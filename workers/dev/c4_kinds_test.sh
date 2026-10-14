#!/bin/bash
# C4 contract test: prints "C4 OK" (needs web/assets/kit_c4.glb)
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/c4_kinds_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/c4_kinds_test.cjs --log-level=error && node /home/claude/dev/c4_kinds_test.cjs
