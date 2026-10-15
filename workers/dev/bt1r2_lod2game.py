#!/usr/bin/env python3
# bt1r2_lod2game.py <tag> — BT1_R2: the LOD2 capsule colour IN THE GAME (its own light, sky and shadows, the battle camera): for each foot-soldier kind, the mean colour of its figures drawn at LOD0 and forced to LOD2,
# found as the pixels that differ from the same frame with every unit hidden.  The ratio is what the capsule's colours are corrected by.   env: KINDS=spear,sword,guard,archer,e_guard,e_archer  DIST=60  Q=low  LV=30
import asyncio, json, os, sys, io
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
TAG = sys.argv[1]; Q = os.environ.get('Q', 'low'); LV = int(os.environ.get('LV', 30)); DIST = float(os.environ.get('DIST', 60)); OUT = os.environ.get('OUT', '/home/claude/work/bt1r2/lod2game_%s.json' % TAG)
KINDS = os.environ.get('KINDS', 'spear,sword,guard,archer,e_guard,e_archer').split(','); FR = '/home/claude/work/bt1r2/frames'; os.makedirs(FR, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
PATCH = """(() => { const s = __bw.battle.session, K = s.views.kinds; window.__force = 'none'; for (const [n, k] of Object.entries(K)) { if (k.__w) continue; const u = k.update; k.update = (t, c, o) => u.call(k, t, c, window.__force === 'lod0' ? { ...o, lodDist: 1e9, lod2Dist: 1e9 } : window.__force === 'lod2' ? { ...o, lodDist: 0, lod2Dist: 0 } : o); k.__w = 1; } return Object.keys(K); })()"""
async def shot(pg, force, only, cam):
    await pg.evaluate("([f, only, cam]) => { window.__force = f; const s = __bw.battle.session; for (const [n, k] of Object.entries(s.views.kinds)) k.group.visible = (n === only); s.cam.tx = cam[0]; s.cam.tz = cam[1]; s.cam.dist = cam[2]; }", [force, only, cam])
    await asyncio.sleep(2.2); return np.asarray(Image.open(io.BytesIO(await pg.screenshot())).convert('RGB')).astype(np.int16)
async def main():
    res = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS); ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/bt1r2_%s.html?q=%s&w=clear&h=14&wa=0.1&lv=%d' % (TAG, Q, LV))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': LV, 'wall': LV, 'towers': LV}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate('__bw.battle.start(%s)' % tgt)
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3); await pg.evaluate('__bw.battle.session.cam.intro = 0'); await asyncio.sleep(1)
        print('kinds', await pg.evaluate(PATCH))
        for kn in KINDS:
            c = await pg.evaluate("(kn) => { const s = __bw.battle.session, e = kn.startsWith('e_'), t = e ? kn.slice(2) : kn, L = (e ? s.sim.defenders : s.sim.units).filter(u => u.type === t && !u.dead); if (!L.length) return null; let x = 0, z = 0; for (const u of L) { x += u.x; z += u.z; } return { n: L.length, x: x / L.length, z: z / L.length, tier: L[0].tier }; }", kn)
            if not c: print(kn, 'not in the army'); continue
            cam = [c['x'], c['z'], DIST]
            base = await shot(pg, 'none', '__none__', cam); a = await shot(pg, 'lod0', kn, cam); d = await shot(pg, 'lod2', kn, cam)
            r = {'n': c['n'], 'tier': c['tier']}
            for nm, im in (('lod0', a), ('lod2', d)):
                m = np.abs(im - base).max(axis=2) > 28; r[nm] = {'px': int(m.sum()), 'rgb': [round(float(im[..., i][m].mean()), 1) for i in range(3)] if m.sum() else None}
            if r['lod0']['rgb'] and r['lod2']['rgb']: r['ratio'] = [round(r['lod0']['rgb'][i] / max(1, r['lod2']['rgb'][i]), 3) for i in range(3)]
            res[kn] = r; print(kn, r, flush=True)
            Image.fromarray(np.concatenate([a, d], axis=1).astype(np.uint8)).save('%s/lod2game_%s_%s.png' % (FR, TAG, kn))
        json.dump(res, open(OUT, 'w'), indent=1); print('ERR', errs[:3]); await b.close()
asyncio.run(main())
