# ld_pipe.py <pipe.json> : one semaphore slot = one full iteration: offline renders → post commands (grading/inject) → loader screenshots.
# pipe: {"renders": [[page, query, outprefix], ...], "post": ["shell cmd", ...], "shots": [[page, outprefix, "WxH,..", "p1,p2", {env}], ...]}
import asyncio, sys, json, base64, time, subprocess, os
from playwright.async_api import async_playwright
TG = 'window.Telegram={WebApp:{initData:"x",platform:"tdesktop",ready(){},expand(){},isVersionAtLeast(){return false},onEvent(){},safeAreaInset:{top:%d,bottom:%d},contentSafeAreaInset:{top:%d,bottom:0}}}'
async def render(b, page, qs, out):
    pg = await b.new_page(viewport={'width': 400, 'height': 300})
    logs = []
    pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300]))
    pg.on('pageerror', lambda e: logs.append('PAGEERR: ' + str(e)[:400]))
    t0 = time.time()
    await pg.goto(f'http://127.0.0.1:8777/ld_art/{page}?{qs}')
    st = 0
    for i in range(1200):
        await asyncio.sleep(0.5)
        st = await pg.evaluate('window.__done ? 1 : window.__err ? 2 : 0')
        if st: break
    if st != 1:
        print(out, 'FAILED', await pg.evaluate('window.__err||""'), flush=True); print('\n'.join(logs[-20:]), flush=True); await pg.close(); return
    o = await pg.evaluate('window.__out')
    for k in ('beauty', 'emis', 'img', 'depth'):
        if k in o and o[k]:
            open(f'{out}_{k}.png', 'wb').write(base64.b64decode(o[k].split(',', 1)[1]))
    json.dump({k: v for k, v in o.items() if k not in ('beauty', 'emis', 'img', 'depth')}, open(f'{out}_pts.json', 'w'))
    print(out.split('/')[-1], 'ok %.1fs' % (time.time() - t0), [l for l in logs if 'error' in l.lower() or 'PAGEERR' in l][:3], flush=True)
    await pg.close()
async def shot(b, page, out, vps, ps, env):
    ins = [int(x) for x in env.get('INS', '0,0,0').split(',')]
    for vp in vps.split(','):
        dpr = 2
        if '@' in vp: vp, d = vp.split('@'); dpr = float(d)
        w, h = map(int, vp.split('x'))
        ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, reduced_motion=env.get('RM', 'no-preference'))
        pg = await ctx.new_page(); logs = []
        pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]))
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.route('**/tg.js', lambda r: r.fulfill(body=TG % (ins[0], ins[1], ins[2]), content_type='application/javascript'))
        await pg.route('**/api/**', lambda r: None)
        await pg.goto(f'http://127.0.0.1:8777/{page}')
        await asyncio.sleep(float(env.get('WAIT', 3)))
        for pv in ps.split(','):
            await pg.evaluate(f"bwLoading({pv});bwTip({json.dumps(env.get('TIP', 'Raising the mountains…'))})")
            await asyncio.sleep(1.4)
            fn = f'{out}_{w}x{h}_{pv}.png'; await pg.screenshot(path=fn); print(fn, flush=True)
        if env.get('FLAP'):
            for i in range(4):
                fn = f'{out}_{w}x{h}_flap{i}.png'; await pg.screenshot(path=fn, clip={'x': 0, 'y': 0, 'width': w, 'height': min(h, 360)}); print(fn, flush=True); await asyncio.sleep(0.42)
        if env.get('PERF'):
            secs = float(env['PERF']); cdp = await ctx.new_cdp_session(pg); await cdp.send('Performance.enable')
            m0 = {m['name']: m['value'] for m in (await cdp.send('Performance.getMetrics'))['metrics']}
            await asyncio.sleep(secs)
            m1 = {m['name']: m['value'] for m in (await cdp.send('Performance.getMetrics'))['metrics']}
            lay = []
            cdp.on('LayerTree.layerTreeDidChange', lambda e: lay.append(len(e.get('layers') or [])))
            try:
                await cdp.send('LayerTree.enable'); await asyncio.sleep(1.5)
            except Exception as e: lay.append(str(e)[:60])
            print('PERF', vp, json.dumps({k: round((m1[k] - m0[k]) * 1000 / secs, 2) for k in ('TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration') if k in m1}), 'nodes', m1.get('Nodes'), 'layers', lay[-1:] , flush=True)
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]
        if errs: print('ERRORS', vp, errs[:4], flush=True)
        await ctx.close()
async def main():
    cfg = json.load(open(sys.argv[1]))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for j in cfg.get('renders', []): await render(b, *j)
        for c in cfg.get('post', []):
            r = subprocess.run(c, shell=True, capture_output=True, text=True); print('POST', c[:80], '->', (r.stdout + r.stderr).strip()[-600:], flush=True)
        for s in cfg.get('shots', []): await shot(b, s[0], s[1], s[2], s[3], s[4] if len(s) > 4 else {})
        await b.close()
    print('PIPE DONE', flush=True)
asyncio.run(main())
