import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# pf_shots.py OUTPREFIX — the real game (dev_s35.html or PAGE=...) -> seeded opponent -> ATTACK -> playable -> two fixed cameras -> screenshots OUTPREFIX_army.png / OUTPREFIX_keep.png
#   env: PAGE=dev_s35.html  Q=low  HOUR=14  LV=30  SEED=777  VW=450 VH=900   (compare two pages with pf_shots_cmp.py)
SEEDJS = """(() => { const e = __bw.econ, o = e.scout, SEED = __SEED__, mul = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  e.scout = function (...a) { const r = Math.random; Math.random = mul(SEED); try { return o.apply(this, a); } finally { Math.random = r; } }; })()"""
CAM = """(() => { const s = __bw.battle.session, c = s.cam, k = __bw.world.baseMeta.keep; c.intro = 0; __KEEP__ ; return JSON.stringify({ tx: c.tx, tz: c.tz, dist: c.dist, az: c.az, pitch: c.pitch }); })()"""
async def main():
    out = sys.argv[1]; PAGE = os.environ.get('PAGE', 'dev_s35.html'); Q = os.environ.get('Q', 'low'); HOUR = os.environ.get('HOUR', '14'); LV = os.environ.get('LV', '30')
    ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']; VP = {'width': int(os.environ.get('VW', 450)), 'height': int(os.environ.get('VH', 900))}
    async with async_playwright() as p:
        if os.environ.get('PROFILE'):
            b = await p.chromium.launch_persistent_context(os.environ['PROFILE'], args=ARGS, viewport=VP, device_scale_factor=1); pg = b.pages[0] if b.pages else await b.new_page()
        else:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport=VP, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate(SEEDJS.replace('__SEED__', os.environ.get('SEED', '777')))
        t0 = time.time(); await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        print('battle playable after %.0fs' % (time.time() - t0), 'programs', await pg.evaluate('__bw.renderer.info.programs.length'), flush=True)
        await asyncio.sleep(2)
        info = await pg.evaluate("JSON.stringify({ name: __bw.battle.session.target.name, levels: __bw.battle.session.target.levels, seed: __bw.battle.session.target.seed, types: __bw.battle.session.types })")
        print('opponent', info)
        for name, js in (('army', 'c.tx = c.tx; c.dist = 120'), ('keep', 'c.tx = k.x; c.tz = k.z; c.dist = 150; c.az = c.az0 + 0.4')):
            await pg.evaluate("__bw.pause(false)")
            print(name, await pg.evaluate(CAM.replace('__KEEP__', js)))
            f0 = await pg.evaluate('__bw.frames')
            for i in range(600):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'__bw.frames >= {f0} + 4'): break
            await pg.evaluate("__bw.pause(true)")
            await pg.screenshot(path=f'{out}_{name}.png', timeout=240000); print('shot', name, flush=True)
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
