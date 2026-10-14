#!/bin/bash
# mkbase.sh — build the BEFORE bundle for before/after screenshots.  BEFORE = /home/claude/base_snapshot (the code the owner runs now, taken by setup_lite.sh).
# Creates: dev/app_base_dbg.js, dev/app_base/wall.js, dev/dev_base.html (= dev_s35.html on the BEFORE bundle), dev/a1_shot_base.py (= a1_shot.py on dev_base.html).
# Use:  bash dev/mkbase.sh ; then   python3 dev/a1_shot.py after "30:ctr,..."   and   python3 dev/a1_shot_base.py before "30:ctr,..."   (same SPEC / VIEWDEF → same cameras).  One browser job at a time.
set -e
W=$(mktemp -d); mkdir -p $W/client && cp -a /home/claude/base_snapshot/client/src $W/client/src
cp /home/claude/base_snapshot/client/package.json $W/client/ 2>/dev/null || true
ln -s /home/claude/bot/bluebot_v2/bluewall/client/node_modules $W/client/node_modules
( cd $W/client && npx esbuild src/main.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"0\" --legal-comments=none --outfile=/home/claude/dev/app_base_dbg.js --log-level=error )
cd /home/claude/dev && mkdir -p app_base && ln -sfn ../app_base_dbg.js app_base/wall.js
sed 's#app_s35/wall.js#app_base/wall.js#' dev_s35.html > dev_base.html
sed 's#dev_s35.html#dev_base.html#' a1_shot.py > a1_shot_base.py
grep -q app_base dev_base.html && grep -q dev_base a1_shot_base.py && echo "BEFORE bundle ready (dev_base.html, a1_shot_base.py)"
