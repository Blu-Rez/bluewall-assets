#!/usr/bin/env python3
# ST1_R2 probe: load the home map once, print the vault / mine lists and camera fields (positions for the shot script)
import asyncio, os, json, time
from playwright.async_api import async_playwright
W=844; H=390; HOUR=os.environ.get('HOUR','22'); LV=os.environ.get('LV','30'); URLQ=os.environ.get('URLQ','')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':W,'height':H}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:300]))
        t0=time.time()
        await pg.goto(f'http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h={HOUR}&wa=0.1&lv={LV}'+('&'+URLQ if URLQ else ''))
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        print('ready', round(time.time()-t0), flush=True)
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('late', round(time.time()-t0), flush=True)
        r = await pg.evaluate("""() => { const w=__bw.world, c=__bw.ctl; const f=(a)=>(a||[]).map(s=>({id:s.id,x:s.x,y:s.y,z:s.z,ry:s.ry,top:s.top&&[s.top.x,s.top.y,s.top.z]}));
          return { vaults:f(w.vaults&&w.vaults.list), mines:f((w.ctx&&w.ctx.mines&&w.ctx.mines.list)||(w.mines&&w.mines.list)), ctl:Object.keys(c).slice(0,60), maxD:c.maxD, dist:c.dist, polar:c.polar, azim:c.azim, tgt:[c.target.x,c.target.y,c.target.z], keys:Object.keys(w).slice(0,60) }; }""")
        print(json.dumps(r, indent=1)); print('LOGS', logs[:5]); await b.close()
asyncio.run(main())
