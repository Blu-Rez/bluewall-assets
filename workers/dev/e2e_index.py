import asyncio, sys, json, os
from playwright.async_api import async_playwright
WALL = open('/home/claude/bot/bluebot_v2/bluewall/web/app/wall.js', 'rb').read()
async def main():
    S = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:200]) if '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.route('**/tg.js', lambda r: r.fulfill(body='window.Telegram={WebApp:{initData:"x=1",ready(){},expand(){},isVersionAtLeast(){return false},platform:"web"}}', content_type='application/javascript'))
        await pg.route('**/api/auth', lambda r: r.fulfill(body=json.dumps({'ok': True, 'token': 't', 'uid': 1, 'name': 'Blꪊe Heart', 'owner': True}), content_type='application/json'))
        await pg.route('**/api/bundle', lambda r: r.fulfill(body=WALL, headers={'X-Raw-Size': str(len(WALL)), 'Content-Type': 'text/javascript'}))
        await pg.route('**/api/state', lambda r: r.fulfill(body=json.dumps({'ok': True, 'level': 20, 'gems': {'ruby': 369, 'emerald': 657, 'turq': 759}, 'mines': {}, 'vault': {}, 'owner': True}), content_type='application/json'))
        await pg.goto('http://127.0.0.1:8777/loadtest.html')
        seen = []
        for i in range(2400):
            await asyncio.sleep(1)
            t = await pg.evaluate("(()=>{const e=document.getElementById('pct'), t=document.getElementById('bw-tip'); return e? (e.textContent+' | '+(t?t.textContent:'')) : 'LOADER GONE'})()")
            if not seen or seen[-1] != t: seen.append(t); print(i, t, flush=True)
            if t == 'LOADER GONE': break
        await asyncio.sleep(4)
        await pg.screenshot(path=S + '/e2e_after.png')
        print('welcome card present:', await pg.evaluate("!!document.querySelector('.bw-wel')"))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
