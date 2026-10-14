#!/usr/bin/env bash
# mkpkg.sh <name> "<title>"  -> /home/claude/pkg/<name>.tar.gz  (delta vs. what is deployed on the server)
# Ships every file under bluewall/ whose sha256 differs from pkg/deployed.sha256 (= server state after p4).
# After the owner confirms the install worked:  bash mkpkg.sh --commit <name>   (updates deployed.sha256)
set -euo pipefail
PKG=/home/claude/pkg; SRC=/home/claude/bot/bluebot_v2; MAN=$PKG/deployed.sha256
if [ "${1:-}" = "--commit" ]; then
  N=${2:?name}; cp "$MAN" "$MAN.bak"
  ( cd "$PKG/$N/files" && find . -type f | sed 's#^\./##' | sort | xargs -d '\n' sha256sum ) > /tmp/new.sha
  python3 - "$MAN" /tmp/new.sha <<'PY'
import sys
m={}
for f in sys.argv[1:]:
    for l in open(f):
        h,p=l.rstrip('\n').split('  ',1); m[p]=h
open(sys.argv[1],'w').write(''.join(f"{m[k]}  {k}\n" for k in sorted(m)))
PY
  echo "deployed.sha256 updated with $N"; exit 0
fi
NAME=$1; TITLE=$2
OUT=$PKG/$NAME; rm -rf "$OUT"; mkdir -p "$OUT/files"
cd "$SRC"
bash bluewall/client/build.sh >/dev/null
declare -A DEP; while read -r h p; do DEP["$p"]=$h; done < "$MAN"
n=0
while IFS= read -r f; do
  h=$(sha256sum "$f" | cut -d' ' -f1)
  if [ "${DEP[$f]:-}" != "$h" ]; then mkdir -p "$OUT/files/$(dirname "$f")"; cp -p "$f" "$OUT/files/$f"; n=$((n+1)); fi
done < <(find bluewall -type f -not -path '*/node_modules/*' -not -path '*/__pycache__/*' -not -name '*.pyc' | sort)
printf '%s\n' "$NAME" > "$OUT/files/bluewall/BUILD"            # the running server reports this id on /healthz?deep=1 (the installer proves the NEW process answers)
TT=$(printf '%s' "$TITLE" | tr '#&\\' '   ')
sed -e "s#@NAME@#$NAME#g" -e "s#@TITLE@#$TT#g" > "$OUT/install.sh" <<'EOT'
#!/usr/bin/env bash
# Blue Wall — @TITLE@
set -Eeuo pipefail
NAME=@NAME@
APP=/root/bluebot_v2
PKG="$(cd "$(dirname "$0")" && pwd)"
BK="$APP/_backups/$NAME"
fail(){ trap - ERR; echo "❌ $1 — rolling back"; bash "$PKG/rollback.sh" || true; exit 1; }
[ -d "$APP/bluewall" ] || { echo "❌ $APP/bluewall not found"; exit 1; }

echo "== 0/4 verify package"
( cd "$PKG" && sha256sum -c --quiet SHA256SUMS ) || { echo "❌ package damaged — download it again"; exit 1; }

echo "== 1/4 backup -> $BK"
if [ -d "$BK/files" ]; then
  echo "   (already there — re-run, keeping the original backup)"
else
  mkdir -p "$BK/files"; : > "$BK/added.txt"
  ( cd "$PKG/files" && find . -type f | sed 's#^\./##' ) | while read -r f; do
    if [ -e "$APP/$f" ]; then mkdir -p "$BK/files/$(dirname "$f")"; cp -p "$APP/$f" "$BK/files/$f"; else echo "$f" >> "$BK/added.txt"; fi
  done
fi
trap 'fail "unexpected error (line $LINENO)"' ERR

echo "== 2/4 copy files ($(cd "$PKG/files" && find . -type f | wc -l) files)"
cp -r "$PKG/files/." "$APP/"

echo "== 3/4 python check"
PY=python3; for c in "$APP/venv/bin/python" "$APP/.venv/bin/python"; do [ -x "$c" ] && PY="$c" && break; done
( cd "$APP" && "$PY" -m bluewall.names --export ) >/dev/null 2>&1 || true      # kingdom names from the bot's game section (read-only; harmless when not found)
( cd "$APP" && "$PY" -m py_compile bluewall/*.py ) || fail "python check failed"

echo "== 4/4 restart bluebot-wall"
systemctl restart bluebot-wall || fail "restart failed"
for i in $(seq 1 25); do curl -fs http://127.0.0.1:8590/healthz >/dev/null 2>&1 && break; sleep 1; done
curl -fs http://127.0.0.1:8590/healthz >/dev/null 2>&1 || { journalctl -u bluebot-wall -n 15 --no-pager || true; fail "bluebot-wall is down"; }
B=$(curl -fs "http://127.0.0.1:8590/healthz?deep=1" 2>/dev/null | "$PY" -c 'import sys,json;print(json.load(sys.stdin).get("build",""))' 2>/dev/null || true)
[ "$B" = "$NAME" ] || fail "the running server is '$B' (expected $NAME)"
S=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8590/api/state || true)
[ "$S" = 403 ] || fail "state API answered $S"
I=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8590/ || true)
[ "$I" = 200 ] || fail "game page answered $I"
trap - ERR
echo "✅ bluebot-wall up (build $B) — gems/mines API ok"
echo "Done ✅  حالا ربات رو باز کن ← بخش بازی ← 🏰 Blue Wall"
echo "Rollback: bash $PKG/rollback.sh"
EOT
sed -e "s#@NAME@#$NAME#g" > "$OUT/rollback.sh" <<'EOT'
#!/usr/bin/env bash
set -euo pipefail
APP=/root/bluebot_v2; BK="$APP/_backups/@NAME@"
[ -d "$BK/files" ] || { echo "no backup at $BK"; exit 1; }
cp -r "$BK/files/." "$APP/"
while read -r f; do [ -n "$f" ] && rm -f "$APP/$f"; done < "$BK/added.txt"
systemctl restart bluebot-wall && echo "✅ rolled back to the previous version"
EOT
( cd "$OUT/files" && find . -type f | sed 's#^\./##' | sort | xargs -d '\n' sha256sum ) > "$OUT/SHA256SUMS.tmp"
sed 's#  #  files/#' "$OUT/SHA256SUMS.tmp" > "$OUT/SHA256SUMS"; rm -f "$OUT/SHA256SUMS.tmp"
chmod +x "$OUT"/*.sh
cd "$PKG" && tar czf "$NAME.tar.gz" "$NAME"
echo "files: $n  size: $(du -h "$NAME.tar.gz" | cut -f1)  -> $PKG/$NAME.tar.gz"
echo "install on server:  cd /root && tar xzf $NAME.tar.gz && bash $NAME/install.sh"
