#!/usr/bin/env python3
# bt1r2_shot.py <tag> <name> — one real-draw frame of the battle (844x390 x DPR, software GL).  env: DIST=cam distance (default: the battle's own)  SEND=1 WAIT=s  DPR=1  Q=low  LV=30  OUT=/home/claude/work/bt1r2/frames  TX,TZ = camera target offset from the keep (m)
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
TAG, NAME = sys.argv[1], sys.argv[2]; Q = os.environ.get('Q', 'low'); LV = int(os.environ.get('LV', 30)); DPR = float(os.environ.get('DPR', 1)); OUT = os.environ.get('OUT', '/home/claude/work/bt1r2/frames'); os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS); ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=DPR, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/bt1r2_%s.html?q=%s&w=clear&h=14&wa=0.1&lv=%d' % (TAG, Q, LV))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': LV, 'wall': LV, 'towers': LV}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate('__bw.battle.start(%s)' % tgt)
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3); await pg.evaluate('__bw.battle.session.cam.intro = 0'); await asyncio.sleep(1)
        if os.environ.get('SEND'):
            await pg.evaluate("(() => { const s = __bw.battle.session, k = __bw.world.baseMeta.keep; for (const t of s.types) s.sim.send(t, k.x, k.z); s.started = true; })()"); await asyncio.sleep(float(os.environ.get('WAIT', 10)))
        if os.environ.get('DIST') or os.environ.get('CAMJS'):
            js = os.environ.get('CAMJS') or ("(() => { const s = __bw.battle.session, g = __bw.world.baseMeta.keep, d = s.sim.deploy; s.cam.tx = (g.x + d.x) / 2; s.cam.tz = (g.z + d.z) / 2; s.cam.dist = %s; })()" % os.environ['DIST'])
            await pg.evaluate(js); await asyncio.sleep(2.5)
        await pg.screenshot(path='%s/%s_%s.png' % (OUT, NAME, TAG), timeout=180000); print('shot', NAME, TAG, errs[:3]); await b.close()
asyncio.run(main())
