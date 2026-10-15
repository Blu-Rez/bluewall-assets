#!/usr/bin/env python3
# bt1r2_lod2cal.py — BT1_R2: calibrate the LOD2 capsule colours of the foot soldiers against the real figure (mean colour of head / body / legs at LOD0 vs LOD2, per forge tier).   env: TIERS=0,1,2,3,4,5  KEYS=spear,sword,guard,archer,legionary,captain  OUT=/home/claude/work/bt1r2/lod2cal.json
import asyncio, json, os
from playwright.async_api import async_playwright
KEYS = os.environ.get('KEYS', 'spear,sword,guard,archer,legionary,captain,e_guard,e_archer').split(','); TIERS = [int(x) for x in os.environ.get('TIERS', '0,1,2,3,4,5').split(',')]
OUT = os.environ.get('OUT', '/home/claude/work/bt1r2/lod2cal.json')
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS); ctx = await b.new_context(viewport={'width': 1500, 'height': 620}, device_scale_factor=1)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/bt1r2_units.html')
        for i in range(120):
            if await pg.evaluate('!!window.__unitsReady'): break
            await asyncio.sleep(0.5)
        for t in TIERS:
            res[t] = await pg.evaluate('(a) => __units.cal(a[0], a[1])', [KEYS, t]); print('tier', t, 'ok', flush=True)
        json.dump(res, open(OUT, 'w'), indent=1); print('ERR', errs[:3]); await b.close()
asyncio.run(main())
