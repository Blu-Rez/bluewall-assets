#!/usr/bin/env python3
# ST1_R2 — contact sheets from the full-size frames (every cell is the untouched 844x390 frame; big number = the number the owner answers with)
#   python3 st1r2_sheet.py OUT.png "LABEL=dir/frame.png" "LABEL=dir/frame.png" ...   (cells in order, COLS per row via env COLS, default 2)
import sys, os
from PIL import Image, ImageDraw, ImageFont
COLS = int(os.environ.get('COLS', 2)); out = sys.argv[1]; cells = [a.split('=', 1) for a in sys.argv[2:]]
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); FB = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 40)
imgs = [(lab, Image.open(p).convert('RGB')) for lab, p in cells]; w, h = imgs[0][1].size; bar = 34; rows = (len(imgs) + COLS - 1) // COLS
S = Image.new('RGB', (COLS * w + (COLS + 1) * 6, rows * (h + bar) + (rows + 1) * 6), (20, 24, 34)); d = ImageDraw.Draw(S)
for i, (lab, im) in enumerate(imgs):
    x = 6 + (i % COLS) * (w + 6); y = 6 + (i // COLS) * (h + bar + 6)
    S.paste(im, (x, y + bar)); d.text((x + 8, y + 5), lab, font=F, fill=(255, 236, 160))
    num = lab.split()[0]
    if num.isdigit(): d.rectangle((x + w - 64, y + bar + 8, x + w - 8, y + bar + 62), fill=(0, 0, 0)); d.text((x + w - 48, y + bar + 10), num, font=FB, fill=(255, 255, 255))
S.save(out); print(out, S.size)
