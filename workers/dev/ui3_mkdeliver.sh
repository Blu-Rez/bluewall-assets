#!/bin/bash
# ui3_mkdeliver.sh — builds patch_UI3.tar.gz (repo-relative paths + patch.diff) and photos_UI3.tar.gz in /home/claude/work/ui3/deliver
set -e
R=/home/claude/bot/bluebot_v2; D=/home/claude/dev; OUT=/home/claude/work/ui3/deliver; ST=/tmp/ui3_stage; PH=/home/claude/work/ui3/photos
rm -rf $ST; mkdir -p $ST/workers/dev $ST/workers/docs $OUT
cd $R
# files this round touched: the client sources, the loader page, the font files; never web/app, pkg, dev/gate*, server *.py
CL=$(git status --porcelain -- bluewall/client bluewall/web/index.html bluewall/web/pub | awk '{print $2}')
for f in $CL; do mkdir -p $ST/$(dirname $f); cp $f $ST/$f; done
for f in $CL; do git add -N $f 2>/dev/null || true; done
TXT=$(echo "$CL" | grep -v '\.woff2$' || true)     # the font files (binary) travel as plain files in the tar, not in the text diff
git diff -- $TXT > $ST/patch.diff
# the tokens doc for UI2 + the menu table
cp $R/workers/docs/UI3_TOKENS.md $ST/workers/docs/; cp $OUT/UI3_menus.md $ST/workers/docs/
# dev tools
for f in $D/ui3_*.py $D/ui3_*.js $D/ui3_*.sh $D/ui1r4_*.py $D/ui1r4_*.js $D/ui1_menus_test.sh $D/ui1_r3_test.sh; do [ -f "$f" ] && cp $f $ST/workers/dev/; done
rm -f $ST/workers/dev/ui1r4_dbg*.py $ST/workers/dev/ui1r4_dump*.py $ST/workers/dev/ui1r4_snap.py $ST/workers/dev/ui1r4_picks.py $ST/workers/dev/ui1r4_probe.py
( cd $ST && tar czf $OUT/patch_UI3.tar.gz . )
echo "patch: $(tar tzf $OUT/patch_UI3.tar.gz | grep -vc '/$') files, $(stat -c %s $OUT/patch_UI3.tar.gz) B"; tar tzf $OUT/patch_UI3.tar.gz | grep -v '/$' | head -80
( cd $PH && tar czf $OUT/photos_UI3.tar.gz . ); echo "photos: $(tar tzf $OUT/photos_UI3.tar.gz | grep -vc '/$') files, $(stat -c %s $OUT/photos_UI3.tar.gz) B"
