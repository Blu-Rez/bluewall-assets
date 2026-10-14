import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# b3_today.py : what the game builds TODAY for the market square + church (before B3): instanced stalls / carts / crates / barrels around the market centre, draw calls + triangles from the live scene
JS_LIST = """() => {
  const bw = window.__bw, out = { keys: Object.keys(bw).slice(0, 60), inst: [] };
  bw.scene.traverse((o) => {
    if (!o.isInstancedMesh) return;
    const g = o.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3, e = o.instanceMatrix.array, pts = [];
    for (let i = 0; i < o.count; i++) pts.push([e[i * 16 + 12], e[i * 16 + 14]]);
    out.inst.push({ name: o.name, mat: (o.material && o.material.name) || '', n: o.count, tri, pts: pts.slice(0, 400), cast: o.castShadow });
  });
  return out;
}"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 540}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        r = await pg.evaluate(JS_LIST)
        json.dump(r, open('/tmp/b3_today_inst.json', 'w'))
        print('instanced meshes', len(r['inst']), 'keys', r['keys'][:40])
        await b.close()
asyncio.run(main())
