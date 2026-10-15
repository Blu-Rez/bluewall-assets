#!/usr/bin/env python3
# rp1c2_L_ba.py out.png before.png after.png [scale] [label_before] [label_after] — a before | after pair side by side (nearest-neighbour for the scale, so every pixel stays visible)
import sys
from PIL import Image, ImageDraw, ImageFont
out, b, a = sys.argv[1:4]; sc = int(sys.argv[4]) if len(sys.argv) > 4 else 1; lb = sys.argv[5] if len(sys.argv) > 5 else 'before'; la = sys.argv[6] if len(sys.argv) > 6 else 'after'
A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
if sc != 1: A = A.resize((A.width * sc, A.height * sc), Image.NEAREST); B = B.resize((B.width * sc, B.height * sc), Image.NEAREST)
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: F = ImageFont.load_default()
pad = 10; head = 30; W = B.width + A.width + 3 * pad; H = max(A.height, B.height) + head + pad
im = Image.new('RGB', (W, H), (16, 20, 30)); d = ImageDraw.Draw(im)
im.paste(B, (pad, head)); im.paste(A, (2 * pad + B.width, head)); d.text((pad, 5), lb, fill=(255, 255, 255), font=F); d.text((2 * pad + B.width, 5), la, fill=(255, 255, 255), font=F)
im.save(out); print(out, im.size)
