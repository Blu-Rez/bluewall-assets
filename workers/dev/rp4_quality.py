# RP4: setQuality(0..3) check: 0 = full ... 3 = lowest.  prints live particles / trail / quality after a fight burst.
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from rp4_shot import *
async def main():
    async with async_playwright() as p:
        for q in range(4):
            b, pg, logs, err = await open_page(p, 480, 360, '&kinds=soldier,beast')
            r = await pg.evaluate("""(q) => { const r = __rp4; r.cmb.setQuality(q); const e = r.sim.spawn('soldier', 0, 1.8, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 9999; const b = r.sim.spawn('beast', 2.5, 3, {yaw: Math.PI, passive: true}); b.hp = b.hpMax = 9999; r.setPos(0, 0, 0); r.setCam(0, 0.2, 3.6, 50); r.step(0.3);
              r.press('attack'); let mx = 0, tl = 0; for (let i = 0; i < 40; i++) { r.step(1/60, 1/60); const s = r.cmb.stats(); mx = Math.max(mx, s.partLive); tl = Math.max(tl, s.trailLive); } r.press('skill2'); for (let i = 0; i < 60; i++) { r.step(1/60, 1/60); const s = r.cmb.stats(); mx = Math.max(mx, s.partLive); } return JSON.stringify({q: r.cmb.stats().quality, maxPart: mx, maxTrail: tl, js: r.cmb.stats().jsMs}); }""", q)
            print(r, logs[:2]); await b.close()
asyncio.run(main())
