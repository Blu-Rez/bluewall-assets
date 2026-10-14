import asyncio, sys, json
from playwright.async_api import async_playwright
INIT = r'''
(() => {
  const live = new Map(); let id = 0;
  const P = WebGL2RenderingContext.prototype, ct = P.createTexture, dt = P.deleteTexture;
  P.createTexture = function () { const t = ct.call(this); live.set(t, { n: ++id, s: new Error().stack.split('\n').slice(2, 7).map((l) => l.trim().replace(/http:\/\/[^ ]*\//, '')).join(' < ') }); return t; };
  P.deleteTexture = function (t) { live.delete(t); return dt.call(this, t); };
  window.__live = () => { const m = {}; for (const v of live.values()) { m[v.s] = (m[v.s] || 0) + 1; } return m; };
  window.__liveN = () => live.size;
})();
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 600, 'height': 900})
        await pg.add_init_script(INIT)
        logs = []; pg.on('pageerror', lambda e: logs.append(str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/bat_dev.html?lv=8&power=700')
        for i in range(600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__battle && !window.__battle.loading)'): break
        async def frames(n):
            f0 = await pg.evaluate('window.__frames')
            for i in range(200):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'window.__frames >= {f0}+{n}'): break
        res = []; LEFT = []
        for k in range(3):
            await frames(3)
            res.append(await pg.evaluate('__liveN()'))
            if k == 0: first = await pg.evaluate('__live()')
            await pg.evaluate('__mode.exit()'); await asyncio.sleep(1)
            after = await pg.evaluate('__liveN()'); res.append(('after', after))
            left = await pg.evaluate('__live()'); LEFT.append(left)
            if k < 2:
                await pg.evaluate('(async()=>{await __mode.start(__battle? __battle.target : {id:"t2",kind:"bot",name:"X",ratio:1.1,levels:{keep:8,wall:8,towers:8},seed:7,power:700,loot:{ruby:1,emerald:1,turq:1}})})()') if False else None
                await pg.evaluate("(async()=>{await __mode.start({id:'t2',kind:'bot',name:'X',ratio:1.1,levels:{keep:8,wall:8,towers:8},seed:7,power:700,loot:{ruby:1,emerald:1,turq:1}})})()")
                for i in range(240):
                    await asyncio.sleep(0.5)
                    if await pg.evaluate('!!(window.__battle && !window.__battle.loading)'): break
        print('live textures (GL):', res)
        keys = set(LEFT[0]) | set(LEFT[-1])
        for s in sorted(keys, key=lambda k: -(LEFT[-1].get(k, 0) - LEFT[0].get(k, 0))):
            a, c = LEFT[0].get(s, 0), LEFT[-1].get(s, 0)
            if a != c: print(a, '->', c, s[:300])
        for l in logs[:5]: print(l)
        await b.close()
asyncio.run(main())
