#!/usr/bin/env python3
# qa1_probe.py (GR1_R3) — run a list of page evals BEFORE the hero starts (strategic camera = QA1.strat works), save each returned data-URL as a PNG.
#   python3 dev/qa1_probe.py --tag wp --hour 18.3 --evals work/qa1/diag_water3.json      (entries: {"name":..., "eval":"(async()=>{...return await QA1.shot()})()"})
import argparse, asyncio, base64, json, os, socket, subprocess, time
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; BASE = '/home/claude/work/qa1/'; PORT = int(os.environ.get('PORT', 8779))
ap = argparse.ArgumentParser(); ap.add_argument('--tag', default='probe'); ap.add_argument('--hour', type=float, default=12.5); ap.add_argument('--evals', required=True); ap.add_argument('--quality', default='high')
A = ap.parse_args(); OUT = BASE + 'out/' + A.tag + '/probe/'; os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
def log(*a): print(time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in a), flush=True)
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            t0 = time.time(); await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=%s&w=clear&h=%s&wa=0.1' % (PORT, A.quality, A.hour), timeout=900000)
            for i in range(4000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(1500):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            log('page ready after', round(time.time() - t0), 's')
            await pg.evaluate(open(D + 'qa1_page.js').read()); await pg.evaluate('QA1.init()')
            G = json.load(open(BASE + 'layout_dump.json'))['gate']; await pg.evaluate('window.__qa1.gate=%s' % json.dumps({'nx': G['nx'], 'nz': G['nz']}))
            for q in json.load(open(A.evals)):
                t1 = time.time()
                try:
                    out = await asyncio.wait_for(pg.evaluate(q["eval"]), 2400)
                    if isinstance(out, str) and out.startswith('data:image'): open(OUT + q['name'] + '.png', 'wb').write(base64.b64decode(out.split(',', 1)[1]))
                    else: json.dump(out, open(OUT + q['name'] + '.json', 'w'), indent=1)
                    log(q['name'], 'ok', round(time.time() - t1), 's')
                except Exception as e: log(q['name'], 'ERR', str(e)[:200])
            log('pageerrors', errs)
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
