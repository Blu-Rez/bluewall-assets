import asyncio, sys
from playwright.async_api import async_playwright
HZ = float(sys.argv[1]) if len(sys.argv) > 1 else 120
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 120, 'height': 200})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.add_init_script("window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), %f);" % (1000 / HZ))
        await pg.goto('http://127.0.0.1:8777/dev.html?nolate&q=low&wa=0')
        for i in range(600):
            await asyncio.sleep(1)
            if await pg.evaluate("!!window.__ready"): break
        print('ready after', i, 's', logs[-2:])
        # make drawing free so only the pacing is measured
        await pg.evaluate("(()=>{const bw=window.__bw; bw.renderer.render=()=>{}; let n=0; const u=bw.world.update; bw.world.update=function(){n++; return u.apply(this,arguments)}; window.__n=()=>n; })()")
        await asyncio.sleep(2)
        async def rate(sec):
            a = await pg.evaluate("window.__n()"); await asyncio.sleep(sec); c = await pg.evaluate("window.__n()"); return (c - a) / sec
        print('hold/intro rate (expect ~30):', round(await rate(4), 1))
        await pg.evaluate("(()=>{const c=window.__bw.ctl; c.intro=null;})()")       # skip the intro
        await pg.mouse.move(10, 10); await pg.mouse.down(); await pg.mouse.up()
        print('active rate (expect ~60):', round(await rate(4), 1))
        print('waiting for idle...'); await asyncio.sleep(24)
        print('idle rate (expect ~30):', round(await rate(4), 1))
        await pg.mouse.move(30, 30)
        await asyncio.sleep(0.5)
        print('after touch (expect ~60):', round(await rate(3), 1))
        print(logs[-3:]); await b.close()
asyncio.run(main())
