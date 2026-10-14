import asyncio, sys, os, json, time, urllib.parse
sys.argv_save = sys.argv
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'gems':100,'army':'fill'},tok=T)
before=req('/api/state',tok=T)[1]
print('owner army before', before['army']['army'], 'rep', len(before['army'].get('rep',[])) if isinstance(before['army'].get('rep'),list) else '?')
from playwright.async_api import async_playwright
async def enter(p, frag, vw=390, vh=844):
    b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width':vw,'height':vh}, device_scale_factor=1)
    logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type=='error' and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:500]))
    await pg.goto('http://127.0.0.1:8591/#' + frag)
    for i in range(600):
        await asyncio.sleep(1)
        if await pg.evaluate("!document.getElementById('bw-load')"): break
    await asyncio.sleep(4)
    await pg.evaluate("document.querySelector('.bwa-btn').click()")
    for i in range(300):
        await asyncio.sleep(1)
        if await pg.evaluate("!!document.querySelector('.bwb-sq .c') && !document.querySelector('.bwb-load:not(.off)')"): break
    await asyncio.sleep(6)
    return b, pg, logs
async def main():
    frag = urllib.parse.urlencode({"tgWebAppData": init_data(777), "tgWebAppVersion": "8.0", "tgWebAppPlatform": "android"})
    async with async_playwright() as p:
        # --- run 2: every spell, one screenshot each right after casting
        b, pg, logs = await enter(p, frag)
        sp = await pg.evaluate("[...document.querySelectorAll('.bwb-sp .s')].map(e=>e.dataset.s+':'+e.querySelector('b').textContent)")
        print('spells', sp)
        async def count(k): return int(await pg.evaluate("document.querySelector('.bwb-sp .s[data-s=%s] b').textContent"%k))
        for k in ['heal','rage','freeze','quake','lightning']:
            if not any(x.startswith(k+':') for x in sp): continue
            n0 = await count(k)
            for attempt in range(80):
                await pg.click('.bwb-sp .s[data-s=%s]'%k); await asyncio.sleep(0.4)
                await pg.mouse.click(195, 400); await asyncio.sleep(0.6)
                if await count(k) < n0: break
                await asyncio.sleep(2)
            print(k, 'cast after', attempt, 'attempts')
            await asyncio.sleep(0.6)
            await pg.screenshot(path=OUT+'_sp_'+k+'.png', timeout=180000)
            await asyncio.sleep(1.5)
        print('end btn text after cast:', await pg.evaluate("document.querySelector('.bwb-end').innerText"))
        for l in logs[:10]: print(l)
        await b.close()
asyncio.run(main())
