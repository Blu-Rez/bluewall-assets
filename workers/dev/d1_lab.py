import asyncio, sys, base64, io, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
# d1_lab.py — particle look lab (fast: no game): rows = (tier, body height H, camera distance D); columns = t 0 / 0.4 / 0.8 / 1.2 / 1.6 s.   -> work/d1/lab_<tag>.png
TAG = sys.argv[1] if len(sys.argv) > 1 else 'x'; NN = sys.argv[3] if len(sys.argv) > 3 else '[14,20,26,34,44]'
ROWS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else [[0, 4.85, 30], [2, 4.85, 30], [4, 4.85, 30], [3, 14, 80]]
AGES = [0, 0.4, 0.8, 1.2, 1.6]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']); pg = await b.new_page(viewport={'width': 390, 'height': 844})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' else None)
        await pg.add_init_script('window.__N=' + NN); await pg.goto('http://127.0.0.1:8777/d1_lab.html')
        for i in range(120):
            if await pg.evaluate('!!window.__labReady'): break
            await asyncio.sleep(0.5)
        tiles = []
        for ti, H, D in ROWS:
            urls = await pg.evaluate("(a) => window.runLab(a[0], a[1], a[2], a[3])", [ti, H, D, AGES]); row = []
            for k, u in enumerate(urls):
                im = Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGB'); hh = int(max(200, H * 811 / D * 1.9)); ww = int(hh * 0.8); cy = 422 + int(H * 811 / D * 0.0)
                c = im.crop((195 - ww // 2, cy - hh // 2, 195 + ww // 2, cy + hh // 2)).resize((200, int(200 * hh / ww))); d = ImageDraw.Draw(c); d.rectangle((0, 0, 100, 13), fill=(0, 0, 0)); d.text((2, 1), f't{ti} H{H} {AGES[k]}s', fill=(255, 255, 255)); row.append(c)
            tiles.append(row)
        W = 200 * 5 + 8; Hh = sum(r[0].height for r in tiles) + 2 * len(tiles); out = Image.new('RGB', (W, Hh), (0, 0, 0)); y = 0
        for r in tiles:
            for k, c in enumerate(r): out.paste(c, (k * 202, y))
            y += r[0].height + 2
        out.save(f'/home/claude/work/d1/lab_{TAG}.png'); print('ok', out.size, errs[:3]); await b.close()
asyncio.run(main())
