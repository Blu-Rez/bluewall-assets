import asyncio, sys, json, os, glob, time
from playwright.async_api import async_playwright
# live.py URL [W H]: load the dev page once and then serve step files: drop s30/cmd/<name>.json (list of {name,js,frames,wait,shot}); results -> s30/cmd/<name>.out (+ png OUT_<name>_<step>.png); quits when s30/cmd/QUIT exists
URL = sys.argv[1]; VW, VH = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (390, 844)
D = '/home/claude/dev/s30/cmd'; os.makedirs(D, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': VW, 'height': VH}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type == 'error' and '404' not in m.text and 'GL_INVALID' not in m.text else None)
        await pg.goto(URL)
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('(()=>{const c=__bw.ctl; c._skipIntro(); c.intro=null; c.vel.set(0,0)})()')
        open(D + '/READY', 'w').write('1')
        while not os.path.exists(D + '/QUIT'):
            fs = sorted(glob.glob(D + '/*.json'))
            if not fs: await asyncio.sleep(1); continue
            f = fs[0]; name = os.path.basename(f)[:-5]; out = []
            try: steps = json.load(open(f))
            except Exception as e: os.rename(f, f + '.bad'); continue
            os.rename(f, f + '.run')
            for st in steps:
                try:
                    r = await pg.evaluate('(async()=>{' + st['js'] + '})()')
                    if r is not None: out.append(st['name'] + ' ' + json.dumps(r)[:3000])
                    n = st.get('frames', 4); f0 = await pg.evaluate('__bw.frames')
                    for i in range(600):
                        if await pg.evaluate('__bw.frames') >= f0 + n: break
                        await asyncio.sleep(0.5)
                    if st.get('wait'): await asyncio.sleep(st['wait'])
                    open(D + '/' + name + '.part', 'w').write('\n'.join(out))
                    if st.get('shot', True): await pg.screenshot(path=f'/home/claude/dev/s30/t/{name}_{st["name"]}.png', timeout=240000)
                except Exception as e: out.append(st['name'] + ' ERR ' + str(e)[:300])
            out.append('LOGS ' + json.dumps(logs[-6:])[:800])
            open(D + '/' + name + '.out', 'w').write('\n'.join(out)); os.rename(f + '.run', f + '.done')
        await b.close()
asyncio.run(main())
