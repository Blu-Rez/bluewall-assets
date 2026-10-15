import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
OUT = '/home/claude/work/ar1/tmp'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=float(os.environ.get('DPR', 1)), has_touch=True, is_mobile=True)
        pg = await ctx.new_page()
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]) if m.type in ('error',) and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_ar1.html?q=low&w=clear&h=14&wa=0.1')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        print('ready', T(), flush=True)
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('late', T(), flush=True)
        await pg.evaluate("document.documentElement.style.setProperty('--tg-content-safe-area-inset-top','56px')")
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        await asyncio.sleep(2)
        await pg.evaluate('__bw.armyUI.open()')
        await asyncio.sleep(3)
        await pg.screenshot(path=OUT + '/game_probe.png', timeout=120000)
        print('shot', T(), flush=True)
        print(json.dumps(await pg.evaluate("({lv: __bw.econ.st.level, hasArmy: !!__bw.econ.st.army, imgs: [...document.querySelectorAll('.bwa-c img')].length, sp: JSON.stringify(__bw.econ.st.army.units.spear).slice(0,200)})")))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
