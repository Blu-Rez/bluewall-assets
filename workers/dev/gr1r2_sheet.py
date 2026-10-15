#!/usr/bin/env python3
# gr1r2_sheet.py out.png cols label1=file1 label2=file2 ... — numbered contact sheet (each tile keeps its pixels; label strip on top of each)
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols = sys.argv[1], int(sys.argv[2]); items = [a.split('=', 1) for a in sys.argv[3:]]
ims = [(l, Image.open(f).convert('RGB')) for l, f in items]
w, h = ims[0][1].size; lh = 16; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols + 1) * 4, rows * (h + lh) + (rows + 1) * 4), (24, 24, 28)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 12)
except Exception: font = ImageFont.load_default()
for i, (l, im) in enumerate(ims):
    x = 4 + (i % cols) * (w + 4); y = 4 + (i // cols) * (h + lh + 4)
    d.text((x + 2, y + 1), l, fill=(255, 255, 255), font=font); sheet.paste(im.resize((w, h)) if im.size != (w, h) else im, (x, y + lh))
sheet.save(out); print(out, sheet.size)
