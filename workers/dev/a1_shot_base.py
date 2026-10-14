import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# a1_shot.py TAG SPEC : in-game shots of the home map, ONE page load, any levels / cameras in one run (the full game takes minutes in software GL).
#   SPEC = comma list of  LEVEL:VIEW   e.g.  30:ctr,10:ctr,20:ctr   (the level is set with __bw.world.setLevel(n) -> the same call the game makes when the server sends a new level)
#   env: W H (viewport), LV0 (level the page boots with, default 30), EXTRA (js run after each setLevel, before the camera), SETTLE (seconds to wait after the camera move)
TAG = sys.argv[1]; SPEC = sys.argv[2] if len(sys.argv) > 2 else '30:ctr'
OUT = '/home/claude/work/a1_' + TAG
os.makedirs('/home/claude/work', exist_ok=True)
W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 620)); LV0 = os.environ.get('LV0', '30'); SETTLE = float(os.environ.get('SETTLE', 8))
VIEWS = {
  'ctr':    "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  'wide':   "c.target.set(0,0,20); c.dist=c.maxD*0.95; c.polar=0.8; c.azim=0.6;",
  'top':    "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'cit':    "c.target.set(0,0,-5); c.dist=170; c.polar=0.95; c.azim=0.6;",
  'cit2':   "c.target.set(-10,0,-10); c.dist=120; c.polar=1.0; c.azim=2.4;",
  'town':   "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'gateN':  "c.target.set(0,0,60); c.dist=150; c.polar=1.0; c.azim=0.0;",
  'home':   "c.target.set(0,0,0); c.dist=190; c.polar=1.08; c.azim=0.95;",
}
for kv in os.environ.get('VIEWDEF', '').split('|'):         # VIEWDEF="name=js|name2=js"
    if '=' in kv: k, v = kv.split('=', 1); VIEWS[k] = v
want = [s.split(':') for s in SPEC.split(',')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) or m.text.startswith('[late]') or m.text.startswith('A1') else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        if os.environ.get('INIT'): await pg.add_init_script(os.environ['INIT'])
        await pg.goto('http://127.0.0.1:8777/dev_base.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV0)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) { c.intro=null; } }')
        for lv, nm in want:
            await pg.evaluate('(n) => { __bw.world.setLevel(n); }', int(lv))
            try: print('rings', lv, json.dumps(await pg.evaluate('() => __bw.world.rings ? __bw.world.rings.state() : null')), flush=True)
            except Exception as e: print('rings state failed', e)
            if os.environ.get('PROBE'):
                try: print('probe', lv, json.dumps(await pg.evaluate('() => (' + os.environ['PROBE'] + ')')), flush=True)
                except Exception as e: print('probe failed', e)
            if os.environ.get('EXTRA'): await pg.evaluate('() => { ' + os.environ['EXTRA'] + ' }')
            await pg.evaluate('() => { const c=__bw.ctl; ' + VIEWS[nm] + ' }')
            if os.environ.get('NOSHOT'): await asyncio.sleep(1); continue
            await asyncio.sleep(SETTLE)
            f = f'{OUT}_L{lv}_{nm}.png'
            await pg.screenshot(path=f, timeout=240000)
            print('shot', f, T(), flush=True)
        print('LOGS', json.dumps([l for l in logs][:40]))
        await b.close()
asyncio.run(main())
