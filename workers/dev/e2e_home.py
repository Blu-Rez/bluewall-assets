import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; W=int(os.environ.get('W',390)); H=int(os.environ.get('H',844))
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'reset':True},tok=T)
s,j=req('/api/dev',{'fill':True,'gems':100000,'army':'fill','set':{'keep':3}},tok=T)
s,j=req('/api/upgrade/start',{'ent':'barracks'},tok=T); print('upgrade', s, j.get('ok'), j.get('why'))
# some history + a friend
s,j=req('/api/scout',{},tok=T); tg=j['target']; army=j['army']['army']; sent={u:max(1,n//2) for u,n in army.items()}
s,e=req('/api/battle/end',{'id':tg['id'],'rep':{'sent':sent,'lost':{},'destruction':83,'stars':2,'loot':{'ruby':1200,'emerald':800,'turq':300}}},tok=T)
a2=req('/api/auth',{'init_data':init_data(5001, 'ref_777')})[1]['token']; req('/api/state',tok=a2)
s,c=req('/api/clan',{'op':'create','name':'Blue Fleet','tag':'bf'},tok=T); print('clan', c.get('ok'), c.get('why'))
b2=req('/api/auth',{'init_data':init_data(5002)})[1]['token']; req('/api/dev',{'fill':True,'set':{'keep':3}},tok=b2); print('join', req('/api/clan',{'op':'join','id':1},tok=b2)[1].get('ok'))
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
        await pg.screenshot(path=f'{OUT}_home.png', timeout=180000)
        print('rects', await pg.evaluate("(()=>['.bwh-btn','.bw-gems','.bw-who','.bw-lvl','.bw-pm','.bwh-atk','.bwh-strip'].map(s=>{const e=document.querySelector(s);if(!e)return [s,null];const r=e.getBoundingClientRect();return [s,Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}))()"))
        async def settle(sel_gone, t=60):
            for i in range(t):
                if await pg.evaluate("(s)=>!document.querySelector(s)", sel_gone): return
                await asyncio.sleep(1)
        async def appear(sel, t=90):
            for i in range(t):
                if await pg.evaluate("(s)=>!!document.querySelector(s)", sel): return
                await asyncio.sleep(1)
        await pg.click('.bwh-btn'); await asyncio.sleep(3); await pg.screenshot(path=f'{OUT}_hub.png', timeout=180000)
        await pg.click('.bwh-x'); await settle('.bwh.on'); await asyncio.sleep(2)
        for t in ('clan','friends','log'):
            await pg.click('.bwh-btn'); await asyncio.sleep(2)
            await pg.click(f'.bwh-t[data-a={t}]'); await settle('.bwh.on'); await appear('.bwk.bwc.on'); await asyncio.sleep(3); await pg.screenshot(path=f'{OUT}_{t}.png', timeout=180000)
            await pg.click('.bwc .bwk-x'); await settle('.bwk.bwc.on'); await asyncio.sleep(1.5)
        # the tutorial, replayed from Settings
        await pg.click('.bwh-btn'); await asyncio.sleep(2)
        await pg.click('.bwh-t[data-a=set]'); await settle('.bwh.on'); await asyncio.sleep(2)
        await pg.evaluate("()=>{const b=[...document.querySelectorAll('.bw-btnw')].find(x=>/tutorial/i.test(x.textContent)); if(b) b.click();}")
        await asyncio.sleep(8)
        for i in range(4):
            await pg.screenshot(path=f'{OUT}_coach{i}.png', timeout=180000)
            if not await pg.evaluate("!!document.querySelector('.bwch')"): break
            await pg.evaluate("()=>document.querySelector('.bwch').click()"); await asyncio.sleep(3)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
