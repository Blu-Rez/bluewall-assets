# ui3_bg.py — UI3: grab the clean map (HUD hidden) from the loaded 'before' game page, for the light rig's background.
import asyncio
from playwright.async_api import async_playwright
from ui1r4_common import *
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, 'before'); assert pg, 'no page'
        await pg.evaluate(PREP)
        await set_size(pg, 932, 430, False); await close_all(pg)
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); u.style.display = 'none'; document.querySelectorAll('.rp-open,.bwl .b.ent,.bwl').forEach(e => e.style.visibility = 'hidden'); const t = document.getElementById('tgmock'); if (t) t.style.display = 'none'; }")
        for _ in range(2): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.4)
        await pg.screenshot(path='/home/claude/dev/ui3_bg/map.jpg', type='jpeg', quality=82, timeout=240000)
        await pg.evaluate("() => { document.querySelector('.bw-ui').style.display = ''; document.querySelectorAll('.rp-open,.bwl .b.ent,.bwl').forEach(e => e.style.visibility = ''); }")
        print('ok')
asyncio.run(main())
