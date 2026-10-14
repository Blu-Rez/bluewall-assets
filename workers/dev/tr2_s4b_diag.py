import asyncio, sys, os, json
from playwright.async_api import async_playwright
# TR2-S4b: which meshes does a worksite view draw?  python3 tr2_s4b_diag.py "<camera js>" [LV]   (BLOCK_TR2=1 -> the old pieces)
JS = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620})
        if os.environ.get('BLOCK_TR2'): await pg.route('**/assets/tr2/**', lambda r: r.abort())
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; ' + JS + ' }')
        f0 = await pg.evaluate('__bw.frames')
        for i in range(600):                                   # frames are slow in software GL: wait for 6 real frames (camera + wsbuild.update have run)
            await asyncio.sleep(1)
            if await pg.evaluate('__bw.frames') - f0 >= 6: break
        r = await pg.evaluate("""() => { const out = {}; const cam = __bw.camera; const fr = new (cam.constructor.prototype.constructor === Object ? Object : Object)(); 
          const ws = __bw.scene.getObjectByName('late-stage').children.filter((c) => c.name === 'late:worksites');
          for (const root of ws) root.traverse((m) => { if (!m.isMesh && !m.isLine && !m.isPoints) return; let vis = true; for (let o = m; o; o = o.parent) if (!o.visible) { vis = false; break; } if (!vis) return;
            const g = m.geometry, tri = g.index ? g.index.count / 3 : g.attributes.position.count / 3; const k = root.name + ' | ' + (m.name || m.parent && m.parent.name || '?') + (m.isInstancedMesh ? ' [inst ' + m.count + ']' : '') + (m.castShadow ? ' S' : '');
            const e = out[k] || (out[k] = { n: 0, tri: 0 }); e.n++; e.tri += Math.round(tri * (m.isInstancedMesh ? m.count : 1)); });
          return out; }""")
        cp = await pg.evaluate("() => { const p = __bw.camera.position, c = __bw.ctl; return [p.x|0, p.y|0, p.z|0, c.target.x|0, c.target.z|0, +c.dist.toFixed(0), !!c.intro]; }")
        print('CAM pos/target/dist/intro', cp)
        gs = await pg.evaluate("() => { const w = __bw.scene.getObjectByName('late-stage').children.find((c) => c.name === 'late:worksites'); const o = []; w.traverse((g) => { if (g.isGroup && /lumber1/.test(g.name || '')) o.push([g.name, g.visible, g.children.map((m) => (m.name || '?') + (m.visible ? '' : '(hidden)')).join(',')]); }); return o; }")
        print('GROUPS', json.dumps(gs)[:900])
        rows = sorted(r.items(), key=lambda kv: -kv[1]['tri'])
        tn = sum(v['n'] for _, v in rows); tt = sum(v['tri'] for _, v in rows)
        print('TOTAL meshes', tn, 'tris', tt)
        for k, v in rows: print(f"{v['n']:4d} {v['tri']:8d}  {k}")
        await b.close()
asyncio.run(main())
