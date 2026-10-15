#!/usr/bin/env python3
# tr2h_probe3.py — the generic houses ALONE: the atlas parts (what bakeTr2 merges) drawn with the game's atlas material next to the original GLB (plain GLTFLoader); one frame.
# If the atlas copy is smeared here, the bug is in tr2lib.parts / the atlas remap; if it is clean here, it is the lot matrix / the merge / the lot itself.
import asyncio, json
from playwright.async_api import async_playwright
SETUP = """async () => {
  const B = __bw, T = B.THREE, A = __tr2Town.state.atlas.homes, grp = new T.Group(); grp.name = 'tr2h_probe3'; B.scene.add(grp);
  const names = ['house_generic_a|w7.5', 'house_generic_b|w7.5', 'house_generic_c|w7.5', 'house_cottage_0|w6.6'];
  const X0 = 70, Z0 = 150, GY = 1.0;
  names.forEach((n, i) => { for (const p of A.get(n)) { const m = new T.Mesh(p.geometry, A.material); m.position.set(X0 + i * 10, GY, Z0); grp.add(m); } });   // front row: atlas copy
  const im = document.createElement('script'); im.type = 'importmap'; im.textContent = JSON.stringify({ imports: { three: '/three/build/three.module.js', 'three/addons/': '/three/examples/jsm/' } }); document.head.appendChild(im);
  const { GLTFLoader } = await import('/three/examples/jsm/loaders/GLTFLoader.js'); const { MeshoptDecoder } = await import('/three/examples/jsm/libs/meshopt_decoder.module.js'); const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder);
  const files = ['house_generic_a', 'house_generic_b', 'house_generic_c', 'house_cottage_0'], ws = [7.5, 7.5, 7.5, 6.6];
  for (let i = 0; i < files.length; i++) { const g = await new Promise((r, j) => ld.load('/assets/tr2/' + files[i] + '.glb', (x) => r(x.scene), undefined, j)); const bb = new T.Box3().setFromObject(g), sz = bb.getSize(new T.Vector3()), k = ws[i] / Math.max(sz.x, sz.z) * (i === 3 ? 1 : 1); g.scale.setScalar(k); const b2 = new T.Box3().setFromObject(g); g.position.set(X0 + i * 10 - (b2.min.x + b2.max.x) / 2, GY - b2.min.y, Z0 + 14 - (b2.min.z + b2.max.z) / 2); grp.add(g); }   // back row: the plain GLB (sized to the same width)
  return grp.children.length; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/rp1_dev.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const B = __bw; B.ctl._skipIntro && B.ctl._skipIntro(); if (B.ctl.intro) B.ctl.intro = null; delete B.ctl.update; }')
        await pg.evaluate("() => { const u = document.querySelector('.bw-ui'); if (u) u.style.display = 'none'; }")
        print('setup', await pg.evaluate(SETUP), flush=True)
        await pg.evaluate("(async()=>{ await __rpLoad('?v=1'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()")
        await pg.evaluate("__rp.cam('third')"); await asyncio.sleep(1)
        await pg.evaluate("(() => { __rp.setPos(85, 133, 0); __rp.setLook(0, 0.22); })()"); await asyncio.sleep(3)
        for _ in range(100):
            if await pg.evaluate('() => { const T = window.__tr2Town; if (!T) return true; T.lod(__bw.camera, null, true); return T.state.lazy.length === 0; }'): break
            await asyncio.sleep(1)
        await asyncio.sleep(5); await pg.evaluate('() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))')
        await pg.screenshot(path='/home/claude/work/tr2h/generic_dx/probe3_alone_hero.png', timeout=240000); print('shot', flush=True); await b.close()
asyncio.run(main())
