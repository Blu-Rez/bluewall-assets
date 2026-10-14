#!/bin/bash
# RP4: check a sister's kit file.  usage: bash dev/rp4_kit_check.sh <sister>     (the file is web/assets/rpg/combat/kit_<sister>.js; or give a path:  bash dev/rp4_kit_check.sh <sister> /abs/path/kit.js)
# Exit 0 + "KIT OK" = it follows the contract (every field, every beat connects, every skill effect works, the guard works, 25 s random fight is stable + deterministic).  "KIT FAILED" lists the field path of each error.
set -e
ID="${1:?usage: rp4_kit_check.sh <sister> [kit file]}"; D=$(cd "$(dirname "$0")" && pwd)
KIT="${2:-/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/combat/kit_${ID}.js}"; [ -f "$KIT" ] || { echo "no such kit file: $KIT"; exit 2; }
E=$(mktemp /tmp/rp4_kc_XXXX.js); printf "import KIT from '%s';\nimport { runCheck } from '%s/rp4_kit_check.js';\nrunCheck(KIT, '%s');\n" "$KIT" "$D" "$ID" > "$E"
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild "$E" --bundle --platform=node --format=cjs --outfile=/tmp/rp4_kc_$ID.cjs --log-level=error && node /tmp/rp4_kc_$ID.cjs
