import asyncio, sys, os, json
from playwright.async_api import async_playwright
# u3_game6.py TAG (the lich attack and the deaths only, from farther away: u3_game5.py put the camera among the squad's own units)   — the REAL game, a real battle: close-ups, attack on an enemy defence and death of part of a squad, the camera taken over by the script and placed where NOTHING stands between it and the squad
#   (it tries a ring of azimuths / distances / heights and keeps the first line of sight that no tree, wall or building blocks).   Shots: /home/claude/work/u3/game_<TAG>_<WxH>_<unit>_<phase>[_n].png
#   Test run only: the two kinds get a huge hp so they live until their frame; the death is an injected sim 'die' event.
TAG = sys.argv[1] if len(sys.argv) > 1 else 'h'
ARMY = {"lich": 12, "darkrider": 2, "spear": 14, "sword": 8, "archer": 8}; UNITS = ['lich', 'darkrider']
VIEW = {390: 844, 1100: 620}
CAM = {'lich': {'close': (26, 0.28), 'attack': (46, 0.3), 'attack2': (62, 0.3), 'death': (36, 0.3), 'death2': (50, 0.3)}, 'darkrider': {'close': (30, 0.22), 'attack': (30, 0.22), 'death': (40, 0.25), 'death2': (56, 0.25)}}
FOCUS = """(a) => { const W = __bw, T = W.THREE, s = W.battle.session, sim = s.sim; let us = sim.units.filter((u) => u.type === a[0] && (a[4] ? a[4].includes(u.id) : !u.dead)); if (a[5]) { const e = us.filter((u) => u.target && !u.target.dead); if (e.length) us = e; }
  if (!us.length) return null; let x = 0, z = 0, f = 0, y = 0; for (const u of us) { x += u.x; z += u.z; f += u.face || 0; y += u.air ? (u.y || 0) : 0; } x /= us.length; z /= us.length; f /= us.length; y /= us.length;
  const c = s.cam; c.intro = 0; c.free = true; const gy = W.world.fastHeight(x, z), ty = Math.max(gy, y) + (a[6] || 1.2), tgt = new T.Vector3(x, ty, z), ray = new T.Raycaster(), units = s.views.group; ray.camera = W.camera;
  const blocked = (p) => { const d = p.clone().sub(tgt); const len = d.length(); ray.set(tgt, d.normalize()); ray.near = 1; ray.far = len; let first = len, hits = []; try { hits = ray.intersectObjects(W.scene.children, true); } catch (e) { hits = []; } for (const h of hits) { let o = h.object, skip = !o.visible; for (let q = o; q && !skip; q = q.parent) if (q === units || q.isSprite) skip = true; if (!skip && h.distance < first) first = h.distance; } return first; };
  let best = null, bd = -1; const E = [a[2], a[2] + 0.18, a[2] + 0.4], D = [a[1], a[1] * 1.35, a[1] * 1.8];
  search: for (const d of D) for (const e of E) for (const o of [0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.4, -2.4, 3.1]) { const az = f + o, cp = Math.cos(e), sp = Math.sin(e), p = new T.Vector3(x + Math.sin(az) * cp * d, ty + sp * d, z + Math.cos(az) * cp * d); const gh = W.world.fastHeight(p.x, p.z); if (p.y < gh + 2) continue; const first = blocked(p) / d; if (first > bd) { bd = first; best = { p, az, d, e }; } if (first >= 0.99) break search; }
  if (!best) return null; W.camera.position.copy(best.p); W.camera.lookAt(tgt); W.camera.updateMatrixWorld(true);
  return { n: us.length, x: +x.toFixed(1), z: +z.toFixed(1), clear: +bd.toFixed(2), az: +best.az.toFixed(2), d: +best.d.toFixed(0), e: +best.e.toFixed(2) }; }"""
STATE = """(a) => { const sim = __bw.battle.session.sim, out = {}; for (const t of a) { const us = sim.units.filter((u) => u.type === t && !u.dead); if (!us.length) { out[t] = null; continue; }
  const eng = us.filter((u) => u.target && !u.target.dead && Math.hypot(u.x - u.target.x, u.z - u.target.z) <= (u.rng || 30) + 3); let x = 0, z = 0; for (const u of us) { x += u.x; z += u.z; } out[t] = { n: us.length, eng: eng.length, x: x / us.length, z: z / us.length, t: sim.time }; } return out; }"""
