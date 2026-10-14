#!/bin/bash
# a2_run.sh <script.mjs> [args...] : bundle a dev script with esbuild (node platform) and run it
S=$1; shift
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild "$S" --bundle --platform=node --format=cjs --outfile=/tmp/a2_$(basename "$S").cjs --log-level=error && node /tmp/a2_$(basename "$S").cjs "$@"
