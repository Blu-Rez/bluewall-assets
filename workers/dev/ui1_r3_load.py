# ui1_r3_load.py <tag> [W H] — loads the real game (page ui1r2_<tag>.html built by ui1r2_rig_build.sh) ONCE at W x H (default 844x390) in the CDP chromium (:9222)
import asyncio, sys, json, time
from playwright.async_api import async_playwright
from ui1r2_common import get_page, PREP
async def main():
    tag = sys.argv[1]; w = int(sys.argv[2]) if len(sys.argv) > 2 else 844; h = int(sys.argv[3]) if len(sys.argv) > 3 else 390
    async with async_playwright() as p:
        b, pg = await get_page(p, tag)
        if pg is None:
            ctx = b.contexts[0]; pg = ctx.pages[0] if (ctx.pages and ctx.pages[0].url == 'about:blank') else await ctx.new_page()
            await pg.set_viewport_size({'width': w, 'height': h})
            pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:300], flush=True))
            await pg.goto(f'http://127.0.0.1:8777/ui1r2_{tag}.html?q=low&w=clear&h=14&wa=0.1&lv=30')
            t0 = time.time()
            for i in range(3000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!__bw.lateReady'): break
                await asyncio.sleep(1)
            print('loaded', round(time.time() - t0), flush=True); await asyncio.sleep(3)
            await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
            print(json.dumps(await pg.evaluate(PREP)), flush=True)
        print('page ok', pg.url, await pg.evaluate('[innerWidth, innerHeight]'))
asyncio.run(main())
