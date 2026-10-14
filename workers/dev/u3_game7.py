import asyncio, sys, os, json
from playwright.async_api import async_playwright
# u3_game7.py TAG — the REAL game, a real battle: the DEATH frames, done the way the game does it.  The loop is paused, victims are marked dead in the sim and the views get the very same 'die' event handleEvents() passes on (views.event),
#   then the game is stepped (advance) and one frame is rendered at +0.3 s, +0.9 s and +2.1 s after the blow.  (sim.step() clears sim.events, so an event pushed from outside never reaches the views: u3_game3..6 had no death animation.)
#   The camera is taken over and put where nothing blocks the view.   Shots: /home/claude/work/u3/game_<TAG>_<WxH>_<unit>_death_<n>.png
TAG = sys.argv[1] if len(sys.argv) > 1 else 'i'
ARMY = {"lich": 12, "darkrider": 2, "spear": 14, "sword": 8, "archer": 8}; UNITS = [('lich', 3, (26, 0.28)), ('darkrider', 1, (34, 0.22))]
VIEW = {390: 844, 1100: 620}
src = open('/home/claude/dev/u3_game5.py').read(); FOCUS = src.split('FOCUS = """')[1].split('"""')[0]
KILL = """(a) => { const s = __bw.battle.session, us = s.sim.units.filter((u) => u.type === a[0] && !u.dead); const pick = us.slice(0, Math.max(1, Math.min(a[1], us.length))); const ids = pick.map((u) => u.id);
  for (const u of pick) { u.hp = 0; u.dead = true; u.deadAt = s.sim.time; s.views.event({ k: 'die', id: u.id, side: u.side, type: u.type, x: u.x, z: u.z }, s.t); } return ids; }"""
RENDER = "() => { __bw.renderer.render(__bw.scene, __bw.camera); return 1; }"
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
        for W in (1100, 390):
            await pg.set_viewport_size({'width': W, 'height': VIEW[W]}); await asyncio.sleep(2)
            for u, n, (d, pt) in UNITS:
                await pg.evaluate("() => { __bw.pause(true); }")
                ids = await pg.evaluate(KILL, [u, n]); print('killed', u, W, ids, flush=True)
                for k, adv in enumerate((0.3, 0.6, 1.2)):
                    await pg.evaluate("(s) => { __bw.battle.advance(s); }", adv)
                    r = await pg.evaluate(FOCUS, [u, d, pt, 0.6, ids, False]); print(u, 'death', k, W, r, flush=True)
                    await pg.evaluate(RENDER); await asyncio.sleep(0.3)
                    await pg.screenshot(path=f'/home/claude/work/u3/game_{TAG}_{W}x{VIEW[W]}_{u}_death_{k + 1}.png', timeout=240000)
                await pg.evaluate("() => { __bw.pause(false); }"); await asyncio.sleep(1)
        print('LOGS', logs[:8], flush=True); await b.close()
asyncio.run(main())
