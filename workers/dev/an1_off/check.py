import asyncio, sys
from playwright.async_api import async_playwright
bad = 0
def ok(c, m):
    global bad; print(('ok   ' if c else 'FAIL ') + m)
    if not c: bad = 1
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 600, 'height': 400})
        reqs = []; errs = []
        pg.on('request', lambda r: reqs.append(r.url)); pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8779/index.html')
        for i in range(120):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        e = await pg.evaluate('window.__err || null'); ok(e is None and not errs, 'page runs without errors ' + ('' if e is None else e[:160]))
        R = await pg.evaluate('window.__res'); ok(bool(R), 'result present')
        if R:
            ok(R['ok'] and R['useAnimals'] is False and not R['err'], 'preload ok, Tripo animals OFF by default, no load errors %s' % R['err'])
            ok(not any(R['hasAnimal']), 'has() is false for every animal / bird / poultry key')
            ok(all(R['hasVill']), 'the four villagers are loaded (not affected)')
            ok(R['fauna'] and R['horses'] and R['gltf'] and R['dyn'], 'fauna / horses / gltfLike / dyn return null (old code stays in charge)')
            ok(R['people'], 'people() still builds a villager crowd kind')
        glb = [u.split('/')[-1] for u in reqs if '/assets/tr2/' in u and '.glb' in u]
        animal = [g for g in glb if g.startswith(('animal_', 'birds', 'poultry'))]
        ok(not animal and len(glb) >= 4, 'files requested: %s — no animal file downloaded' % ', '.join(sorted(set(g.split('?')[0] for g in glb))))
        await b.close()
asyncio.run(main()); sys.exit(bad)
