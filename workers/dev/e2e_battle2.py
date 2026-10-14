import asyncio, sys, os, json, time, urllib.parse
sys.argv_save = sys.argv
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,j=req('/api/dev',{'gems':100,'army':'fill'},tok=T)
before=req('/api/state',tok=T)[1]
print('owner army before', before['army']['army'], 'rep', len(before['army'].get('rep',[])) if isinstance(before['army'].get('rep'),list) else '?')
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
        print('loader gone after', i)
        await asyncio.sleep(5)
        print('attack btn', await pg.evaluate("(()=>{const b=document.querySelector('.bwa-btn'); return b? b.className+' | '+b.textContent.trim().slice(0,30):'none'})()"))
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(300):
            await asyncio.sleep(1)
            if await pg.evaluate("!!document.querySelector('.bwb-sq .c') && !document.querySelector('.bwb-load:not(.off)')"): break
        await asyncio.sleep(6)
        print('battle ui after', i, await pg.evaluate("document.querySelector('.bwb-load') ? document.querySelector('.bwb-load').className : 'noload'"))
        await pg.screenshot(path=OUT+'_a.png', timeout=180000)
        # send first squad + second squad
        cards = await pg.query_selector_all('.bwb-sq .c')
        print('cards', len(cards))
        for k in range(12):
            await cards[0].click(); await asyncio.sleep(1)
            await pg.evaluate("(()=>{const pad=document.querySelector('.bwb-pad'); const o={bubbles:true,clientX:195,clientY:420,pointerId:1,pointerType:'touch',isPrimary:true}; pad.dispatchEvent(new PointerEvent('pointerdown',o)); pad.dispatchEvent(new PointerEvent('pointerup',o));})()"); await asyncio.sleep(4)
            if await pg.evaluate("!document.querySelector('.bwb-end.home')"): print('started after try', k); break
        await pg.screenshot(path=OUT+'_b.png', timeout=180000)
        # retreat: first press asks, second confirms
        await pg.click('.bwb-end'); await asyncio.sleep(1.5)
        await pg.screenshot(path=OUT+'_cf.png', timeout=180000)
        await pg.click('.bwb-cf .yes'); await asyncio.sleep(1)
        for i in range(120):
            await asyncio.sleep(1)
            if await pg.evaluate("!!document.querySelector('.bwb-res.on')"): break
        await asyncio.sleep(3)
        print('results on after', i, await pg.evaluate("(document.querySelector('.bwb-res .bwb-card')||{innerText:'none'}).innerText.replace(/\\n+/g,' | ').slice(0,400)"))
        await pg.screenshot(path=OUT+'_c.png', timeout=180000)
        await pg.click('.bwb-res [data-b=home]'); await asyncio.sleep(4)
        print('battle active class? ui visible', await pg.evaluate("!!document.querySelector('.bwa-btn') && getComputedStyle(document.querySelector('.bwa-btn')).display"))
        for l in logs[:15]: print(l)
        await b.close()
asyncio.run(main())
after=req('/api/state',tok=T)[1]
print('owner army after ', after['army']['army'])
