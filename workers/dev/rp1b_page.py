import asyncio, json, sys, time, os, subprocess, socket
from playwright.async_api import async_playwright
# rp1b_page.py — RP1B browser part: (A) the gate-off page (hero not enabled) fetches nothing of the hero and draws the same program count; (B) the dev page: start the hero, run dev/rp1b_page.js (reach map,
# physical walks, walls, water, building buttons, diet), then leave hero mode and check every knob is back.  Prints "PAGE OK" or the failures.   software GL: each page takes ~2-3 min to load.
D = '/home/claude/dev/'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
PORT = int(os.environ.get('RP1B_PORT', 8777))
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
STATE = "(()=>{ const r=__bw.renderer, k=__bw.world.key; return JSON.stringify({pr:r.getPixelRatio(), progs:(r.info.programs||[]).length, box:k&&k.shadow?[k.shadow.camera.left,k.shadow.camera.right,k.shadow.camera.top,k.shadow.camera.bottom]:null}); })()"
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            # ---- A: gate off — the page of a normal player (no hero switch)
            b, pg, reqs, errs = await boot(p, 'rp1_off.html')
            a_state = json.loads(await pg.evaluate(STATE)); has_rp = await pg.evaluate('typeof window.__rp !== "undefined" || typeof window.__rpLoad !== "undefined"'); btn = await pg.evaluate('!!document.querySelector(".rp-open")')
            ok(not [u for u in reqs if '/rpg/' in u], 'gate off: nothing under assets/rpg/ is fetched', [u for u in reqs if '/rpg/' in u][:3])
            ok(not has_rp and not btn, 'gate off: no hero switch, no hero button')
            ok(a_state['pr'] > 0 and a_state['progs'] <= 168, 'gate off: shader programs ' + str(a_state['progs']) + ' (<= 168, the base game has 166-168)')
            ok(not errs, 'gate off: no page error', errs[:2])
            await b.close()
            # ---- B: the owner's page
            b, pg, reqs, errs = await boot(p, 'rp1_dev.html')
            s0 = json.loads(await pg.evaluate(STATE))
            ok(not [u for u in reqs if '/rpg/' in u], 'owner page before the hero is started: still nothing fetched from assets/rpg/')
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); return 1; })()" % int(time.time()))
            ok(await pg.evaluate("__rp.S.where === 'home' && !!__rp.S.hero"), 'hero started on the home map')
            res = json.loads(await pg.evaluate(open(D + 'rp1b_page.js').read()))
            for c in res['checks']: ok(c['ok'], c['name'], c['info'])
            ok(res['progs'] <= s0['progs'] + 4, 'shader programs after the whole hero session: ' + str(res['progs']) + ' (before the hero: ' + str(s0['progs']) + ', allowed +4)')
            await pg.evaluate("(()=>{ __rp.exit(); return 1; })()")
            for i in range(30):                                   # (the page applies the pixel ratio on its next frame: ~1 fps in software GL)
                await asyncio.sleep(2); s1 = json.loads(await pg.evaluate(STATE))
                if s1['pr'] == s0['pr']: break
            ok(s1['pr'] == s0['pr'] and s1['box'] == s0['box'], 'after leaving hero mode: pixel ratio ' + str(s1['pr']) + ' and shadow box back to the strategic values', json.dumps([s0['pr'], s0['box']]) + ' -> ' + json.dumps([s1['pr'], s1['box']]))
            ok(await pg.evaluate("(()=>{ let n=0; __bw.scene.traverse(o=>{ if(o.userData && o.userData.rpOff===1 && !o.visible) n++; }); return n===0; })()"), 'after leaving hero mode: nothing the diet hid stays hidden')
            ok(not errs, 'no page error in the owner page', errs[:3])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('PAGE FAILED: ' + '; '.join(fails) if fails else 'PAGE OK')
    sys.exit(1 if fails else 0)
asyncio.run(main())
