# ui3_coach.py <tag> <outdir> [W H] — UI3: the first-hour tour (coach.js, Persian RTL text) — each step as a frame, at one size with Telegram margins.
import asyncio, os, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
TAG = sys.argv[1]; OUT = sys.argv[2].rstrip('/') + '/'; os.makedirs(OUT, exist_ok=True)
W = int(sys.argv[3]) if len(sys.argv) > 3 else 844; H = int(sys.argv[4]) if len(sys.argv) > 4 else 390
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, TAG); assert pg
        b.contexts[0].on('page', lambda q: asyncio.ensure_future(q.close()))
        await pg.evaluate(PREP); await set_size(pg, W, H, True); await close_all(pg); await settle(pg, .6)
        ok = await pg.evaluate("() => { __bw.coach.stop(); return __bw.coach.home(true); }"); print('tour started', ok, flush=True)
        for i in range(1, 6):
            await settle(pg, 1.2)
            for _ in range(2): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.35)
            if not await pg.evaluate("() => !!document.querySelector('.bwch')"): break
            await pg.screenshot(path=f'{OUT}coach_step{i}_{W}x{H}.png', timeout=240000); print('shot', i, flush=True)
            await pg.evaluate("() => { const e = document.querySelector('.bwch'); if (e) e.click(); }")
        await pg.evaluate("() => __bw.coach.stop()")
asyncio.run(main())
