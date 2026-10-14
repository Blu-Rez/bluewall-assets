#!/usr/bin/env bash
# b2_homes_test.sh — B2 acceptance test: prints "B2 OK" (every homePieces name is in the kit, deterministic per seed, <= 1.5k tris per house, kit <= 400 KB, credits file).
set -euo pipefail
GT=${GT:-/tmp/claude-0/gt}
[ -d "$GT/node_modules/@gltf-transform" ] || { echo "need the @gltf-transform install of devkit/setup_lite.sh in $GT"; exit 2; }
cp "$(dirname "$0")/b2_homes_test.mjs" "$GT/b2_homes_test.mjs"
cd "$GT" && node b2_homes_test.mjs
