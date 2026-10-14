# ld_sheet.py <out.png> <title> <img1> <label1> <img2> <label2> ... : side-by-side sample sheet (images scaled to a common height)
import sys
from PIL import Image, ImageDraw, ImageFont
out, title, rest = sys.argv[1], sys.argv[2], sys.argv[3:]
pairs = list(zip(rest[0::2], rest[1::2]))
H = 900
ims = []
for p, l in pairs:
    im = Image.open(p).convert('RGB'); im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS); ims.append((im, l))
gap, top = 24, 70
W = sum(i.width for i, _ in ims) + gap * (len(ims) + 1)
sheet = Image.new('RGB', (W, H + top + gap), (14, 18, 28))
d = ImageDraw.Draw(sheet)
try:
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
except Exception:
    f = f2 = ImageFont.load_default()
d.text((gap, 18), title, fill=(220, 232, 255), font=f)
x = gap
for im, l in ims:
    sheet.paste(im, (x, top)); d.text((x + 6, top - 26), l, fill=(160, 190, 230), font=f2); x += im.width + gap
sheet.save(out); print(out, sheet.size)
