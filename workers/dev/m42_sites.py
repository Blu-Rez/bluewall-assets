import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# m42_sites.py [base|after] [lv=30]: per-worksite meshes (= draw calls without shadows) / tris / distinct materials, read from the real game scene ('ws:<id>' groups).  Writes /home/claude/work/m42_sites_<which>.json
WHICH = sys.argv[1] if len(sys.argv) > 1 else 'after'; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
PAGE = 'dev_base.html' if WHICH == 'base' else 'dev_s35.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q=low&w=clear&h=14&wa=0.1&lv={LV}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        res = await pg.evaluate("""() => { const out = {}; __bw.scene.traverse((g) => { if (!g.name || !g.name.startsWith('ws:') || g.name === 'ws:') return;
            let meshes = 0, tris = 0, minorMeshes = 0, minorTris = 0; const mats = new Set();
            g.traverse((o) => { if (!o.isMesh) return; const inMinor = (() => { let q = o; while (q && q !== g) { if (q.name === 'minor') return true; q = q.parent; } return false; })(); const n = o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; if (inMinor) { minorMeshes++; minorTris += n; } else { meshes++; tris += n; } mats.add(o.material.uuid); });
            out[g.name] = { meshes, tris: Math.round(tris), minorMeshes, minorTris: Math.round(minorTris), mats: mats.size }; }); return out; }""")
        json.dump(res, open(f'/home/claude/work/m42_sites_{WHICH}.json', 'w'), indent=1)
        print(WHICH, 'ready', round(time.time() - t0), 's, sites', len(res), 'pageerrors', errs[:3])
        await b.close()
asyncio.run(main())
