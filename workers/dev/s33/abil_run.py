import asyncio, sys, base64
from playwright.async_api import async_playwright
# abil_run.py QUERY : renders the emblems and writes s33/abil/{shield,rally}.png (+ sheet.png screenshot)
async def main():
    q = sys.argv[1] if len(sys.argv) > 1 else ''
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 330})
        logs = []; pg.on('console', lambda m: logs.append(m.text[:300]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/s33/abil.html' + q)
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        print('err', await pg.evaluate('window.__err||""'))
        out = await pg.evaluate('window.__out||{}')
        for k, v in out.items(): open(f'/home/claude/dev/s33/abil/{k}.png', 'wb').write(base64.b64decode(v.split(',')[1]))
        await asyncio.sleep(1); await pg.screenshot(path='/home/claude/dev/s33/abil/sheet.png')
        print('dbg', await pg.evaluate('window.__dbg||""')); print(logs[-8:]); await b.close()
asyncio.run(main())
