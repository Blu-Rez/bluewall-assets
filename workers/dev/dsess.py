import asyncio, sys, json, os, time, glob, traceback
from playwright.async_api import async_playwright
# persistent dev session: dsess.py DIR [home|battle] ; drop DIR/cmd/N.txt (one step per line) and read DIR/cmd/N.out
# steps: js:CODE | shot:name | shotel:SELECTOR,name | cam:tx,tz,dist,az,pitch | adv:SEC | send:type,x,z | sendall:x,z | wait:SEC | vp:W,H | click:SELECTOR
async def main():
    d = sys.argv[1]; mode = sys.argv[2] if len(sys.argv) > 2 else 'home'
    os.makedirs(d + '/cmd', exist_ok=True)
    W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':W,'height':H}, device_scale_factor=float(os.environ.get('DPR','1')))
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)[:400])); pg.on('console', lambda m: logs.append(m.type+': '+m.text[:300]) if m.type in ('error',) and '404' not in m.text else None)
        await pg.goto(f'http://127.0.0.1:8777/dev_dbg.html?q={os.environ.get("Q","low")}&w=clear&h={os.environ.get("HOUR","2")}&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        if mode == 'battle':
            tgt = json.dumps({'id':'t1','name':'Portrait','emblem':'🐉','levels':{'keep':int(os.environ.get('LV','14')),'wall':14,'towers':14},'seed':3,'ratio':1.0,'power':4000,'loot':{'ruby':1000,'emerald':1000,'turq':1000}})
            await pg.evaluate(f'() => {{ window.__st = __bw.battle.start({tgt}); }}')
            for i in range(900):
                await asyncio.sleep(1)
                if await pg.evaluate('!!(window.__battle && !window.__battle.loading)'): break
            await pg.evaluate('() => { __battle.cam.intro = 0; }')
        open(d + '/ready', 'w').write('1'); print('ready', flush=True)
        n = 0
        while True:
            await asyncio.sleep(0.4)
            if os.path.exists(d + '/quit'): break
            f = f'{d}/cmd/{n}.txt'
            if not os.path.exists(f): continue
            await asyncio.sleep(0.2)
            out = []
            for st in open(f, encoding='utf-8').read().split('\n'):
                st = st.strip()
                if not st: continue
                k, _, v = st.partition(':')
                try:
                    if k == 'wait': await asyncio.sleep(float(v or 3))
                    elif k == 'vp': w, h = v.split(','); await pg.set_viewport_size({'width': int(w), 'height': int(h)}); await asyncio.sleep(1.5)
                    elif k == 'click': await pg.click(v, timeout=20000)
                    elif k == 'cam':
                        a = [float(x) for x in v.split(',')]
                        await pg.evaluate('(a) => { const c = __battle.cam; c.tx=a[0]; c.tz=a[1]; c.dist=a[2]; c.az=a[3]; c.pitch=a[4]; c.min=1; c.max=2000; c.intro=0; }', a)
                    elif k == 'adv': out.append('adv %s' % await pg.evaluate(f'__bw.battle.advance({v})'))
                    elif k == 'send': t,x,z = v.split(','); await pg.evaluate(f'__bw.battle.send("{t}",{x},{z})')
                    elif k == 'sendall': x,z = v.split(','); await pg.evaluate(f'() => {{ for (const t of __battle.types) __bw.battle.send(t,{x},{z}); }}')
                    elif k == 'js': out.append('js -> ' + json.dumps(await pg.evaluate(v))[:3000])
                    elif k in ('shot', 'shotel'):
                        f0 = await pg.evaluate('__bw.frames')
                        for i in range(60):
                            if await pg.evaluate(f'__bw.frames >= {f0} + 3'): break
                            await asyncio.sleep(1)
                        if k == 'shot': await pg.screenshot(path=f'{d}/{v}.png', timeout=240000); out.append('shot ' + v)
                        else:
                            sel, name = v.rsplit(',', 1); el = await pg.query_selector(sel); await el.screenshot(path=f'{d}/{name}.png', timeout=240000); out.append('shotel ' + name)
                except Exception as e:
                    out.append('ERR %s: %s' % (st[:60], str(e)[:300]))
            out.append('\n'.join(logs[-6:])); logs.clear()
            open(f'{d}/cmd/{n}.out', 'w', encoding='utf-8').write('\n'.join(out)); n += 1
        await b.close()
asyncio.run(main())
