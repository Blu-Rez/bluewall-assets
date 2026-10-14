import asyncio, os, time, subprocess, socket, sys
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8778
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
OUT = '/home/claude/work/mb3d/shots'; os.makedirs(OUT, exist_ok=True)
HERO = sys.argv[1] if len(sys.argv) > 1 else 'mobina'
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('response', lambda r: errs.append('HTTP %s %s' % (r.status, r.url[-50:])) if r.status >= 400 else None)
            await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=low&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1200):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(600):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('%s'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % (int(time.time()), HERO))
            await pg.evaluate("__rp.cam('third')"); await asyncio.sleep(1)
            await pg.screenshot(path=f'{OUT}/g_{HERO}_idle.png')
            for name, inp, spr in [('walk', (0, 0.5), False), ('run', (0, 1), True)]:
                await pg.evaluate(f"__rp.setInput({inp[0]},{inp[1]}); __rp.sprint({str(spr).lower()})"); await asyncio.sleep(2.2)
                await pg.screenshot(path=f'{OUT}/g_{HERO}_{name}.png')
            await pg.evaluate("__rp.setInput(0,0); __rp.sprint(false); __rp.look(2.0,0)"); await asyncio.sleep(1.2)
            await pg.screenshot(path=f'{OUT}/g_{HERO}_turn.png')
            print('errors', errs[:4]); await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
