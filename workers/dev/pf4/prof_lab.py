#!/usr/bin/env python3
# pf3/lab.py <tag> <exp.js> [more.js ...] — boots the rig page (software GL, draw calls swallowed after boot), installs the program-trace hook of pf3/trace.py, waits for the late stage, then evaluates each JS file in turn
# (an async function body; its return value is printed as JSON).  Between files the page keeps its state, so an experiment can be split in steps.  env: PF3_H (game hour, default 14) · PF3_QS · PF3_PAGE · PF3_DRAW=1 (let draw calls through)
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
sys.argv_ = sys.argv
D = '/home/claude/dev/'; TAG = sys.argv[1]; FILES = sys.argv[2:]; PORT = int(os.environ.get('PF3_PORT', 8795))
PAGE = os.environ.get('PF3_PAGE') or ('pf2_%s.html' % TAG); QS = os.environ.get('PF3_QS', '')
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
src = open(D + 'pf3/trace.py').read()
INIT = open(D + 'pf2/page.py').read().split('INIT = "')[1].split('"\n')[0].replace('\\"', '"')
HOOK = src.split('HOOK = """')[1].split('"""')[0]
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: log('PAGEERROR', str(e)[:300])); pg.on('console', lambda m: log('console', m.text[:300]) if m.type in ('error',) or m.text.startswith('[lab]') else None)
            t0 = time.time()
            await pg.goto('http://127.0.0.1:%d/%s?pf=1&q=high&w=clear&h=%s&wa=0.1%s' % (PORT, PAGE, os.environ.get('PF3_H', '14'), QS))
            for i in range(3000):
                await asyncio.sleep(0.4)
                if (await pg.evaluate('!!window.__bw')): break
            await pg.evaluate(HOOK)
            for i in range(3000):
                await asyncio.sleep(0.4)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            if os.environ.get('PF3_DRAW'): await pg.evaluate('window.__nd.on=false')
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
            log('ready after %.0f s: programs %s' % (time.time() - t0, await pg.evaluate('__bw.renderer.info.programs.length')))
            cdp = await ctx.new_cdp_session(pg); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 400}); await cdp.send('Profiler.start')
            for f in FILES:
                js = open(f).read()
                t1 = time.time()
                try: r = await pg.evaluate('(async () => {' + js + '})()')
                except Exception as e: r = {'EXC': str(e)[:600]}
                log('== %s (%.1f s)' % (os.path.basename(f), time.time() - t1)); os.makedirs('/home/claude/work/pf3', exist_ok=True); json.dump(r, open('/home/claude/work/pf3/lab_%s.json' % os.path.basename(f), 'w'), indent=1); print(json.dumps(r)[:int(os.environ.get('PF3_MAX', 9000))], flush=True)
            prof = await cdp.send('Profiler.stop'); json.dump(prof['profile'], open('/home/claude/work/pf4/profile_%s.json' % TAG, 'w'))
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
