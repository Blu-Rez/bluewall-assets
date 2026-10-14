import asyncio, sys, os, json, urllib.parse
exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
OUT = sys.argv[1]; UID = int(sys.argv[2]) if len(sys.argv) > 2 else 123
req('/api/auth',{'init_data':init_data(UID)})
from playwright.async_api import async_playwright
async def main():
    frag = urllib.parse.urlencode({"tgWebAppData": init_data(UID), "tgWebAppVersion": "8.0", "tgWebAppPlatform": "android"})
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type=='error' and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:500]))
        await pg.goto('http://127.0.0.1:8591/#' + frag)
        for i in range(600):
            await asyncio.sleep(1)
            if await pg.evaluate("!document.getElementById('bw-load')"): break
        print('loader gone after', i)
        await asyncio.sleep(12)
        await pg.screenshot(path=OUT+'_home.png', timeout=180000)
        print('attack btn', await pg.evaluate("(()=>{const b=document.querySelector('.bwa-btn'); return b? b.className+' | '+b.textContent.trim().slice(0,30):'none'})()"))
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        await asyncio.sleep(3)
        print('toast', await pg.evaluate("(document.querySelector('.bw-toast, .toast')||{textContent:'?'}).textContent"))
        await pg.evaluate("document.querySelector('.bwa-chip').click()")
        await asyncio.sleep(4)
        await pg.screenshot(path=OUT+'_army.png', timeout=180000)
        for l in logs[:15]: print(l)
        await b.close()
asyncio.run(main())
