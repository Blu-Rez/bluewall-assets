import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    w, h, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
        logs=[]; pg.on('console', lambda m: logs.append(m.text[:150])); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:200]))
        await pg.route('**/tg.js', lambda r: r.fulfill(body='window.Telegram={WebApp:{initData:"",ready(){},expand(){}}}', content_type='application/javascript'))
        await pg.goto('http://127.0.0.1:8777/loadv.html?s=' + sys.argv[4])
        await asyncio.sleep(2.5)
        await pg.evaluate("document.querySelector('.lbar').style.display='';document.getElementById('msg').className='';document.getElementById('bw-tip').style.display='';bwLoading(64);bwTip('Forging shaders…')")
        await asyncio.sleep(1.2)
        await pg.screenshot(path=out)
        print(logs[-5:]); await b.close()
asyncio.run(main())
