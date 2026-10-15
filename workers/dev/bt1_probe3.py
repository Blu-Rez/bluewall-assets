import asyncio, sys, os, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        await pg.goto("http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        print(await pg.evaluate("""JSON.stringify((()=>{
          const out = []; __bw.scene.traverse(o => { if (!(o.isMesh)) return; let p = o, ch = [], inRef = false; while (p) { const n = p.name || ''; if (n.indexOf('refinery') >= 0) inRef = true; ch.unshift(n || p.type); p = p.parent; }
            if (!inRef) return; let ids = new Set(); const a = o.geometry.attributes.aB; if (a) { let last=-1; for (const x of a.array) { if (x !== last) { last = x; ids.add(Math.round(x)); } } }
            let vis = true; p = o; while (p) { if (!p.visible) vis = false; p = p.parent; }
            out.push([ch.slice(-3).join('>'), vis, o.geometry.attributes.position.count / 3 | 0, a ? [...ids] : 'noaB']); });
          return out; })()).slice(0, 3000)"""))
        print(await pg.evaluate("JSON.stringify(__bw.world.targets.filter(t=>t.id===113))"))
        await b.close()
asyncio.run(main())
