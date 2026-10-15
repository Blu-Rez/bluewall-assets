# WC1 proof frames, 844x390, library weapons on the sister's rig (test only): at rest (idle / walk / sit) and in a fight (draw -> hit -> sheathe), from BEHIND and from the LEFT side.
#   usage: python3 wc1_frames.py [sister] [class ...]  -> /home/claude/work/wc1/out/frames/<sister>_<class>_<phase>_<view>.png
import asyncio, sys, os
sys.path.insert(0, '/home/claude/dev')
from wc1_shot import *
import wc1_pen as W
OUT = '/home/claude/work/wc1/out/frames/'; os.makedirs(OUT, exist_ok=True)
PH = [('rest_idle', 'idle', 1.0, None), ('rest_walk', 'walk', 0.45, None), ('rest_sit', 'sit_idle', 0.5, None),
      ('fight_1draw', 'slash_a', 0.04, 'draw'), ('fight_2hit', 'slash_a', 0.25, 'hit'), ('fight_3sheathing', 'idle', 1.0, 'sheathing'), ('fight_4sheathed', 'idle', 1.0, 'sheathed')]
VIEWS = [('behind', 3.14159), ('left', 1.5708)]
async def main():
    a = [x for x in sys.argv[1:]]; sister = a[0] if a else 'elina'; classes = a[1:] or ['short_sword', 'big_sword', 'staff', 'bow_quiver']
    async with async_playwright() as p:
        b, pg, logs = await open_page(p, 844, 390)
        await pg.evaluate("() => { __wc1.renderer.setScissorTest(false); __wc1.renderer.setClearColor(0x0b111b); }")
        for cls in classes:
            await pg.evaluate("(o) => __wc1.dress(o)", dict(sister=sister, items=W.CLASSES[cls], drawn=False))
            fh = {'big_sword': (4.3, 0.98), 'bow_quiver': (4.3, 0.98), 'staff': (4.0, 0.95), 'short_sword': (3.9, 0.92), 'spear': (4.6, 1.1), 'hammer': (4.3, 1.0), 'dagger_pair': (3.6, 0.92)}[cls]
            for name, clip, t, st in PH:
                for vname, az in VIEWS:
                    await pg.evaluate("""([clip, t, st, az, dist, ty]) => { const w = __wc1, c = w.getCtl();
                        if (st === 'draw') { c.setDrawn(false); c.update(0.001, true); c.update(0.03, true); }          // mid swap (scale ~0.5)
                        else if (st === 'hit') { c.setDrawn(true); }
                        else if (st === 'sheathing') { c.setDrawn(true); c.update(1.0, false); c.update(1.0, false); c.update(1.01, false); c.update(0.001, false); c.update(0.03, false); }
                        else if (st === 'sheathed') { c.setDrawn(true); c.update(1.0, false); c.update(1.0, false); c.update(1.01, false); for (let i = 0; i < 12; i++) c.update(0.02, false); }
                        else c.setDrawn(false);
                        w.pose(clip, t); w.hero.model.updateMatrixWorld(true); w.scene.updateMatrixWorld(true); w.syncHalo(); w.scene.background.set(0x1b2536); w.frameFigure(az, 0.08, 30, dist, ty); w.panel(0, 0, 844, 390); }""", [clip, t, st, az, fh[0], fh[1]])
                    await pg.screenshot(path=f"{OUT}{sister}_{cls}_{name}_{vname}.png")
            print(cls, 'ok', await pg.evaluate("() => __wc1.getCtl().state().map(s => s.kind + ':' + s.where + ':' + s.phase)"))
        await b.close()
asyncio.run(main())
