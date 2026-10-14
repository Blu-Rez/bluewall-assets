#!/bin/bash
# C2 data contract: kinds / pieces in the kits / counts grow / BUILD deterministic / footprint <= 18 m / front +z.   prints "C2 OK"
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/c2_kinds_test.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/c2_kinds_test.cjs --log-level=error && node /home/claude/dev/c2_kinds_test.cjs
