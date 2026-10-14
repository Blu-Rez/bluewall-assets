import asyncio, json, sys, time, os, subprocess, socket
from playwright.async_api import async_playwright
# rp1c_page.py — RP1C browser part: (A) the gate-off page fetches nothing of the hero and draws no more programs than the base game; (B) the dev page: take the "before the hero" snapshot, start the hero, run dev/rp1c_page.js
# (culling A/B at 2 views, the door orbs / icons / button, tap-from-distance walk + sheet + interact, joystick cancel, exit leaves nothing, a second session leaks nothing).  Prints "PAGE OK" or the failures.
D = '/home/claude/dev/'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
PORT = int(os.environ.get('RP1C_PAGE_PORT', 8779))
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
fails = []
def ok(c, m, info=''):
    print(('ok   ' if c else 'FAIL ') + m + ((' — ' + str(info)) if info != '' else ''), flush=True)
    if not c: fails.append(m)
async def boot(p, page, q='low'):
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1, has_touch=True, is_mobile=True)
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
PRE = """(()=>{ const R=__bw.renderer, sc=__bw.scene; const h=[]; sc.traverse((o)=>{ if (o.isInstancedMesh && o.count>0 && !o.visible && !(o.userData && (o.userData.rpHero || o.userData.rpProxy))) h.push((o.name || o.type) + ':' + o.count); });
  window.__pre = { progs: R.info.programs.length, shadowRender: R.shadowMap.render, hidden: h.sort().join('|') }; return window.__pre.progs; })()"""
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b, pg, reqs, errs = await boot(p, 'rp1_off.html')
            progs = await pg.evaluate('(__bw.renderer.info.programs||[]).length'); has_rp = await pg.evaluate('typeof window.__rp !== "undefined" || typeof window.__rpLoad !== "undefined"'); btn = await pg.evaluate('!!document.querySelector(".rp-open")')
            ok(not [u for u in reqs if '/rpg/' in u], 'gate off: nothing under assets/rpg/ is fetched (0 requests)', [u for u in reqs if '/rpg/' in u][:3])
            ok(not has_rp and not btn, 'gate off: no hero switch, no hero button, no door orb code')
            ok(progs <= 168, 'gate off: shader programs ' + str(progs) + ' (<= 168, the base game has 166-168)')
            ok(not errs, 'gate off: no page error', errs[:2])
            await b.close()
            b, pg, reqs, errs = await boot(p, 'rp1_dev.html')
            pp = await pg.evaluate(PRE); ok(pp > 0, 'owner page: snapshot before the hero (programs ' + str(pp) + ')')
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2000)); return 1; })()" % int(time.time()))
            ok(await pg.evaluate("__rp.S.where === 'home' && !!__rp.S.hero && !!__rp.doors() && !!__rp.cull()"), 'hero started with the culling and the doors')
            res = json.loads(await pg.evaluate(open(D + 'rp1c_page.js').read()))
            for c in res['checks']: ok(c['ok'], c['name'], c['info'])
            print('NUMS ' + json.dumps(res['nums']), flush=True)
            ok(not errs, 'no page error in the owner page', errs[:3])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('PAGE FAILED: ' + '; '.join(fails) if fails else 'PAGE OK')
    sys.exit(1 if fails else 0)
asyncio.run(main())
