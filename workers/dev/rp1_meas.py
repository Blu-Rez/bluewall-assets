import asyncio, os, json, time
from playwright.async_api import async_playwright
# rp1_meas.py : base bundle / new bundle gate OFF / new bundle gate ON: programs, draw calls, triangles, bytes downloaded until ready (and: does anything under assets/rpg/ get fetched?)
CFG = [('A_base', 'rp1_base.html'), ('B_off', 'rp1_off.html'), ('C_on', 'rp1_dev.html')]
MEAS = """async (secs) => { const r = __bw.renderer; r.info.autoReset = false; r.info.reset(); await new Promise(res => setTimeout(res, secs * 1000)); const o = { calls: r.info.render.calls, tris: r.info.render.triangles, frames: r.info.render.frame, progs: (r.info.programs || []).length, geo: r.info.memory.geometries, tex: r.info.memory.textures }; r.info.autoReset = true; return o; }"""
async def main():
    res = {}
    async with async_playwright() as p:
        for tag, page in CFG:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
            reqs = []; pg.on('response', lambda r: reqs.append((r.url, r.headers.get('content-length'))))
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            t0 = time.time(); await pg.goto('http://127.0.0.1:8777/' + page + '?q=low&w=clear&h=14&wa=0.1')
            for i in range(3000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate("() => { const c=__bw.ctl; c.intro=null; __bw.world.setLevel(30); c.target.set(0,0,0); c.dist=190; c.polar=1.08; c.azim=0.95; }")
            await asyncio.sleep(8)
            rr = {'ready_s': round(time.time() - t0), 'meas_home': await pg.evaluate(MEAS, 3)}
            rr['reqs'] = len(reqs); rr['bytes_hdr'] = sum(int(c) for u, c in reqs if c and c.isdigit()); rr['rpg_reqs'] = [u for u, c in reqs if '/rpg/' in u]; rr['pageerr'] = errs[:3]
            if tag == 'C_on':
                await pg.click('.rp-open'); await pg.wait_for_selector('.rp-pick'); await pg.click('.rp-card[data-k=elina]')
                for i in range(240):
                    if await pg.evaluate('!!(window.__rp && __rp.S.hero)'): break
                    await asyncio.sleep(0.5)
                await pg.evaluate("() => { __rp.pause(true); __rp.S.cool = 99; __rp.setPos(40.95,21.98,-2.17); __rp.sim(0.3); }")
                await asyncio.sleep(3)
                rr['hero_on_map'] = await pg.evaluate(MEAS, 4)
                await pg.evaluate("() => { __rp.S.hero.grp.visible = false; }"); await asyncio.sleep(2)
                rr['hero_hidden_same_cam'] = await pg.evaluate(MEAS, 4)
                await pg.evaluate("() => { __rp.S.hero.grp.visible = true; __rp.S.cool = 0; setTimeout(() => __rp.goUnder(), 0); }")
                for i in range(240):
                    if await pg.evaluate("__rp.pos().where === 'under' && !__rp.S.busy2"): break
                    await asyncio.sleep(0.5)
                await asyncio.sleep(3); rr['under'] = await pg.evaluate(MEAS, 4)
                rr['rpg_reqs'] = [u.split('/rpg/')[1] for u, c in reqs if '/rpg/' in u]
            res[tag] = rr; print(tag, json.dumps(rr), flush=True)
            await b.close()
    json.dump(res, open('/home/claude/work/rp1/meas.json', 'w'), indent=1)
asyncio.run(main())
