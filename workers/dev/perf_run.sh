#!/bin/bash
# perf_run.sh new|old label levels...  (bundles with the client's esbuild; one core)
v=$1; shift
cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/perf_$v.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/perf_$v.cjs --log-level=error --loader:.json=json && node /home/claude/dev/perf_$v.cjs "$@"
