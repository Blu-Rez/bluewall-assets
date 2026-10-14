import asyncio, sys, os, json, time, glob
from playwright.async_api import async_playwright
# rp1_drv.py : ONE persistent browser on the real game (the full load takes minutes in software GL). Commands come as files in work/rp1/q/NNN.json, answers go to work/rp1/r/NNN.json.
#   env: W H (viewport, default 390x844), URL (page + query), BASE (alternative app js is served by the page itself)
W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844)); URL = os.environ.get('URL', 'rp1_dev.html?q=low&w=clear&h=14&wa=0.1')
Q = '/home/claude/work/rp1/q/'; R = '/home/claude/work/rp1/r/'; SH = '/home/claude/work/rp1/shots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') or 'rpg' in m.text.lower() else None)
        t0 = time.time()
        await pg.goto('http://127.0.0.1:8777/' + URL)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('ready after', round(time.time() - t0), 's', flush=True)
        open('/home/claude/work/rp1/ready', 'w').write(str(round(time.time() - t0)))
        while True:
            fs = sorted(glob.glob(Q + '*.json'))
            if not fs: await asyncio.sleep(0.3); continue
            f = fs[0]; cmd = json.load(open(f)); os.remove(f); out = {'ok': True}
            try:
                op = cmd['op']
                if op == 'eval': out['v'] = await pg.evaluate(cmd['js'])
                elif op == 'shot': await pg.screenshot(path=SH + cmd['name'] + '.png', timeout=300000); out['v'] = SH + cmd['name'] + '.png'
                elif op == 'click': await pg.click(cmd['sel'], timeout=60000)
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
