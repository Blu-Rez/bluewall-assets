#!/usr/bin/env python3
# TR2-S4c dev: are the baked Tripo lamps tied to their structure (per-vertex aB = battle target id, so they fall with the wall)?  python3 tr2_s4c_aB.py [LV]
import asyncio, sys, json
from playwright.async_api import async_playwright
LV = sys.argv[1] if len(sys.argv) > 1 else '30'
CHK = """() => { const rows = []; __bw.scene.traverse((o) => { if (!o.isMesh || !o.material) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (!(m.userData && m.userData.tr2) || o.isInstancedMesh) continue; const a = o.geometry.attributes.aB; if (!a) { rows.push([o.name, 'NO aB', o.geometry.attributes.position.count]); continue; } let z = 0, nz = 0; const ids = new Set(); for (let i = 0; i < a.count; i++) { if (a.getX(i) > 0) { nz++; ids.add(a.getX(i)); } else z++; } rows.push([o.name, 'verts', a.count, 'tagged', nz, 'untagged', z, 'targets', ids.size]); } }); return rows; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 450})
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV + '&s4c=1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print(json.dumps(await pg.evaluate(CHK)))
        await b.close()
asyncio.run(main())
