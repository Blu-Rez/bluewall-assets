import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# a1_time.py TAG PAGE [SEQ] : JS main-thread cost of a level change (render loop paused, so nothing else competes) + triangles submitted by the scene's meshes (by name group).
#   PAGE = dev_s35.html (after) | dev_base.html (before).  env INIT = js run before the page loads (e.g. window.__a1InnerH=7.5)
TAG, PAGE = sys.argv[1], sys.argv[2]; SEQ = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '10,20,30,10,20,30,10,30').split(',')]
TRIS = """() => { const g = {}; let all = 0; __bw.scene.traverse((o) => { if (!o.isMesh || !o.geometry) return; for (let p = o; p; p = p.parent) if (!p.visible) return;
  const geo = o.geometry, n = (geo.index ? geo.index.count : geo.attributes.position.count) / 3, dr = geo.drawRange.count; const t = (isFinite(dr) ? Math.min(n, dr / 3) : n) * (o.isInstancedMesh ? o.count : 1);
  const k = /^(static|troof|props|her-)/.test(o.name || '') ? (o.name || '').replace(/[0-9]+$/, '') : 'other'; g[k] = (g[k] || 0) + Math.round(t); all += t; }); g.ALL = Math.round(all); return g; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        if os.environ.get('INIT'): await pg.add_init_script(os.environ['INIT'])
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/' + PAGE + '?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print(TAG, 'ready', T(), flush=True)
        await asyncio.sleep(3); await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        await pg.evaluate('() => __bw.pause(true)'); await asyncio.sleep(2)
        print(TAG, 'tris at boot level 30', json.dumps(await pg.evaluate(TRIS)), flush=True)
        for lv in SEQ:
            dt = await pg.evaluate('(n) => { const t = performance.now(); __bw.world.setLevel(n); return Math.round((performance.now() - t) * 10) / 10; }', lv)
            print(TAG, 'setLevel', lv, 'ms', dt, flush=True)
        await pg.evaluate('(n) => __bw.world.setLevel(n)', 30)
        print(TAG, 'tris at level 30', json.dumps(await pg.evaluate(TRIS)), flush=True)
        if os.environ.get('RINGS'):       # pure ring cost: flip which rings stand with the level fixed (the same work a level change does for them)
            print(TAG, 'rings toggle ms', json.dumps(await pg.evaluate('''() => { const R = __bw.world.rings, o = [], t = (f) => { const a = performance.now(); f(); return Math.round((performance.now() - a) * 10) / 10; };
              __bw.world.setLevel(10); const A = ['inner', 'outer', 'town'], B = ['town', 'outer', 'inner'];
              for (let i = 0; i < 4; i++) { o.push(['to-reversed(L10: inner off, town on)', t(() => R.setOrder(B))]); o.push(['to-default', t(() => R.setOrder(A))]); }
              __bw.world.setLevel(30); o.push(['L30 apply() no-op', t(() => R.apply())]); o.push(['L30 apply(true) forced', t(() => R.apply(true))]); return o; }''')), flush=True)
        print('LOGS', json.dumps(logs[:5])); await b.close()
asyncio.run(main())
