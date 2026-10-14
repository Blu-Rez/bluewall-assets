import json, sys, numpy as np; sys.path.insert(0, '/home/claude/dev')
from a2_plot import *
C = json.load(open('/home/claude/work/a2/courses.json'))
COL = {'A': ((70, 230, 255), '1'), 'D': ((255, 170, 40), '2')}
# ---- panel 1: the owner's own screenshot with the courses drawn through his camera
shot = Image.open('/home/claude/work/a2/shot1999.png').convert('RGBA'); ov = Image.new('RGBA', shot.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov); f = load_font(34); fs = load_font(22)
for k, pts in C.items():
    col, num = COL[k]; q = [(p['px'], p['py']) for p in pts]
    d.line(q, fill=(255, 255, 255, 200), width=14, joint='curve'); d.line(q, fill=col + (255,), width=8, joint='curve')
    h0 = q[0]; d.line([h0, (h0[0], h0[1] - 55)], fill=(255, 255, 255, 230), width=7)           # the waterfall
    m = q[len(q) // 2 + 1]; d.ellipse([m[0] - 22, m[1] - 22, m[0] + 22, m[1] + 22], fill=(10, 20, 40, 235), outline=col + (255,), width=4); d.text((m[0] - 10, m[1] - 20), num, fill=col + (255,), font=f)
shot = Image.alpha_composite(shot, ov).convert('RGB')
# ---- panel 2: top-down of the north half (real terrain)
x0, x1, z0, z1, S = -260, 120, -520, -120, 3.0
im, hh = base_image(x0, x1, z0, z1, S); draw_base_overlays(im, x0, z0, S)
d2 = ImageDraw.Draw(im, 'RGBA')
for k, pts in C.items():
    col, num = COL[k]; q = [((p['x'] - x0) * S, (p['z'] - z0) * S) for p in pts]
    d2.line(q, fill=(255, 255, 255, 220), width=11, joint='curve'); d2.line(q, fill=col + (255,), width=6, joint='curve')
    m = q[len(q) // 2 + 1]; d2.ellipse([m[0] - 20, m[1] - 20, m[0] + 20, m[1] + 20], fill=(10, 20, 40, 235), outline=col + (255,), width=4); d2.text((m[0] - 9, m[1] - 19), num, fill=col + (255,), font=f)
    h0 = q[0]; d2.ellipse([h0[0] - 9, h0[1] - 9, h0[0] + 9, h0[1] + 9], fill=(255, 255, 255, 255))
# sheet: screenshot on top (scaled to 1400 wide), map below, captions at the bottom
sw = 1400; sh = shot.resize((sw, int(shot.size[1] * sw / shot.size[0])), Image.LANCZOS); mp = im.resize((int(im.size[0] * 0.95), int(im.size[1] * 0.95)), Image.LANCZOS)
lines = [((255, 255, 255), "A2 — stream at your 2 o'clock. Top: your screenshot. Below: real map from above (white dot = waterfall)"),
         ((70, 230, 255), "1  natural gully west of the army camp, 310 m, meets the moat on the north side"),
         ((70, 230, 255), "    (that part of the moat is hidden behind the north wall in your default view; you see it when you rotate)"),
         ((255, 170, 40), "2  same mountain, the stream sweeps east across the north plain (470 m), meets the moat at its NE shoulder"),
         ((255, 170, 40), "    (the meeting point is visible in your default view, at the right edge under the gem bars)"),
         ((255, 255, 255), "3  both streams"),
         ((255, 255, 255), "Tell me 1, 2 or 3.  If I hear nothing in 15 minutes I build 2.")]
W = sw; Hs = sh.size[1] + mp.size[1] + 24 + 34 * len(lines) + 14
sheet = Image.new('RGB', (W, Hs), (14, 20, 34)); sheet.paste(sh, (0, 0)); sheet.paste(mp, ((W - mp.size[0]) // 2, sh.size[1] + 8))
g = ImageDraw.Draw(sheet); F = load_font(21)
y = sh.size[1] + mp.size[1] + 22
for col, t in lines: g.text((14, y), t, fill=col, font=F); y += 34
sheet.save('/home/claude/work/a2/sheet_A2_1.png'); print(sheet.size)
