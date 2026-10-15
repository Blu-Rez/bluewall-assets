#!/usr/bin/env python3
# bt1r2_camp.py — BT1_R2: camp frames from the dev page.  env: OUT=/home/claude/work/bt1r2/camp
#   frames: <name>_far (default battle-like camera, far pavilions) · <name>_near (22 m from a tent) ; for names: shipped (table as shipped) · stand (stand-in models) · broken (a missing file in one slot)
import asyncio, json, os, sys
from playwright.async_api import async_playwright
OUT = os.environ.get('OUT', '/home/claude/work/bt1r2/camp'); os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def main():
    names = sys.argv[1].split(',') if len(sys.argv) > 1 else ['shipped', 'stand']; res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        for nm in names:
            q = {'shipped': '', 'stand': '?stand=1', 'palisade': '?stand=1&palisade=1', 'broken': '?stand=1&broken=1'}[nm]
            pg = await (await b.new_context(viewport={'width': 1300, 'height': 600}, device_scale_factor=1)).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'warning' else None)
            await pg.goto('http://127.0.0.1:8777/bt1r2_camp.html' + q)
            for i in range(120):
                if await pg.evaluate('!!window.__campReady'): break
                await asyncio.sleep(0.5)
            info = await pg.evaluate('__camp.build()'); await asyncio.sleep(2)
            c = await pg.evaluate('(() => { const r = __camp.report(); const t = r.slots.filter(s => s.kind !== "banner" && s.kind !== "palisade"); return { cx: t.reduce((a, s) => a + s.x, 0) / t.length, cz: t.reduce((a, s) => a + s.z, 0) / t.length, first: t[0] }; })()')
            # far: the default battle camera is ~250 m away; here a camera 200 m back, high, looking at the camp
            await pg.evaluate('(c) => __camp.look(c.cx, 150, c.cz - 190, c.cx, 0, c.cz)', c); await asyncio.sleep(1.5); await pg.evaluate('(c) => __camp.look(c.cx, 150, c.cz - 190, c.cx, 0, c.cz)', c)
            far = await pg.evaluate('__camp.report()'); await pg.screenshot(path='%s/camp_%s_far.png' % (OUT, nm))
            await pg.evaluate('(c) => __camp.look(c.first.x + 14, 14, c.first.z - 26, c.first.x, 3, c.first.z)', c); await asyncio.sleep(1.5); await pg.evaluate('(c) => __camp.look(c.first.x + 14, 14, c.first.z - 26, c.first.x, 3, c.first.z)', c)
            near = await pg.evaluate('__camp.report()'); await pg.screenshot(path='%s/camp_%s_near.png' % (OUT, nm))
            res[nm] = {'far': {k: far[k] for k in ('lod', 'calls', 'tris', 'kinds', 'tents')}, 'near': {k: near[k] for k in ('lod', 'calls', 'tris')}, 'errors': errs[:3], 'slots': [(s['kind'], s['state']) for s in far['slots']][:6]}
            print(nm, json.dumps(res[nm])[:700], flush=True)
        json.dump(res, open(OUT + '/camp_report.json', 'w'), indent=1); await b.close()
asyncio.run(main())
