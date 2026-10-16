#!/bin/bash
# TR2_H_R4: build patch_TR2_H_R4.tar.gz from the kit working tree (changed files + diff + manifest + report + dev tools)
set -e
K=/home/claude/bot/bluebot_v2; W=/home/claude/work/h4; P=$W/patch_TR2_H_R4; rm -rf $P; mkdir -p $P/dev
cd $K
FILES="bluewall/client/src/nav.js bluewall/client/src/town_build.js bluewall/client/src/mines.js bluewall/client/src/buildings.js bluewall/web/assets/rpg/rpg.js bluewall/web/assets/rpg/cull.js $EXTRA"
for f in $FILES; do mkdir -p $P/$(dirname $f); cp $f $P/$f; done
git diff -- $FILES > $P/TR2_H_R4.diff || true
cp /home/claude/dev/tr2h4_test.mjs /home/claude/dev/qa1_page.js /home/claude/dev/qa1_walk_h4.py /home/claude/dev/tr2h4_lab.py /home/claude/dev/tr2h4_lod2.mjs /home/claude/dev/tr2h4_sheet.py /home/claude/dev/tr2h4_lod2.mjs /home/claude/dev/tr2h4_sheet.py /home/claude/dev/tr2h4_glb_probe.mjs /home/claude/dev/tr2h4_orient.mjs /home/claude/dev/tr2h4_pack.sh $P/dev/ 2>/dev/null || true
cp $W/report_TR2_H_R4.md $P/REPORT.md
cp $W/MANIFEST.txt $P/MANIFEST.txt
cd $W && tar czf patch_TR2_H_R4.tar.gz patch_TR2_H_R4 && ls -la patch_TR2_H_R4.tar.gz
