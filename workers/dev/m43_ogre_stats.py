import asyncio, json
from playwright.async_api import async_playwright
# m43_ogre_stats.py — draw calls / triangles / programs of the Behemoth ogre kind in the lab (m43_ogre_look.html, real crowd path): 1 stance + 7 attack poses = 8 instances
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 400})
        await pg.goto('http://127.0.0.1:8777/m43_ogre_look.html?tier=0')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        for i in range(60):
            await asyncio.sleep(0.4)
            if await pg.evaluate('window.__frames >= 6'): break
        print(json.dumps(await pg.evaluate('({stats: window.__stats, err: window.__err || null})')))
        await b.close()
asyncio.run(main())
