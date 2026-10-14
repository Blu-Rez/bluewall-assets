import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# frames.py TAG [LV]: baseline census of the home map: per-mesh triangles + calls/tris at views with/without the planned town
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/s4a/fr_' + TAG
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
        info = await pg.evaluate("""() => { const bw = __bw, r = bw.renderer, G = bw.scene.getObjectByName('late-stage'); const tp = G && G.children.find((c) => c.name === 'late:townplan');
          const rows = []; if (tp) tp.traverse((o) => { if (!o.isMesh) return; const g = o.geometry; g.computeBoundingBox(); const b = g.boundingBox; rows.push({ n: o.name, tris: (g.index ? g.index.count : g.attributes.position.count) / 3, cx: (b.min.x + b.max.x) / 2, cz: (b.min.z + b.max.z) / 2, sx: b.max.x - b.min.x, sz: b.max.z - b.min.z, mat: o.material.map ? o.material.map.image.width : 0 }); });
          return { rows, mem: { textures: r.info.memory.textures, geometries: r.info.memory.geometries }, programs: r.info.programs.length }; }""")
        json.dump(info, open(OUT + '_info.json', 'w'), indent=1)
        civ = [x for x in info['rows'] if x['n'].startswith('civic')]; hom = [x for x in info['rows'] if x['n'].startswith('homes')]
        print('programs', info['programs'], 'mem', info['mem'], 'civic meshes', len(civ), 'tris', sum(x['tris'] for x in civ), 'home meshes', len(hom), 'tris', sum(x['tris'] for x in hom), 'all townplan', len(info['rows']), flush=True)
        async def meas():
            return await pg.evaluate("""async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const w = () => (bw.frames > t0 + 2 ? res() : requestAnimationFrame(w)); w(); }); const i = r.info.render, nf = Math.max(1, bw.frames - f0); const o = { calls: Math.round(i.calls / nf), tris: Math.round(i.triangles / nf), nf }; r.info.autoReset = true; return o; }""")
        cc = (civ[0]['cx'], civ[0]['cz']) if civ else (60, 150); hc = (hom[0]['cx'], hom[0]['cz']) if hom else (60, 150)
        VIEWS['civic'] = "c.target.set(%f,0,%f); c.dist=60; c.polar=1.0; c.azim=0.7;" % cc
        VIEWS['homes'] = "c.target.set(%f,0,%f); c.dist=45; c.polar=1.05; c.azim=0.3;" % hc
        VIEWS['homes_close'] = "c.target.set(%f,0,%f); c.dist=22; c.polar=1.15; c.azim=0.3;" % hc
        rows = {}
        for nm, js in VIEWS.items():
            await pg.evaluate('() => { const c=__bw.ctl; ' + js + ' }')
            await asyncio.sleep(6)
            rows[nm] = await meas(); print('view', nm, rows[nm], flush=True)
            await pg.screenshot(path=OUT + '_' + nm + '.png', timeout=240000)
        json.dump(rows, open(OUT + '_views.json', 'w'), indent=1)
        print('LOGS', json.dumps(logs[:12]))
        await b.close()
asyncio.run(main())
