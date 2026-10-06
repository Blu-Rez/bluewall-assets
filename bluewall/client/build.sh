#!/usr/bin/env bash
# Rebuild ../web/app/wall.js from src/ (needs node + `npm i` in this folder).
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm i --no-audit --no-fund
npx esbuild src/main.js --bundle --format=iife --minify --target=es2020 --define:__BUILD__=\"$(date +%s)\" \
  --legal-comments=none --outfile=../web/app/wall.js
ls -la ../web/app/wall.js
