# WC1: sweep a MOUNT entry (dev tool): python3 wc1_sweep.py <mount> <sister> <class> "x,z,dx,dy,dz;x,z,dx,dy,dz;..."   (pos[0],pos[2], dir) -> weapon / fittings worst cm over a clip subset (carried state)
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from wc1_shot import *
import wc1_pen as W
CLIPS = ['idle', 'walk', 'run', 'sit_idle', 'cheer', 'cast', 'talk', 'angry', 'jump', 'look_around', 'dodge', 'crouch', 'death']
async def main():
    mount, sister, cls, spec = sys.argv[1:5]
    async with async_playwright() as p:
        b, pg, logs = await open_page(p, 844, 390)
        for v in spec.split(';'):
            x, z, dx, dy, dz = [float(q) for q in v.split(',')]
            await pg.evaluate("""async ([m, x, z, d]) => { const M = await __wc1.mods(); const e = M.carry.MOUNT[m]; e.pos[0] = x; e.pos[2] = z; e.dir[0] = d[0]; e.dir[1] = d[1]; e.dir[2] = d[2]; }""", [mount, x, z, [dx, dy, dz]])
            await pg.evaluate("(o) => __wc1.dress(o)", dict(sister=sister, items=W.CLASSES[cls], drawn=False))
            names = await pg.evaluate("() => __wc1.hero.clips.map(c => c.name)")
            r = await pg.evaluate("(o) => __wc1.pen(o)", dict(stepSec=0.1, clips=[c for c in CLIPS if c in names], drawn=False, stride=2, maxPer=200))
            print(f"{mount} x={x} z={z} dir=({dx},{dy},{dz}) -> weapon {r['wpn']['cm']:.2f} cm @ {r['wpn'].get('clip')} t={r['wpn'].get('t')} near {r['wpn'].get('near','')[-12:]} | fit {r['fit']['cm']:.2f} @ {r['fit'].get('clip')} near {r['fit'].get('near','')[-12:]}")
        await b.close()
asyncio.run(main())
