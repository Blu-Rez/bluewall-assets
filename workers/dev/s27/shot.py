import asyncio, sys
from playwright.async_api import async_playwright
STUB = 'window.Telegram={WebApp:{initData:"query_id=x",initDataUnsafe:{},version:"8.0",platform:"android",ready(){},expand(){},onEvent(){},offEvent(){},isVersionAtLeast(){return true},safeAreaInset:{top:0,bottom:0,left:0,right:0},contentSafeAreaInset:{top:0,bottom:0,left:0,right:0},setHeaderColor(){},setBackgroundColor(){},disableVerticalSwipes(){},requestFullscreen(){},BackButton:{show(){},hide(){},onClick(){}}}}'
base, out = sys.argv[1], sys.argv[2]
sizes = [(390,844,'p'),(844,390,'l'),(360,640,'s')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w,h,k in sizes:
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2)
            errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)[:160])); pg.on('console', lambda m: errs.append(m.text[:160]) if m.type=='error' else None)
            await pg.route('**/tg.js', lambda r: r.fulfill(body=STUB, content_type='application/javascript'))
            async def hang(route): await asyncio.sleep(60)
            await pg.route('**/api/auth', hang)
            await pg.goto(f'{base}/?p=72'); await asyncio.sleep(3.5)
            await pg.evaluate("window.bwLoading(72); window.bwTip('Raising the banners…')"); await asyncio.sleep(1.5)
            await pg.screenshot(path=f'{out}_{k}.png'); print(k, errs[:3]); await pg.close()
        await b.close()
asyncio.run(main())
