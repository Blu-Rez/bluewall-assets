# fire cycle check: python3 firetest.py OUTPREFIX [EXTRA]   (waits for the late stage, then freezes the loop at chosen moments)
import asyncio, sys, os, json
from playwright.async_api import async_playwright
STEPS = [
 ('fire',  "(()=>{const b=__bw.world.late.ballistas.S[3]; b.sweepT=0; b.phase='fire'; b.t=0.07;})()", 1),
 ('bolt',  "(()=>{const b=__bw.world.late.ballistas.S[3]; b.sweepT=0; b.phase='aim'; b.t=0.89; b.boltOn=true;})()", 4),
 ('cock',  "(()=>{const b=__bw.world.late.ballistas.S[3]; b.sweepT=0; b.phase='cock'; b.t=1.3;})()", 1),
]
async def main():
    pre = sys.argv[1]; extra = sys.argv[2] if len(sys.argv) > 2 else ''
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 500})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&w=clear&h=14' + extra)
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        await pg.evaluate('''(()=>{const s=__bw.world.ctx.weaponSites[3]; const a=s.a; __cam(s.x+Math.cos(a)*8-Math.sin(a)*8, s.y+5.5, s.z+Math.sin(a)*8+Math.cos(a)*8, s.x, s.y+1.4, s.z); document.querySelectorAll(".bw-ui,.bw-wel").forEach(e=>e.style.display="none"); })()''')
        for name, js, n in STEPS:
            f0 = await pg.evaluate('__bw.frames')
            await pg.evaluate(js)
            for i in range(240):
                if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
                await asyncio.sleep(0.5)
            await pg.evaluate('__bw.pause(true)')
            await pg.screenshot(path=f'{pre}_{name}.png', timeout=240000)
            print(name, await pg.evaluate('(()=>{const b=__bw.world.late.ballistas.S[3]; return JSON.stringify({ph:b.phase,t:b.t.toFixed(2),phi:b.phi,flying:b.flying})})()'))
            await pg.evaluate('__bw.pause(false)')
        print(await pg.evaluate('(()=>{try{__bw.audio.twang(1);return "twang ok"}catch(e){return "twang ERR "+e}})()'))
        for l in logs[-6:]: print(l)
        await b.close()
asyncio.run(main())
