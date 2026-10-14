import sys, numpy as np; sys.path.insert(0, '/home/claude/dev')
from a2_plot import *
x0, x1, z0, z1, S = -330, 130, -540, -120, 3.0
im, hh = base_image(x0, x1, z0, z1, S)
# contours every 10 m (above water) as thin dark lines, every 50 m heavier
from PIL import ImageDraw
a = np.array(im).astype(float)
for lvl, wt in [(l, 0.55 if l % 50 else 0.8) for l in range(10, 300, 10)]:
    b = hh < lvl; mm = np.zeros(hh.shape, bool); mm[:, :-1] |= b[:, :-1] != b[:, 1:]; mm[:-1, :] |= b[:-1, :] != b[1:, :]
    a[mm] = a[mm] * (1 - wt) + np.array([30, 20, 10]) * wt
im = Image.fromarray(a.astype(np.uint8))
draw_base_overlays(im, x0, z0, S)
# mark the owner's 2 o'clock pixels: (1500,150) (1600,110) (1700,60) (1400,200) -> world points from a2_probe3
d = ImageDraw.Draw(im, 'RGBA'); f = load_font(14)
for (px, py, x, z) in [(1400, 200, -194, -310), (1500, 150, -192, -383), (1600, 110, -160, -422), (1700, 60, -122, -444), (1450, 330, -21, -181), (1550, 250, -87, -314)]:
    cx, cy = (x - x0) * S, (z - z0) * S; d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], outline=(255, 0, 255, 255), width=2); d.text((cx + 7, cy - 7), f'px{px},{py}', fill=(255, 0, 255, 255), font=f)
im.save('/home/claude/work/a2/north.png'); print(im.size)
