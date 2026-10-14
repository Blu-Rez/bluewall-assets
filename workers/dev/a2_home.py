import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# p38_home.py TAG [LV] : home map shots of the real game (dev_s35.html?lv=LV). VIEWS env = comma list of names from VIEWS below.
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/a2_' + TAG
W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 620))
VIEWS = {
  'home':   "c.target.set(49.5,0,51.5); c.dist=257.6; c.azim=1.191;",
  'a2_top': "c.target.set(0,0,-250); c.dist=c.maxD*0.85; c.polar=0.30; c.azim=0.0;",
  'a2_w': "c.target.set(-115,0,-290); c.dist=190; c.polar=0.95; c.azim=3.0;",
  'a2_e': "c.target.set(30,0,-280); c.dist=200; c.polar=0.95; c.azim=3.3;",
  'a2_head_w': "c.target.set(-158,0,-420); c.dist=110; c.polar=1.1; c.azim=3.0;",
  'a2_head_e': "c.target.set(-93,0,-435); c.dist=110; c.polar=1.1; c.azim=3.2;",
  'a2_bridge_w': "c.target.set(-101,0,-200); c.dist=60; c.polar=0.9; c.azim=2.9;",
  'a2_mouth_w': "c.target.set(-62,0,-170); c.dist=80; c.polar=0.9; c.azim=3.0;",
  'a2_mouth_e': "c.target.set(100,0,-145); c.dist=80; c.polar=0.9; c.azim=3.3;",
  'falls_old': "c.target.set(262,0,-190); c.dist=170; c.polar=1.0; c.azim=-1.15;",
  'rtop':   "c.target.set(0,0,-20); c.dist=c.maxD*0.95; c.polar=0.35; c.azim=0.0;",
  'rnorth': "c.target.set(0,0,-105); c.dist=130; c.polar=0.95; c.azim=3.14;",
  'rgateNE':"c.target.set(128,0,-84); c.dist=85; c.polar=0.95; c.azim=2.3;",
  'rgateW': "c.target.set(-134,0,86); c.dist=85; c.polar=0.95; c.azim=-0.9;",
  'rbridge':"c.target.set(-94,0,-58); c.dist=70; c.polar=0.9; c.azim=0.3;",
  'rlake':  "c.target.set(-148,0,150); c.dist=120; c.polar=0.95; c.azim=-0.4;",
  'top':    "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'ctr':    "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  'town':   "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'fields': "c.target.set(235,0,10); c.dist=150; c.polar=0.9; c.azim=1.2;",
  'lake':   "c.target.set(-128,0,230); c.dist=150; c.polar=0.95; c.azim=2.2;",
  'mines':  "c.target.set(-120,0,-230); c.dist=170; c.polar=0.95; c.azim=3.6;",
  'ws_lumber1': "c.target.set(241,0,-233); c.dist=85; c.polar=0.95; c.azim=-0.47;",
  'ws_lumber2': "c.target.set(-253,0,228); c.dist=85; c.polar=0.95; c.azim=2.49;",
  'ws_oil': "c.target.set(-311,0,-126); c.dist=95; c.polar=0.95; c.azim=1.51;",
  'ws_quarry': "c.target.set(38,0,-357); c.dist=85; c.polar=0.95; c.azim=1.34;",
  'ws_iron': "c.target.set(249,0,258); c.dist=85; c.polar=0.95; c.azim=-1.51;",
  'ws_gold': "c.target.set(354,0,-62); c.dist=85; c.polar=0.95; c.azim=-1.10;",
  'ws_farm': "c.target.set(244,0,-98); c.dist=85; c.polar=0.95; c.azim=-0.47;",
  'ws_greenhouse': "c.target.set(133,0,184); c.dist=85; c.polar=0.95; c.azim=2.11;",
  'ws_livestock': "c.target.set(-21,0,298); c.dist=85; c.polar=0.95; c.azim=2.48;",
  'ws_slaughter': "c.target.set(-76,0,264); c.dist=85; c.polar=0.95; c.azim=-1.87;",
  'ws_fishery_lake': "c.target.set(-123,0,280); c.dist=95; c.polar=0.95; c.azim=-1.75;",
  'ws_fishery_river': "c.target.set(189,0,-169); c.dist=95; c.polar=0.95; c.azim=1.24;",
  'def_e1': "c.target.set(185,0,75); c.dist=110; c.polar=0.9; c.azim=1.6;",
  'def_e2': "c.target.set(170,0,100); c.dist=60; c.polar=1.0; c.azim=2.0;",
  'def_w1': "c.target.set(-170,0,-95); c.dist=110; c.polar=0.9; c.azim=-1.4;",
  'def_e3': "c.target.set(183,0,92); c.dist=48; c.polar=1.05; c.azim=2.4;",
  'past':   "c.target.set(46,0,233); c.dist=130; c.polar=0.95; c.azim=-0.4;",
}
want = os.environ.get('VIEWS', 'top,ctr,town,fields,lake').split(',')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if (m.type in ('error', 'warning') and '404' not in m.text) or m.text.startswith('[late]') else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        for i in range(900):
            if os.environ.get('SKIPINTRO') or await pg.evaluate('!__bw.ctl.intro'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) { c.intro=null; } }')
        for nm in want:
            js = VIEWS[nm]
            await pg.evaluate('() => { const c=__bw.ctl; ' + js + ' }')
            await asyncio.sleep(8)
            await pg.screenshot(path=f'{OUT}_{nm}.png', timeout=240000)
            print('shot', nm, T(), flush=True)
        print('LOGS', json.dumps([l for l in logs if 'job' in l or 'built' in l or 'watchdog' in l][:60]))
        await b.close()
asyncio.run(main())
