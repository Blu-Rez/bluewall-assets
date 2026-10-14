import asyncio, sys, json, os
from playwright.async_api import async_playwright
# c2_programs.py PAGE : the number / keys of the shader programs of the real game after the 'town' camera has been shown (PAGE = dev_s35.html | c2_dev_sites.html)
PAGE = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        for v in ["c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;", "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;", "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;"]:
            await pg.evaluate('() => { const c=__bw.ctl; ' + v + ' }'); await asyncio.sleep(6)
        r = await pg.evaluate('() => { const P = __bw.renderer.info.programs; return { n: P.length, keys: P.map((x) => x.cacheKey.length + ":" + x.name).sort() }; }')
        print(PAGE, 'programs', r['n']); json.dump(r, open('/tmp/prog_' + PAGE + '.json', 'w'))
        await b.close()
asyncio.run(main())
