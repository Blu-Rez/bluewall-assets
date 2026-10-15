import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt1_bodyprobe.py LEVEL ID[,ID..] : in an attack, which meshes carry the vertices of target ID (aB == ID): name path, vertex count, mean world position
async def main():
    lv = int(sys.argv[1]); ids = [int(x) for x in sys.argv[2].split(',')]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        await pg.add_init_script("try{localStorage.setItem('bw_coach_battle','1')}catch(e){}")
        await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv={lv}")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate(f'__bw.battle.start({tgt})')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        r = await pg.evaluate("""(ids) => {
          const out = {}; const w = __bw.world; const st = w.stage || null;
          const root = __bw.scene; const want = new Set(ids);
          root.traverse((o) => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.aB) return; const a = o.geometry.attributes.aB.array, p = o.geometry.attributes.position.array; o.updateWorldMatrix(true, false);
            const m = o.matrixWorld.elements; const acc = {};
            for (let i = 0; i < a.length; i++) { const id = Math.round(a[i]); if (!want.has(id)) continue; const e = acc[id] || (acc[id] = { n: 0, x: 0, y: 0, z: 0 }); const x = p[i*3], y = p[i*3+1], z = p[i*3+2]; e.n++; e.x += m[0]*x + m[4]*y + m[8]*z + m[12]; e.y += m[1]*x + m[5]*y + m[9]*z + m[13]; e.z += m[2]*x + m[6]*y + m[10]*z + m[14]; }
            for (const id in acc) { const e = acc[id]; let path = o.name || '(mesh)', q = o.parent; for (let k = 0; q && k < 4; k++, q = q.parent) path = (q.name || '·') + ' > ' + path; (out[id] = out[id] || []).push({ path, vis: o.visible, n: e.n, at: [Math.round(e.x / e.n), Math.round(e.y / e.n), Math.round(e.z / e.n)] }); } });
          const tg = (w.targets || []).filter((t) => want.has(t.id)).map((t) => [t.id, t.type, Math.round(t.x), Math.round(t.z), t.w, t.d, t.h]);
          return JSON.stringify({ out, tg, mach: (w.ballistas && w.ballistas.S ? w.ballistas.S.slice(0, 3).map((b) => Object.keys(b).concat(b.s ? Object.keys(b.s) : [])) : null) }); }""", ids)
        print(r[:3000])
        await b.close()
asyncio.run(main())
