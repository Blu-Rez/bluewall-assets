import sys, asyncio
from playwright.sync_api import sync_playwright
vs = sys.argv[1:] or ['N1','N2','N3']
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader'])
    for v in vs:
        pg = b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.goto(f'http://127.0.0.1:8792/lab.html?v={v}&p=89')
        pg.wait_for_selector('body[data-ready="1"]', timeout=20000)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{v}.png')
        print(v, 'errors:', errs[:3])
        pg.close()
    b.close()
