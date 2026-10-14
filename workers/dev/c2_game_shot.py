import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# c2_game_shot.py : shots of the three C2 sites INSIDE the real game (dev/c2_dev_sites.html = the game + three temporary sites appended at build time, see c2_perf_sites.mjs).
# env SHOTS = "name:tx:tz:dist:polar:azim,..."  ->  /home/claude/work/c2_game_<name>.png
W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 620)); LV = os.environ.get('LV', '30')
SHOTS = [s.split(':') for s in os.environ['SHOTS'].split(',')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/c2_dev_sites.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }'); await asyncio.sleep(3)
        for nm, tx, tz, dist, polar, azim in SHOTS:
            await pg.evaluate(f'() => {{ const c=__bw.ctl; c.target.set({tx},0,{tz}); c.dist={dist}; c.polar={polar}; c.azim={azim}; }}')
            await asyncio.sleep(7)
            await pg.screenshot(path=f'/home/claude/work/c2_game_{nm}.png', timeout=120000); print('shot', nm, flush=True)
        print('LOGS', json.dumps(logs[:8]))
        await b.close()
asyncio.run(main())
