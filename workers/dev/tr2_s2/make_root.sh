#!/bin/bash
# builds the static root the browser proof needs (symlinks only)
set -e
D=$(cd "$(dirname "$0")" && pwd); R=${ROOT:-/tmp/tr2_root}; LIB=${LIB:-/home/claude/lib/lib/tripo}; APP=${APP:-/home/claude/bot/bluebot_v2/bluewall}
mkdir -p "$R/s2assets/tr2"; cd "$R"
ln -sfn "$APP/client/node_modules/three" three; ln -sfn "$APP/client/src" src
cp "$D/tr2_s2.html" "$D/s2.py" .; cp "$APP/web/assets/tr2/swap.json" s2assets/tr2/swap.json
for t in wood stone iron gold diamond_ice diamond_green diamond_red diamond_black diamond_blue; do for k in castle_wall castle_gate castle_tower_short castle_tower_medium castle_tower_tall; do
  ln -sf "$LIB/castle/${k}_${t}/${k}_${t}.glb" "s2assets/tr2/${k}_${t}.glb"; done; done
echo "ready: $R  (serve it on :8777)"
