#!/usr/bin/env python3
# tr2h_mock.py OUT — PREVIEW ONLY (nothing is written into the game): drops the owner's Tripo bridge GLBs into the live lv30 scene through page.evaluate and shoots strat + hero-third frames.
# env: HOUR (14), Q (low), LV (30), MODE=wood|arch|both
import asyncio, sys, os, json, time, math
from playwright.async_api import async_playwright
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
HOUR = os.environ.get('HOUR', '14'); Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30'); MODE = os.environ.get('MODE', 'both')
W, H = 844, 390
SETTLE = '() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); const s = T.state; return s.lazy.length === 0 && s.cells.every((c) => c.want !== "hi" || c.shown === "hi"); }'
# river spots (centre of a river segment, unit direction along the river) from tr2h_mockpts.mjs
SPOTS = {'wood': dict(x=203.0, z=-145.2, ux=0.852, uz=-0.523), 'arch': dict(x=172.4, z=-126.4, ux=0.852, uz=-0.523)}   # river E of the town: bridge #7 (187.7,-135.8) moved 18 m up / down the river
if os.environ.get('SX'): SPOTS['wood'] = dict(x=float(os.environ['SX']), z=float(os.environ['SZ']), ux=float(os.environ['SUX']), uz=float(os.environ['SUZ']))
LOAD = """async () => {
  if (!window.__mk) {
    const im = document.createElement('script'); im.type = 'importmap'; im.textContent = JSON.stringify({imports: {three: '/three/build/three.module.js', 'three/addons/': '/three/examples/jsm/'}}); document.head.appendChild(im);
    const { GLTFLoader } = await import('/three/examples/jsm/loaders/GLTFLoader.js'); const ld = new GLTFLoader();
    window.__mk = (url) => new Promise((res, rej) => ld.load(url, (g) => res(g.scene), undefined, rej));
  }
  return true; }"""
PLACE = """async (a) => {
  const B = __bw, sc = B.scene; if (window.__mock) { sc.remove(window.__mock); }
  const grp = new B.THREE.Group(); grp.name = 'tr2h_mock'; window.__mock = grp; sc.add(grp);
  // a.items: [{url, k, cx, cz, ry, y}] — the model is 1 m-normalised, origin at the bbox centre in x/z and y = 0 at the bottom
  for (const it of a.items) { const m = (await window.__mk(it.url)).clone(); m.scale.setScalar(it.k); if (it.sy) m.scale.y = it.k * it.sy; m.rotation.y = it.ry; m.position.set(it.cx, it.y, it.cz); grp.add(m); }
  return grp.children.length; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type == 'error' and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto(f'http://127.0.0.1:8777/rp1_dev.html?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        await pg.evaluate(LOAD); await asyncio.sleep(3); print('ready', T(), flush=True)
        async def settle(extra=4):
            for _ in range(150):
                if await pg.evaluate(SETTLE): break
                await asyncio.sleep(1)
            await asyncio.sleep(extra); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
        await pg.evaluate('() => { delete __bw.ctl.update; }')
        hero_on = False
        for name in (['wood', 'arch'] if MODE == 'both' else [MODE]):
            s = SPOTS[name]; ux, uz = s['ux'], s['uz']; nx, nz = -uz, ux          # nx,nz = across the river
            ry = math.atan2(-nz, nx)                                                # model +X -> across the river
            items = []
            if name == 'wood':   # two wood_bridge_1 modules, deck top 0.394*k above the base; base sunk so the deck is at 0.72 (the game's deck)
                k = 11.2; L1 = 0.98 * k
                for e in (-0.5, 0.5): items.append(dict(url='/tr2h_in/wood_bridge_1.glb', k=k, cx=s['x'] + nx * e * L1, cz=s['z'] + nz * e * L1, ry=ry, y=0.72 - 0.394 * k))
                span = 2 * L1
            else:                # raised: two arch_1 modules (deck at 3.4 m) + the ramp (stone_bridge_a) on both ends; base on the water surface -0.75
                k = 8.36; L1 = 0.979 * k; kr = 11.25; Lr = 0.979 * kr
                for e in (-0.5, 0.5): items.append(dict(url='/tr2h_in/stone_arch_1.glb', k=k, cx=s['x'] + nx * e * L1, cz=s['z'] + nz * e * L1, ry=ry, y=-0.75))
                for sgn in (-1, 1): items.append(dict(url='/tr2h_in/stone_bridge_a.glb', k=kr, cx=s['x'] + nx * sgn * (L1 + Lr / 2), cz=s['z'] + nz * sgn * (L1 + Lr / 2), ry=ry + (math.pi if sgn < 0 else 0) , y=0))
                span = 2 * L1 + 2 * Lr
            print(name, 'placed', await pg.evaluate(PLACE, {'items': items}), 'span', round(span, 1), flush=True)
            await pg.evaluate('(c) => { const k = __bw.ctl; k.target.set(c.x, 0, c.z); k.dist = c.dist; k.polar = 1.1; k.azim = c.azim; }', {'x': s['x'], 'z': s['z'], 'dist': 60 if name == 'arch' else 48, 'azim': round(math.atan2(nx, nz) + 1.2, 2)}); await asyncio.sleep(2)
            await settle(4); await pg.screenshot(path=f'{OUT}/mock_{name}_strat.png', timeout=240000); print('shot strat', name, T(), flush=True)
            if not hero_on:
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time())); hero_on = True
            await pg.evaluate("__rp.cam('third')"); await asyncio.sleep(1)
            yaw = math.atan2(nx, nz); half = span / 2
            sx, sz = s['x'] - nx * (half + 4), s['z'] - nz * (half + 4)
            await pg.evaluate(f"(() => {{ __rp.setPos({sx},{sz},{yaw}); __rp.setLook({yaw}, 0.2); }})()"); await asyncio.sleep(2.5)
            await settle(4); await pg.screenshot(path=f'{OUT}/mock_{name}_third.png', timeout=240000); print('shot third', name, await pg.evaluate('__rp.pos()'), T(), flush=True)
            mx, mz = s['x'] - nx * 6, s['z'] - nz * 6
            await pg.evaluate("__rp.cam('first')"); await pg.evaluate(f"(() => {{ __rp.setPos({mx},{mz},{yaw}); __rp.setLook({yaw}, 0.08); }})()"); await asyncio.sleep(2.5)
            await settle(4); await pg.screenshot(path=f'{OUT}/mock_{name}_first.png', timeout=240000); print('shot first', name, T(), flush=True)
        print('LOGS', logs[:6]); await b.close()
asyncio.run(main())
