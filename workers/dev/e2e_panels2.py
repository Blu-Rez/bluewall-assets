import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; W=int(os.environ.get('W',390)); H=int(os.environ.get('H',844))
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'gems':100,'army':'fill'},tok=T)
from playwright.async_api import async_playwright
async def main():
    frag = urllib.parse.urlencode({"tgWebAppData": init_data(777), "tgWebAppVersion": "8.0", "tgWebAppPlatform": "android"})
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':W,'height':H}, device_scale_factor=1)
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type=='error' and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:500]))
        await pg.goto('http://127.0.0.1:8591/#' + frag)
        for i in range(600):
            await asyncio.sleep(1)
            if await pg.evaluate("!document.getElementById('bw-load')"): break
        await asyncio.sleep(45)
        ONLY=os.environ.get('ONLY')
        for name, open_js, close_js in tuple(x for x in (('rank',"document.querySelector('.bwk-chip').click()","document.querySelector('.bwk-x').click()"),
                                        ('army',"document.querySelector('.bwa-chip').click()","document.querySelector('.bwa-x').click()"),
                                        ('build',"document.querySelector('.bwu-btn').click()","document.querySelector('.bwu-x') && document.querySelector('.bwu-x').click()"),
                                        ('set',"document.querySelector('.bw-lvl').click()","document.querySelector('[data-a=setclose]').click()")) if not ONLY or x[0]==ONLY):
            await pg.evaluate(open_js); await asyncio.sleep(45)
            await pg.screenshot(path=f'{OUT}_{name}.png', timeout=180000)
            r = await pg.evaluate("(()=>{const q=['.bwk-pan','.bwa-pan','.bwu-pan','.bw-panel'].map(s=>document.querySelector(s)).filter(e=>e&&e.getBoundingClientRect().width>0&&e.offsetParent!==null);return q.map(e=>{const r=e.getBoundingClientRect();return [e.className,Math.round(r.top),Math.round(r.height)]})})()")
            print(name, r, flush=True)
            await pg.evaluate(close_js); await asyncio.sleep(1.2)
        print('LOGS', logs[:6])
        await b.close()
asyncio.run(main())
