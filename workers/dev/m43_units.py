import asyncio, sys, os, json
from playwright.async_api import async_playwright
# m43_units.py TAG [QUALITY] — MERGE-4 proof run: ONE real battle on the merged tree (dev_s35.html = app_dbg.js) with every new unit kind of U1-U5 in the army.
#   phone 390x844 + wide 1100x620; per unit: close (idle in the ring) / move / attack / death.  Camera, KILL and STATE helpers are the ones U3 used (dev/u3_game5.py, u3_game7.py): the camera is taken over and placed where nothing blocks it;
#   a death is the real 'die' event handed to views.event with the loop paused.  Test run only: the new kinds get a huge hp so they live until their frame.   Shots: /home/claude/work/m43/<TAG>_<W>x<H>_<unit>_<phase>.png
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'; Q = sys.argv[2] if len(sys.argv) > 2 else 'low'
ARMY = json.loads(os.environ.get('ARMY', '{"legionary": 8, "captain": 1, "ogre": 3, "treant": 3, "lich": 4, "darkrider": 1, "gryphon": 3, "baby3": 2, "dragon3": 1, "spear": 8, "archer": 6}'))
UNITS = [u for u in os.environ.get('UNITS', 'legionary,captain,ogre,treant,lich,darkrider,gryphon,baby3,dragon3').split(',') if u in ARMY]
VIEW = {390: 844, 1100: 620}
CAMD = {'legionary': (16, 0.35), 'captain': (14, 0.3), 'ogre': (24, 0.3), 'treant': (28, 0.3), 'lich': (22, 0.3), 'darkrider': (30, 0.22), 'gryphon': (26, 0.25), 'baby3': (28, 0.25), 'dragon3': (34, 0.22)}
src = open('/home/claude/dev/u3_game5.py').read(); FOCUS = src.split('FOCUS = """')[1].split('"""')[0]; STATE = src.split('STATE = """')[1].split('"""')[0]
KILL = """(a) => { const s = __bw.battle.session, us = s.sim.units.filter((u) => u.type === a[0] && !u.dead); const pick = us.slice(0, Math.max(1, Math.min(a[1], us.length))); const ids = pick.map((u) => u.id);
  for (const u of pick) { u.hp = 0; u.dead = true; u.deadAt = s.sim.time; s.views.event({ k: 'die', id: u.id, side: u.side, type: u.type, x: u.x, z: u.z }, s.t); } return ids; }"""
RENDER = "() => { __bw.renderer.render(__bw.scene, __bw.camera); return 1; }"
OUT = '/home/claude/work/m43'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:240]) if m.type in ('error', 'warning') else None)
        await pg.goto(f'http://127.0.0.1:8777/dev_s35.html?q={Q}&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3); print('late ready', flush=True)
        await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", ARMY)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        print('kinds', await pg.evaluate("(() => { const k = __bw.battle.session.views.kinds; return k ? (k instanceof Map ? [...k.keys()] : Object.keys(k)) : null; })()"), flush=True)
        print('counts', await pg.evaluate("(a) => { const o = {}; for (const u of __bw.battle.session.sim.units) if (u.side === 'A') o[u.type] = (o[u.type] || 0) + 1; return o; }", UNITS), flush=True)
        await pg.evaluate("(()=>{__bw.battle.session.hud.el.style.display='none';})()")
        async def view(W): await pg.set_viewport_size({'width': W, 'height': VIEW[W]}); await asyncio.sleep(2)
        async def shot(W, unit, phase, az=None, ids=None, eng=False, wait=0.5, suffix=''):
            d, pt = CAMD[unit]; r = await pg.evaluate(FOCUS, [unit, d, pt, az, ids, eng]); print(unit, phase, W, r, flush=True)
            await pg.evaluate(RENDER); await asyncio.sleep(wait)
            await pg.screenshot(path=f'{OUT}/{TAG}_{W}x{VIEW[W]}_{unit}_{phase}{suffix}.png', timeout=240000)
        # 1. idle in the ring, both views
        for W in (390, 1100):
            await view(W)
            for u in UNITS: await shot(W, u, 'idle', wait=0.8)
        # 2. everybody goes for the nearest enemy defence; move + attack frames
        tg = await pg.evaluate("""(a) => { const sim = __bw.battle.session.sim, out = {}; for (const t of a) { const us = sim.units.filter((u) => u.type === t && u.side === 'A'); if (!us.length) continue; let x = 0, z = 0; for (const u of us) { x += u.x; z += u.z; } x /= us.length; z /= us.length;
          let best = null, bd = 1e9; for (const b of sim.buildings) { if (b.dead || /keep|wall|gate/.test(b.type) || !b.def) continue; const d = Math.hypot(b.x - x, b.z - z); if (d < bd) { bd = d; best = b; } } out[t] = best ? { x: best.x, z: best.z, type: best.type, d: bd } : null; } return out; }""", UNITS); print('targets', json.dumps(tg), flush=True)
        await pg.evaluate("(a) => { for (const u of __bw.battle.session.sim.units) if (a.includes(u.type) && u.side === 'A') { u.hp = 1e6; u.maxHp = 1e6; } }", UNITS)
        for u in UNITS:
            t = tg.get(u); kx, kz = (t['x'], t['z']) if t else (-21, -20)
            await pg.evaluate("(a) => { __bw.battle.select(a[0]); __bw.battle.send(a[0], a[1], a[2]); }", [u, kx, kz])
        moved = set(); att = set()
        await view(1100)
        for step in range(90):
            await pg.evaluate("() => { __bw.battle.advance(2); }"); st = await pg.evaluate(STATE, UNITS)
            if step % 4 == 0: print('step', step, {k: (v and (v['n'], v['eng'])) for k, v in st.items()}, flush=True)
            if step == 1:
                for u in UNITS:
                    if st.get(u): await shot(1100, u, 'move', wait=0.3); moved.add(u)
            for u in UNITS:
                s = st.get(u)
                if u in att or not s or s['eng'] < min(2, s['n']) or step < 2: continue
                att.add(u); await pg.evaluate("() => { __bw.battle.advance(0.8); }")
                for W in (1100, 390):
                    await view(W)
                    for k in range(2): await shot(W, u, 'attack', eng=True, wait=0.3, suffix='' if k == 0 else f'_{k + 1}')
                await view(1100)
            if set(UNITS) <= att: break
        print('moved', sorted(moved), 'attacked', sorted(att), 'never engaged', sorted(set(UNITS) - att), flush=True)
        # 3. death (loop paused, the real die event)
        for W in (390, 1100):
            await view(W)
            for u in UNITS:
                await pg.evaluate("() => { __bw.pause(true); }")
                ids = await pg.evaluate(KILL, [u, 1 if u in ('captain', 'darkrider', 'dragon3') else 2])
                for k, adv in enumerate((0.4, 1.2)):
                    await pg.evaluate("(s) => { __bw.battle.advance(s); }", adv)
                    await shot(W, u, 'death', ids=ids, wait=0.15, suffix=f'_{k + 1}')
                await pg.evaluate("() => { __bw.pause(false); }"); await asyncio.sleep(0.5)
        print('LOGS', json.dumps(logs[:25]), flush=True); await b.close()
asyncio.run(main())
