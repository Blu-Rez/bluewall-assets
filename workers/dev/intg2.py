import asyncio, sys, os, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:600]))
        pg.on('console', lambda m: logs.append(m.type+' '+m.text[:300]) if m.type=='error' and 'assets/audio' not in m.text and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/dev_dbg.html?q=low&h=14&w=clear&wa=1')
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__bw && window.__bw.lateReady)'): break
        await asyncio.sleep(3)
        mem = "JSON.stringify([__bw.renderer.info.memory.geometries, __bw.renderer.info.memory.textures, __bw.renderer.info.programs.length])"
        print('home mem', await pg.evaluate(mem))
        for k in range(3):
            await pg.evaluate("document.querySelector('.bwa-btn').click()")
            for i in range(400):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
            await asyncio.sleep(2)
            print(k, 'in battle mem', await pg.evaluate(mem))
            await pg.evaluate("__bw.battle.exit()")
            await asyncio.sleep(3)
            print(k, 'after exit mem', await pg.evaluate(mem), 'active', await pg.evaluate('__bw.battle.active'))
            await asyncio.sleep(21)   # scout cooldown is server-side only; offline bot has none
        for l in logs[:20]: print(l)
        await b.close()
asyncio.run(main())
