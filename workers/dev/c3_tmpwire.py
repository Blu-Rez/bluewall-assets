#!/usr/bin/env python3
# TEMPORARY wiring for the in-game perf measurement (apply / revert).  Touches assets.js, world.js, layout.js (FORBIDDEN files for the patch) — `revert` restores them from base_snapshot byte for byte.
import sys, shutil, re
S='/home/claude/bot/bluebot_v2/bluewall/client/src/'; B='/home/claude/base_snapshot/client/src/'
if sys.argv[1]=='revert':
    for f in ('assets.js','world.js','layout.js'): shutil.copyfile(B+f, S+f)
    print('reverted'); sys.exit(0)
a=open(S+'assets.js').read(); a=a.replace("'kit_ws', 'kit_def',","'kit_ws', 'kit_def', 'kit_c3',",1); open(S+'assets.js','w').write(a)
w=open(S+'world.js').read(); old="buildWorksites(b, A.models.kit_ws, terrain.fastHeight, { shadows: !!Q.shadows, castle: levelOf('keep') || 30 })"; assert old in w
w=w.replace(old,"buildWorksites(b, A.models.kit_ws, terrain.fastHeight, { shadows: !!Q.shadows, castle: levelOf('keep') || 30, kitC3: A.models.kit_c3 })",1); open(S+'world.js','w').write(w)
l=open(S+'layout.js').read(); old="  { id: 'fishery_river'"; assert old in l
l=l.replace(old,"  { id: 'mint', kind: 'mint', x: 40.0, z: 260.0, ry: 0.0, r: 17, link: [40.0, 290.0] },\n  { id: 'refinery', kind: 'refinery', x: 240.0, z: 100.0, ry: 0.0, r: 18, link: [240.0, 130.0] },\n"+old,1); open(S+'layout.js','w').write(l)
print('applied')
