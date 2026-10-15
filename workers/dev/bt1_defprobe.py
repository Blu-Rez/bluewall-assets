import asyncio, sys, os, json
from playwright.async_api import async_playwright
LIST = """() => { const out = [], S = __bw.scene;
  let root = null; S.traverse(o => { if (o.name === 'late:defenses') root = o; });
  root.traverse(o => { if (!(o.isMesh || o.isPoints)) return; let v = true, p = o; const ch = []; while (p && p !== root) { if (!p.visible) v = false; ch.unshift(p.name || p.type); p = p.parent; }
    const g = o.geometry, n = g.index ? g.index.count / 3 : g.attributes.position.count / 3; const wp = new __bw.THREE.Vector3(); o.getWorldPosition(wp);
    out.push([v ? 1 : 0, ch.join('>').slice(0, 70), (o.material && o.material.name) || '', Math.round(n), Math.round(wp.x), Math.round(wp.z)]); });
  return out; }"""
async def settle(pg, n=8):
    f0 = await pg.evaluate('__bw.frames')
    for i in range(400):
        await asyncio.sleep(0.3)
        if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
async def main():
    lv = 30
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
        await pg.evaluate('__cam(0,230,150,0,0,-10)'); await settle(pg)
        home = await pg.evaluate(f'({LIST})()')
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate(f'__bw.battle.start({tgt})')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        await pg.evaluate('__bw.battle.session.cam.free = true; __bw.battle.session.cam.intro = 0')
        await pg.evaluate('(()=>{const k=__bw.camera; k.position.set(0,230,150); k.lookAt(0,0,-10); k.updateMatrixWorld(true);})()'); await settle(pg)
        atk = await pg.evaluate(f'({LIST})()')
        key = lambda r: tuple(r[1:])
        hs = {key(r): r[0] for r in home}; as_ = {key(r): r[0] for r in atk}
        print('only visible at home:')
        for k in sorted(hs): 
            if hs[k] == 1 and as_.get(k, 0) != 1: print('  ', k)
        print('only visible in attack:')
        for k in sorted(as_):
            if as_[k] == 1 and hs.get(k, 0) != 1: print('  ', k)
        print('home total meshes', len(home), 'visible', sum(r[0] for r in home), '| attack total', len(atk), 'visible', sum(r[0] for r in atk))
        await b.close()
asyncio.run(main())
