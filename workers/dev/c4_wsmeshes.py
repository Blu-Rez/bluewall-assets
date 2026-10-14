import asyncio, sys, os, json
from playwright.async_api import async_playwright
# c4_wsmeshes.py PAGE.html — in the REAL game: how many worksite meshes (= draw calls without shadows) are visible per site from the overview camera (top) and from a close view of the farm / slaughter.
PAGE = sys.argv[1]
VIEWS = {'top': "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;", 'ws_farm': "c.target.set(244,0,-98); c.dist=85; c.polar=0.95; c.azim=-0.47;", 'ws_slaughter': "c.target.set(-76,0,264); c.dist=85; c.polar=0.95; c.azim=-1.87;"}
JS = """() => { const g = __bw.scene.getObjectByName('late-stage').children.find((c) => c.name === 'late:worksites'); const out = {}; let tot = 0, tris = 0;
  const vis = (o) => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  g.traverse((o) => { if (!o.isMesh || !vis(o)) return; let p = o; while (p && !(p.name || '').startsWith('ws:') ) p = p.parent; const id = p ? p.name : (o.name || 'other'); out[id] = (out[id] || 0) + 1; tot++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 * (o.isInstancedMesh ? Math.max(1, o.count) : 1); });
  return { total: tot, tris: Math.round(tris), sites: out }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 520})
        await pg.goto('http://127.0.0.1:8777/' + PAGE + '?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }'); await asyncio.sleep(3)
        for nm, js in VIEWS.items():
            await pg.evaluate('() => { const c=__bw.ctl; ' + js + ' }'); await asyncio.sleep(6)
            r = await pg.evaluate(JS); print(PAGE, nm, 'visible worksite meshes', r['total'], 'tris', r['tris'], json.dumps(r['sites'], sort_keys=True), flush=True)
        await b.close()
asyncio.run(main())
