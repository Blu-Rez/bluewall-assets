import asyncio, sys, os, json, math
from playwright.async_api import async_playwright
# bt1_destroy.py OUTDIR LEVEL KINDS(comma) : real game, attack, for each target kind: intact / half (50 % damage) / ruin (killed) frames at 844x390 from a camera on the target.
async def settle(pg, n=4):
    f0 = await pg.evaluate('__bw.frames')
    for i in range(400):
        await asyncio.sleep(0.3)
        if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
async def main():
    out = sys.argv[1]; lv = int(sys.argv[2]); kinds = sys.argv[3].split(','); os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q={os.environ.get('Q','low')}&w=clear&h=14&wa=0.1&lv={lv}")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate(f'__bw.battle.start({tgt})')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        await pg.evaluate('__bw.battle.session.cam.free = true; __bw.battle.session.cam.intro = 0')
        # hide the HUD so the structure is what you look at (the frame is about the structure, not the buttons)
        await pg.add_style_tag(content='.bwb-hud, .bwb-root, [class^="bwb-"]{opacity:0 !important}')
        for spec in kinds:
            kind, _, only = spec.partition(':')
            info = await pg.evaluate("""(kind) => {
              const sim = __bw.battle.session.sim; const byId = kind.startsWith('id') ? +kind.slice(2) : 0;
              let c = byId ? sim.buildings.filter(b => b.id === byId) : sim.buildings.filter(b => b.type === kind && !b.dead && !(kind === 'ballista' && b.off));
              if (!c.length) return null;
              const ref = kind === 'house' ? [39, 71] : kind === 'wall' ? [2, -53] : kind === 'gate' ? [0, -60] : [0, 0]; c.sort((a, b) => Math.hypot(a.x - ref[0], a.z - ref[1]) - Math.hypot(b.x - ref[0], b.z - ref[1]));
              const b = c[0]; return { id: b.id, type: b.type, x: b.x, z: b.z, w: b.w || 8, d: b.d || 8, h: b.h || 8, gy: __bw.world.fastHeight(b.x, b.z), maxHp: b.maxHp, n: c.length };
            }""", kind)
            if not info: print('NO TARGET of kind', kind, flush=True); continue
            D = max(34, max(info['w'], info['d']) * 2.0, info['h'] * 2.6) * float(os.environ.get('DIST', '1'))          # (DIST < 1: closer)
            off = [float(v) for v in os.environ.get('CAMOFF', '0.25,0.62,0.92').split(',')]          # (camera offset from the target in units of D: x, y, z)
            cam = f"(()=>{{const k=__bw.camera; k.position.set({info['x'] + off[0] * D}, {info['gy'] + off[1] * D}, {info['z'] + off[2] * D}); k.lookAt({info['x']}, {info['gy'] + info['h'] * 0.35}, {info['z']}); k.updateMatrixWorld(true);}})()"
            await pg.evaluate(cam); await settle(pg)
            if not only:
                await pg.screenshot(path=f'{out}/{kind}_1intact.png', timeout=240000); print(kind, 'intact', json.dumps({k: (round(v) if isinstance(v, float) else v) for k, v in info.items()}), flush=True)
                await pg.evaluate(f"(()=>{{const b=__bw.battle.session.sim.buildings.find(q=>q.id=={info['id']}); b.hp=b.maxHp*0.5;}})()"); await settle(pg)
                await pg.evaluate(cam); await settle(pg, 2)
                await pg.screenshot(path=f'{out}/{kind}_2half.png', timeout=240000); print(kind, 'half', flush=True)
            print('machines on the site', await pg.evaluate(f"JSON.stringify((__bw.world.ballistas && __bw.world.ballistas.S || []).filter(b => b.s && b.s.tid === {info['id']}).map(b => ({{dead: !!b.dead}})))"), flush=True)
            await pg.evaluate(f"__bw.battle._kill({info['id']})")
            print('machines after', await pg.evaluate(f"JSON.stringify((__bw.world.ballistas && __bw.world.ballistas.S || []).filter(b => b.s && b.s.tid === {info['id']}).map(b => ({{dead: !!b.dead}})))"), flush=True)
            for i in range(40):
                await asyncio.sleep(0.4)
                st = await pg.evaluate(f"JSON.stringify(__bw.DS.get({info['id']}))")
                if json.loads(st)['collapse'] >= 0.999: break
            await pg.evaluate(f"(()=>{{const b=__bw.battle.session.sim.buildings.find(q=>q.id=={info['id']}); b.cTv=1;}})()")      # (the software renderer runs ~1 fps: the last beat of the fall is shown by setting the shown collapse time to its end)
            await pg.evaluate(cam); await settle(pg, 4)
            await pg.screenshot(path=f'{out}/{kind}_3ruin.png', timeout=240000); print(kind, 'ruin', st, flush=True)
        print('\n'.join(logs[:10]))
        await b.close()
asyncio.run(main())
