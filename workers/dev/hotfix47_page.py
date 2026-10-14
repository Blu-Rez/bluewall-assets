import asyncio, json, sys, os, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
PORT = int(os.environ.get('HF_PORT', 8778))
fails = []
class R:
    pass
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def ok(c, m, info=''):
    print(('ok   ' if c else 'FAIL ') + m + ((' — ' + str(info)) if info != '' else ''), flush=True)
    if not c: fails.append(m)
async def boot(p, page, q='low'):
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
    reqs = []; errs = []
    pg.on('request', lambda r: reqs.append(r.url)); pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    await pg.goto('http://127.0.0.1:%d/%s?q=%s&w=clear&h=14&wa=0.1' % (PORT, page, q))
    for i in range(1200):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready'): break
    for i in range(600):
        if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
        await asyncio.sleep(1)
    return b, pg, reqs, errs
OUT = '/home/claude/work/hotfix47'; os.makedirs(OUT, exist_ok=True)
async def main():
    import subprocess
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b, pg, reqs, errs = await boot(p, 'rp1_dev.html')
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); return 1; })()" % int(time.time()))
            box = lambda sel: pg.evaluate("(()=>{const e=document.querySelector('%s'); if(!e) return null; const r=e.getBoundingClientRect(); return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)];})()" % sel)
            print('no tg header   exit box', await box('[data-rp=exit]'), 'cam', await box('[data-rp=cam]'), 'gate', await box('[data-rp=gate]'))
            await pg.evaluate("document.documentElement.style.setProperty('--tg-safe-area-inset-top','0px');document.documentElement.style.setProperty('--tg-content-safe-area-inset-top','56px')")
            await asyncio.sleep(0.5)
            e = await box('[data-rp=exit]'); c = await box('[data-rp=cam]'); g = await box('[data-rp=gate]')
            print('tg header 56px exit box', e, 'cam', c, 'gate', g)
            ok(e and e[1] >= 56, 'exit button sits below a 56 px Telegram header', e)
            ok(c and c[1] >= 56 + 40 and g and g[1] >= c[1] + 40, 'cam / gate buttons stack below it', [c, g])
            await pg.screenshot(path=OUT + '/hero_tg_header.png')
            # tap the exit with the pointer at its centre
            await pg.mouse.click(e[0] + e[2] / 2, e[1] + e[3] / 2)
            await asyncio.sleep(1.5)
            ok(await pg.evaluate("!__rp.active"), 'a tap on the exit button leaves hero mode')
            await pg.screenshot(path=OUT + '/after_exit.png')
            ok(not errs, 'no page error', errs[:2])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('HOTFIX47 PAGE ' + ('OK' if not fails else 'FAILED ' + str(fails)))
asyncio.run(main())
