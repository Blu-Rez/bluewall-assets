import sys
from PIL import Image, ImageDraw, ImageFont
# a1_sheet2.py OUT.png W "N|title|img10|img20|img30" ...  -> ONE numbered sample sheet: one ROW per option (the big number is the option), columns = levels 10 / 20 / 30
out, W = sys.argv[1], int(sys.argv[2]); args = [a.split('|') for a in sys.argv[3:]]; rows = [a for a in args if a[0] != 'S']; strips = [a for a in args if a[0] == 'S']   # 'S|title|imgA|labA|imgB|labB' = close-up strip under the rows
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FN = ImageFont.truetype(B, 64); FT = ImageFont.truetype(B, 22); FL = ImageFont.truetype(B, 18)
first = Image.open(rows[0][2]); h = int(first.height * W / first.width); G = 8; LW = 84; TH = 36
TW = LW + 3 * (W + G) + G; SW = (TW - 3 * G) // 2; sh = int(Image.open(strips[0][2]).height * SW / Image.open(strips[0][2]).width) if strips else 0
sheet = Image.new('RGB', (TW, len(rows) * (TH + h + G) + G + (TH + sh + G if strips else 0)), (12, 18, 34)); d = ImageDraw.Draw(sheet)
for r, (n, title, *imgs) in enumerate(rows):
    y = G + r * (TH + h + G)
    d.text((14, y + TH + h // 2 - 40), n, fill=(255, 214, 80), font=FN)
    d.text((LW + G, y + 5), title, fill=(225, 235, 255), font=FT)
    for c, (p, lab) in enumerate(zip(imgs, ['level 10', 'level 20', 'level 30'])):
        x = LW + G + c * (W + G)
        sheet.paste(Image.open(p).convert('RGB').resize((W, h), Image.LANCZOS), (x, y + TH))
        d.rectangle((x, y + TH, x + W - 1, y + TH + h - 1), outline=(70, 100, 170))
        d.rectangle((x + 6, y + TH + h - 30, x + 100, y + TH + h - 6), fill=(12, 18, 34)); d.text((x + 12, y + TH + h - 28), lab, fill=(255, 255, 255), font=FL)
for st in strips:
    y = G + len(rows) * (TH + h + G); d.text((G, y + 5), st[1], fill=(225, 235, 255), font=FT)
    for c in range(2):
        p, lab = st[2 + 2 * c], st[3 + 2 * c]; x = G + c * (SW + G)
        sheet.paste(Image.open(p).convert('RGB').resize((SW, sh), Image.LANCZOS), (x, y + TH)); d.rectangle((x, y + TH, x + SW - 1, y + TH + sh - 1), outline=(70, 100, 170))
        bb = d.textbbox((0, 0), lab, font=FN); d.rectangle((x + 6, y + TH + sh - (bb[3] + 22), x + 6 + bb[2] + 20, y + TH + sh - 6), fill=(12, 18, 34)); d.text((x + 16, y + TH + sh - (bb[3] + 18) - bb[1] + 4), lab, fill=(255, 214, 80), font=FN)
sheet.save(out); print(out, sheet.size)
