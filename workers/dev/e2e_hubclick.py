import asyncio, sys, os, json, time, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; W=int(os.environ.get('W',360)); H=int(os.environ.get('H',640))
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'reset':True},tok=T)
s,j=req('/api/dev',{'fill':True,'gems':100000,'army':'fill','set':{'keep':3}},tok=T)
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
        for i in range(90):
            if await pg.evaluate("!!document.querySelector('.bw-wel:not(.out)')"): await pg.evaluate("document.querySelector('.bw-wel').click()"); await asyncio.sleep(2)
            elif await pg.evaluate("!!document.querySelector('.bwch')"): await pg.evaluate("document.querySelector('.bwch .skip').click()"); await asyncio.sleep(2)
            elif await pg.evaluate("!!document.querySelector('.bwh-btn') && getComputedStyle(document.querySelector('.bwh-btn')).opacity>0.9 && !document.querySelector('.bw-wel:not(.out)')"): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate("window.__log=[]; const h=document.querySelector('.bwh'); ['pointerdown','pointerup','click'].forEach(t=>h.addEventListener(t,e=>window.__log.push(t+':'+e.target.tagName+'.'+(e.target.className||'')+'>'+((e.target.closest('[data-a]')||{dataset:{}}).dataset.a)),true))")
        await pg.screenshot(path=f'{OUT}_hud.png', timeout=180000)
        for k in ['build','friends']:
            await pg.click('.bwh-btn'); await asyncio.sleep(2)
            on0 = await pg.evaluate("document.querySelector('.bwh').classList.contains('on')")
            await pg.click(f'.bwh-t[data-a={k}]'); await asyncio.sleep(3)
            if k=='build':
                for i in range(90):
                    vis = await pg.evaluate("(()=>{const e=document.querySelector('.bwu.on');return e?getComputedStyle(e).visibility+'/'+getComputedStyle(e).opacity:'noon'})()")
                    if vis.startswith('visible/1'): break
                    await asyncio.sleep(1)
                print('build panel visible after extra', i, 's ->', vis)
                await asyncio.sleep(2)
            if k=='build': print('bwu', await pg.evaluate("[...document.querySelectorAll('[class*=bwu]')].map(e=>e.className+':'+getComputedStyle(e).visibility+'/'+getComputedStyle(e).opacity+'/'+getComputedStyle(e).display).slice(0,12)"))
            st = await pg.evaluate("({hub:document.querySelector('.bwh').classList.contains('on'),soc:!!document.querySelector('.bwk.bwc.on'),ups:!!document.querySelector('.bwu.on,.bwu-pan'),log:window.__log.slice(-4)})")
            print(k, 'hubopen', on0, '->', st)
            await pg.screenshot(path=f'{OUT}_{k}.png', timeout=180000)
            await pg.evaluate("(()=>{const x=document.querySelector('.bwc.on .bwk-x')||document.querySelector('.bwu.on .bwu-x')||document.querySelector('.bwu-x'); if(x) x.click();})()"); await asyncio.sleep(2)
        await pg.click('.bwh-btn'); await asyncio.sleep(2)
        print('attack tile', await pg.evaluate("(()=>{const a=document.querySelector('.bwh-a');return a?[a.className,a.textContent.trim()]:null})()"))
        await pg.screenshot(path=f'{OUT}_hub.png', timeout=180000)
        await pg.click('.bwh-a'); await asyncio.sleep(2)
        print('hub closed', await pg.evaluate("!document.querySelector('.bwh.on')"))
        for i in range(150):
            st = await pg.evaluate("(()=>({s:!!document.querySelector('.bws'),b:!!document.querySelector('.bwb'),army:!!document.querySelector('.bwa.on')}))()")
            if st['s'] or st['b'] or st['army']: break
            await asyncio.sleep(1)
        print('after attack tap', st, 'waited', i)
        await pg.screenshot(path=f'{OUT}_after.png', timeout=180000)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
