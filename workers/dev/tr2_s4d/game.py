import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# dev/tr2_s4d/game.py TAG : the REAL game (dev_s35.html, lv 30, software GL — NOT phone numbers): errors, TL state, frames + calls/tris at the S4d views.
# needs: static server on :8777 with root = dev/ (assets -> web/assets, app_s35/wall.js -> ../app_dbg.js).  env VIEWS = comma list of names, W/H = frame size, LV.
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'; LV = os.environ.get('LV', '30')
OUT = os.environ.get('OUT', '/home/claude/work/s4d_' + TAG); os.makedirs(OUT, exist_ok=True)
W = int(os.environ.get('W', 1280)); H = int(os.environ.get('H', 720))
VIEWS = {
  # hero views (close: animals / people)
  'h_past':    "c.target.set(46,0,233); c.dist=48; c.polar=1.12; c.azim=-0.4;",
  'h_stock':   "c.target.set(-21,0,298); c.dist=42; c.polar=1.12; c.azim=2.48;",
  'h_farm':    "c.target.set(244,0,-98); c.dist=40; c.polar=1.12; c.azim=-0.47;",
  'h_lumber':  "c.target.set(241,0,-233); c.dist=40; c.polar=1.12; c.azim=-0.47;",
  'h_fish':    "c.target.set(-123,0,280); c.dist=45; c.polar=1.1; c.azim=-1.75;",
  'h_yard':    "c.target.set(6,0,-22); c.dist=30; c.polar=1.15; c.azim=0.7;",
  # close-ups (the game's own camera stops at minD = 90, the owner never sees this near — PRE sets minD low): a quality check of the models themselves
  'c_past':    "c.target.set(30,0,222); c.dist=26; c.polar=1.2; c.azim=0.3;",
  'c_horse':   "c.target.set(46,0,233); c.dist=16; c.polar=1.3; c.azim=-0.4;",
  'c_yard':    "c.target.set(6,0,-22); c.dist=14; c.polar=1.25; c.azim=0.7;",
  'c_farm':    "c.target.set(244,0,-98); c.dist=22; c.polar=1.25; c.azim=-0.47;",
  'c_leap':    "const f=__bw.scene.getObjectByName('leaping-fish'); if (f) { f.visible=true; f.position.set(-128,6,230); f.rotation.set(-0.5,0.8,0); f.scale.setScalar(1.2); } c.target.set(-128,6,230); c.dist=9; c.polar=1.25; c.azim=0.3;",
  # strategic cameras
  's_top':     "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  's_ctr':     "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  's_town':    "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  's_fields':  "c.target.set(200,0,40); c.dist=150; c.polar=0.9; c.azim=0.6;",      # (the kit's old 'fields' pose put the camera behind the mountain wall: a broken frame in the kit too)
  's_past':    "c.target.set(46,0,233); c.dist=130; c.polar=0.95; c.azim=-0.4;",
  's_lake':    "c.target.set(-128,0,230); c.dist=150; c.polar=0.95; c.azim=2.2;",
}
want = os.environ.get('VIEWS', ','.join(k for k in VIEWS if not k.startswith('c_'))).split(',')
PEEK = """() => { const s = window.__tr2life || null, bw = window.__bw;
  let inst = 0, skinned = 0, meshes = 0; bw.scene.traverse((o) => { if (o.isInstancedMesh) inst++; if (o.isSkinnedMesh) skinned++; if (o.isMesh) meshes++; });
  return { tl: s ? { ok: s.ok, animals: s.animals, people: s.people, has: Object.keys(s.has).filter((k) => s.has[k]).length, err: s.err } : null, inst, skinned, meshes, programs: bw.renderer.info.programs.length, tex: bw.renderer.info.memory.textures, geo: bw.renderer.info.memory.geometries }; }"""
MEAS = """async () => { const bw = __bw, r = bw.renderer; const out = []; for (let i = 0; i < 5; i++) { r.info.autoReset = false; r.info.reset(); await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 50); }); out.push([r.info.render.calls / 3, r.info.render.triangles / 3]); r.info.autoReset = true; await new Promise((res) => setTimeout(res, 700)); }
  const med = (k) => out.map((o) => o[k]).sort((a, b) => a - b)[2]; return { calls: Math.round(med(0)), tris: Math.round(med(1)), callsAll: out.map((o) => Math.round(o[0])) }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:500])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:' + os.environ.get('PORT', '8777') + '/dev_s35.html?q=' + os.environ.get('Q', 'low') + '&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        print('ready', T(), flush=True)
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('late', T(), json.dumps(await pg.evaluate(PEEK)), flush=True)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; ' + os.environ.get('PRE', '') + ' }'); await asyncio.sleep(3)
        res = {}
        for nm in want:
            await pg.evaluate('() => { const c=__bw.ctl; ' + VIEWS[nm] + ' }')
            await asyncio.sleep(9)
            m = await pg.evaluate(MEAS); res[nm] = m
            
            if not os.environ.get('NOSHOT'): await pg.screenshot(path=f'{OUT}/{nm}.png', timeout=180000)
            print('view', nm, m, T(), flush=True)
        res['_peek'] = await pg.evaluate(PEEK); res['_logs'] = logs[:30]
        json.dump(res, open(f'{OUT}/res.json', 'w'), indent=1)
        print('PEEK', json.dumps(res['_peek'])); print('LOGS', json.dumps(logs[:12]))
        await b.close()
asyncio.run(main())