KILL = """(a) => { const s = __bw.battle.session, us = s.sim.units.filter((u) => u.type === a[0] && !u.dead); const eng = us.filter((u) => u.target && !u.target.dead); const pick = (eng.length ? eng : us).slice(0, Math.max(1, Math.min(a[1], us.length - 1))); const ids = pick.map((u) => u.id);
  for (const u of pick) { u.hp = 0; u.dead = true; u.deadAt = s.sim.time; s.sim.events.push({ k: 'die', id: u.id, side: u.side, type: u.type, x: u.x, z: u.z }); } __bw.battle.advance(0.3); return ids; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1); logs = []
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
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
        await pg.evaluate("(()=>{__bw.battle.session.hud.el.style.display='none';})()")
        async def shot(W, unit, phase, az=None, ids=None, eng=False, wait=0.5, suffix=''):
            d, pt = CAM[unit][phase]; r = await pg.evaluate(FOCUS, [unit, d, pt, az, ids, eng]); print(unit, phase, W, r, flush=True)
            await asyncio.sleep(wait); await pg.screenshot(path=f'/home/claude/work/u3/game_{TAG}_{W}x{VIEW[W]}_{unit}_{phase}{suffix}.png', timeout=240000)
        async def view(W): await pg.set_viewport_size({'width': W, 'height': VIEW[W]}); await asyncio.sleep(2)
        tg = await pg.evaluate("""(a) => { const sim = __bw.battle.session.sim, out = {}; for (const t of a) { const us = sim.units.filter((u) => u.type === t); let x = 0, z = 0; for (const u of us) { x += u.x; z += u.z; } x /= us.length; z /= us.length;
          let best = null, bd = 1e9; for (const b of sim.buildings) { if (b.dead || /keep|wall|gate/.test(b.type) || !b.def) continue; const d = Math.hypot(b.x - x, b.z - z); if (d < bd) { bd = d; best = b; } } out[t] = best ? { x: best.x, z: best.z, type: best.type, d: bd } : null; } return out; }""", UNITS); print('targets', tg, flush=True)
        await pg.evaluate("(a) => { for (const u of __bw.battle.session.sim.units) if (a.includes(u.type)) { u.hp = 1e6; u.maxHp = 1e6; } }", UNITS)
        for u in UNITS:
            t = tg[u]; kx, kz = (t['x'], t['z']) if t else (-21, -20)
            await pg.evaluate("(a) => { __bw.battle.select(a[0]); __bw.battle.send(a[0], a[1], a[2]); }", [u, kx, kz])
        done = set()
        for step in range(70):
            await pg.evaluate("() => { __bw.battle.advance(2); }"); st = await pg.evaluate(STATE, UNITS); L, D = st.get('lich'), st.get('darkrider')
            if step % 3 == 0: print('step', step, 'lich', L and (L['n'], L['eng'], round(L['x']), round(L['z'])), 'dr', D and (D['n'], D['eng']), flush=True)
            if 'li_att' not in done and L and L['eng'] >= 3:
                done.add('li_att'); await pg.evaluate("() => { __bw.battle.advance(0.8); }")
                for W in (1100, 390):
                    await view(W)
                    for ph in ('attack', 'attack2'):
                        for k in range(1): await shot(W, 'lich', ph, eng=True, wait=0.3, suffix='' if k == 0 else f'_{k + 1}')
            if 'li_att' in done: break
        print('done', sorted(done), flush=True)
        for u, n in (('lich', 3), ('darkrider', 1)):
            for W in (1100, 390):
                await view(W); ids = await pg.evaluate(KILL, [u, n])
                for ph in ('death', 'death2'):
                    for k in range(1): await shot(W, u, ph, ids=ids, wait=0.15, suffix='' if k == 0 else f'_{k + 1}')
        print('LOGS', logs[:8], flush=True); await b.close()
asyncio.run(main())
