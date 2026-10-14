#!/bin/bash
# builds web/assets/kit_c3.glb from dev/c3_recipe.json  (needs the gltf-transform install in /tmp/claude-0/gt, see next-prompt-p38 §6)
cd /tmp/claude-0/gt && cp /home/claude/dev/p38/mkkit.mjs . && node mkkit.mjs /home/claude/dev/c3_recipe.json /home/claude/bot/bluebot_v2/bluewall/web/assets/kit_c3.glb 2>&1 | grep -v "^prune\|^quantize\|^metalRough" | tail -5
