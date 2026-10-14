import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# dev/tr2_s4d/close.py : close-up frames INSIDE the real game — the camera is aimed at real S4d objects found in the scene (horse / cow / sheep / hen / villager / leaping fish).
# The game's own camera stops at minD = 90 (the owner never sees this near); here minD / tilt are overridden.  Needs the static server on :8777 (root dev/).
W = int(os.environ.get('W', 1280)); H = int(os.environ.get('H', 720)); OUT = os.environ.get('OUT', '/home/claude/work/s4d_close2'); os.makedirs(OUT, exist_ok=True)
FIND = """(spec) => { const T = __bw.THREE, v = new T.Vector3(), m = new T.Matrix4(); let r = null;
  __bw.scene.traverse((o) => { if (r) return; const [kind, name] = spec;
    if (kind === 'inst' && o.isInstancedMesh && o.name === name && o.count > 0 && o.visible) { for (let i = 0; i < o.count && !r; i++) { o.getMatrixAt(i, m); v.setFromMatrixPosition(m); o.localToWorld(v); if (Math.abs(v.y) < 400 && Math.hypot(v.x, v.z) < 290) r = [v.x, v.y, v.z]; } }
    if (kind === 'skin' && o.isSkinnedMesh && o.skeleton.bones.length >= 70) { o.getWorldPosition(v); if (Math.hypot(v.x, v.z) < 290) r = [v.x, v.y, v.z]; }
    if (kind === 'name' && o.name === name) { r = 'x'; } });
  if (!r && spec[0] === 'boat') { const w = __bw.world.ctx.wsLife, b = w && w.boats.find((q) => q.man); if (b) r = [b.man.x, b.man.y, b.man.z]; }
  if (!r && spec[0] === 'tip') { const w = __bw.world.ctx.wsLife, a = w && w.agents.find((q) => q.fixed && q.p.y < -1); if (a) r = [a.p.x, a.p.y, a.p.z]; }
  return r; }"""
WS = """() => { const w = __bw.world.ctx.wsLife; if (!w) return null; const fx = w.agents.filter((a) => a.fixed).map((a) => +a.p.y.toFixed(2)), bm = w.boats.filter((b) => b.man).map((b) => +b.man.y.toFixed(2)), bl = w.boats.map((b) => [+b.x.toFixed(1), +b.z.toFixed(1)]);
  return { agents: w.agents.length, fixedFishers: fx, boatMen: bm, boats: bl.slice(0, 4), animals: w.animals.length, carts: w.carts.length, lakeLevelFromBoat: w.boats.length ? +(w.boats[0].man ? w.boats[0].man.y - 0.43 : 0).toFixed(2) : null }; }"""
SHOTS = [   # name, spec, where to look first (x, z: the animals are only in the instance list while the camera sees them), dist, azim
  ('horse_white', ['inst', 'tr2:animal_horse_white'], (46, 233), 7, 0.9), ('horse_bay', ['inst', 'tr2:animal_horse_brown'], (46, 233), 7, 2.4), ('horse_black', ['inst', 'tr2:animal_horse_black'], (46, 233), 7, 4.0),
  ('cow', ['inst', 'tr2:animal_cow'], (46, 233), 6, 0.6), ('sheep', ['inst', 'tr2:animal_sheep'], (-21, 290), 5, 0.9), ('pig', ['inst', 'tr2:animal_pig'], (-21, 290), 5, 2.2),
  ('hen', ['inst', 'tr2dyn:poultry_fish_pack/hen'], (244, -98), 4, 0.5), ('villager', ['skin', ''], (14, -4), 6, 0.8),
  ('boatman', ['boat'], (-160, 240), 7, 0.8), ('tipfisher', ['tip'], (-160, 240), 7, 2.0),
]
if os.environ.get('ONLYLEAP'): SHOTS = []
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:' + os.environ.get('PORT', '8777') + '/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('late', T(), flush=True)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; c.minD=3; c.pNear=1.28; c.pFar=1.28; }'); await asyncio.sleep(3)
        print('WS', json.dumps(await pg.evaluate(WS)), flush=True)
        for nm, spec, where, dist, az in SHOTS:
            await pg.evaluate(f'() => {{ const c=__bw.ctl; c.target.set({where[0]},0,{where[1]}); c.dist=90; }}'); await asyncio.sleep(6)
            pos = await pg.evaluate(FIND, spec); print('find', nm, pos, flush=True)
            if not pos or pos == 'x': continue
            await pg.evaluate(f'() => {{ const c=__bw.ctl; c.target.set({pos[0]},0,{pos[2]}); c.dist={dist}; c.azim={az}; }}')
            await asyncio.sleep(4)
            await pg.screenshot(path=f'{OUT}/{nm}.png', timeout=180000); print('shot', nm, T(), flush=True)
        # the leaping carp (water_life.js): placed in front of the camera by hand (the real leap is a 0.85 s event every ~20 s)
        await pg.evaluate("() => { const c=__bw.ctl; c.target.set(-128,0,230); c.dist=8; c.azim=0.3; }"); await asyncio.sleep(5)
        ok = await pg.evaluate("() => { const f = __bw.scene.getObjectByName('leaping-fish'); if (!f) return null; f.visible = true; f.position.set(-128, 3.2, 230); f.rotation.set(-0.5, 0.8, 0); f.scale.setScalar(1.2); let meshes = 0; f.traverse((o) => { if (o.isMesh) meshes++; }); return { type: f.type, meshes, tr2: !!f.getObjectByProperty('name', '') }; }")
        print('leapfish', ok, flush=True)
        if ok: await asyncio.sleep(3); await pg.screenshot(path=f'{OUT}/leap.png', timeout=180000); print('shot leap', T(), flush=True)
        print('LOGS', json.dumps(logs[:10]))
        await b.close()
asyncio.run(main())
