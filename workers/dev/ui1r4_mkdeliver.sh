#!/bin/bash
# ui1r4_mkdeliver.sh — builds patch_UI1_R4.tar.gz (repo-relative paths + patch.diff) and photos_UI1_R4.tar.gz in /home/claude/work/ui1r4/deliver
set -e
R=/home/claude/bot/bluebot_v2; D=/home/claude/dev; OUT=/home/claude/work/ui1r4/deliver; ST=/tmp/ui1r4_stage; PH=${PHOTOS:-/home/claude/work/ui1r4/photos}
rm -rf $ST; mkdir -p $ST/workers/dev $OUT
cd $R
# client files this round touched (only these; web/app, pkg, dev/gate*, server *.py are never in the list)
CL=$(git status --porcelain -- bluewall/client | awk '{print $2}')
for f in $CL; do mkdir -p $ST/$(dirname $f); cp $f $ST/$f; done
for f in $CL; do git add -N $f 2>/dev/null || true; done
git diff -- $CL > $ST/patch.diff
# dev files
for f in $D/ui1r4_*.py $D/ui1r4_*.js $D/ui1r4_*.sh $D/ui1_menus_test.sh $D/ui1_menus_verdict.py; do [ -f "$f" ] && cp $f $ST/workers/dev/; done
# not the throw-away debug helpers
rm -f $ST/workers/dev/ui1r4_dbg*.py $ST/workers/dev/ui1r4_dump*.py $ST/workers/dev/ui1r4_snap.py $ST/workers/dev/ui1r4_picks.py $ST/workers/dev/ui1r4_probe.py
( cd $ST && tar czf $OUT/patch_UI1_R4.tar.gz . )
echo "patch: $(tar tzf $OUT/patch_UI1_R4.tar.gz | wc -l) entries, $(stat -c %s $OUT/patch_UI1_R4.tar.gz) B"; tar tzf $OUT/patch_UI1_R4.tar.gz | grep -v '/$' | head -50
if [ -d "$PH" ]; then ( cd $PH && tar czf $OUT/photos_UI1_R4.tar.gz . ); echo "photos: $(tar tzf $OUT/photos_UI1_R4.tar.gz | grep -vc '/$') files, $(stat -c %s $OUT/photos_UI1_R4.tar.gz) B"; fi
