import asyncio, sys, os, json
from playwright.async_api import async_playwright
# TR2-S3: a destroyed wall in a battle picture: collapse states are set through the shader state (DS) on the targets of the Tripo wall pieces / a tower / the gate.
#   PAGE=dev_s35.html python3 dev/tr2_s3_battle.py OUT LV
OUT = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
VIEWS = {'a': (80, 16, 46, 49, 6, 26, 40), 'b': (66, 30, 70, 40, 5, 20, 45), 'c': (30, 40, 62, 22, 5, 38, 45)}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 600})
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) else None)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev_s35.html') + '?q=low&w=clear&h=13&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await asyncio.sleep(2)
        # the outer-ring wall pieces nearest the main gate (49, 26), the nearest outer tower and the gate target
        sel = await pg.evaluate("""() => { const T3 = __bw.world.tr2c, G = [49, 26]; if (!T3) return null;
          const ws = T3.walls.filter((w) => w.ring === 'outer').map((w) => ({ tid: w.tid, d: Math.hypot((w.ax + w.ux * w.len / 2) - G[0], (w.az + w.uz * w.len / 2) - G[1]) })).sort((a, b) => a.d - b.d);
          const tw = T3.towers.filter((t) => t.ring === 'outer').map((t) => ({ tid: t.tid, d: Math.hypot(t.x - G[0], t.z - G[1]) })).sort((a, b) => a.d - b.d);
          return { walls: ws.slice(0, 4), towers: tw.slice(0, 2), gates: T3.gates.map((g) => ({ ring: g.ring, tid: g.tid })) }; }""")
        print('SEL', json.dumps(sel), flush=True)
        if not sel: print('no tr2c'); return
        async def shot(name, v):
            a = list(VIEWS[v])
            await pg.evaluate('(a) => { const B = __bw; B.ctl.update = () => {}; const c = B.camera; c.fov = a[6]; c.updateProjectionMatrix(); c.position.set(a[0], a[1], a[2]); c.lookAt(a[3], a[4], a[5]); c.updateMatrixWorld(true); }', a)
            f0 = await pg.evaluate('__bw.frames')
            for i in range(120):
                if await pg.evaluate(f'__bw.frames >= {f0} + 4'): break
                await asyncio.sleep(0.5)
            await pg.screenshot(path=f'{OUT}_{name}.png', timeout=240000); print('shot', name, flush=True)
        await shot('intact', 'a')
        w = sel['walls']
        # half way down (cp .45) for the nearest piece, nearly down (.8) for the next, damaged (dmg 1) for a third, a tower collapsing
        await pg.evaluate("""(s) => { const { DS, DU } = __bw; DU.battle.value = 1; DS.set(s.walls[0].tid, { collapse: 0.8, dmg: 1 }); DS.set(s.walls[1].tid, { collapse: 0.45, dmg: 1 }); DS.set(s.walls[2].tid, { dmg: 1, flash: 1 }); DS.set(s.towers[0].tid, { collapse: 0.6, dmg: 1 }); DS.flush(); }""", sel)
        await shot('hit_a', 'a'); await shot('hit_b', 'b'); await shot('hit_c', 'c')
        print('\n'.join(logs[:20])); await b.close()
asyncio.run(main())
