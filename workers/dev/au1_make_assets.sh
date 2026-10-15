#!/bin/bash
# AU1: rebuilds every audio file AU1 changed or added in web/assets/audio/ from the ORIGINALS of the kit (base_snapshot) / from au1_music.py.
#   bash dev/au1_make_assets.sh            sfx_bell + sfx_anvil (filtered) and the calm music tracks
#   bash dev/au1_make_assets.sh sfx        only the two filtered one-shots
# The originals are never edited in place: this script always starts from /home/claude/base_snapshot (set AU1_ORIG to point somewhere else).
set -euo pipefail
ORIG=${AU1_ORIG:-/home/claude/base_snapshot/web/assets/audio}; OUT=/home/claude/bot/bluebot_v2/bluewall/web/assets/audio; D=$(cd "$(dirname "$0")" && pwd)
[ -f "$ORIG/sfx_bell.mp3" ] || { echo "missing originals in $ORIG"; exit 1; }
# the anvil's 2.56 kHz ring was a sustained pure tone 45 dB above its floor (the second "mosquito"): notch it, soften the 5.1 kHz ring and everything above 3.8 kHz, +5 dB to keep the body
ffmpeg -v error -y -i "$ORIG/sfx_anvil.mp3" -af "equalizer=f=2562:t=q:w=10:g=-22,equalizer=f=5100:t=q:w=12:g=-12,lowpass=f=3800:poles=2,volume=5dB" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k "$OUT/sfx_anvil.mp3"
# the bell had six strokes (12 s) with partials up to 5 kHz: keep the first three strokes, 24 dB/oct low-pass at 1.5 kHz, fade out, +2 dB
ffmpeg -v error -y -i "$ORIG/sfx_bell.mp3" -t 6.4 -af "lowpass=f=1500:poles=2,lowpass=f=1500:poles=2,afade=t=out:st=4.6:d=1.8,volume=2dB" -ac 1 -ar 44100 -c:a libmp3lame -b:a 64k "$OUT/sfx_bell.mp3"
ls -l "$OUT/sfx_anvil.mp3" "$OUT/sfx_bell.mp3"
[ "${1:-}" = sfx ] && exit 0
python3 "$D/au1_music.py" --out "$OUT"
