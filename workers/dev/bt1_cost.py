import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt1_cost.py LEVEL : draw calls / triangles / shader programs, same fixed camera: home, attack BEFORE the fix (the kept groups hidden again at run time), attack AFTER.
KEEP = ['late:townplan', 'late:cabbage', 'late:corn', 'late:pumpkin', 'late:haybale']
async def settle(pg, n=6):
    f0 = await pg.evaluate('__bw.frames')
    for i in range(300):
        await asyncio.sleep(0.3)
        if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
async def info(pg):
    return json.loads(await pg.evaluate("JSON.stringify({calls: __bw.renderer.info.render.calls, tris: __bw.renderer.info.render.triangles, programs: __bw.renderer.info.programs.length})"))
async def main():
    lv = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    cams = {'far': [0, 230, 150, 0, 0, -10], 'near': [20, 55, 125, 45, 0, 55]}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv={lv}")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        res = {}
        for cn, c in cams.items():
            await pg.evaluate(f'__cam({",".join(map(str, c))})'); await settle(pg); await asyncio.sleep(20); await settle(pg)
            res[f'home_{cn}'] = await info(pg)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate(f'__bw.battle.start({tgt})')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        await pg.evaluate('__bw.battle.session.cam.free = true; __bw.battle.session.cam.intro = 0')
        for cn, c in cams.items():
            await pg.evaluate(f'(()=>{{const k=__bw.camera; k.position.set({",".join(map(str,c[:3]))}); k.lookAt({",".join(map(str,c[3:]))}); k.updateMatrixWorld(true);}})()'); await settle(pg); await asyncio.sleep(20); await settle(pg)
            res[f'attack_after_{cn}'] = await info(pg)
            await pg.evaluate("(names) => { __bw.world.stage.children.forEach(c => { if (names.includes(c.name)) c.visible = false; }); }", KEEP); await settle(pg)
            res[f'attack_before_{cn}'] = await info(pg)
            await pg.evaluate("(names) => { __bw.world.stage.children.forEach(c => { if (names.includes(c.name)) c.visible = true; }); }", KEEP); await settle(pg)
        print(json.dumps(res, indent=1))
        json.dump(res, open(f'/home/claude/work/bt1/cost_lv{lv}.json', 'w'))
        await b.close()
asyncio.run(main())
