import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# u4_death.py TAG : the REAL game (dev_s35.html), the gryphon squad in a real battle, game time driven by hand (battle.advance + loop paused),
#   so every frame is exact: ATTACK (strike frames of the real Atk clip) and DEATH (the real 'die' event -> bunits.kill -> Die clip + tumble) of one gryphon, wide 1100x620 + phone 390x844.
#   ARMY='{"gryphon":6,"spear":8,"archer":4}'  TYPE=gryphon  LV=23  DEATH_AT=0.1,0.3,0.6,1.0,1.6,2.6
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'
OUT = '/home/claude/work/u4d_' + TAG
ARMY = json.loads(os.environ.get('ARMY', '{"gryphon":6,"spear":8,"archer":4}'))
TYPE = os.environ.get('TYPE', 'gryphon'); LV = os.environ.get('LV', '23'); PAGE = os.environ.get('PAGE', 'dev_s35.html')
DEATH_AT = [float(x) for x in os.environ.get('DEATH_AT', '0.1,0.3,0.6,1.0,1.6,2.6').split(',')]
HELP = """(() => {
  const W = __bw, S = () => W.battle.session;
  const mine = (type) => S().sim.units.filter((u) => u.type === type && u.side === 'A');
  const vw = (u) => S().views.views.get(u.id);
  const P = (u) => { const v = vw(u), p = v.parts[0].p; return { x: p.x, y: p.y, z: p.z, yaw: v.yaw || 0, v }; };
  window.__u4 = {
    attacking: (type) => { const t = S().t, a = mine(type).filter((u) => !u.dead && vw(u) && vw(u).atkUntil > t); return a.length ? a[0].id : null; },
    nearest: (type) => { let b = null; for (const u of mine(type)) { if (u.dead || !u.target || u.target.x === undefined) continue; const d = Math.hypot(u.target.x - u.x, u.target.z - u.z); if (!b || d < b.d) b = { d, id: u.id }; } return b; },
    info: (type) => { const us = mine(type), al = us.filter((u) => !u.dead); return { t: +S().t.toFixed(2), n: us.length, alive: al.length, st: al.slice(0, 3).map((u) => [Math.round(u.hp), u.target ? (u.target.type || u.target.kind || 'T') : null, u.target && u.target.x !== undefined ? +Math.hypot(u.target.x - u.x, u.target.z - u.z).toFixed(1) : null]), tier: us[0] && us[0].tier }; },
    adv: (sec) => { W.battle.advance(sec); return +S().t.toFixed(2); },
    kill: (id) => { const s = S(), sim = s.sim, u = sim.units.find((q) => q.id === id); const gy = W.world.fastHeight(u.x, u.z); window.__u4.dp = { x: u.x, z: u.z, y: (u.air && u.y) ? u.y : gy, yaw: u.face || 0 }; u.hp = 0; u.dead = true; u.deadAt = sim.time; s.views.event({ k: 'die', id: u.id, side: u.side, type: u.type, x: u.x, z: u.z }, s.t); W.battle.advance(1 / 30); return 1; },
    cam: (id, d, up, az, asp, fov, dy) => { const u = S().sim.units.find((q) => q.id === id), c = W.camera, gy = W.world.fastHeight(u.x, u.z), vp = vw(u).parts[0].p;
      const A = window.__u4.dp && u.dead ? window.__u4.dp : { x: u.x, z: u.z, y: (u.air && u.y) ? u.y : gy, yaw: u.face || 0 };
      c.fov = fov; c.aspect = asp; c.updateProjectionMatrix(); const a = A.yaw + az; c.position.set(A.x + Math.sin(a) * d, A.y + (dy || 0) + up, A.z + Math.cos(a) * d); c.lookAt(A.x, A.y + (dy || 0), A.z); c.updateMatrixWorld(true); W.renderer.render(W.scene, W.camera);
      return { sim: [Math.round(u.x), +(u.y || 0).toFixed(1), Math.round(u.z), +(u.face || 0).toFixed(2)], view: [Math.round(vp.x), +vp.y.toFixed(1), Math.round(vp.z)], gy: +gy.toFixed(1), dead: !!vw(u).dead, st: vw(u).state }; },
    stat: () => { const r = W.renderer.info.render; return { calls: r.calls, tris: r.triangles }; }
  }; return 1; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/' + PAGE + '?q=low&w=clear&h=14&wa=0.1&lv=' + LV)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True); await asyncio.sleep(3)
        await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", ARMY)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        print('battle ready', T(), flush=True)
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(2)
        await pg.evaluate("(()=>{const s=__bw.battle.session; s.hud.el.style.display='none';})()")
        await pg.evaluate(HELP)
        await pg.evaluate("(type) => { const s = __bw.battle.session, dp = s.sim.deploy; s.sim.send(type, dp.x + dp.nx * 120, dp.z + dp.nz * 120); s.started = true; }", TYPE)
        await pg.evaluate("__bw.battle.session.cam.free = true; __bw.pause(true)")
        await asyncio.sleep(1)
        cur = {'vw': 1100, 'vh': 620}
        async def shot(name, W, H, id, d, up, az, fov=40, dy=0.0):
            if (W, H) != (cur['vw'], cur['vh']): await pg.set_viewport_size({'width': W, 'height': H}); cur['vw'], cur['vh'] = W, H; await asyncio.sleep(1.5)
            r = await pg.evaluate("(a) => __u4.cam(a[0], a[1], a[2], a[3], a[4], a[5], a[6])", [id, d, up, az, W / H, fov, dy])
            await pg.evaluate("new Promise((res) => { let n = 0; const f = () => { if (++n >= 3) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); setTimeout(res, 20000); })")
            await pg.screenshot(path=f'{OUT}_{name}.png', timeout=240000); print('shot', name, json.dumps(r), flush=True)
        async def pair(name, id, dw, dp_, az=1.2, dy=0.0):
            await shot(name + '_wide', 1100, 620, id, dw, dw * 0.28, az, 40, dy)
            await shot(name + '_phone', 390, 844, id, dp_, dp_ * 0.28, az, 40, dy)
        # 1. fly in until one gryphon is attacking (the sim is stepped by hand, 0.2 s at a time)
        actor = None
        for k in range(400):
            await pg.evaluate("__u4.adv(0.2)")
            if k % 10 == 0: print('adv', k, json.dumps(await pg.evaluate("__u4.info('%s')" % TYPE)), flush=True)
            actor = await pg.evaluate("__u4.attacking('%s')" % TYPE)
            if actor is not None: break
            if k in (12, 26):       # a mid-flight 'move' frame of a gryphon too (they cruise on the Fly clip)
                nr = await pg.evaluate("__u4.nearest('%s')" % TYPE)
                if nr: await pair('1_move_%d' % k, nr['id'], 22, 30, 1.0)
        if actor is None:
            nr = await pg.evaluate("__u4.nearest('%s')" % TYPE); actor = nr['id'] if nr else None
        print('actor', actor, json.dumps(await pg.evaluate("__u4.info('%s')" % TYPE)), flush=True)
        if actor is None: print('NO ACTOR'); await b.close(); return
        # 2. the strike: three frames 0.12 s apart
        for k, dt in enumerate([0, 0.12, 0.12]):
            if dt: await pg.evaluate("__u4.adv(%s)" % dt)
            await pair('2_atk_%d' % k, actor, 22, 30, 1.2)
        # 3. it falls: the real 'die' event, then the Die clip + tumble, frame by frame
        await pg.evaluate("__u4.kill(%d)" % actor); tprev = 0.0
        for k, at in enumerate(DEATH_AT):
            await pg.evaluate("__u4.adv(%s)" % (at - tprev)); tprev = at
            await pair('3_die_%d_%s' % (k, str(at).replace('.', 'p')), actor, 22, 30, 1.2)
        print('STAT', json.dumps(await pg.evaluate("__u4.stat()")), flush=True)
        print('LOGS', json.dumps(logs[:8]), flush=True); await b.close()
asyncio.run(main())
