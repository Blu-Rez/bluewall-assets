import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# u4_battle.py TAG : the REAL game (dev_s35.html, lv 30), a real battle with our new flyers in squad rings: idle -> move -> attack -> death, wide + phone shots.
#   ARMY='{"gryphon":6,"spear":12}'  TYPES=gryphon,gryphonknight (the units to follow with the camera)  PAGE=dev_s35.html  FRAMES=14  GAP=3
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'
OUT = '/home/claude/work/u4b_' + TAG
ARMY = json.loads(os.environ.get('ARMY', '{"gryphon":6,"spear":10,"archer":6}'))
TYPES = os.environ.get('TYPES', 'gryphon').split(',')
LV = os.environ.get('LV', '30'); PAGE = os.environ.get('PAGE', 'dev_s35.html'); FRAMES = int(os.environ.get('FRAMES', 14)); GAP = float(os.environ.get('GAP', 3))
FOLLOW = """(types) => { const s = __bw.battle.session, us = s.sim.units.filter((u) => types.includes(u.type) && u.side === 'A'); const al = us.filter((u) => !u.dead);
  const L = al.length ? al : us; if (!L.length) return null; let x = 0, z = 0; for (const u of L) { x += u.x; z += u.z; } x /= L.length; z /= L.length;
  s.cam.tx = x; s.cam.tz = z; return { n: us.length, alive: al.length, x, z, st: L.slice(0, 4).map((u) => [u.type, Math.round(u.hp), !!u.active, u.target ? u.target.type || u.target.kind || 'T' : null]) }; }"""
STAT = "() => { const r = __bw.renderer.info.render; const s = __bw.battle.session; return { calls: r.calls, tris: r.triangles, t: +s.sim.time.toFixed(1), ring: ['gryphon','gryphonknight'].map((t) => { const i = s.rings.info(t); return i ? [t, +i.cx.toFixed(1), +i.cz.toFixed(1), +i.r.toFixed(1)] : null; }) }; }"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
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
        await asyncio.sleep(3)
        await pg.evaluate("(()=>{const s=__bw.battle.session; s.hud.el.style.display='none';})()")
        shots = []
        async def shot(name, W=None, H=None):
            if W: await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(2)
            f0 = await pg.evaluate('__bw.frames')
            for i in range(200):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'__bw.frames >= {f0} + 2'): break
            await pg.screenshot(path=f'{OUT}_{name}.png', timeout=240000); st = await pg.evaluate(STAT); print('shot', name, json.dumps(st), flush=True); shots.append(name)
        cam = lambda d, pt, az=None: pg.evaluate("(a)=>{const c=__bw.battle.session.cam; c.dist=a[0]; c.pitch=a[1]; if (a[2] != null) c.az=a[2];}", [d, pt, az])
        # 1. idle (standing in the ring, before any order)
        f = await pg.evaluate(FOLLOW, TYPES); print('follow', json.dumps(f), flush=True)
        await cam(48, 0.62); await asyncio.sleep(4); await pg.evaluate(FOLLOW, TYPES); await shot('1_idle_wide')
        await shot('1_idle_phone', 390, 844); await pg.set_viewport_size({'width': 1100, 'height': 620})
        # 2. send them in; the sim is stepped by hand (the real-time loop gives ~0.1 s of fight per second in software GL)
        await pg.evaluate("(types) => { const s = __bw.battle.session, dp = s.sim.deploy; for (const t of types) s.sim.send(t, dp.x + dp.nx * 120, dp.z + dp.nz * 120); s.started = true; }", TYPES)
        INFO = """(types) => { const s = __bw.battle.session, sim = s.sim, us = sim.units.filter((u) => types.includes(u.type) && u.side === 'A'), al = us.filter((u) => !u.dead);
          let best = null; for (const u of al) if (u.target && u.target.x !== undefined) { const d = Math.hypot(u.target.x - u.x, u.target.z - u.z); if (!best || d < best.d) best = { d, x: u.x, z: u.z, f: u.face }; }
          const dd = us.find((u) => u.dead);
          return { t: +sim.time.toFixed(1), n: us.length, alive: al.length, dead: us.length - al.length, md: best ? +best.d.toFixed(1) : null, near: best ? [best.x, best.z, best.f] : null, dpos: dd ? [dd.x, dd.z, dd.face] : null, tier: us[0] ? us[0].tier : null }; }"""
        STEP = "(a) => { const sim = __bw.battle.session.sim, n = Math.max(1, Math.round(a * 30)); for (let i = 0; i < n && !sim.over; i++) sim.step(1 / 30); return +sim.time.toFixed(1); }"
        AIM = "(a) => { const c = __bw.battle.session.cam; c.tx = a[0]; c.tz = a[1]; c.dist = a[2]; c.pitch = a[3]; if (a[4] !== null && a[4] !== undefined) c.az = a[4] + 1.5708; }"
        async def aim(info, key, d, pt):
            p = info.get(key)
            if p: await pg.evaluate(AIM, [p[0], p[1], d, pt, p[2]])
            else: await pg.evaluate(FOLLOW, TYPES); await cam(d, pt)
        k = 0; phase = 'move'; fight_n = 0; death_n = 0
        while k < FRAMES:
            info = await pg.evaluate(INFO, TYPES)
            if info['dead'] and phase != 'death': phase = 'death'
            elif phase == 'move' and info['md'] is not None and info['md'] <= 25: phase = 'close'
            elif phase == 'close' and info['md'] is not None and info['md'] <= 7: phase = 'fight'
            adv = {'move': 3.0, 'close': 0.4, 'fight': 0.12, 'death': 0.0}[phase]
            if adv: await pg.evaluate(STEP, adv)
            info = await pg.evaluate(INFO, TYPES)
            if phase == 'move': await pg.evaluate(FOLLOW, TYPES); await cam(70, 1.0)
            elif phase in ('close', 'fight'): await aim(info, 'near', 26, 1.2)
            else: await aim(info, 'dpos', 20, 1.2)
            tag = f'{k:02d}_{phase}'; await shot('2_' + tag); print('f', k, phase, json.dumps(info), flush=True); k += 1
            if phase == 'fight':
                fight_n += 1
                if fight_n == 2: await shot('3_fight_phone', 390, 844); await pg.set_viewport_size({'width': 1100, 'height': 620})
                if fight_n == 3:      # now the nearest two fall (death frames): weakened in the middle of the fight, the defences finish them
                    await pg.evaluate("(types) => { const us = __bw.battle.session.sim.units.filter((u) => types.includes(u.type) && u.side === 'A' && !u.dead && u.target && u.target.x !== undefined); us.sort((a, b) => Math.hypot(a.target.x - a.x, a.target.z - a.z) - Math.hypot(b.target.x - b.x, b.target.z - b.z)); us.slice(0, 2).forEach((u) => { u.hp = 1; }); }", TYPES)
            if phase == 'death':
                death_n += 1
                if death_n == 2: await shot('4_death_phone', 390, 844); await pg.set_viewport_size({'width': 1100, 'height': 620})
                if death_n >= 5: break
            if phase == 'fight' and fight_n >= 4 and not info['dead']:
                # keep stepping until the weakened ones fall
                pass
        print('LOGS', json.dumps(logs[:8]), flush=True); await b.close()
asyncio.run(main())
