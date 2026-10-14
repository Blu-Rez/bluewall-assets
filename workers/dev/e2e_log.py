import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; W=int(os.environ.get('W',390)); H=int(os.environ.get('H',844))
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'reset':True},tok=T)
s,j=req('/api/dev',{'fill':True,'gems':100000,'army':'fill','set':{'keep':3}},tok=T)
s,j=req('/api/scout',{},tok=T); tg=j['target']; army=j['army']['army']; sent={u:max(1,n//2) for u,n in army.items()}
for k in range(3):
    s,e=req('/api/battle/end',{'id':tg['id'],'rep':{'sent':sent,'lost':{},'destruction':40+k*20,'stars':k,'loot':{'ruby':1200,'emerald':800,'turq':300}}},tok=T)
a2=req('/api/auth',{'init_data':init_data(5001, 'ref_777')})[1]['token']; req('/api/state',tok=a2)
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
        await asyncio.sleep(6)
        async def has(sel, want=True, t=120):
            for i in range(t):
                if await pg.evaluate("(s)=>!!document.querySelector(s)", sel) == want: return True
                await asyncio.sleep(1)
            return False
        for t in ('friends','log'):
            await pg.click('.bwh-btn'); await has('.bwh.on')
            await pg.click(f'.bwh-t[data-a={t}]'); await has('.bwk.bwc.on'); await has('.bwh.on', False); await asyncio.sleep(4)
            await pg.screenshot(path=f'{OUT}_{t}_a.png', timeout=180000); await asyncio.sleep(14)
            await pg.screenshot(path=f'{OUT}_{t}.png', timeout=180000)
            print(t, await pg.evaluate("[...document.querySelectorAll('.bwk.bwc,.bwh')].map(e=>e.className+':'+getComputedStyle(e).opacity+':'+getComputedStyle(e).visibility)"))
            print(t, 'scroll', await pg.evaluate("[document.scrollingElement.scrollTop, document.body.scrollTop]"))
            await pg.click('.bwc .bwk-x'); await has('.bwk.bwc.on', False); await asyncio.sleep(2)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
