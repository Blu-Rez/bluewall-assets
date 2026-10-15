import asyncio, sys, os, json, time, glob
from playwright.async_api import async_playwright
# rp1c2_drv.py (RP1C-R2): ONE persistent browser on the real game (the full load takes minutes in software GL).  Commands are files work/rp1c2/q/NNN.json, answers work/rp1c2/r/NNN.json.
#   env: W H (viewport, default 390x844), DPR (device scale factor, default 1), URL (page + query)
W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844)); DPR = float(os.environ.get('DPR', 1)); URL = os.environ.get('URL', 'rp1_dev.html?q=low&w=clear&h=14&wa=0.1')
TAG = os.environ.get('TAG', 'rp1c3'); BASE = '/home/claude/work/' + TAG + '/'
Q = BASE + 'q/'; R = BASE + 'r/'; SH = BASE + 'shots/'
for d in (Q, R, SH): os.makedirs(d, exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=DPR, has_touch=True, is_mobile=True)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') or 'rpg' in m.text.lower() else None)
        t0 = time.time()
        await pg.goto('http://127.0.0.1:' + os.environ.get('PORT', '8777') + '/' + URL)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('ready after', round(time.time() - t0), 's', flush=True)
        open(BASE + 'ready', 'w').write(str(round(time.time() - t0)))
        while True:
            fs = sorted(glob.glob(Q + '*.json'))
            if not fs: await asyncio.sleep(0.3); continue
            f = fs[0]; cmd = json.load(open(f)); os.remove(f); out = {'ok': True}
            try:
                op = cmd['op']
                if op == 'eval': out['v'] = await pg.evaluate(cmd['js'])
                elif op == 'shot':
                    if cmd.get('clip'): await pg.screenshot(path=SH + cmd['name'] + '.png', timeout=300000, clip=cmd['clip'])
                    else: await pg.screenshot(path=SH + cmd['name'] + '.png', timeout=300000)
                    out['v'] = SH + cmd['name'] + '.png'
                elif op == 'dsf':                                                                   # change the device scale factor live (CDP) — one loaded session serves dpr 1 and dpr 2
                    cdp = await pg.context.new_cdp_session(pg); await cdp.send('Emulation.setDeviceMetricsOverride', {'width': W, 'height': H, 'deviceScaleFactor': float(cmd['v']), 'mobile': True}); out['v'] = 'dsf ' + str(cmd['v'])
                elif op == 'click': await pg.click(cmd['sel'], timeout=60000)
                elif op == 'touch': await pg.touchscreen.tap(cmd['x'], cmd['y'])
                elif op == 'mouse':
                    m = pg.mouse
                    for st in cmd['steps']:
                        if st[0] == 'move': await m.move(st[1], st[2])
                        elif st[0] == 'down': await m.down()
                        elif st[0] == 'up': await m.up()
                elif op == 'key': await pg.keyboard.press(cmd['k'])
                elif op == 'keydown': await pg.keyboard.down(cmd['k'])
                elif op == 'keyup': await pg.keyboard.up(cmd['k'])
                elif op == 'logs': out['v'] = logs[-60:]
                elif op == 'sleep': await asyncio.sleep(cmd['s'])
                elif op == 'quit': json.dump(out, open(R + os.path.basename(f), 'w')); break
            except Exception as e: out = {'ok': False, 'err': str(e)[:800]}
            json.dump(out, open(R + os.path.basename(f), 'w'))
        await b.close()
asyncio.run(main())
