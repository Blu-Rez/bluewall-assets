import sys
from PIL import Image, ImageChops
# pf_shots_cmp.py BEFORE_PREFIX AFTER_PREFIX [OUT_PREFIX]  — compares OUT_army.png / OUT_keep.png of two pf_shots.py runs (same camera, same seed): prints the share of pixels that differ and writes an amplified difference picture.
a, b = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else b
for n in ('army', 'keep'):
    A = Image.open(f'{a}_{n}.png').convert('RGB'); B = Image.open(f'{b}_{n}.png').convert('RGB')
    if A.size != B.size: print(n, 'SIZE DIFFERS', A.size, B.size); continue
    D = ImageChops.difference(A, B); px = D.load(); w, h = D.size; tot = w * h; c8 = c24 = 0; mx = 0; s = 0
    for y in range(h):
        for x in range(w):
            r, g, bb = px[x, y]; m = max(r, g, bb); s += m
            if m > 8: c8 += 1
            if m > 24: c24 += 1
            if m > mx: mx = m
    print(f'{n}: pixels differing by > 8/255: {100 * c8 / tot:.2f} %   by > 24/255: {100 * c24 / tot:.2f} %   max channel diff {mx}   mean {s / tot:.2f}')
    D.point(lambda v: min(255, v * 8)).save(f'{out}_{n}_diff.png')
