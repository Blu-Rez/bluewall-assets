# mkport.py : build client/src/portraits.js from /home/claude/dev/port/<unit>.png (square renders of the real 3D models)
#   python3 mkport.py            -> 192 px WebP, soft vignette, base64 into portraits.js (units in unitdefs order)
import sys, os, json, base64, io
from PIL import Image, ImageDraw, ImageFilter
D = '/home/claude/dev/port'
SRC = '/home/claude/bot/bluebot_v2/bluewall/client/src/'
order = json.load(open(SRC + 'unitdefs.json'))['order']
S = 192
def vignette(im):
    m = Image.new('L', (S, S), 0); d = ImageDraw.Draw(m); d.ellipse((S * 0.06, S * 0.06, S * 0.94, S * 0.94), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(S * 0.16))
    bg = Image.new('RGB', (S, S), (8, 20, 48))
    return Image.composite(im, bg, m)
out = {}
BOOST = {'dragon': 3.2, 'werewolf': 1.9, 'baby': 1.5, 'lord': 1.35, 'cavalry': 1.25}
MARGIN = {'baby': 0.02, 'dragon': 0.04}
for u in order:
    f = f'{D}/{u}.png'
    if not os.path.exists(f): print('missing', u); continue
    im = Image.open(f).convert('RGB')
    # auto-frame: the bounding box of everything that is not the flat background, as a square with a margin
    BG = (12, 31, 68); w, h = im.size; px = im.load(); x0, y0, x1, y1 = w, h, 0, 0
    for yy in range(0, h, 2):
        for xx in range(0, w, 2):
            r, g, b = px[xx, yy]
            if abs(r - BG[0]) + abs(g - BG[1]) + abs(b - BG[2]) > 36:
                x0 = min(x0, xx); x1 = max(x1, xx); y0 = min(y0, yy); y1 = max(y1, yy)
    if x1 <= x0 or y1 <= y0: print('empty', u); continue
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; side = max(x1 - x0, y1 - y0) * (1.0 + MARGIN.get(u, 0.2))
    big = Image.new('RGB', (w * 3, h * 3), BG); big.paste(im, (w, h))
    im = big.crop((int(cx + w - side / 2), int(cy + h - side / 2), int(cx + w + side / 2), int(cy + h + side / 2))).resize((S, S), Image.LANCZOS)
    k = BOOST.get(u)
    if k:                                                  # dark models on the navy backdrop: stretch the subject away from the backdrop colour
        px = im.load()
        for yy in range(im.size[1]):
            for xx in range(im.size[0]):
                r, g, b = px[xx, yy]; px[xx, yy] = tuple(max(0, min(255, int(BG[i] + (c - BG[i]) * k))) for i, c in enumerate((r, g, b)))
    im = vignette(im); im.save(f'{D}/out/{u}.png')
    b = io.BytesIO(); im.save(b, 'WEBP', quality=82, method=6); out[u] = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
    print(u, len(b.getvalue()))
js = '// Unit portraits: renders of the real 3D models (every soldier, creature, hero and siege engine of the roster), 192 px WebP.\n// Made by /home/claude/dev/mkport.py from battle-rig renders (dsess.py + __pt); regenerate when the models change.\nexport const PORTRAIT = {\n'
js += ',\n'.join(f' {json.dumps(k)}: {json.dumps(v)}' for k, v in out.items()) + '\n};\n'
open(SRC + 'portraits.js', 'w').write(js); print('wrote', len(js) // 1024, 'KB', len(out), 'portraits')
