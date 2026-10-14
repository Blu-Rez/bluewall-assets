import asyncio, json, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844})
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&nolate&h=15&w=clear')
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        r = await pg.evaluate("""(()=>{const f=__bw.world.fastHeight, out={}; for (const a of [0,45,90,135,180,225,270,315]){ const th=a*Math.PI/180, row=[]; for(let r=100;r<=700;r+=50) row.push(Math.round(f(Math.cos(th)*r, Math.sin(th)*r))); out[a]=row;} return out})()""")
        for k,v in r.items(): print(k, v)
        await b.close()
asyncio.run(main())
