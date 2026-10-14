import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844})
        await pg.goto('http://127.0.0.1:8777/dev.html?q=high&nolate&h=15&w=clear')
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        r = await pg.evaluate("""(()=>{const c=__bw.ctl; if(c.intro){c.intro.hold=false; c.intro.t=c.intro.dur;} c.update(0.016); const P=__bw.camera.position;
          return {cam:[P.x,P.y,P.z], target:[c.target.x,c.target.y,c.target.z], dist:c.dist, azim:c.azim, polar:c.polar, keys:Object.keys(__bw.world).slice(0,80)}})()""")
        print(json.dumps(r)); await b.close()
asyncio.run(main())
