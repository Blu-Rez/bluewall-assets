import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'gems':100,'army':'fill'},tok=T)
from playwright.async_api import async_playwright
async def main():
    frag = urllib.parse.urlencode({"tgWebAppData": init_data(777), "tgWebAppVersion": "8.0", "tgWebAppPlatform": "android"})
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type=='error' and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:500]))
        await pg.goto('http://127.0.0.1:8591/#' + frag)
        for i in range(600):
            await asyncio.sleep(1)
            if await pg.evaluate("!document.getElementById('bw-load')"): break
        print('loader gone after', i, flush=True)
        await asyncio.sleep(5)
        await pg.evaluate("document.querySelector('.bwa-chip').click()")
        await asyncio.sleep(2.5)
        await pg.screenshot(path=OUT+'_army.png', timeout=180000); print('army shot', flush=True)
        await pg.evaluate("document.querySelector('.bwa-x').click()")
        await asyncio.sleep(1.5)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(300):
            await asyncio.sleep(1)
            if await pg.evaluate("!!document.querySelector('.bwb-sq .c') && !document.querySelector('.bwb-load:not(.off)')"): break
        await asyncio.sleep(6)
        await pg.screenshot(path=OUT+'_battle.png', timeout=180000); print('battle shot', flush=True)
        # NEXT while scouting -> the one loading screen (no separate search page), then the next battle
        await pg.evaluate("document.querySelector('.bwb-next').click()")
        seen = []
        for i in range(600):
            await asyncio.sleep(0.25)
            st = await pg.evaluate("(()=>{const l=[...document.querySelectorAll('.bwb-load')]; const s=document.querySelector('.bws'); return {n:l.length, s:!!s, pc:l.map(x=>x.querySelector('.pc')?x.querySelector('.pc').textContent:'-').join(',')}})()")
            if not seen or seen[-1]!=st: seen.append(st)
            if i>8 and st['n']==0 and await pg.evaluate("!!document.querySelector('.bwb-sq .c')"): break
        print('loader states', seen[:12], '...', seen[-2:], flush=True)
        await asyncio.sleep(4)
        await pg.screenshot(path=OUT+'_battle2.png', timeout=180000)
        print('LOGS', logs[:6])
        await b.close()
asyncio.run(main())
