# ui3_load.py <tag> — UI3: like ui1r2_load.py, but it does NOT fail when `goto` needs more than 30 s (SwiftShader + a busy 2-core box).
# If the tab of ui1r2_<tag>.html already exists it only waits for the game (`window.__ready`, `__bw.lateReady`) and runs PREP; otherwise it opens the page with a 240 s goto timeout.
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
from ui1r2_common import get_page, PREP
CDP_TAG = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, CDP_TAG)
        if pg is None:
            ctx = b.contexts[0]; pg = ctx.pages[0] if (ctx.pages and ctx.pages[0].url == 'about:blank') else await ctx.new_page()
            await pg.set_viewport_size({'width': 844, 'height': 390})
            pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:300], flush=True))
            try: await pg.goto(f'http://127.0.0.1:8777/ui1r2_{CDP_TAG}.html?q=low&w=clear&h=14&wa=0.1&lv=30', timeout=240000, wait_until='commit')
            except Exception as ex: print('goto:', str(ex)[:120], flush=True)
            if os.environ.get('LOADSHOT'):   # the loader screen (fonts, bar) a few seconds after the first byte
                await asyncio.sleep(float(os.environ.get('LOADWAIT', '6')))
                try: await pg.screenshot(path=os.environ['LOADSHOT'], timeout=120000); print('loader shot', flush=True)
                except Exception as ex: print('loadshot:', str(ex)[:120], flush=True)
        t0 = time.time()
        for i in range(1200):
            try:
                if await pg.evaluate('!!window.__ready'): break
            except Exception: pass
            await asyncio.sleep(1)
        for i in range(900):
            try:
                if await pg.evaluate('!!__bw.lateReady'): break
            except Exception: pass
            await asyncio.sleep(1)
        print('loaded', round(time.time() - t0), flush=True); await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        print(json.dumps(await pg.evaluate(PREP)), flush=True)
asyncio.run(main())
