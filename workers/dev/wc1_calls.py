# WC1 budget proof: shader programs (+0) and draw calls (<= +2) added by combat/carry.js, measured in the RP4 arena on the REAL renderer (software GL).
#   programs: the set of compiled programs with each fixture == the set of WC1_BARE (the same weapon without scabbard / gem = the cost before WC1);  calls: renderer.info.render.calls with the carry meshes (scabbard + gem) shown minus hidden.
import asyncio, sys, json, math
sys.path.insert(0, '/home/claude/dev')
import rp4_shot
rp4_shot.URL = 'http://127.0.0.1:8777/rp4_dev.html'
from rp4_shot import *
FX = ['WC1_SWORD', 'WC1_BIG', 'WC1_PAIR', 'WC1_STAFF', 'WC1_BOW']
async def one(p, fx):
    b, pg, logs, err = await open_page(p, 844, 390, '&kinds=soldier&fixture=' + fx)
    if err: print(fx, 'ERR', err); await b.close(); return None
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0, 0); r.sim.enemies.splice(0); r.step(0.5, 1/60); }")
    out = {}
    for phase in ('rest', 'drawn'):
        if phase == 'drawn': await pg.evaluate("() => { const r = __rp4; r.sim.spawn('soldier', 0, 2.2, { yaw: Math.PI, passive: true }).hp = 9999; r.press('attack'); r.step(0.4, 1/60); }")
        out[phase] = await pg.evaluate("""() => { const r = __rp4, R = r.renderer, vis = []; r.scene.traverse((o) => { if (o.name === 'wc1_gem' || o.name === 'wc1_scabbard') vis.push(o); });
          const calls = () => { R.info.reset ? R.info.reset() : 0; r.render(); return R.info.render.calls; };
          const withC = calls(); const was = vis.map((o) => o.visible); vis.forEach((o) => { o.visible = false; }); const without = calls(); vis.forEach((o, i) => { o.visible = was[i]; });
          return { withCarry: withC, without, added: withC - without, meshes: vis.length, programs: R.info.programs.length, names: R.info.programs.map((x) => x.cacheKey.length + ':' + x.name).sort() }; }""")
    await b.close(); return out
async def prog(p, fx, control=False):
    b, pg, logs, err = await open_page(p, 844, 390, '&kinds=soldier&fixture=' + fx)
    if control:   # the game already draws static vertex-coloured MeshStandard meshes (terrain.js, gear_shield.js, sc_farm.js ...): put one into the arena so the baseline has that program too
        await pg.evaluate("() => { const r = __rp4, T = r.THREE, g = new T.BoxGeometry(0.2, 0.2, 0.2); g.setAttribute('color', new T.BufferAttribute(new Float32Array(g.attributes.position.count * 3).fill(0.5), 3)); const m = new T.Mesh(g, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })); m.position.set(0, 0.1, 1); r.scene.add(m); }")
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0, 0); r.sim.enemies.splice(0); r.step(0.5, 1/60); r.sim.spawn('soldier', 0, 2.2, { yaw: Math.PI, passive: true }).hp = 9999; r.press('attack'); r.step(0.6, 1/60); r.render(); }")
    n = await pg.evaluate("() => __rp4.renderer.info.programs.map((x) => x.cacheKey).sort()"); await b.close(); return n
async def main():
    async with async_playwright() as p:
        base = await prog(p, 'WC1_BARE', True); print('WC1_BARE + one game-style static vertex-colour mesh (= before WC1, in a scene that has terrain / gear): programs', len(base)); allok = True
        for fx in FX:
            r = await one(p, fx); pr = await prog(p, fx)
            extra = [k for k in pr if k not in base]; print(f"{fx:10s} rest +{r['rest']['added']} calls ({r['rest']['meshes']} carry meshes) | drawn +{r['drawn']['added']} | programs {len(pr)} (new vs WC1_BARE: {len(extra)})")
            allok = allok and r['rest']['added'] <= 3 and len(extra) == 0
        print('WC1 CALLS OK' if allok else 'WC1 CALLS: see numbers')
asyncio.run(main())
