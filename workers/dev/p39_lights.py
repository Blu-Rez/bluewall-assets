import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
Q = os.environ.get('Q', 'high'); LATE = os.environ.get('LATE')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/dev_s35.html?q={Q}&w=clear&h=14&wa=0.1&lv=30' + ('' if LATE else '&nolate=1'))
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        print('ready', round(time.time() - t0), flush=True)
        await asyncio.sleep(5)
        res = await pg.evaluate("""() => { const bw = __bw, r = bw.renderer, gl = r.getContext(); const L = {}; bw.scene.traverse((o) => { if (o.isLight) { const k = o.type + (o.castShadow ? '+shadow' : '') + (o.visible ? '' : '(hidden)') + ':i' + (o.intensity > 0 ? '>0' : '=0'); L[k] = (L[k] || 0) + 1; } });
          const rows = r.info.programs.map((p) => { let fs = 0, vs = 0, np = '', nd = ''; try { const f = gl.getShaderSource(p.fragmentShader) || ''; fs = f.length; vs = (gl.getShaderSource(p.vertexShader) || '').length; const m = f.match(/#define NUM_POINT_LIGHTS (\\d+)/); np = m ? +m[1] : 0; const d = f.match(/#define NUM_DIR_LIGHTS (\\d+)/); nd = d ? +d[1] : 0; } catch (e) {} return { name: p.name, fs, vs, np, nd, hooks: (p.cacheKey || '').length }; });
          return { L, n: rows.length, rows, shadows: r.shadowMap.enabled }; }""")
        print('lights', res['L'], 'programs', res['n'], 'shadows', res['shadows'])
        rows = sorted(res['rows'], key=lambda r: -r['fs']); import collections
        print('NUM_POINT_LIGHTS in programs', collections.Counter(r['np'] for r in res['rows'])); print('NUM_DIR_LIGHTS', collections.Counter(r['nd'] for r in res['rows']))
        fs = [r['fs'] for r in res['rows'] if r['fs']]; print('fragment source size: n', len(fs), 'median', sorted(fs)[len(fs)//2], 'max', max(fs), 'sum KB', sum(fs)//1024)
        print('top 12 by fragment size', [(r['name'] or '-', r['fs'], r['np']) for r in rows[:12]])
        json.dump(res, open('/home/claude/work/lights_%s.json' % Q, 'w'))
        await b.close()
asyncio.run(main())
