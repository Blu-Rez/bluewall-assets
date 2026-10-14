import asyncio, sys, json, os
from playwright.async_api import async_playwright
# gearworld.py W H HOUR "OUT|js|wait" ...   one world load (LATE ready), several camera shots
async def main():
    w, h, hour = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h})
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)))
        await pg.goto(f'http://127.0.0.1:8777/'+os.environ.get('PAGE','dev_gear.html')+f'?q={os.environ.get("Q","high")}&w='+os.environ.get('WX','clear')+'&h='+hour+os.environ.get('EXTRA',''))
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready') or await pg.evaluate('window.__log.some(x=>x.startsWith("ERR"))'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        for item in sys.argv[4:]:
            out, js, wait = item.split('|')
            if js: await pg.evaluate(js)
            await asyncio.sleep(float(wait or 3))
            for i in range(120):
                if await pg.evaluate('window.__f0===undefined || __bw.frames >= window.__f0 + 3'): break
                await asyncio.sleep(1)
            await pg.screenshot(path=out, timeout=240000); print('shot', out, flush=True)
        print(json.dumps(await pg.evaluate('window.__log.filter(x=>/ERR/.test(x)).slice(-6)'), ensure_ascii=False))
        for l in logs[-20:]: print(l[:300])
        await b.close()
asyncio.run(main())
