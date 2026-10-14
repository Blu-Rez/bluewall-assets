import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); out = []
        for name, w, hh in [('pick_cards', 390, 844), ('pick_cards_land', 844, 390)]:
            pg = await b.new_page(viewport={'width': w, 'height': hh}, device_scale_factor=2 if w == 390 else 1)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('response', lambda r: errs.append('HTTP %s %s' % (r.status, r.url[-40:])) if r.status >= 400 else None)
            await pg.goto('http://127.0.0.1:8777/rp1_pick.html'); await pg.wait_for_function('window.__done === true', timeout=20000); await asyncio.sleep(1.5)
            await pg.screenshot(path='/home/claude/work/rp1/shots/%s.png' % name); out.append((name, errs))
        print(out); await b.close()
asyncio.run(main())
