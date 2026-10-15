#!/bin/bash
# AU1 (sound): music logic, night animals, mosquito-ding spectrum, music assets.   Last line: "AU1 OK"   Run: bash dev/au1_test.sh
#   1  au1_logic_test.js      REAL audio.js + tod.js on a virtual clock (mock AudioContext / <audio> / timers):
#                             48 game hours with no animal sound in the dark, gain sampling (never 2 audible tracks, no jumps), fades, hidden tab, hysteresis
#   2  au1_spectrum_test.py   every one-shot (synth ones rendered in headless Chromium OfflineAudioContext, mp3 ones decoded x loudest game volume):
#                             no pure tone above 1.8 kHz over -24 dBFS
#   3  au1_assets_test.py     file sizes (<= 400 KB each, <= 2 MB new), loudness, clipping, fades, originals untouched
set -euo pipefail
D=$(cd "$(dirname "$0")" && pwd); C=/home/claude/bot/bluebot_v2/bluewall/client; T=${TMPDIR:-/tmp}/au1_test; mkdir -p "$T"
cd "$C"; export NODE_PATH=$PWD/node_modules
echo "== 1/3 music + animal logic (virtual 48 game hours)"
npx esbuild "$D/au1_logic_test.js" --bundle --platform=node --format=esm --outfile="$T/logic.mjs" --log-level=error
node "$T/logic.mjs"
echo "== 2/3 spectrum of every one-shot"
npx esbuild "$D/au1_export.js" --bundle --platform=node --format=esm --outfile="$T/export.mjs" --log-level=error
node "$T/export.mjs" > "$T/tables.json"
python3 -c "import json,sys; json.dump(json.load(open('$T/tables.json'))['ONESHOT_MAX'], open('$T/levels.json','w'))"
npx esbuild "$D/au1_render.js" --bundle --format=iife --platform=browser --outfile="$T/render.bundle.js" --log-level=error
python3 "$D/au1_spectrum_test.py" "$T/render.bundle.js" --max-vol "$T/levels.json" --json "$T/spectrum.json"
echo "== 3/3 audio files"
python3 "$D/au1_assets_test.py" "$T/tables.json"
echo "AU1 OK"
