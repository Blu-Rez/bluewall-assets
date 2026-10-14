import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt_shot.py OUT "name=JS" ... : the real game (dev_s35.html) -> click ATTACK -> battle ready -> run each JS, then a screenshot (name starting with _ : no shot). env LV Q W H HOUR PAGE
async def main():
    out = sys.argv[1]; steps = sys.argv[2:]
    W = int(os.environ.get('W', 450)); H = int(os.environ.get('H', 900))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error',) and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_s35.html') + '?q=' + os.environ.get('Q', 'low') + '&w=clear&h=' + os.environ.get('HOUR', '14') + '&wa=0.1' + ('&lv=' + os.environ['LV'] if os.environ.get('LV') else ''))
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        print('battle ready', await pg.evaluate('!!(__bw.battle && __bw.battle.active)'), flush=True)
        await asyncio.sleep(3)
        print(await pg.evaluate('JSON.stringify({types: __bw.battle.session.types})'))
        for s in steps:
            name, js = s.split('=', 1)
            if js: print('JS', name, str(await pg.evaluate(js))[:600], flush=True)
            if name.startswith('_'): continue
            f0 = await pg.evaluate('__bw.frames')
            for i in range(300):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'__bw.frames >= {f0} + 3'): break
            await pg.screenshot(path=f'{out}_{name}.png', timeout=240000); print('shot', name, flush=True)
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
