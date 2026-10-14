import sys
from PIL import Image, ImageDraw, ImageFont
# the owner sample: the six real in-game frames as ONE numbered sheet (phone-size cells)
D = '/home/claude/work/t1/'; names = [('barracks', 'Barracks'), ('forge', 'Forge'), ('mine', 'Ruby mine'), ('site', 'Fishery'), ('house', 'House'), ('wall', 'Wall')]
S = 0.62; cw, ch = int(390 * S), int(844 * S); pad = 10; hdr = 30
sheet = Image.new('RGB', (3 * cw + 4 * pad, 2 * (ch + hdr) + 3 * pad), (6, 12, 26)); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: f = ImageFont.load_default()
for i, (k, t) in enumerate(names):
    im = Image.open(f'{D}t1_{k}.png').convert('RGB').resize((cw, ch), Image.LANCZOS)
    x = pad + (i % 3) * (cw + pad); y = pad + (i // 3) * (ch + hdr + pad)
    d.text((x + 4, y + 2), f'{i + 1}  {t}', fill=(190, 230, 255), font=f); sheet.paste(im, (x, y + hdr))
sheet.save(D + 't1_sample.png'); print(sheet.size)
