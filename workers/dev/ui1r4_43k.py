# ui1r4_43k.py <page-tag> <out-tag> [fix] — UI1_R4 bug «a ruby 43K pill stays mid-screen over the hero»: start the hero, stand it near every mine badge (gems.js gemBadge sprites, "+43K" when >= 10 000 are ready),
# measure where the pill lands on the screen (844x390) and shoot it.  Prints, per spot: pill visible? its screen rect, does it cover the hero / the screen centre?
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
FAST = bool(os.environ.get('FAST'))          # FAST=1: only the ruby mine at 130 / 300 m, no pitched camera (what dev/ui1_menus_test.sh runs); without it: all three mines, 5 distances + near + pitched
PAGE = sys.argv[1]; OUTTAG = sys.argv[2]; OUT = os.environ.get('OUT', '/home/claude/work/ui1r4/') + OUTTAG + '/'; os.makedirs(OUT, exist_ok=True)
INFO = """() => { const w = __bw.world, o = []; for (const b of w.badges || []) { const p = b.sprite.position; o.push({ id: b.id, x: p.x, y: p.y, z: p.z, vis: b.sprite.visible }); } return o; }"""
FILL = """(n) => { const e = __bw.econ; for (const b of __bw.world.badges || []) b.sprite.userData.set(n, false); window.__fill = n; }"""
SPOT = """([mx, mz, dist, ang]) => { const r = __rp; const x = mx + Math.cos(ang) * dist, z = mz + Math.sin(ang) * dist; r.setPos(x, z, Math.atan2(mx - x, mz - z)); r.sim(1.2); return r.pos(); }"""
MEAS = """() => { const r = __rp, o = []; for (const b of __bw.world.badges || []) { const p = b.sprite.position, s = b.sprite.scale, vis = b.sprite.visible;
  const c = r.proj(p.x, p.y, p.z), l = r.proj(p.x - s.x / 2, p.y, p.z), rr = r.proj(p.x + s.x / 2, p.y, p.z), t = r.proj(p.x, p.y + s.y / 2, p.z), bt = r.proj(p.x, p.y - s.y / 2, p.z);
  const half = Math.abs(rr[0] - l[0]) / 2, halfH = Math.abs(bt[1] - t[1]) / 2; o.push({ id: b.id, vis, behind: c[2] > 1, cx: Math.round(c[0]), cy: Math.round(c[1]), hw: Math.round(half), hh: Math.round(halfH) }); }
  const pos = r.pos(); const hp = r.proj(pos.x, pos.y + 1.0, pos.z); return { hero: [Math.round(hp[0]), Math.round(hp[1])], badges: o, W: innerWidth, H: innerHeight }; }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, PAGE); assert pg
        await set_size(pg, 844, 390, True); await close_all(pg)
        print('badges', json.dumps(await pg.evaluate(INFO)))
        if not await pg.evaluate("() => !!window.__rp"): await pg.evaluate("async () => { await __rpLoad(); }")
        await pg.evaluate("async () => { if (__rp.start) await __rp.start('elina'); }")
        for _ in range(240):
            if await pg.evaluate("() => !!(__rp && __rp.pos && document.querySelector('.rp-k') && !document.querySelector('.rp-pick'))"): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate(FILL, 43000)
        res = []
        info = await pg.evaluate(INFO)
        for bd in info:
            if FAST and bd['id'] != 'ruby': continue
            for dist, ang in ([(d, 0.6) for d in (130, 300)] if FAST else [(d, 0.6) for d in (60, 90, 130, 200, 300)] + [(10, 3.6)]):
                pos = await pg.evaluate(SPOT, [bd['x'], bd['z'], dist, ang]); await rerender(pg, 4)
                m = await pg.evaluate(MEAS); me = [x for x in m['badges'] if x['id'] == bd['id']][0]
                hx, hy = m['hero']; cover = me['vis'] and not me['behind'] and abs(me['cx'] - hx) <= me['hw'] and abs(me['cy'] - hy) <= me['hh']
                ctr = me['vis'] and not me['behind'] and abs(me['cx'] - m['W'] / 2) <= me['hw'] and abs(me['cy'] - m['H'] / 2) <= me['hh']
                row = dict(mine=bd['id'], dist=dist, ang=ang, hero=m['hero'], badge=me, coversHero=cover, coversCentre=ctr); res.append(row)
                print(f"{bd['id']:12s} d={dist:3d} hero@{m['hero']} pill c=({me['cx']},{me['cy']}) half=({me['hw']},{me['hh']}) vis={me['vis']} behind={me['behind']}  coversHero={cover} coversCentre={ctr}", flush=True)
                await pg.screenshot(path=f"{OUT}{bd['id']}_d{dist}_a{ang}.png", timeout=240000)
        # looking up: the same spots with the camera pitched (the player swipes up to look at the mountains)
        for bd in ([] if FAST else info):
            for dist in (130, 300):
                for pitch in (0.5, 0.9):
                    await pg.evaluate(SPOT, [bd['x'], bd['z'], dist, 0.6]); await pg.evaluate("(p) => __rp.setLook(__rp.pos().yaw, p)", pitch); await pg.evaluate("() => __rp.sim(0.6)"); await rerender(pg, 4)
                    m = await pg.evaluate(MEAS); me = [x for x in m['badges'] if x['id'] == bd['id']][0]; hx, hy = m['hero']
                    cover = me['vis'] and not me['behind'] and abs(me['cx'] - hx) <= me['hw'] and abs(me['cy'] - hy) <= me['hh']
                    ctr = me['vis'] and not me['behind'] and abs(me['cx'] - m['W'] / 2) <= me['hw'] and abs(me['cy'] - m['H'] / 2) <= me['hh']
                    onscreen = me['vis'] and not me['behind'] and me['cx'] + me['hw'] > 0 and me['cx'] - me['hw'] < m['W'] and me['cy'] + me['hh'] > 0 and me['cy'] - me['hh'] < m['H']
                    res.append(dict(mine=bd['id'], dist=dist, pitch=pitch, hero=m['hero'], badge=me, coversHero=cover, coversCentre=ctr, onscreen=onscreen))
                    print(f"{bd['id']:8s} d={dist:3d} pitch={pitch} hero@{m['hero']} pill c=({me['cx']},{me['cy']}) half=({me['hw']},{me['hh']}) onscreen={onscreen} coversHero={cover} coversCentre={ctr}", flush=True)
                    await pg.screenshot(path=f"{OUT}{bd['id']}_d{dist}_p{pitch}.png", timeout=240000)
        json.dump(res, open(OUT + 'results.json', 'w'), indent=0)
        hidden = all(not r['badge']['vis'] for r in res); anyshown = [r for r in res if r['badge']['vis'] and not r['badge']['behind'] and (r.get('onscreen') or r.get('coversHero') or r.get('coversCentre'))]
        await pg.evaluate("() => { try { __rp.exit && __rp.exit(); } catch (e) {} }"); await asyncio.sleep(1.5); await rerender(pg, 6)
        back = await pg.evaluate("() => (__bw.world.badges || []).map((b) => b.sprite.visible)")
        print('hero mode: every gem pill hidden:', hidden, '| pills shown on screen:', len(anyshown), '| after leaving hero mode, visible again:', back)
        ok = hidden and not anyshown and back and all(back)
        print('43K PILL OK' if ok else '43K PILL FAIL'); sys.exit(0 if ok else 1)
asyncio.run(main())
