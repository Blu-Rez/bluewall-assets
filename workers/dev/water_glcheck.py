# water_glcheck.py : full world (PAGE, H): count GL console warnings with the water life shown vs hidden (water worker; wrap in sem.sh)
import asyncio, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]) if m.type in ('error', 'warning') else None); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto(f"http://127.0.0.1:8777/{os.environ.get('PAGE','dev_water.html')}?q=high&w=clear&h={os.environ.get('H','22')}", timeout=180000)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        await pg.evaluate('__cam(-40,60,250,-125,0,196)')
        for i in range(120):
            if await pg.evaluate('__bw.frames >= window.__f0 + 4'): break
            await asyncio.sleep(1)
        res = await pg.evaluate('''() => { const B = __bw, r = B.renderer, gl = r.getContext(); B.pause(true);
          const err = () => { let e = 0, k = 0, x; while ((x = gl.getError()) !== gl.NO_ERROR && k++ < 20) e = x; return e; };
          const test = (label) => { err(); r.render(B.scene, B.camera); return label + ': ' + err(); };
          const out = [test('all')];
          const names = ['water-life', 'bank-life', 'water', 'rowboat', 'waterfowl', 'reed-fireflies', 'fish', 'water-rings', 'water-mist'];
          for (const n of names) { const o = B.scene.getObjectByName(n); if (!o) { out.push(n + ': missing'); continue; } const v = o.visible; o.visible = false; out.push(test('without ' + n)); o.visible = v; }
          const vis = []; B.scene.getObjectByName('water-life').traverse((o) => { if (o.visible && (o.isMesh || o.isPoints)) vis.push(o.name); }); out.push('visible: ' + vis.join(','));
          return out; }''')
        for l in res: print(l)
        print('console GL warnings:', len([l for l in logs if 'GL_' in l]), [l for l in logs if 'GL_' not in l][:6])
        await b.close()
asyncio.run(main())
