import asyncio, json, os, sys, time, socket, subprocess, traceback
from playwright.async_api import async_playwright
# rp1c_repl.py — a persistent software-GL browser for RP1C work (the game takes ~3 min to load; this loads it ONCE).
#   python3 dev/rp1c_repl.py [page] [quality] &          # boots rp1_dev.html, starts the hero (elina), then waits for commands
#   python3 dev/rp1c_ask.py 'js body (async, may use await / return)' [shot.png]   -> prints the JSON result
# Commands are files in /tmp/rp1c/in/<n>.js, answers /tmp/rp1c/out/<n>.json (+ optional screenshot).  Ctrl-C / `touch /tmp/rp1c/stop` ends it.
D = '/home/claude/dev/'; IO = os.environ.get('RP1C_IO', '/tmp/rp1c/'); PORT = int(os.environ.get('RP1C_PORT', 8777))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
page_name = sys.argv[1] if len(sys.argv) > 1 else 'rp1_dev.html'; quality = sys.argv[2] if len(sys.argv) > 2 else 'low'
extra = os.environ.get('RP1C_Q', '')
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    os.makedirs(IO + 'in', exist_ok=True); os.makedirs(IO + 'out', exist_ok=True)
    for f in os.listdir(IO + 'in'): os.remove(IO + 'in/' + f)
    for f in os.listdir(IO + 'out'): os.remove(IO + 'out/' + f)
    if os.path.exists(IO + 'stop'): os.remove(IO + 'stop')
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    errs = []; reqs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, has_touch=True, is_mobile=True)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)[:400])); pg.on('request', lambda r: reqs.append(r.url)); pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text[:300]) if m.type in ('error',) else None)
            await pg.goto('http://127.0.0.1:%d/%s?q=%s&w=clear&h=14&wa=0.1%s' % (PORT, page_name, quality, extra))
            for i in range(1500):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            if page_name == 'rp1_dev.html':
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); return 1; })()" % int(time.time()))
            open(IO + 'ready', 'w').write(str(time.time())); print('READY', flush=True)
            while not os.path.exists(IO + 'stop'):
                await asyncio.sleep(0.25)
                for f in sorted(os.listdir(IO + 'in')):
                    if not f.endswith('.js'): continue
                    n = f[:-3]; src = open(IO + 'in/' + f).read(); os.remove(IO + 'in/' + f); out = {}
                    try:
                        shot = None
                        if src.startswith('#shot '):
                            first, src = src.split('\n', 1); shot = first[6:].strip()
                        if src.startswith('#throttle'):                      # CDP CPU throttling: '#throttle 4' (1 = off)
                            rate = float(src.split()[1]); cdp = await ctx.new_cdp_session(pg); await cdp.send('Emulation.setCPUThrottlingRate', {'rate': rate}); out['result'] = 'throttle %s' % rate
                        elif src.startswith('#reload'):                      # re-import the hero module (new ?v=), keep the game
                            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1200)); return 1; })()" % int(time.time() * 1000) )
                            out['result'] = 'reloaded'
                        else:
                            res = await pg.evaluate('(async()=>{ ' + src + ' })()')
                            out['result'] = res
                        if shot:
                            await asyncio.sleep(0.4); await pg.screenshot(path=shot); out['shot'] = shot
                    except Exception as e:
                        out['error'] = (str(e) + '\n' + traceback.format_exc())[:3000]
                    out['errs'] = errs[-6:]; errs.clear()
                    json.dump(out, open(IO + 'out/' + n + '.tmp', 'w')); os.rename(IO + 'out/' + n + '.tmp', IO + 'out/' + n + '.json')
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
