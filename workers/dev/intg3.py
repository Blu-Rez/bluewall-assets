import asyncio, sys
from playwright.async_api import async_playwright
OUT = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:600])); pg.on('console', lambda m: logs.append(m.type+' '+m.text[:300]) if (m.type=='error' and '404' not in m.text) or 'GL_' in m.text else None)
        await pg.goto('http://127.0.0.1:8777/dev_dbg.html?q=' + __import__('os').environ.get('Q','low') + '&h=14&w=clear&wa=1')
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw && __bw.lateReady)'): break
        await asyncio.sleep(3)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        async def wait_loaded():
            for i in range(400):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): return True
            return False
        print('first loaded', await wait_loaded())
        name1 = await pg.evaluate('__bw.battle.session.target.name+"|"+__bw.battle.session.target.id')
        await pg.evaluate("(()=>{const B=__bw.battle,s=B.session; s.cam.intro=0; B.send('spear',0,45); B.send('dragon',0,30); B.advance(250); s.overAt -= 5; return s.sim.over})()")
        for i in range(120):
            await asyncio.sleep(1)
            if await pg.evaluate("!!document.querySelector('.bwb-res.on')"): break
        print('results after', i, await pg.evaluate("(document.querySelector('.bwb-res .bwb-card')||{innerText:'none'}).innerText.replace(/\\n+/g,' | ').slice(0,200)"))
        await pg.evaluate("document.querySelector('.bwb-res [data-b=next]').click()")
        await asyncio.sleep(2)
        print('after next click: results still?', await pg.evaluate("!!document.querySelector('.bwb-res.on')"))
        ok = await wait_loaded()
        name2 = await pg.evaluate('__bw.battle.session ? __bw.battle.session.target.name+"|"+__bw.battle.session.target.id : "none"')
        print('second loaded', ok, name1, '->', name2)
        await asyncio.sleep(3)
        f0 = await pg.evaluate('__bw.frames')
        await pg.screenshot(path=OUT+'_n2.png', timeout=180000)
        await pg.evaluate("__bw.battle.exit()"); await asyncio.sleep(2)
        print('active after exit', await pg.evaluate('__bw.battle.active'), 'uiVisible', await pg.evaluate("getComputedStyle(document.querySelector('.bwa-btn')).display"))
        print('log lines', len(logs)); [print(l[:230]) for l in logs[:6]]
        await b.close()
asyncio.run(main())
