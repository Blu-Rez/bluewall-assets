#!/bin/bash
# c2_mkkit.sh — regenerates web/assets/kit_c2.glb: procedural props (dev/c2_genparts.mjs) + the real forge pieces (recipe dev/c2_recipe.json) packed by dev/c2_mkkit.mjs.
# needs /tmp/claude-0/gt (@gltf-transform, set up by setup_lite.sh) and the sparse clone /home/claude/blu-rez/bluewall-assets (v4/sketchfab/iron).
set -e
OUT=/home/claude/bot/bluebot_v2/bluewall/web/assets/kit_c2.glb
node /home/claude/dev/c2_genparts.mjs > /tmp/c2_gen.log
cp /home/claude/dev/c2_mkkit.mjs /tmp/claude-0/gt/ && cd /tmp/claude-0/gt && node c2_mkkit.mjs /home/claude/dev/c2_recipe.json "$OUT" 2>&1 | tail -2
mv "${OUT%.glb}.report.json" /home/claude/dev/c2_kit.report.json
ls -la "$OUT"
