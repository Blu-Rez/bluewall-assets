import asyncio, sys, json
from playwright.async_api import async_playwright
# u1_perf.py : perf before / after of the two units in the REAL createUnitViews (ug_lab): load time (kind bake), draw calls, triangles, shader programs, JS time of views.update per frame
CFG = [('legionary x24', {"legionary": 24}), ('captain x3', {"captain": 3}), ('both (24 + 3)', {"legionary": 24, "captain": 3})]
async def one(b, page, army):
    pg = await b.new_page(viewport={'width': 800, 'height': 500})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' and '404' not in m.text else None)
    q = 'army=%s&tier=%s&gap=3' % (json.dumps(army, separators=(',', ':')), json.dumps({k: 2 for k in army}, separators=(',', ':')))
    await pg.goto('http://127.0.0.1:8777/%s?%s' % (page, q))
    for i in range(240):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready || !!window.__err'): break
    r = await pg.evaluate("""() => { const L = __lab; L.cam(0, 26, 70, 0, 3, 0, 40);
      L.render(); const info = L.renderer.info; const s0 = { calls: info.render.calls, tris: info.render.triangles };
      for (let i = 0; i < 5; i++) L.adv(1 / 30);
      const t0 = performance.now(); const N = 60; for (let i = 0; i < N; i++) L.adv(1 / 30); const upd = (performance.now() - t0) / N;
      L.render(); return { loadMs: Math.round(window.__loadMs), calls: info.render.calls, tris: info.render.triangles, programs: info.programs.length, textures: info.memory.textures, geometries: info.memory.geometries, updateMs: +upd.toFixed(3), err: window.__err || '' }; }""")
    r['errs'] = errs[:2]; await pg.close(); return r
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        res = {}
        for name, army in CFG:
            for var, page in (('base', 'u1_ug_base.html'), ('new', 'u1_ug_new.html')):
                res[(name, var)] = await one(b, page, army); print(name, var, json.dumps(res[(name, var)]), flush=True)
        await b.close()
        print('\n| scene | | load ms | draw calls | triangles | programs | update ms/frame |\n|---|---|---|---|---|---|---|')
        for name, _ in CFG:
            for var in ('base', 'new'):
                r = res[(name, var)]; print('| %s | %s | %d | %d | %d | %d | %.2f |' % (name, var, r['loadMs'], r['calls'], r['tris'], r['programs'], r['updateMs']))
asyncio.run(main())
