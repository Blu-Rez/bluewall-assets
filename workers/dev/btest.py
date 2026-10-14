import asyncio, sys, json, os, time
from playwright.async_api import async_playwright
# usage: btest.py OUT QUALITY  "step;step;..."   steps:  wait  |  cam:tx,tz,dist,az,pitch  |  adv:SEC  |  send:type,x,z  |  sendall:x,z  |  shot:name  |  js:CODE
async def main():
    out, q, steps = sys.argv[1], sys.argv[2], (sys.argv[3].split('\n') if '\n' in sys.argv[3] else sys.argv[3].split(';'))
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':W,'height':H}, device_scale_factor=float(os.environ.get('DPR','1')))
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)[:400])); pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type in ('error','warning') else None)
        await pg.goto(f'http://127.0.0.1:8777/dev_dbg.html?q={q}&w=clear&h=2&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', flush=True)
        await pg.evaluate('''() => { const e = __bw.econ; e.st.army = { army: {spear:30, sword:30, guard:12, archer:30, cavalry:8, pegasus:6, baby:3, catapult:5, giant:3}, forge: 10, space: 252, spell: { spells: { lightning:{n:3}, heal:{n:2}, freeze:{n:1}, rage:{n:1}, quake:{n:1} } } }; }''')
        tgt = json.dumps({'id':'t1','name':'Test Lord','kind':'bot','levels':{'keep':int(os.environ.get('LV','14')),'wall':14,'towers':14},'seed':3,'ratio':1.0,'power':4000,'loot':{'ruby':1000,'emerald':1000,'turq':1000}})
        t0=time.time()
        await pg.evaluate(f'() => {{ window.__st = __bw.battle.start({tgt}); }}')
        for i in range(900):
            await asyncio.sleep(1)
            if await pg.evaluate('!!(window.__battle && !window.__battle.loading)'): break
        print('battle loaded', round(time.time()-t0), 's', flush=True)
        await pg.evaluate('() => { __battle.cam.intro = 0; }')
        for st in steps:
            k, _, v = st.partition(':')
            if k == 'wait': await asyncio.sleep(float(v or 3))
            elif k == 'cam':
                a = [float(x) for x in v.split(',')]
                await pg.evaluate('(a) => { const c = __battle.cam; c.tx=a[0]; c.tz=a[1]; c.dist=a[2]; c.az=a[3]; c.pitch=a[4]; c.min=1; c.max=2000; c.intro=0; }', a)
            elif k == 'free':
                a = [float(x) for x in v.split(',')]
                await pg.evaluate('(a) => { const b=__bw, c=b.camera; c.position.set(a[0],a[1],a[2]); c.lookAt(a[3],a[4],a[5]); c.updateMatrixWorld(true); __battle.cam.free = true; }', a)
            elif k == 'adv': print('adv', await pg.evaluate(f'__bw.battle.advance({v})'), flush=True)
            elif k == 'send':
                t,x,z = v.split(','); await pg.evaluate(f'__bw.battle.send("{t}",{x},{z})')
            elif k == 'sendall':
                x,z = v.split(','); await pg.evaluate(f'() => {{ for (const t of __battle.types) __bw.battle.send(t,{x},{z}); }}')
            elif k == 'js': print('js ->', json.dumps(await pg.evaluate(v))[:1200], flush=True)
            elif k == 'shot':
                f0 = await pg.evaluate('__bw.frames')
                for i in range(120):
                    if await pg.evaluate(f'__bw.frames >= {f0} + 3'): break
                    await asyncio.sleep(1)
                await pg.screenshot(path=f'{out}_{v}.png', timeout=240000); print('shot', v, flush=True)
        print('\n'.join(logs[:14]))
        await b.close()
asyncio.run(main())
