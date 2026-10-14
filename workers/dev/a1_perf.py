import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# a1_perf.py TAG PAGE LEVELS VIEWS : draw calls / triangles / shader programs of the home map.  PAGE = dev_s35.html (after) | dev_base.html (before, the p38 build)
TAG, PAGE = sys.argv[1], sys.argv[2]; LEVELS = sys.argv[3].split(','); VIEWS = sys.argv[4].split(',')
V = {'ctr': "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;", 'top': "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;", 'cit': "c.target.set(0,0,-5); c.dist=170; c.polar=0.95; c.azim=0.6;"}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
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
        for lv in LEVELS:
            dt = await pg.evaluate('(n) => { const t = performance.now(); __bw.world.setLevel(n); return Math.round((performance.now() - t) * 10) / 10; }', int(lv)); print(TAG, 'setLevel', lv, 'ms', dt, flush=True); await asyncio.sleep(3)
            if os.environ.get('PROBE'):
                try: print(TAG, 'probe', lv, json.dumps(await pg.evaluate('() => (' + os.environ['PROBE'] + ')')), flush=True)
                except Exception as e: print('probe failed', e)
            for nm in VIEWS:
                await pg.evaluate('() => { const c=__bw.ctl; ' + V[nm] + ' }'); await asyncio.sleep(6)
                o = await pg.evaluate("""async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 4) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0; const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), programs: r.info.programs.length, geos: r.info.memory.geometries, n }; r.info.autoReset = true; return o; }""")
                print(TAG, 'level', lv, nm, json.dumps(o), flush=True)
        print('LOGS', json.dumps(logs[:5])); await b.close()
asyncio.run(main())
