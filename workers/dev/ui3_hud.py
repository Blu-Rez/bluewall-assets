# ui3_hud.py <tag> <outdir> [sizes] — UI3: frames of the bare strategic HUD (no menu open) at the three landscape sizes WITH Telegram's margins, plus the Assist hub.
# frames: <outdir>/hud_home_<W>x<H>.png , hub_<W>x<H>.png.  Needs the loaded rig page (python3 ui3_load.py <tag>).
import asyncio, os, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
TAG = sys.argv[1]; OUT = sys.argv[2].rstrip('/') + '/'; os.makedirs(OUT, exist_ok=True)
SZ = [tuple(map(int, s.split('x'))) for s in sys.argv[3].split(',')] if len(sys.argv) > 3 else SIZES
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, TAG); assert pg, 'page not loaded'
        b.contexts[0].on('page', lambda q: asyncio.ensure_future(q.close()))
        await pg.evaluate(PREP)
        for (W, H) in SZ:
            await set_size(pg, W, H, True); await close_all(pg); await settle(pg, .6)
            for _ in range(2): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.35)
            await pg.screenshot(path=f'{OUT}hud_home_{W}x{H}.png', timeout=240000)
            await js_click(pg, '.bwh-btn'); await settle(pg, .9)
            for _ in range(2): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.35)
            await pg.screenshot(path=f'{OUT}hub_{W}x{H}.png', timeout=240000)
            await close_all(pg)
            print('shot', W, H, flush=True)
asyncio.run(main())
