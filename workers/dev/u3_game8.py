import asyncio, sys
from playwright.async_api import async_playwright
# u3_game8.py TAG — the REAL game: the lich squad MARCHING (move frames), at 1100x620 and 390x844, camera put where nothing blocks the view (same FOCUS as u3_game5.py).  Shots: /home/claude/work/u3/game_<TAG>_<WxH>_lich_move[_n].png
TAG = sys.argv[1] if len(sys.argv) > 1 else 'j'
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
        tg = await pg.evaluate("""() => { const sim = __bw.battle.session.sim, us = sim.units.filter((u) => u.type === 'lich'); let x = 0, z = 0; for (const u of us) { x += u.x; z += u.z; } x /= us.length; z /= us.length; let best = null, bd = 1e9;
          for (const b of sim.buildings) { if (b.dead || /keep|wall|gate/.test(b.type) || !b.def) continue; const d = Math.hypot(b.x - x, b.z - z); if (d < bd) { bd = d; best = b; } } return best ? [best.x, best.z] : [-21, -20]; }""")
        await pg.evaluate("(a) => { for (const u of __bw.battle.session.sim.units) if (u.type === 'lich') { u.hp = 1e6; u.maxHp = 1e6; } __bw.battle.select('lich'); __bw.battle.send('lich', a[0], a[1]); }", tg)
        await pg.evaluate("() => { __bw.pause(true); __bw.battle.advance(4); }")
        for W in (1100, 390):
            await pg.set_viewport_size({'width': W, 'height': VIEW[W]}); await asyncio.sleep(2)
            for k, adv in enumerate((0.0, 0.5)):
                if adv: await pg.evaluate("(s) => { __bw.battle.advance(s); }", adv)
                r = await pg.evaluate(FOCUS, ['lich', 30, 0.3, 0.6, None, False]); print('lich move', W, k, r, flush=True)
                await pg.evaluate("() => { __bw.renderer.render(__bw.scene, __bw.camera); return 1; }"); await asyncio.sleep(0.4)
                await pg.screenshot(path=f'/home/claude/work/u3/game_{TAG}_{W}x{VIEW[W]}_lich_move' + ('' if k == 0 else f'_{k + 1}') + '.png', timeout=240000)
        print('LOGS', logs[:8], flush=True); await b.close()
asyncio.run(main())
