import asyncio, sys, os, io, json, base64
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/dev/s35/port'); import mkport3
from PIL import Image
import numpy as np
# m43_ogre_port.py [pd py yaw state frac] | --write — the Behemoth ogre portrait through the real crowd path (m43_ogre_look.html?port=1), on black and white -> alpha (like s35/port/mkport3.py), 192 px webp.
#   python3 m43_ogre_port.py 19 4.6 0.55 Stand 0   then   python3 m43_ogre_port.py --write   (splices PORTRAITS.ogre into client/src/portraits.js)
OUT = '/home/claude/work/m43/port'; os.makedirs(OUT, exist_ok=True)
async def shoot(pd, py, az, st, pt, VP=384):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for bg, suf in (('000000', 'k'), ('ffffff', 'w')):
            pg = await b.new_page(viewport={'width': VP, 'height': VP})
            await pg.goto(f'http://127.0.0.1:8777/m43_ogre_look.html?port=1&bg={bg}&pd={pd}&py={py}&yaw={az}&st={st}&pt={pt}&tier=0')
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready || !!window.__err'): break
            for i in range(60):
                await asyncio.sleep(0.4)
                if await pg.evaluate('window.__frames >= 4'): break
            await pg.screenshot(path=f'{OUT}/ogre_{suf}.png'); await pg.close()
        await b.close()
def make(size=192):
    k = Image.open(f'{OUT}/ogre_k.png'); w = Image.open(f'{OUT}/ogre_w.png'); F, a = mkport3.alpha_from_pair(k, w, False)
    im = Image.fromarray(np.dstack([F, a * 255.0]).astype(np.uint8), 'RGBA').resize((size, size), Image.LANCZOS); im.save(f'{OUT}/ogre_a.png'); return im
if __name__ == '__main__':
    if sys.argv[1] == '--write':
        P = '/home/claude/bot/bluebot_v2/bluewall/client/src/portraits.js'; src = open(P).read().split('\n'); im = make(); b = io.BytesIO(); im.save(b, 'WEBP', quality=84, method=6)
        uri = 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()
        for i, l in enumerate(src):
            if l.startswith(' "ogre": "data:image/webp;base64,'):
                src[i] = f' "ogre": "{uri}"' + (',' if l.rstrip().endswith(',') else ''); print('spliced ogre', len(b.getvalue()), 'bytes'); break
        else: print('NOT FOUND')
        open(P, 'w').write('\n'.join(src))
    else:
        pd, py, az = [float(x) for x in sys.argv[1:4]]; st = sys.argv[4] if len(sys.argv) > 4 else 'Stand'; pt = sys.argv[5] if len(sys.argv) > 5 else '0'
        asyncio.run(shoot(pd, py, az, st, pt)); im = make(384); print('ok')
