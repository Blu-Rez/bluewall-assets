# ui3_rig_load.py — UI3: open dev/ui1r2_rig.html (the light rig) in the CDP chromium and run PREP.  Reload with RELOAD=1.
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from ui1r2_common import get_page, PREP
TAG = sys.argv[1] if len(sys.argv) > 1 else 'rig'
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, TAG)
        if pg is not None and os.environ.get('RELOAD'):
            await pg.close(); pg = None
        if pg is None:
            ctx = b.contexts[0]; pg = await ctx.new_page(); await pg.set_viewport_size({'width': 844, 'height': 390})
            pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:300], flush=True))
            pg.on('console', lambda m: print('CONSOLE', m.type, m.text[:200], flush=True) if m.type in ('error',) else None)
            await pg.goto(f'http://127.0.0.1:8777/ui1r2_{TAG}.html' + (('?look=' + os.environ['LOOK']) if os.environ.get('LOOK') else ''), timeout=60000)
        for i in range(60):
            if await pg.evaluate('!!window.__ready'): break
            await asyncio.sleep(.5)
        await asyncio.sleep(1.5)
        print(json.dumps(await pg.evaluate(PREP)), flush=True)
asyncio.run(main())
