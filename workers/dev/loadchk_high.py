import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:500]))
        pg.on('console', lambda m: logs.append(m.type+' '+m.text[:600]) if (m.type in ('error','warning')) and '404' not in m.text and 'KHR_parallel' not in m.text else None)
        pg.on('response', lambda r: logs.append('HTTP%d %s'%(r.status,r.url)) if r.status>=400 else None)
        await pg.goto(f"http://127.0.0.1:8777/dev_dbg.html?q=high&h=15&w=clear")
        T=int(os.environ.get('T','120'))
        for i in range(T*2):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): print('ready after',i/2); break
        print((await pg.evaluate('window.__log.slice(-6)')))
        print('\n'.join([l for l in logs if 'assets/audio' not in l][:25]))
        await b.close()
asyncio.run(main())
