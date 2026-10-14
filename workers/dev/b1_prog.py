import asyncio, sys, os, time
from playwright.async_api import async_playwright
# b1_prog.py PAGE EXTRA : renderer.info.programs after the home map is up (shader programs compiled)
PAGE = sys.argv[1]; EXTRA = sys.argv[2] if len(sys.argv) > 2 else ''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/' + PAGE + '?q=low&w=clear&h=14&wa=0.1&lv=30' + EXTRA)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; c.target.set(0,0,-20); c.dist=c.maxD*0.95; c.polar=0.35; c.azim=0.0; }')
        await asyncio.sleep(10)
        print(PAGE, EXTRA or '(flag off)', await pg.evaluate('() => ({ programs: __bw.renderer.info.programs.length, geometries: __bw.renderer.info.memory.geometries, textures: __bw.renderer.info.memory.textures, b1: !!window.__b1town })'), flush=True)
        await b.close()
asyncio.run(main())
