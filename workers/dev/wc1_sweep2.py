# WC1: sweep carry.FIT.* / MOUNT.* values (dev tool).  usage: python3 wc1_sweep2.py <sister> <class> 'JS-object-literal-list'   e.g.  '[{FIT:{beltDy:-0.02}},{FIT:{beltDy:0}}]'  (MOUNT entries as {MOUNT:{hip:{pos:[x,y,z],dir:[a,b,c]}}})
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from wc1_shot import *
import wc1_pen as W
EVERYDAY = ['idle', 'walk', 'run', 'sit_down', 'sit_idle', 'stand_up', 'jump', 'fall', 'land', 'dodge', 'talk', 'look_around']
async def main():
    sister, cls, spec = sys.argv[1:4]; variants = json.loads(spec)
    async with async_playwright() as p:
        b, pg, logs = await open_page(p, 844, 390)
        for v in variants:
            await pg.evaluate("""async (v) => { const M = await __wc1.mods(); if (v.FIT) Object.assign(M.carry.FIT, v.FIT); if (v.MOUNT) for (const k in v.MOUNT) { const e = M.carry.MOUNT[k], q = v.MOUNT[k]; if (q.pos) for (let i = 0; i < 3; i++) if (q.pos[i] != null) e.pos[i] = q.pos[i]; if (q.dir) for (let i = 0; i < 3; i++) if (q.dir[i] != null) e.dir[i] = q.dir[i]; if (q.bone) e.bone = q.bone; } }""", v)
            await pg.evaluate("(o) => __wc1.dress(o)", dict(sister=sister, items=W.CLASSES[cls], drawn=False))
            names = await pg.evaluate("() => __wc1.hero.clips.map(c => c.name)")
            r1 = await pg.evaluate("(o) => __wc1.pen(o)", dict(stepSec=0.1, clips=[c for c in EVERYDAY if c in names], drawn=False, stride=2, maxPer=200))
            r2 = await pg.evaluate("(o) => __wc1.pen(o)", dict(stepSec=0.1, clips=[c for c in names if c not in EVERYDAY], drawn=False, stride=2, maxPer=200))
            print(json.dumps(v), f"| everyday: wpn {r1['wpn']['cm']:.1f} fit {r1['fit']['cm']:.1f} items {r1['items']} | other: wpn {r2['wpn']['cm']:.1f} fit {r2['fit']['cm']:.1f} items {r2['items']}", flush=True)
        await b.close()
asyncio.run(main())
