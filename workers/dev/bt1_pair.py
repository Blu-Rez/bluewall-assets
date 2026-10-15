import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt1_pair.py OUTDIR LEVEL : one session at level LEVEL, home frames first, then the SAME level + SAME cameras in an attack (battle.start with a fixed target).
# env: W H Q HOUR VIEWS(json: name -> [px,py,pz,tx,ty,tz]) ; writes OUTDIR/home_<name>.png and OUTDIR/atk_<name>.png ; prints the stage visibility
CAMS = {
 'top':    [0, 230, 150, 0, 0, -10],
 'town':   [0, 60, 40, 0, 0, -10],
 'castle': [0, 38, -20, 0, 8, -62],
 'fields': [60, 40, 60, 60, 0, 20],
 'works':  [-60, 40, 60, -60, 0, 20],
}
async def wait_frames(pg, n=3):
    f0 = await pg.evaluate('__bw.frames')
    for i in range(300):
        await asyncio.sleep(0.3)
        if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
async def main():
    out = sys.argv[1]; lv = int(sys.argv[2]); os.makedirs(out, exist_ok=True)
    W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390))
    cams = json.loads(os.environ['VIEWS']) if os.environ.get('VIEWS') else CAMS
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error',) and '404' not in m.text else None)
        await pg.add_init_script("try{localStorage.setItem('bw_coach_battle','1');localStorage.setItem('bw_coach_home','1')}catch(e){}")          # (no first-hour tour card over the frames: coach.js shows it at castle level <= 3 on the first attack)
        await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q={os.environ.get('Q','low')}&w=clear&h={os.environ.get('HOUR','14')}&wa=0.1&lv={lv}")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        await pg.evaluate(f'__bw.world.setLevel({lv})'); await wait_frames(pg, 6)          # (the page clamps ?lv= to the live cap 30; the attack goes up to MAXL = 50: the home map is put at the same level the same way)
        for n, c in cams.items():
            if os.environ.get('ATK_ONLY'): break
            await pg.evaluate(f'__cam({",".join(map(str, c))})'); await wait_frames(pg, 4)
            await pg.screenshot(path=f'{out}/home_{n}.png', timeout=240000); print('home', n, flush=True)
        print('HOME levels', await pg.evaluate("JSON.stringify(__bw.world.levels && __bw.world.levels.get ? __bw.world.levels.get() : null)"))
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate(f'__bw.battle.start({tgt})')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        await pg.evaluate('__bw.battle.session.cam.free = true; __bw.battle.session.cam.intro = 0')
        for n, c in cams.items():
            await pg.evaluate(f'(()=>{{const c=__bw.camera; c.position.set({c[0] if False else ",".join(map(str,c[:3]))}); c.lookAt({",".join(map(str,c[3:]))}); c.updateMatrixWorld(true);}})()')
            await wait_frames(pg, 4)
            await pg.screenshot(path=f'{out}/atk_{n}.png', timeout=240000); print('atk', n, flush=True)
        print('ATK levels', lv, await pg.evaluate("JSON.stringify(__bw.world.levels && __bw.world.levels.get ? __bw.world.levels.get() : null)"))
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
