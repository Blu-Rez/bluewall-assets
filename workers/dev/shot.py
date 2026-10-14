import asyncio, sys, json
from playwright.async_api import async_playwright
async def main():
    w,h = int(sys.argv[1]), int(sys.argv[2]); out = sys.argv[3]; q = sys.argv[4] if len(sys.argv)>4 else 'high'
    script = sys.argv[5] if len(sys.argv)>5 else ''
    wait = float(sys.argv[6]) if len(sys.argv)>6 else 0
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=float(__import__('os').environ.get('DPR','1')))
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text))
        pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)))
        await pg.goto(f'http://127.0.0.1:8777/'+__import__('os').environ.get('PAGE','dev.html')+f'?q={q}&w='+__import__('os').environ.get('WX','clear')+'&h='+(sys.argv[7] if len(sys.argv)>7 else '21')+__import__('os').environ.get('EXTRA',''))
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready') or await pg.evaluate('window.__log.some(x=>x.startsWith("ERR"))'): break
        if __import__('os').environ.get('LATE'):
            for i in range(900):
                if await pg.evaluate('!!__bw.lateReady'): break
                await asyncio.sleep(1)
        if script:
            await pg.add_script_tag(path='/home/claude/dev/cam.js')
            await pg.evaluate(script)
        if wait:
            await asyncio.sleep(wait)
            for i in range(120):
                if await pg.evaluate('window.__f0===undefined || __bw.frames >= window.__f0 + 3'): break
                await asyncio.sleep(1)
        await pg.screenshot(path=out, timeout=240000)
        print(json.dumps(await pg.evaluate('window.__log.slice(-6)'), ensure_ascii=False))
        for l in logs[-15:]: print(l[:300])
        await b.close()
asyncio.run(main())
