# u3_mkports.py lich,darkrider — turns shots/<type>_k.png + _w.png into the 192 px WebP portrait and replaces ONLY those entries in portraits.js (the other units are not touched)
import sys, io, re, base64
import sys; sys.path.insert(0,'/home/claude/dev/u3_port'); import mkport3
P = '/home/claude/bot/bluebot_v2/bluewall/client/src/portraits.js'
from PIL import Image
import numpy as np
def fit(t, size=192, margin=0.07):
    # the frozen black / white pair -> alpha (mkport3), then the figure's own bounding box is centred in a square with a small margin (framing only: no pixel is repainted)
    k = Image.open(f'{mkport3.D}/shots/{t}_k.png'); w = Image.open(f'{mkport3.D}/shots/{t}_w.png')
    F, a = mkport3.alpha_from_pair(k, w, t in mkport3.GHOST)
    rgba = Image.fromarray(np.dstack([F, a * 255.0]).astype(np.uint8), 'RGBA'); bb = Image.fromarray((a * 255).astype(np.uint8)).point(lambda v: 255 if v > 24 else 0).getbbox()
    x0, y0, x1, y1 = bb; side = max(x1 - x0, y1 - y0) * (1 + 2 * margin); cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    box = (int(cx - side / 2), int(cy - side / 2), int(cx + side / 2), int(cy + side / 2))
    return rgba.crop(box).resize((size, size), Image.LANCZOS)
src = open(P, encoding='utf-8').read()
for t in sys.argv[1].split(','):
    im = fit(t); im.save(f'{mkport3.D}/shots/{t}_a.png')
    b = io.BytesIO(); im.save(b, 'WEBP', quality=80, method=6); d = base64.b64encode(b.getvalue()).decode()
    src, n = re.subn(r'( "%s": ")data:image/webp;base64,[A-Za-z0-9+/=]+(")' % re.escape(t), lambda m: m.group(1) + 'data:image/webp;base64,' + d + m.group(2), src)
    print(t, len(b.getvalue()), 'bytes, replaced', n)
open(P, 'w', encoding='utf-8').write(src)
