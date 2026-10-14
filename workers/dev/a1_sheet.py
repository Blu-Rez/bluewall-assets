import sys
from PIL import Image, ImageDraw, ImageFont
# a1_sheet.py OUT.png COLS W "img1|label1" "img2|label2" ...   -> numbered sample sheet (numbers are drawn on the pictures)
out, cols, W = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); items = [a.split('|', 1) for a in sys.argv[4:]]
ims = [(Image.open(p).convert('RGB'), lab) for p, lab in items]
h = int(ims[0][0].height * W / ims[0][0].width); rows = (len(ims) + cols - 1) // cols
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26); F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: F = F2 = ImageFont.load_default()
sheet = Image.new('RGB', (cols * W + (cols + 1) * 6, rows * (h + 34) + (rows + 1) * 6), (12, 18, 34)); d = ImageDraw.Draw(sheet)
for i, (im, lab) in enumerate(ims):
    x = 6 + (i % cols) * (W + 6); y = 6 + (i // cols) * (h + 34 + 6)
    sheet.paste(im.resize((W, h), Image.LANCZOS), (x, y + 34))
    d.text((x + 4, y + 2), f'{i + 1}', fill=(255, 220, 90), font=F); d.text((x + 40, y + 6), lab, fill=(220, 230, 255), font=F2)
    d.rectangle((x, y + 34, x + W - 1, y + 34 + h - 1), outline=(70, 100, 170))
sheet.save(out); print(out, sheet.size)
