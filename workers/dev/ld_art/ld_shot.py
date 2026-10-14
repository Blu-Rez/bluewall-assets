# ld_shot.py <page> <outprefix> <WxH[@dpr],...> <p1,p2,...> [wait] : screenshots of the loader (auth request held open, so the loader stays up)
# also: PERF=secs → samples CDP Performance metrics over that window (task / style / layout / paint time while the loader animates)
import asyncio, sys, os, json
from playwright.async_api import async_playwright
TG = 'window.Telegram={WebApp:{initData:"x",platform:"tdesktop",ready(){},expand(){},isVersionAtLeast(){return false},onEvent(){},safeAreaInset:{top:%d,bottom:%d},contentSafeAreaInset:{top:%d,bottom:0}}}'
async def main():
    page, out, vps, ps = sys.argv[1], sys.argv[2], sys.argv[3].split(','), [float(x) for x in sys.argv[4].split(',')]
    wait = float(sys.argv[5]) if len(sys.argv) > 5 else 2.5
    perf = float(os.environ.get('PERF', '0'))
    ins = [int(x) for x in os.environ.get('INS', '0,0,0').split(',')]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        for vp in vps:
            dpr = 2
            if '@' in vp: vp, d = vp.split('@'); dpr = float(d)
            w, h = map(int, vp.split('x'))
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, reduced_motion=os.environ.get('RM', 'no-preference'))
            pg = await ctx.new_page()
            logs = []
            pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]))
            pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
            await pg.route('**/tg.js', lambda r: r.fulfill(body=TG % (ins[0], ins[1], ins[2]), content_type='application/javascript'))
            await pg.route('**/api/**', lambda r: None)        # hold auth open
            await pg.goto(f'http://127.0.0.1:8777/{page}')
            await asyncio.sleep(wait)
            for pv in ps:
                await pg.evaluate(f"bwLoading({pv});bwTip({json.dumps(os.environ.get('TIP', 'Raising the mountains…'))})")
                await asyncio.sleep(1.4)
                fn = f'{out}_{w}x{h}_{int(pv)}.png'
                await pg.screenshot(path=fn)
                print(fn, flush=True)
            if perf:
                cdp = await ctx.new_cdp_session(pg)
                await cdp.send('Performance.enable')
                m0 = {m['name']: m['value'] for m in (await cdp.send('Performance.getMetrics'))['metrics']}
                await asyncio.sleep(perf)
                m1 = {m['name']: m['value'] for m in (await cdp.send('Performance.getMetrics'))['metrics']}
                d = {k: round((m1[k] - m0[k]) * 1000 / perf, 2) for k in ('TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration') if k in m1}
                d['frames?'] = m1.get('Frames', 0) - m0.get('Frames', 0)
                print('PERF ms-per-second', json.dumps(d), 'nodes', m1.get('Nodes'), 'layers?', m1.get('LayoutObjects'), flush=True)
            errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]
            if errs: print('ERRORS', errs[:5])
            await ctx.close()
        await b.close()
asyncio.run(main())
