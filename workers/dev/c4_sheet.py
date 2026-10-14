import asyncio, sys, os, json
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont
# c4_sheet.py OUT.png  — ONE sheet: every C4 kind at levels 1 / 15 / 30 from the game-like camera, on the real terrain (c4_ws_dev.html).  Rows = kinds, columns = levels.
ROWS = [  # id, label, az, dist, polar, ty
  ('c4_mill_a', 'mill (wind)  آسیاب بادی', 0.6, 50, 0.82, 4), ('c4_mill_w', 'mill (water)  آسیاب آبی', 0.6, 46, 0.82, 4), ('c4_bakery', 'bakery  نانوایی', 0.6, 46, 0.82, 3),
  ('c4_butcher', 'butcher  قصابی', 0.6, 46, 0.82, 3), ('slaughter', 'slaughter (improved)  کشتارگاه', 0.6, 52, 0.85, 3), ('farm', 'farm (improved)  مزرعه', 0.6, 62, 0.85, 2)]
LV = [1, 15, 30]
W, H = int(os.environ.get('W', 560)), int(os.environ.get('H', 350))
async def main():
    out = sys.argv[1]; tiles = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}); logs = []
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/c4_ws_dev.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||null'))
        await pg.evaluate(f"window.__aim=[0,2]; window.__simSecs=10; window.__aimCart=null")
        info = {}
        for (id_, label, az, d, po, ty) in ROWS:
            for lv in LV:
                dd = d * (1.0 if lv < 20 else 1.18)
                r = await pg.evaluate(f'window.__show("{id_}",{lv},{az},{dd},{po},{ty})'); info[f'{id_}:{lv}'] = json.loads(r)
                await asyncio.sleep(0.8); f = f'{out}_{id_}_{lv}.png'; await pg.screenshot(path=f, timeout=120000); tiles[(id_, lv)] = f
        for l in logs[-6:]: print(l)
        await b.close()
    sheet = Image.new('RGB', (W * 3 + 150, H * len(ROWS)), (14, 22, 40)); dr = ImageDraw.Draw(sheet)
    try: fnt = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    except Exception: fnt = ImageFont.load_default()
    for ri, (id_, label, *_r) in enumerate(ROWS):
        dr.text((8, ri * H + 8), label.split('  ')[0], fill=(190, 215, 255), font=fnt)
        for ci, lv in enumerate(LV):
            im = Image.open(tiles[(id_, lv)]).convert('RGB'); sheet.paste(im, (150 + ci * W, ri * H))
            c = info[f'{id_}:{lv}']['counts']; txt = f'lv {lv}   ' + ' '.join(f'{k}={v}' for k, v in c.items())
            dr.rectangle((150 + ci * W, ri * H, 150 + ci * W + 8 + 7 * len(txt), ri * H + 18), fill=(0, 0, 0)); dr.text((154 + ci * W, ri * H + 2), txt, fill=(255, 255, 255), font=ImageFont.load_default())
    sheet.save(out + '.png'); print('sheet', out + '.png', sheet.size)
asyncio.run(main())
