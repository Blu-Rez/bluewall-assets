import asyncio, sys, os, json
from playwright.async_api import async_playwright
# real-page integration: home -> click ATTACK -> battle -> deploy -> advance -> exit -> home
OUT = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:600]))
        pg.on('console', lambda m: logs.append(m.type+' '+m.text[:500]) if m.type in ('error','warning') and 'assets/audio' not in m.text and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/dev_dbg.html?q=%s&h=14&w=clear&wa=1' % os.environ.get('Q','low'))
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        print('ready', i/2)
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__bw && window.__bw.lateReady)'): break
        print('late', i/2, await pg.evaluate('!!(window.__bw && window.__bw.lateReady)'))
        await asyncio.sleep(4)
        async def shot(n):
            f0 = await pg.evaluate('__bw.frames')
            for i in range(300):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'__bw.frames >= {f0}+2'): break
            await pg.screenshot(path=f'{OUT}_{n}.png', timeout=180000); print('shot', n)
        await shot('home')
        # click the real attack button
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        print('battle ready after', i/2, await pg.evaluate('!!(__bw.battle && __bw.battle.active)'))
        await asyncio.sleep(4)
        await shot('b0')
        print(await pg.evaluate('JSON.stringify({types: __bw.battle.session.types, t: __bw.battle.session.t})'))
        await pg.evaluate("(()=>{const B=__bw.battle; const s=B.session; s.cam.intro=0; B.send('spear',0,45); B.send('archer',-30,45); B.send('giant',20,40); B.send('dragon',0,30);})()")
        await asyncio.sleep(1)
        await pg.evaluate("__bw.battle.advance(6)")
        await shot('b1')
        print(await pg.evaluate("JSON.stringify({calls: __bw.renderer.info.render.calls, tris: __bw.renderer.info.render.triangles, geo: __bw.renderer.info.memory.geometries, tex: __bw.renderer.info.memory.textures})"))
        await pg.evaluate("__bw.battle.advance(20)")
        await shot('b2')
        await pg.evaluate("__bw.battle.exit()")
        await asyncio.sleep(2)
        print('active after exit', await pg.evaluate('__bw.battle.active'))
        await shot('home2')
        print(await pg.evaluate("JSON.stringify({exp: __bw.renderer.toneMappingExposure, calls: __bw.renderer.info.render.calls})"))
        for l in logs[:30]: print(l)
        await b.close()
asyncio.run(main())
