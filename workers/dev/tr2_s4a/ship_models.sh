#!/bin/bash
# tr2_s4a_ship.sh — builds the S4a models into web/assets/tr2/ (re-textured: 512 px; 1K for the two landmarks; 256 px for the small-prop packs).
#   LIB = clone of branch lib-tripo (…/lib/tripo), SHIP = the S1b slimmed models (ship_TR2_S1b.tar.gz extracted: civic/… with tavern / hall / market hall), OUT = web/assets/tr2
set -e
LIB=${LIB:-/home/claude/lib/lib/tripo}; SHIP=${SHIP:-/home/claude/work/s4a/ship}; GT=${GT:-/tmp/claude-0/gt}
OUT=${OUT:-/home/claude/bot/bluebot_v2/bluewall/web/assets/tr2}; TOOL=$(cd "$(dirname "$0")/.." 2>/dev/null && pwd)/tools/tr2_retex.mjs
[ -f "$TOOL" ] || TOOL=/home/claude/bot/bluebot_v2/workers/tools/tr2_retex.mjs
mkdir -p "$OUT"; cp "$TOOL" "$GT/tr2_retex.mjs"
src() { local cat=$1 key=$2; if [ -f "$SHIP/$cat/$key/$key.glb" ]; then echo "$SHIP/$cat/$key/$key.glb"; else echo "$LIB/$cat/$key/$key.glb"; fi; }
one() { local cat=$1 key=$2 px=$3 tris=$4 from; from="$(src $cat $key)"
  if [ -n "$tris" ]; then mkdir -p /tmp/s4a_slim; (cd "$GT" && node slim_uv.mjs "$from" /tmp/s4a_slim/$key.glb $tris 1 Permissive >/dev/null); from=/tmp/s4a_slim/$key.glb; fi    # UV-aware simplify (S1b tool) BEFORE the texture is shrunk
  (cd "$GT" && node tr2_retex.mjs "$from" "$OUT/$key.glb" $px); }
# triangle targets (UV-aware simplify, S1b tool): a house is 40-80 px wide at the closest zoom, so 2.5-4k tris are plenty. Craftsman houses are NOT slimmed (every try opened holes in the roofs).
for k in house_cottage_0 house_cottage_1 house_cottage_2; do one houses $k 512 ${TRIS_COTTAGE:-3200}; done
for k in house_craftsman_0 house_craftsman_1 house_craftsman_2; do one houses $k 512 ${TRIS_CRAFTSMAN-}; done
for k in house_merchant_0 house_merchant_1 house_merchant_2; do one houses $k 512 ${TRIS_MERCHANT:-4400}; done
for k in house_noble_0 house_noble_1 house_noble_2; do one houses $k 512 ${TRIS_NOBLE:-4000}; done
for k in house_generic_a house_generic_b house_generic_c house_generic_d; do one houses $k 512 ${TRIS_GENERIC:-2600}; done
one civic shrine_0 512 ${TRIS_SHRINE:-3500}; one civic tavern_0 512 ${TRIS_TAVERN:-4500}
for k in well_stone well_qanat well_abanbar; do one civic $k 512 ${TRIS_WELL:-2200}; done
one civic civic_hall_0 1024 ${TRIS_HALL:-3000}; one civic market_hall 1024 ${TRIS_MHALL:-4500}
for k in props_town props_street market_stalls; do one props $k 256; done
du -sh "$OUT"; ls "$OUT" | wc -l
