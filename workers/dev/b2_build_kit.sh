#!/usr/bin/env bash
# b2_build_kit.sh [OUT.glb]  — packs dev/b2_recipe.mjs into web/assets/kit_homes.glb (needs the @gltf-transform install of setup_lite in /tmp/claude-0/gt).   ONLY=regex builds a subset.
set -euo pipefail
OUT=${1:-/home/claude/bot/bluebot_v2/bluewall/web/assets/kit_homes.glb}
cp /home/claude/dev/b2_mkkit.mjs /tmp/claude-0/gt/b2_mkkit.mjs
cd /tmp/claude-0/gt && node b2_mkkit.mjs ${RECIPE:-/home/claude/dev/b2_recipe.mjs} "$OUT"
