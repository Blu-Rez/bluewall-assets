#!/usr/bin/env bash
# setup_kit.sh — the workers' environment, straight from the git branch `kit` (replaces devkit_v4 / setup_lite.sh).
# Usage (3 commands, nothing to upload):
#   git clone --depth 1 --branch kit https://github.com/Blu-Rez/bluewall-assets.git /home/claude/bot/bluebot_v2
#   bash /home/claude/bot/bluebot_v2/workers/setup_kit.sh        # ≈ 5 min: npm, python deps, build, quick checks
#   bash /home/claude/dev/gate_w.sh                               # must print GATE_W: ALL OK
# The branch holds the game tree exactly as the mother last built it (see workers/KIT_VERSION) + the tests/tools in workers/.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; APP=/home/claude/bot/bluebot_v2
[ -f "$APP/bluewall/web/assets/horse.glb" ] || { echo "❌ clone the branch first:  git clone --depth 1 --branch kit https://github.com/Blu-Rez/bluewall-assets.git $APP"; exit 1; }
DEV=/home/claude/dev; DOCS=/home/claude/docs; WORK=/home/claude/work
echo "== kit: $(cat "$HERE/KIT_VERSION" 2>/dev/null || echo '?')"
mkdir -p /home/claude/mother/tools /home/claude/pkg "$DEV" "$DOCS" "$WORK" /home/claude/staged
cp -p "$HERE"/tools/mkpatch.sh "$HERE"/tools/applypatch.sh "$HERE"/tools/pkgcheck.sh /home/claude/mother/tools/; cp -p "$HERE"/tools/mkpkg.sh /home/claude/pkg/mkpkg.sh
cp -p "$HERE/pkg/deployed.sha256" /home/claude/pkg/deployed.sha256        # = the server state after the last package the owner installed
[ -d /home/claude/base_snapshot ] || { echo "== base snapshot (for mkpatch.sh)"; cp -a "$APP/bluewall" /home/claude/base_snapshot; }
cp -a "$HERE/dev/." "$DEV/"; cp -a "$HERE/docs/." "$DOCS/"
mkdir -p /tmp/cmp && cp -a "$DEV/cmp/." /tmp/cmp/ 2>/dev/null || true
ln -sfn "$APP/bluewall/web/app" "$DEV/app"; ln -sfn "$APP/bluewall/web/assets" "$DEV/assets"; ln -sfn "$APP/bluewall/web/pub" "$DEV/pub"
chmod +x "$DEV"/*.sh "$DEV"/axe/*.sh "$HERE"/*.sh 2>/dev/null || true
echo "== npm (client: three + esbuild)"; (cd "$APP/bluewall/client" && npm i --no-audit --no-fund >/dev/null)
echo "== npm (model kit tools, optional)"; (mkdir -p /tmp/claude-0/gt && cp -a "$DEV/p38/gt/." /tmp/claude-0/gt/ && cp "$DEV/p38/mkkit.mjs" /tmp/claude-0/gt/ && cd /tmp/claude-0/gt && npm i --no-audit --no-fund >/dev/null 2>&1) || echo "  (skip gt)"
(mkdir -p /tmp/fnt && cd /tmp/fnt && npm i opentype.js --no-audit --no-fund >/dev/null 2>&1) || true
echo "== python deps"
for m in aiohttp playwright PIL numpy scipy; do python3 -c "import $m" 2>/dev/null || pip install -q $( [ $m = PIL ] && echo pillow || echo $m ) --break-system-packages 2>&1 | grep -v WARNING || true; done
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
echo "== build"; bash "$DEV/rb.sh"; bash "$DEV/up.sh"
echo "== quick checks"; bash "$DEV/ring_test.sh" 2>&1 | tail -1 || true; bash "$DEV/nav_test.sh" 2>&1 | tail -1 || true
echo "✅ ready.  Client gate: bash /home/claude/dev/gate_w.sh   (expect: GATE_W: ALL OK).   Docs: /home/claude/docs.   Hand your result back with:  bash $HERE/push_result.sh <ID> <files...>"
