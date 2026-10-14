import asyncio, sys
from playwright.async_api import async_playwright
# u3_game9.py TAG — the REAL game: the dark rider's ATTACK (the shadow breath), caught right after the sim's 'breath' event, at 1100x620 and 390x844.
#   A recorder on views.event waits for the first breath, then the game is stepped 0.3 s (the breath is alive) and paused for the frames; the camera is taken over (same FOCUS as u3_game5.py).
#   Shots: /home/claude/work/u3/game_<TAG>_<WxH>_darkrider_attack[_n].png
TAG = sys.argv[1] if len(sys.argv) > 1 else 'k'
ARMY = {"lich": 12, "darkrider": 2, "spear": 14, "sword": 8, "archer": 8}; VIEW = {1100: 620, 390: 844}
src = open('/home/claude/dev/u3_game5.py').read(); FOCUS = src.split('FOCUS = """')[1].split('"""')[0]
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
        tg = await pg.evaluate("""() => { const sim = __bw.battle.session.sim, us = sim.units.filter((u) => u.type === 'darkrider'); let x = 0, z = 0; for (const u of us) { x += u.x; z += u.z; } x /= us.length; z /= us.length; let best = null, bd = 1e9;
          for (const b of sim.buildings) { if (b.dead || /keep|wall|gate/.test(b.type) || !b.def) continue; const d = Math.hypot(b.x - x, b.z - z); if (d < bd) { bd = d; best = b; } } return best ? [best.x, best.z] : [-21, -20]; }""")
        await pg.evaluate("""(a) => { const s = __bw.battle.session; for (const u of s.sim.units) if (u.type === 'darkrider') { u.hp = 1e6; u.maxHp = 1e6; } window.__br = []; const o = s.views.event;
          s.views.event = (e, t) => { if (e.k === 'breath') window.__br.push([e.u, +t.toFixed(2)]); return o(e, t); }; __bw.battle.select('darkrider'); __bw.battle.send('darkrider', a[0], a[1]); __bw.pause(true); }""", tg)
        got = 0
        for i in range(120):
            await pg.evaluate("() => { __bw.battle.advance(1); }"); got = await pg.evaluate('window.__br.length')
            if got: break
        print('breath events', got, await pg.evaluate('window.__br.slice(0,4)'), flush=True)
        await pg.evaluate("() => { __bw.battle.advance(0.3); }")
        for W in (1100, 390):
            await pg.set_viewport_size({'width': W, 'height': VIEW[W]}); await pg.evaluate("() => { __bw.pause(false); }"); await asyncio.sleep(2.5); await pg.evaluate("() => { __bw.pause(true); }")
            for k, (d, pt) in enumerate(((26, 0.25), (40, 0.3))):
                r = await pg.evaluate(FOCUS, ['darkrider', d, pt, 0.6, None, True]); print('darkrider attack', W, k, r, flush=True)
                await pg.evaluate("() => { __bw.renderer.render(__bw.scene, __bw.camera); return 1; }"); await asyncio.sleep(0.5)
                await pg.screenshot(path=f'/home/claude/work/u3/game_{TAG}_{W}x{VIEW[W]}_darkrider_attack' + ('' if k == 0 else f'_{k + 1}') + '.png', timeout=240000)
        print('LOGS', logs[:8], flush=True); await b.close()
asyncio.run(main())
