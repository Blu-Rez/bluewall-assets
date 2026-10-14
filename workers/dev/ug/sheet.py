# compose the ground-unit sheet: python3 sheet.py SHOT.png '{"legionary":[x,y],...}' OUT.png [CROP_Y0 CROP_Y1]
import sys, json
from PIL import Image, ImageDraw, ImageFont
src, pos, out = sys.argv[1], json.loads(sys.argv[2]), sys.argv[3]
im = Image.open(src).convert('RGB')
W, H = im.size
y0 = int(sys.argv[4]) if len(sys.argv) > 4 else 0
y1 = int(sys.argv[5]) if len(sys.argv) > 5 else H
im = im.crop((0, y0, W, y1))
S = 2 if W < 1400 else 1
im = im.resize((im.width * S, im.height * S), Image.LANCZOS)
NAMES = {'legionary': 'LEGIONARY', 'sword': 'SWORDSMAN', 'captain': 'CAPTAIN', 'shieldmaiden': 'SHIELDMAIDEN', 'hill': 'HILL GIANT', 'ogre': 'OGRE', 'giant': 'GIANT (TROLL)', 'treant': 'TREANT', 'mage': 'MAGE', 'lich': 'LICH'}
NEW = {'legionary', 'captain', 'ogre', 'treant', 'lich'}
def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        try: return ImageFont.truetype(f, sz)
        except Exception: pass
    return ImageFont.load_default()
d = ImageDraw.Draw(im, 'RGBA')
f = font(20 if S == 2 else 24)
prev_r, prev_tier = -1e9, 1
for t, (x, y) in sorted(pos.items(), key=lambda kv: kv[1][0]):
    x *= S; y = (y - y0) * S
    txt = NAMES[t]; w = d.textlength(txt, font=f)
    tier = (1 - prev_tier) if x - w / 2 - 8 < prev_r + 6 else 0
    prev_r, prev_tier = x + w / 2 + 8, tier
    ty = min(y + 14 + tier * 36, im.height - 36)
    d.rectangle((x - w / 2 - 8, ty - 3, x + w / 2 + 8, ty + 28), fill=(8, 14, 36, 200), outline=(95, 196, 255, 220) if t in NEW else (160, 170, 190, 160))
    d.text((x - w / 2, ty), txt, font=f, fill=(255, 211, 110) if t in NEW else (235, 240, 250))
    d.line((x, y - 2, x, ty - 3), fill=(255, 255, 255, 120), width=1)
im.save(out)
print(im.size)
