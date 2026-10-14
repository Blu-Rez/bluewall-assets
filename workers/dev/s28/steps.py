import asyncio, sys, json, os
from playwright.async_api import async_playwright
# steps.py URL STEPS.json OUTPREFIX [W H] : load the dev page once; for each step run js (may return json), wait N rendered frames, screenshot OUTPREFIX_name.png
URL, SF, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
VW, VH = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (390, 844)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': VW, 'height': VH}, device_scale_factor=1)
        glerr = [0]; logs = []; pg.on('console', lambda m: glerr.__setitem__(0, glerr[0] + 1) if 'GL_INVALID' in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        await pg.goto(URL)
        for i in range(900):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('(()=>{const c=__bw.ctl; c._skipIntro(); c.intro=null; c.vel.set(0,0)})()')
        for st in json.load(open(SF)):
            r = await pg.evaluate('(async()=>{' + st['js'] + '})()')
            if r is not None: print(st['name'], json.dumps(r)[:1500], flush=True)
            n = st.get('frames', 4)
            f0 = await pg.evaluate('__bw.frames')
            for i in range(600):
                if await pg.evaluate('__bw.frames') >= f0 + n: break
                await asyncio.sleep(0.5)
            if st.get('wait'): await asyncio.sleep(st['wait'])
            print(st['name'], 'GLerrors so far', glerr[0], flush=True)
            if st.get('shot', True): await pg.screenshot(path=f'{OUT}_{st["name"]}.png', timeout=240000)
        u=[]; [u.append(l) for l in logs if l[:90] not in [x[:90] for x in u]]; print('LOGS', len(logs), [x[:400] for x in u[:8]]); await b.close()
asyncio.run(main())
