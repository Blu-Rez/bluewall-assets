#!/usr/bin/env python3
# rp1c2_L_sheet.py — RP1C-R2 Job 8: ONE numbered sheet of the three marker looks (844x390 frames of the real game, the same camera, her own colour).
#   usage: rp1c2_L_sheet.py out.png crop(x,y,w,h) look1.png look2.png look3.png [far1.png far2.png far3.png]
import sys, os
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]; x, y, w, h = [int(v) for v in sys.argv[2].split(',')]; ims = sys.argv[3:6]; far = sys.argv[6:9]
S = int(os.environ.get('SCALE', 3)); names = os.environ.get('NAMES', '1  neon crown|2  gem|3  halo + pointer').split('|')
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception: F = f2 = ImageFont.load_default()
cw, ch = w * S, h * S; pad = 14; head = 56
ch2 = int(cw * 390 / 844)
sheet = Image.new('RGB', (pad + 3 * (cw + pad), head + ch + pad + ((ch2 + pad) if far else 0) + pad), (14, 18, 28)); d = ImageDraw.Draw(sheet)
for i, p in enumerate(ims):
    c = Image.open(p).convert('RGB').crop((x, y, x + w, y + h)).resize((cw, ch), Image.LANCZOS); ox = pad + i * (cw + pad)
    sheet.paste(c, (ox, head)); d.text((ox, 8), names[i], fill=(255, 255, 255), font=F)
    if far:
        c2 = Image.open(far[i]).convert('RGB').resize((cw, ch2), Image.LANCZOS)
        sheet.paste(c2, (ox, head + ch + pad))
sheet.save(out); print(out, sheet.size)
