import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; W=int(os.environ.get('W',390)); H=int(os.environ.get('H',844))
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'reset':True},tok=T)
s,j=req('/api/dev',{'fill':True,'gems':100000,'army':'fill','set':{'keep':3}},tok=T)
s,j=req('/api/upgrade/start',{'ent':'barracks'},tok=T)
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
        await asyncio.sleep(4)
        # skip the welcome card / tutorial if they show
        for i in range(60):
            if await pg.evaluate("!!document.querySelector('.bw-wel:not(.out)')"):
                await pg.evaluate("document.querySelector('.bw-wel').click()"); await asyncio.sleep(2)
            if await pg.evaluate("!!document.querySelector('.bwch')"):
                await pg.evaluate("document.querySelector('.bwch .skip') ? document.querySelector('.bwch .skip').click() : document.querySelector('.bwch').click()"); await asyncio.sleep(2)
            elif await pg.evaluate("!document.querySelector('.bw-wel:not(.out)')"): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.click('.bwh-btn'); await asyncio.sleep(3)
        print('attack tile', await pg.evaluate("(()=>{const a=document.querySelector('.bwh-a');return a?[a.className,a.textContent.trim(),getComputedStyle(a).display]:null})()"))
        await pg.screenshot(path=f'{OUT}_hub.png', timeout=180000)
        await pg.click('.bwh-a'); await asyncio.sleep(2)
        print('hub closed', await pg.evaluate("!document.querySelector('.bwh.on')"))
        for i in range(120):
            st = await pg.evaluate("(()=>({s:!!document.querySelector('.bws'),b:!!document.querySelector('.bwb'),ld:!!document.querySelector('.bwb-load'),army:!!document.querySelector('.bwa.on, .bwa-pan')}))()")
            if st['s'] or st['b']: break
            await asyncio.sleep(1)
        print('after attack tap', st)
        await pg.screenshot(path=f'{OUT}_after.png', timeout=180000)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
