#!/usr/bin/env python3
# ST1_R3: QA1 pixel check "pure-black pixels below the sky band" (qa1_analyze.metrics.black_below) on the nine dusk frames of QA1-070..078, BEFORE (base_dusk) vs AFTER (r3c_dusk).  Also every frame of the walk (max channel <= 1).
import glob, sys
sys.path.insert(0, '/home/claude/dev')
import numpy as np
from PIL import Image
R = '/home/claude/work/qa1/out/'
def blk(p):
    im = np.asarray(Image.open(p).convert('RGB')); H = im.shape[0]
    return float((im.max(axis=2) <= 1)[int(H * 0.2):].mean()) * 100
ITEMS = [(70, 6, 'first'), (71, 8, 'first'), (72, 9, 'first'), (73, 9, 'third'), (74, 10, 'first'), (75, 10, 'third'), (76, 12, 'first'), (77, 14, 'first'), (78, 15, 'third')]
def fr(tag, st, cam):
    g = glob.glob(f'{R}{tag}/frames/S{st:02d}_*__{cam}__{tag}.png'); return g[0] if g else None
print('QA1-id  station cam   BEFORE %  AFTER %   (QA1 flags > 0.5 %)')
tot_b = tot_a = 0
for q, st, cam in ITEMS:
    b, a = fr('base_dusk', st, cam), fr('r3c_dusk', st, cam)
    vb = blk(b) if b else float('nan'); va = blk(a) if a else float('nan'); tot_b += vb; tot_a += va
    print(f'QA1-{q:03d}  S{st:02d} {cam:5s}  {vb:6.2f}   {va:6.2f}   {"FIXED" if va <= 0.5 < vb else ("still" if va > 0.5 else "(was under 0.5)")}')
print(f'sum  {tot_b:.2f} -> {tot_a:.2f}')
