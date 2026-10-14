import asyncio, sys, io
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont
# b2_sheet.py OUT.png [seed] [kit]  — THE sample sheet: 4 kinds (columns) x levels 1 / 15 / 30 (rows), every cell rendered by the real code path (b2_homes.js homePieces -> village.js bakePieces -> kit_homes.glb)
# from the game camera angle, numbered 1..12 (row by row).
KINDS = [('cottage', 22, 2.4), ('craftsman', 27, 3.0), ('merchant', 31, 4.0), ('noble', 36, 3.2)]
LVS = [1, 15, 30]
async def main():
    out = sys.argv[1]; seed = sys.argv[2] if len(sys.argv) > 2 else '7'; kit = sys.argv[3] if len(sys.argv) > 3 else 'assets/kit_homes.glb'
    CW, CH = 560, 470
    sheet = Image.new('RGB', (CW * 4, CH * 3 + 56), (28, 36, 58)); d = ImageDraw.Draw(sheet)
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
    d.text((14, 14), 'Blue Wall - four house families x levels 1 / 15 / 30   (seed %s)' % seed, fill=(235, 242, 255), font=F)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': CW, 'height': CH}); n = 0
        for r, lv in enumerate(LVS):
            for c, (k, dist, ty) in enumerate(KINDS):
                n += 1
                await pg.goto('http://127.0.0.1:8777/b2_dev.html?mode=homes&kit=%s&kinds=%s&lv=%d&seed=%s&dist=%d&ty=%s&polar=0.95&labels=0' % (kit, k, lv, seed, dist, ty))
                for i in range(240):
                    await asyncio.sleep(0.25)
                    if await pg.evaluate('!!window.__ready || !!window.__err'): break
                err = await pg.evaluate('window.__err||null'); st = await pg.evaluate('window.__stats||null')
                if err: print('ERR', k, lv, err[:300])
                im = Image.open(io.BytesIO(await pg.screenshot())).convert('RGB'); sheet.paste(im, (c * CW, 56 + r * CH))
                x0, y0 = c * CW, 56 + r * CH
                d.rectangle([x0 + 8, y0 + 8, x0 + 52, y0 + 46], fill=(20, 30, 70)); d.text((x0 + 18, y0 + 12), str(n), fill=(255, 255, 255), font=F)
                d.text((x0 + 60, y0 + 16), '%s  lv %d   (%s tris)' % (k, lv, st['tris'] if st else '?'), fill=(255, 255, 255), font=F2)
                print(n, k, lv, st)
        await b.close()
    sheet.save(out); print('saved', out, sheet.size)
asyncio.run(main())
