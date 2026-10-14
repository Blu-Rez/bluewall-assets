import asyncio, json
from playwright.async_api import async_playwright
JS = r'''
(() => {
  const S = __bw.scene, out = [];
  S.traverse((o) => { if (o.isMesh && o.name === 'static') {
    const g = o.geometry, c = g.attributes.color, m = o.material;
    let mn = [9,9,9], mx = [-9,-9,-9]; if (c) for (let i = 0; i < c.count; i += 7) for (let k = 0; k < 3; k++) { const v = c.array[i*3+k]; mn[k] = Math.min(mn[k], v); mx[k] = Math.max(mx[k], v); }
    out.push({ n: g.attributes.position.count, mat: m.type, mapW: m.map && m.map.image && m.map.image.width, wrap: m.map && m.map.wrapS, cmin: mn.map(v=>+v.toFixed(2)), cmax: mx.map(v=>+v.toFixed(2)), rough: m.roughness, env: m.envMapIntensity, col: m.color.getHexString() });
  }});
  return out;
})()
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':300,'height':500})
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&nolate&h=15&w=clear')
        for i in range(900):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for r in await pg.evaluate(JS): print(r)
        await b.close()
asyncio.run(main())
