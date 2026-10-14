import asyncio, sys, os, json
from playwright.async_api import async_playwright
JS = r'''
(() => { const B = __bw, r = B.renderer, c = B.ctl; B.pause(true); const out = [];
  const I = c.intro; for (const k of [0, 0.15, 0.35, 0.6, 1]) { I.t = I.dur * k; I.hold = true; c.update(0); r.info.reset(); r.shadowMap.needsUpdate = true; r.render(B.scene, B.camera);
    out.push([k, Math.round(c.dist), r.info.render.calls, Math.round(r.info.render.triangles / 1000) + 'k']); } return JSON.stringify(out); })()
'''
async def main():
    q = sys.argv[1]; w = int(sys.argv[2]); h = int(sys.argv[3])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        await pg.goto(f'http://127.0.0.1:8777/dev.html?q={q}&h=22&nolate=1&wa=999')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(3)
        print(await pg.evaluate(JS)); await b.close()
asyncio.run(main())
