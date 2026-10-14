#!/usr/bin/env bash
# pkgcheck.sh <package dir | package .tar.gz> — the last look before the owner installs a package.  Exit 1 = do NOT hand it over.
#  1. SHA256SUMS holds   2. nothing outside bluewall/ and nothing secret-looking / generated / foreign   3. added lines in changed code are scanned for network / eval calls (review the list by eye)
#  base for the diff scan = /home/claude/base_snapshot (the code the owner runs now, taken by setup_lite.sh; override with BASE=)
set -uo pipefail
IN=${1:?package dir or .tar.gz}; BASE=${BASE:-/home/claude/base_snapshot}; FAIL=0; W=$(mktemp -d)
if [ -f "$IN" ]; then tar xzf "$IN" -C "$W"; P=$(find "$W" -maxdepth 2 -name SHA256SUMS -printf '%h\n' | head -1); else P=$IN; fi
[ -f "$P/SHA256SUMS" ] || { echo "FAIL not a package (no SHA256SUMS)"; exit 1; }
( cd "$P" && sha256sum -c --quiet SHA256SUMS ) && echo "OK   SHA256SUMS holds" || { echo "FAIL SHA256SUMS"; FAIL=1; }
for f in install.sh rollback.sh; do [ -f "$P/$f" ] || { echo "FAIL missing $f"; FAIL=1; }; done
cd "$P/files" || exit 1
N=$(find . -type f | wc -l); echo "     $N files, $(du -sh . | cut -f1)"
BAD=$(find . -type f | sed 's#^\./##' | grep -Ev '^bluewall/' || true); [ -n "$BAD" ] && { echo "FAIL files outside bluewall/:"; echo "$BAD" | head; FAIL=1; }
BAD=$(find . -type f | sed 's#^\./##' | grep -Ei '(^|/)(\.env[^/]*|.*\.pem|.*\.key|id_[a-z0-9]+|.*token[^/]*|.*secret[^/]*|config\.py|install\.sh|rollback\.sh|.*\.pyc|.*\.map|.*\.log|.*\.sqlite3?|.*\.db)$|node_modules|__pycache__|/_backups/|/pkg/' || true); [ -n "$BAD" ] && { echo "FAIL forbidden / generated files:"; echo "$BAD" | head -20; FAIL=1; }
PY=$(find . -name '*.py' | sed 's#^\./##'); [ -n "$PY" ] && echo "WARN python files in the package (wave 1 should not change the server): $PY"
find . -type f -size +2M | sed 's#^\./#     big: #' | head
echo "== added lines that touch network / eval (review by eye; the telemetry in perf.js is expected)"
PAT='fetch\(|XMLHttpRequest|WebSocket\(|sendBeacon|[^a-zA-Z.]eval\(|new Function|document\.write|importScripts|\batob\(|<script|https?://[a-zA-Z0-9.-]+'
HITS=0
while read -r f; do
  case "$f" in bluewall/web/app/*|*.glb|*.png|*.jpg|*.webp|*.ogg|*.mp3|*.woff2|bluewall/BUILD) continue;; esac
  grep -Iq . "$f" 2>/dev/null || continue
  if [ -f "$BASE/${f#bluewall/}" ]; then A=$(diff "$BASE/${f#bluewall/}" "$f" | grep '^>' | grep -E "$PAT" || true); else A=$(grep -nE "$PAT" "$f" || true); fi
  [ -n "$A" ] && { echo "  -- $f"; echo "$A" | cut -c1-200 | head -8; HITS=$((HITS+1)); }
done < <(find . -type f | sed 's#^\./##' | sort)
[ $HITS = 0 ] && echo "     none"
[ $FAIL = 0 ] && echo "PKGCHECK: OK" || echo "PKGCHECK: FAILED"; exit $FAIL
