import asyncio, sys, os, json
from playwright.async_api import async_playwright
OUT = os.environ.get('OUT', '/home/claude/work/ar1/tmp'); os.makedirs(OUT, exist_ok=True)
async def main():
    steps = sys.argv[1:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, has_touch=True, is_mobile=True)
        pg = await ctx.new_page()
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:200] + ' | ' + str(getattr(e,'stack',''))[:600]))
        await pg.goto('http://127.0.0.1:8777/ar1/harness.html?' + os.environ.get('Q', 'lv=30'))
        await pg.evaluate("document.documentElement.style.setProperty('--tg-content-safe-area-inset-top','56px')")
        for i in range(60):
            if await pg.evaluate('!!window.__ready'): break
            await asyncio.sleep(0.5)
        defs = json.load(open('/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json'))
        await pg.evaluate(open('/home/claude/dev/ar1/prep.js').read(), {'defs': defs, 'lv': int(os.environ.get('LV', 30))})
        await pg.evaluate("window.__h = window.__ar1")
        for st in steps:
            if st.startswith('js:'): print(json.dumps(await pg.evaluate(st[3:])))
            elif st.startswith('wait:'): await asyncio.sleep(float(st[5:]))
            elif st.startswith('shot:'): await pg.screenshot(path=f'{OUT}/{st[5:]}.png')
            elif st.startswith('click:'): await pg.click(st[6:])
        for l in logs[-12:]: print(l)
        await b.close()
asyncio.run(main())
