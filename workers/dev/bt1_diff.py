import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt1_diff.py LEVEL [DEPTH] : home vs attack, same level, same page.  Per scene-tree group: visible mesh count + visible triangles (instances counted).  Prints the groups that differ.
SNAP = """(depth) => {
  const S = __bw.scene, out = {};
  const nm = (o) => o.name || o.type;
  S.traverse((o) => {
    if (!(o.isMesh || o.isPoints || o.isLine)) return;
    let vis = true, p = o, chain = [];
    while (p && p !== S) { if (!p.visible) vis = false; chain.unshift(nm(p)); p = p.parent; }
    const key = chain.slice(0, depth).join(' > ');
    const g = o.geometry; let tri = 0;
    if (g) { const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0); tri = (n / 3) * (o.isInstancedMesh ? (o.count || 0) : 1); if (o.geometry.drawRange && o.geometry.drawRange.count < 1e9) tri = Math.min(tri, o.geometry.drawRange.count / 3 * (o.isInstancedMesh ? o.count : 1)); }
    const e = out[key] || (out[key] = { vis: 0, hid: 0, tri: 0 });
    if (vis) { e.vis++; e.tri += tri; } else e.hid++;
  });
  return out;
}"""
async def main():
    lv = int(sys.argv[1]); depth = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    W = int(os.environ.get('W', 844)); H = int(os.environ.get('H', 390))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q={os.environ.get('Q','low')}&w=clear&h=14&wa=0.1&lv={lv}")
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        CAMS = {'far': [0,230,150,0,0,-10], 'near': [30,50,110,40,0,50]}
        async def settle(n=8):
            f0 = await pg.evaluate('__bw.frames')
            for i in range(300):
                await asyncio.sleep(0.3)
                if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
        home = {}
        for cn, c in CAMS.items():
            await pg.evaluate(f'__cam({",".join(map(str,c))})'); await settle()
            home[cn] = await pg.evaluate(f'({SNAP})({depth})')
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate(f'__bw.battle.start({tgt})')
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        await pg.evaluate('__bw.battle.session.cam.free = true; __bw.battle.session.cam.intro = 0')
        atk = {}
        for cn, c in CAMS.items():
            await pg.evaluate(f'(()=>{{const k=__bw.camera; k.position.set({",".join(map(str,c[:3]))}); k.lookAt({",".join(map(str,c[3:]))}); k.updateMatrixWorld(true);}})()'); await settle()
            atk[cn] = await pg.evaluate(f'({SNAP})({depth})')
        lvs = await pg.evaluate("JSON.stringify(__bw.world.levels && __bw.world.levels.get ? __bw.world.levels.get() : null)")
        json.dump({'lv': lv, 'home': home, 'atk': atk, 'levels_after': lvs}, open(f'/home/claude/work/bt1/diff_lv{lv}.json', 'w'))
        for cn in CAMS:
            hh, aa = home[cn], atk[cn]; keys = sorted(set(hh) | set(aa))
            print(f'LV {lv} cam {cn}  keys {len(keys)}')
            for k in keys:
                h = hh.get(k, {'vis': 0, 'hid': 0, 'tri': 0}); a = aa.get(k, {'vis': 0, 'hid': 0, 'tri': 0})
                if h['vis'] != a['vis'] or abs(h['tri'] - a['tri']) > 0.02 * max(1, h['tri']):
                    print(f"{k[:90]:90s} home vis {h['vis']:4d} tri {int(h['tri']):8d} | atk vis {a['vis']:4d} tri {int(a['tri']):8d}")
        await b.close()
asyncio.run(main())
