import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# census.py TAG [LV]: baseline census of the home map: per-mesh triangles + calls/tris at views with/without the planned town
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/s4a/census_' + TAG
VIEWS = {
  'top':    "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'town':   "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'ctr':    "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) { c.intro=null; } }')
        cen = await pg.evaluate("""() => { const out = []; __bw.scene.traverse((o) => { if (!o.isMesh) return; const g = o.geometry; const t = (g.index ? g.index.count : g.attributes.position.count) / 3; const n = o.isInstancedMesh ? o.count : 1; let p = o.parent, path = []; while (p && path.length < 3) { path.push(p.name || '-'); p = p.parent; } out.push({ name: o.name, mat: o.material && o.material.name, tris: Math.round(t), n, path: path.join('<'), vis: o.visible }); }); return out; }""")
        json.dump(cen, open(OUT + '_meshes.json', 'w'))
        late = await pg.evaluate("() => __bw.scene.getObjectByName('late-stage') ? __bw.scene.getObjectByName('late-stage').children.map(c => c.name) : []")
        print('late groups', late, flush=True)
        async def meas():
            return await pg.evaluate("""async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0; const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), n, progs: r.info.programs.length, tex: r.info.memory.textures }; r.info.autoReset = true; return o; }""")
        rows = {}
        for nm, js in VIEWS.items():
            await pg.evaluate('() => { const c=__bw.ctl; ' + js + ' }')
            await asyncio.sleep(8)
            a1 = await meas()
            await pg.evaluate("() => { for (const c of __bw.scene.getObjectByName('late-stage').children) if (c.name === 'late:townplan') c.visible = false; }")
            await asyncio.sleep(3)
            a0 = await meas()
            await pg.evaluate("() => { for (const c of __bw.scene.getObjectByName('late-stage').children) if (c.name === 'late:townplan') c.visible = true; }")
            rows[nm] = {'all': a1, 'no_townplan': a0}; print('view', nm, rows[nm], flush=True)
        json.dump(rows, open(OUT + '_views.json', 'w'), indent=1)
        print('LOGS', json.dumps(logs[:10]))
        await b.close()
asyncio.run(main())
