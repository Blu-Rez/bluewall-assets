import asyncio, sys, json
from playwright.async_api import async_playwright
STUB = 'window.Telegram={WebApp:{initData:"query_id=x",initDataUnsafe:{},version:"8.0",platform:"android",ready(){},expand(){},onEvent(){},offEvent(){},isVersionAtLeast(){return true},safeAreaInset:{top:0,bottom:0,left:0,right:0},contentSafeAreaInset:{top:0,bottom:0,left:0,right:0},setHeaderColor(){},setBackgroundColor(){},disableVerticalSwipes(){},requestFullscreen(){},BackButton:{show(){},hide(){},onClick(){}}}}'
URL = sys.argv[1]; DSF = 3.28
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--enable-gpu-rasterization'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=DSF)
        await pg.route('**/tg.js', lambda r: r.fulfill(body=STUB, content_type='application/javascript'))
        async def hang(route): await asyncio.sleep(60)
        await pg.route('**/api/auth', hang)
        cdp = await pg.context.new_cdp_session(pg)
        layers = {}
        cdp.on('LayerTree.layerTreeDidChange', lambda e: layers.__setitem__('l', e.get('layers') or layers.get('l')))
        await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable')
        await pg.goto(URL); await asyncio.sleep(4)
        await pg.evaluate("window.bwLoading(60)"); await asyncio.sleep(1.5)
        L = layers.get('l') or []
        rows = []
        for l in L:
            if not l.get('drawsContent'): continue
            w, h = l['width'], l['height']; px = w*h*DSF*DSF
            name = ''
            try:
                d = await cdp.send('DOM.describeNode', {'backendNodeId': l['backendNodeId']})
                n = d['node']; at = dict(zip(n.get('attributes', [])[::2], n.get('attributes', [])[1::2]))
                name = n['nodeName'].lower() + ('#' + at['id'] if 'id' in at else '') + ('.' + at['class'].replace(' ', '.') if 'class' in at else '')
            except Exception: pass
            rows.append((px, w, h, name))
        rows.sort(reverse=True)
        tot = sum(r[0] for r in rows)
        print(f'drawing layers: {len(rows)}  total {tot/1e6:.1f} Mpx  ≈ {tot*4/1048576:.0f} MB (x4 B)   screen = {390*844*DSF*DSF/1e6:.1f} Mpx')
        for px, w, h, n in rows[:14]: print(f'{px/1e6:6.2f} Mpx  {w:.0f}x{h:.0f}  {n}')
        await b.close()
asyncio.run(main())
