# ui1_r3_sheet.py — the numbered look-sheet for the owner: «0 now» + three layouts of the HUD at 844x390 (real game frames, Telegram header mock), stacked, full size.  OUT: /home/claude/work/ui1r3/UI1_R3_sheet.png
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = '/home/claude/work/ui1r3/r3after/'
F = lambda n, s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)
CAP = {0: ('0', 'NOW', 'crown under the gems, left (this is what you see today)'), 1: ('1', 'LEFT RAIL', 'crown alone on the left edge; the 5 gems in one column top-right'),
       2: ('2', 'UNDER THE BADGE', 'crown + the two special gems as one cluster under the level badge'), 3: ('3', 'RIGHT STACK  (default)', 'crown right above Assist: both game buttons under the right thumb')}
W, H, CH = 844, 390, 44
sheet = Image.new('RGB', (W, 4 * (H + CH) + 8), (12, 14, 20)); d = ImageDraw.Draw(sheet)
for i, k in enumerate([0, 1, 2, 3]):
    y = i * (H + CH) + 4
    im = Image.open(f'{D}comp_{k}_844x390.png').convert('RGB'); sheet.paste(im, (0, y))
    cx, cy, r = W // 2, y + 36, 27
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(30, 22, 14), outline=(224, 178, 85), width=4)
    d.text((cx, cy - 2), CAP[k][0], font=F(0, 38), fill=(244, 232, 204), anchor='mm')
    d.text((14, y + H + 4), CAP[k][1], font=F(0, 15), fill=(224, 178, 85)); d.text((14, y + H + 23), CAP[k][2], font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12), fill=(200, 205, 214))
out = '/home/claude/work/ui1r3/UI1_R3_sheet.png'; sheet.save(out); print(out, sheet.size)
