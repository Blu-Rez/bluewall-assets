#!/usr/bin/env bash
# mkpatch.sh <Wn> '<owned-regex>'   — builds /home/claude/patch_<Wn>.tar.gz : the ONLY thing you hand back to the mother chat.
#   owned files  (path matches the regex, or a NEW file): copied whole into  owned/
#   shared files (changed, but not yours)              : unified diff into   shared/<path>.diff   (the mother applies it with `patch`)
# Run step 0 once at the start:  cp -a /home/claude/bot/bluebot_v2/bluewall /home/claude/base_snapshot
set -euo pipefail
W=${1:?worker id, e.g. W2}; OWN=${2:?owned regex, e.g. ^client/src/(town|wsbuild)\\.js}
BASE=/home/claude/base_snapshot; CUR=/home/claude/bot/bluebot_v2/bluewall; OUT=/home/claude/patch_$W
[ -d "$BASE" ] || { echo "missing $BASE (step 0)"; exit 1; }
rm -rf "$OUT" "$OUT.tar.gz"; mkdir -p "$OUT/owned" "$OUT/shared"
cd "$CUR"
find . -type f ! -path './node_modules/*' ! -path './client/node_modules/*' ! -path '*/__pycache__/*' ! -name '*.pyc' ! -path './web/app/*' ! -path './client/dist/*' | sed 's#^\./##' | sort > /tmp/_cur.lst
( cd "$BASE" && find . -type f ! -path './node_modules/*' ! -path './client/node_modules/*' ! -path '*/__pycache__/*' ! -name '*.pyc' ! -path './web/app/*' ! -path './client/dist/*' | sed 's#^\./##' | sort ) > /tmp/_base.lst
: > "$OUT/MANIFEST.txt"; : > "$OUT/DELETED.txt"; N=0
while IFS= read -r f; do
  if [ -f "$BASE/$f" ] && cmp -s "$BASE/$f" "$f"; then continue; fi
  N=$((N+1))
  bh=$( [ -f "$BASE/$f" ] && sha256sum "$BASE/$f" | cut -d' ' -f1 || echo NEW )
  if [ "$bh" = NEW ] || echo "$f" | grep -Eq "$OWN"; then
    mkdir -p "$OUT/owned/$(dirname "$f")"; cp -p "$f" "$OUT/owned/$f"; echo "owned  $bh  $f" >> "$OUT/MANIFEST.txt"
  elif grep -Iq . "$f" 2>/dev/null; then
    mkdir -p "$OUT/shared/$(dirname "$f")"; diff -u --label "a/$f" --label "b/$f" "$BASE/$f" "$f" > "$OUT/shared/$f.diff" || true; echo "shared $bh  $f" >> "$OUT/MANIFEST.txt"
  else
    mkdir -p "$OUT/owned/$(dirname "$f")"; cp -p "$f" "$OUT/owned/$f"; echo "owned  $bh  $f   (BINARY outside your ownership!)" >> "$OUT/MANIFEST.txt"
  fi
done < /tmp/_cur.lst
comm -13 /tmp/_cur.lst /tmp/_base.lst > "$OUT/DELETED.txt" || true
mkdir -p "$OUT/dev"; cp -p /home/claude/dev/$(echo "$W" | tr A-Z a-z)_* "$OUT/dev/" 2>/dev/null || true
cp "${REPORT:-/home/claude/REPORT_$W.md}" "$OUT/REPORT.md" 2>/dev/null || echo "!! write /home/claude/REPORT_$W.md first (proven / not proven / not done + the shared-file edits you made and why)"
tar czf "$OUT.tar.gz" -C "$OUT" . && echo "== $N changed files -> $OUT.tar.gz  ($(du -h "$OUT.tar.gz" | cut -f1))"; cat "$OUT/MANIFEST.txt"
