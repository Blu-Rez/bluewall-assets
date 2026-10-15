import asyncio, sys, os, json
from playwright.async_api import async_playwright
async def main():
    lv = int(sys.argv[1])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv={lv}")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        print(await pg.evaluate("""JSON.stringify((()=>{
          const T=__bw.THREE, out={};
          let pt=null; __bw.scene.traverse(o=>{ if(o.name==='planned-town') pt=o; });
          if(pt){ const bb=new T.Box3().setFromObject(pt); out.planned={min:bb.min.toArray().map(Math.round), max:bb.max.toArray().map(Math.round), kids:pt.children.map(c=>[c.name||c.type,c.visible,c.children.length])}; let p=pt, ch=[]; while(p){ch.unshift((p.name||p.type)+':'+p.visible); p=p.parent;} out.chain=ch; }
          const h=__bw.world.targets.filter(t=>t.type==='house'||t.type==='church'); out.houses=h.length; const xs=h.map(t=>t.x), zs=h.map(t=>t.z); out.hx=[Math.min(...xs),Math.max(...xs)]; out.hz=[Math.min(...zs),Math.max(...zs)];
          out.sampleHouses=h.slice(0,6).map(t=>[Math.round(t.x),Math.round(t.z),t.id]);
          return out; })())"""))
        await b.close()
asyncio.run(main())
