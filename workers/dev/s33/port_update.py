# port_update.py : replaces ONLY the given portraits in client/src/portraits.js (giant / hill from the real-game shots, dragon / baby from the lab stills); every other bust stays byte-identical
import re, io, base64, sys
sys.path.insert(0, '/home/claude/dev/s32/port')
import mkport3
from PIL import Image
P = '/home/claude/bot/bluebot_v2/bluewall/client/src/portraits.js'
src = open(P).read()
items = dict(re.findall(r'"(\w+)": "(data:image/webp;base64,[^"]+)"', src))
def enc(im):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=82, method=6); return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
new = {}
for t in ('giant', 'hill'): new[t] = enc(mkport3.make(t, 192))
for t, f in (('dragon', '/home/claude/dev/s33/dp9_0.png'), ('baby', '/home/claude/dev/s33/dp9_2.png')):
    new[t] = enc(Image.open(f).convert('RGBA').resize((192, 192), Image.LANCZOS))
items.update(new)
head = src.split('export const PORTRAIT')[0]
body = 'export const PORTRAIT = {\n' + ',\n'.join(' "%s": "%s"' % (t, v) for t, v in items.items()) + '\n};\n'
open(P, 'w').write(head + body); print('updated', list(new), 'total', len(items))
