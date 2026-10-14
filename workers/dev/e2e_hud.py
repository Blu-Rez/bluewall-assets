import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; W=int(os.environ.get('W',390)); H=int(os.environ.get('H',844))
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'reset':True},tok=T)
s,j=req('/api/dev',{'fill':True,'gems':100000,'army':'fill','set':{'keep':3},'hits':[
  {'by':'Sepideh','lost':{'ruby':120,'emerald':80,'turq':30},'tro':-18,'stars':2,'pct':64,'ago':5400},
  {'by':'Kian','lost':{'ruby':45},'tro':-9,'stars':1,'pct':41,'ago':40000}]},tok=T)
s,j=req('/api/upgrade/start',{'ent':'barracks'},tok=T)
from playwright.async_api import async_playwright
async def main():
    frag = urllib.parse.urlencode({"tgWebAppData": init_data(777), "tgWebAppVersion": "8.0", "tgWebAppPlatform": "android"})
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':W,'height':H}, device_scale_factor=1)
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type=='error' and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:500]))
        await pg.goto('http://127.0.0.1:8591/#' + frag)
        async def has(sel, want=True, t=300):
            for i in range(t):
                if await pg.evaluate("(s)=>!!document.querySelector(s)", sel) == want: return True
                await asyncio.sleep(1)
            return False
        await has('#bw-load', False, 600)
        await has('.bw-wel .rp', True, 120); await asyncio.sleep(10)
        await pg.screenshot(path=f'{OUT}_wel.png', timeout=180000)
        await pg.click('.bw-wel'); await has('.bw-wel', False, 120)
        print('wel closed; seen=', await pg.evaluate("localStorage.getItem('bw_log_seen')"))
        await has('.bwch', True, 400); await asyncio.sleep(6)
        for i in range(5):
            await pg.screenshot(path=f'{OUT}_coach{i}.png', timeout=180000)
            if not await pg.evaluate("!!document.querySelector('.bwch')"): break
            await pg.evaluate("()=>document.querySelector('.bwch').click()"); await asyncio.sleep(4)
        await asyncio.sleep(6); await pg.screenshot(path=f'{OUT}_hud.png', timeout=180000)
        print('rects', await pg.evaluate("(()=>['.bwh-btn','.bw-gems','.bw-who','.bw-lvl','.bw-pm','.bwh-atk','.bwh-strip'].map(s=>{const e=document.querySelector(s);if(!e)return [s,null];const r=e.getBoundingClientRect();return [s,Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}))()"))
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
