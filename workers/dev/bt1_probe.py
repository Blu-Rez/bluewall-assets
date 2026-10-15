import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt1_probe.py : load the real game (dev_s35), print stage children, targets, keep/gate positions; then attack and print the same.
async def main():
    W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1' + ('&lv=' + os.environ['LV'] if os.environ.get('LV') else ''))
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        js_stage = """JSON.stringify(__bw.world.stage.children.map(c=>[c.name||c.type, c.visible, c.children.length]))"""
        print('HOME stage', await pg.evaluate(js_stage))
        print('HOME targets', await pg.evaluate("JSON.stringify((()=>{const t=__bw.world.targets||[];const o={};for(const x of t){o[x.type||x.kind]=(o[x.type||x.kind]||0)+1}return {n:t.length,by:o,sample:t.slice(0,3)}})())"))
        print('HOME levels', await pg.evaluate("JSON.stringify(__bw.world.levels&&__bw.world.levels.get?__bw.world.levels.get():null)"))
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        print('BATTLE stage', await pg.evaluate(js_stage))
        print('BATTLE target', await pg.evaluate("JSON.stringify(Object.assign({}, __bw.battle.session.target||{}, {}), (k,v)=>k==='targets'?undefined:v).slice(0,900)"))
        print('\n'.join(logs[:10]))
        await b.close()
asyncio.run(main())
