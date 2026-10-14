#!/usr/bin/env bash
# applypatch.sh <patch_Wn.tar.gz> [TARGET=/home/claude/bot/bluebot_v2/bluewall]  (mother only)
set -euo pipefail
P=${1:?}; T=${2:-/home/claude/bot/bluebot_v2/bluewall}; D=$(mktemp -d); tar xzf "$P" -C "$D"
echo "== applying $P"; BAD=0
while read -r kind bh f rest; do
  if [ "$kind" = owned ]; then
    if [ "$bh" != NEW ] && [ -f "$T/$f" ] && [ "$(sha256sum "$T/$f" | cut -d' ' -f1)" != "$bh" ] && [ -z "${FORCE:-}" ]; then echo "CONFLICT (owned file changed elsewhere): $f"; BAD=1; continue; fi
    mkdir -p "$T/$(dirname "$f")"; cp -p "$D/owned/$f" "$T/$f"; echo "ok owned  $f"
  elif [ "$kind" = shared ]; then
    if patch -p1 -d "$T" --no-backup-if-mismatch -s < "$D/shared/$f.diff"; then echo "ok shared $f"; else echo "CONFLICT (diff does not apply): $f"; BAD=1; fi
  fi
done < "$D/MANIFEST.txt"
if [ -d "$D/dev" ]; then cp -p "$D"/dev/* /home/claude/dev/ 2>/dev/null && echo "ok dev tests copied"; fi
while read -r f; do [ -n "$f" ] && { rm -f "$T/$f"; echo "deleted $f"; }; done < "$D/DELETED.txt"
[ $BAD = 0 ] && echo "== applied clean" || echo "== SOME CONFLICTS: fix by hand"; cat "$D/REPORT.md" 2>/dev/null | head -40
