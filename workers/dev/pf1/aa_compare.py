#!/usr/bin/env python3
# pf1/aa_compare.py <view> — side-by-side 1:1 crops (left = MSAA on, right = MSAA off) of the two aa_<view>_{on,off}.png frames + difference numbers.  -> /home/claude/work/pf1/aa_<view>_crops.png
import sys
from PIL import Image, ImageChops, ImageDraw
import numpy as np
V = sys.argv[1]; W = '/home/claude/work/pf1/'
a, b = Image.open(W + 'aa_%s_on.png' % V).convert('RGB'), Image.open(W + 'aa_%s_off.png' % V).convert('RGB')
regs = {'map': [(640, 420, 1000, 640), (200, 380, 560, 600)], 'hero': [(0, 100, 360, 320), (700, 360, 1060, 580)]}[V]
rows = []
for (x0, y0, x1, y1) in regs:
    ca, cb = a.crop((x0, y0, x1, y1)), b.crop((x0, y0, x1, y1)); w, h = ca.size
    r = Image.new('RGB', (w * 2 + 8, h), (255, 0, 255)); r.paste(ca, (0, 0)); r.paste(cb, (w + 8, 0)); rows.append(r)
out = Image.new('RGB', (rows[0].width, sum(r.height for r in rows) + 8 * (len(rows) - 1)), (255, 0, 255)); y = 0
for r in rows: out.paste(r, (0, y)); y += r.height + 8
out.save(W + 'aa_%s_crops.png' % V)
d = np.asarray(ImageChops.difference(a, b)).astype(int).sum(axis=2); print(V, 'size', a.size, 'mean |diff| per pixel (0-765): %.2f' % d.mean(), ' pixels differing by > 60: %.2f %%' % (100.0 * (d > 60).mean()))
