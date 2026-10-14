# her_shot.py OUTPREFIX HOUR VIEWSJSON  -> one page load, several camera views (heraldry worker)
# VIEWSJSON: [["name", px,py,pz, tx,ty,tz], ...]   env PAGE, Q, W, H, WX
import asyncio, sys, json, os
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; hour = sys.argv[2]; views = json.loads(sys.argv[3])
    w = int(os.environ.get('W', 390)); h = int(os.environ.get('H', 844)); q = os.environ.get('Q', 'high')
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=float(os.environ.get('DPR','1')))
        logs=[]
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)))
        await pg.goto('http://127.0.0.1:8777/'+os.environ.get('PAGE','dev.html')+f'?q={q}&w='+os.environ.get('WX','clear')+'&h='+hour+os.environ.get('EXTRA','')+'&nolate')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready') or await pg.evaluate('window.__log.some(x=>x.startsWith("ERR"))'): break
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        if os.environ.get('JS'): print('JS', await pg.evaluate(os.environ['JS']))
        for v in views:
            name = v[0]
            await pg.evaluate('(a)=>__cam(...a)', v[1:7])
            await asyncio.sleep(float(os.environ.get('WAIT', '2')))
            for i in range(200):
                if await pg.evaluate('__bw.frames >= window.__f0 + 3'): break
                await asyncio.sleep(0.5)
            await pg.screenshot(path=f'{out}_{name}.png', timeout=240000)
            print('shot', name, flush=True)
        print(json.dumps(await pg.evaluate('window.__log.filter(x=>x.startsWith("ERR")).slice(-4)'), ensure_ascii=False))
        seen = set()
        for l in logs:
            if '404' in l or l in seen: continue
            seen.add(l); print(l[:1500])
        await b.close()
asyncio.run(main())
