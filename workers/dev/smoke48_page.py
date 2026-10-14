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
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    OUT = '/home/claude/work/smoke48'; os.makedirs(OUT, exist_ok=True)
    try:
        async with async_playwright() as p:
            b, pg, reqs, errs = await boot(p, 'rp1_dev.html')
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); return 1; })()" % int(time.time()))
            ok(await pg.evaluate("__rp.S.where === 'home'"), 'hero started on the home map (33 clips model)')
            n = await pg.evaluate("Object.keys(__rp.S.hero.acts).length")
            ok(n >= 9, 'hero has its locomotion actions', n)
            await pg.evaluate("(async()=>{ __rp.pause(false); __rp.S.cool = 0; await __rp.goUnder(); __rp.pause(true); __rp.S.cool = 99; return 1; })()")
            await asyncio.sleep(3)
            ok(await pg.evaluate("__rp.S.where === 'under'"), 'entered the underworld hub (RP3)')
            ok(await pg.evaluate("!!__rp.S.cmb"), 'combat attached (RP4 hook)')
            ok(await pg.evaluate("!!(__rp.S.under && __rp.S.under.pois && __rp.S.under.pois.length)"), 'hub exposes pois', await pg.evaluate("__rp.S.under.pois.length"))
            try:
                await pg.evaluate("(()=>{ const c = __rp.S.cmb; c.spawnTest(1, ['soldier']); c.press('attack'); return 1; })()")
                await pg.evaluate("__rp.sim(1.2)")
            except Exception as e: ok(False, 'combat spawn + attack', str(e)[:200])
            await pg.screenshot(path=OUT + '/under_combat.png')
            st = await pg.evaluate("JSON.stringify(__rp.S.cmb.stats ? __rp.S.cmb.stats() : {})")
            print('combat stats', st[:200])
            await pg.evaluate("(async()=>{ await __rp.goHome(); return 1; })()")
            await asyncio.sleep(2)
            ok(await pg.evaluate("__rp.S.where === 'home' && !__rp.S.cmb"), 'back home, combat disposed')
            await pg.evaluate("__rp.exit()")
            ok(await pg.evaluate("!__rp.active"), 'exit leaves hero mode')
            ok(not errs, 'no page error', errs[:2])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('SMOKE48 ' + ('OK' if not fails else 'FAILED ' + str(fails)))
asyncio.run(main())
