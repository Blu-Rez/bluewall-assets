# WC1: compare mount variants visually.  usage: python3 wc1_cmp.py <sister> <class> <mount> '<json list of {pos:[x,null,z],dir:[a,b,c]}>' [clip t]   -> out/cmp_<class>.png  (rows = variants, cols = behind-left / left side / front-left, + a walk pose col)
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from wc1_shot import *
import wc1_pen as W
async def main():
    sister, cls, mount, spec = sys.argv[1:5]; variants = json.loads(spec); dist = float(sys.argv[5]) if len(sys.argv) > 5 else 2.9; ty = float(sys.argv[6]) if len(sys.argv) > 6 else 0.95
    cw, ch = 420, 400; cols = [('idle', 1.0, 2.55), ('idle', 1.0, 1.5708), ('walk', 0.45, 2.2), ('run', 0.3, 1.2)]
    Wd, Hh = cw * len(cols), ch * len(variants) + 30
    async with async_playwright() as p:
        b, pg, logs = await open_page(p, Wd, Hh)
        await pg.evaluate("([w,h]) => { __wc1.resize(w,h); __wc1.renderer.setScissorTest(false); __wc1.renderer.setClearColor(0x0b111b); __wc1.renderer.clear(); __wc1.renderer.setScissorTest(true); }", [Wd, Hh])
        for i, v in enumerate(variants):
            await pg.evaluate("""async ([m, v]) => { const M = await __wc1.mods(); const e = M.carry.MOUNT[m]; if (v.pos) for (let i = 0; i < 3; i++) if (v.pos[i] != null) e.pos[i] = v.pos[i]; if (v.dir) for (let i = 0; i < 3; i++) if (v.dir[i] != null) e.dir[i] = v.dir[i]; }""", [mount, v])
            await pg.evaluate("(o) => __wc1.dress(o)", dict(sister=sister, items=W.CLASSES[cls], drawn=False))
            for j, (clip, t, az) in enumerate(cols):
                await pg.evaluate("""([clip, t, az, i, j, cw, ch, dist, ty]) => { const w = __wc1; w.pose(clip, t); w.getCtl().setDrawn(false); w.pose(clip, t); w.hero.model.updateMatrixWorld(true); w.syncHalo(); w.scene.background.set(0x1b2536); w.frameFigure(az, 0.08, 30, dist, ty); w.panel(j * cw, 30 + i * ch, cw, ch); }""", [clip, t, az, i, j, cw, ch, dist, ty])
        await pg.evaluate("""([vs]) => { const w = __wc1; w.clearLabels(); vs.forEach((v, i) => w.label((i + 1) + '  ' + JSON.stringify(v), 8, 34 + i * 400, { size: 13, color: '#ffd24a' })); }""", [[{k: x for k, x in v.items()} for v in variants]])
        await pg.screenshot(path=f"/home/claude/work/wc1/out/cmp_{cls}.png"); await b.close()
asyncio.run(main())
