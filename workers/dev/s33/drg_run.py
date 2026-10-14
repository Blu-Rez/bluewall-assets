import asyncio, sys, base64, json, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw
# drg_run.py OUT_PREFIX 'json list of variants'  -> OUT_PREFIX_sheet.png (+ a_<i>.png) ; contact sheet over a mid-blue disc
async def main():
    out = sys.argv[1]; variants = json.loads(sys.argv[2])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 600, 'height': 400})
        logs = []; pg.on('console', lambda m: logs.append(m.text[:300]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/s33/drg.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||""')); print('clips', await pg.evaluate('window.__clips||""'))
        res = await pg.evaluate('window.__run(%s)' % json.dumps(variants))
        print('bb', await pg.evaluate('window.__bb||null'))
        S = 240; cols = min(5, len(res)); rows = (len(res) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * S, rows * S), (60, 90, 120)); dr = ImageDraw.Draw(sheet)
        for i, v in enumerate(res):
            im = Image.open(io.BytesIO(base64.b64decode(v.split(',')[1]))).convert('RGBA'); im.save(f'{out}_{i}.png')
            x, y = (i % cols) * S, (i // cols) * S
            dr.ellipse((x + 4, y + 4, x + S - 4, y + S - 4), fill=(190, 175, 130)); im2 = im.resize((S - 16, S - 16), Image.LANCZOS); sheet.paste(im2, (x + 8, y + 8), im2)
            dr.text((x + 8, y + 6), str(i) + ' ' + json.dumps(variants[i])[:34], fill=(0, 0, 0))
        sheet.save(out + '_sheet.png'); print(logs[-5:]); await b.close()
asyncio.run(main())
