import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 240, 'height': 420})
        logs = []; pg.on('console', lambda m: logs.append(m.text[:200]) if 'late' in m.text else None)
        await pg.goto('http://127.0.0.1:8777/dev.html?q=high&h=12&w=clear')
        samples = []
        for i in range(2400):
            await asyncio.sleep(0.5)
            n = await pg.evaluate("(window.__bw && __bw.renderer) ? __bw.renderer.info.programs.length : -1")
            if not samples or samples[-1][1] != n: samples.append((round(i * .5), n)); 
            if await pg.evaluate('!!window.__ready'): break
        print('programs timeline (t, n):', samples[-14:])
        n0 = await pg.evaluate("__bw.renderer.info.programs.length")
        keys0 = await pg.evaluate("__bw.renderer.info.programs.map(p=>p.id)")
        await asyncio.sleep(45)
        n1 = await pg.evaluate("__bw.renderer.info.programs.length")
        print('at ready', n0, ' 45 s later', n1, 'frames', await pg.evaluate('__bw.frames'))
        print([l for l in logs if 'built' in l][-1:])
        await b.close()
asyncio.run(main())
