import asyncio, json, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':360,'height':640})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/dev_dbg.html?q=low&w=clear&h=12&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        T = await pg.evaluate('JSON.parse(JSON.stringify({targets: __bw.world.targets, meta: __bw.world.baseMeta}))')
        L = await pg.evaluate('(()=>{const g=__bw.world.ctx; return null})()')
        json.dump(T, open(sys.argv[1],'w'), separators=(',',':'))
        c={}
        for t in T['targets']: c[t['type']]=c.get(t['type'],0)+1
        print(len(T['targets']), c, errs[:3])
        await b.close()
asyncio.run(main())
