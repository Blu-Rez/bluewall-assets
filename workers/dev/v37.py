import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# v37.py TAG : ONE real page (dev_s35.html?lv=30 = the real game code, castle level 30), then the real attack.
#   phase A: home at level 30 (blue-only houses, camera near / far / turned)
#   phase B: attack start (camera, camp vs army), top view of the camp, far / close camera
#   phase C: the resize / context-loss measurement (N6): luminance of the canvas at the END of the frame, old order vs new order
TAG = sys.argv[1]; OUT = '/home/claude/work/v37_' + TAG
W = int(os.environ.get('W', 390)); H = int(os.environ.get('H', 844)); PH = os.environ.get('PH', 'ABC')
INFO = """() => { const s = __bw.battle.session, c = __bw.camera, S = s.cam, dp = s.sim.deploy, tx = -dp.nz, tz = dp.nx;
  let b1 = -1e9, b0 = 1e9, l0 = 1e9, l1 = -1e9; const U = s.sim.units.map((u) => { const dx = u.x - dp.x, dz = u.z - dp.z, l = dx * tx + dz * tz, b = dx * dp.nx + dz * dp.nz; b1 = Math.max(b1, b); b0 = Math.min(b0, b); l0 = Math.min(l0, l); l1 = Math.max(l1, l); return [l, b]; });
  const ci = s.camp && s.camp.info; let gap = null, tg = null;
  if (ci) { gap = 1e9; for (const t of ci.tents) for (const u of U) gap = Math.min(gap, Math.hypot(u[0] - t[1], u[1] - t[2]) - t[3]);
    const g = []; for (let i = 0; i < ci.tents.length; i++) { let m = 1e9; for (let j = 0; j < ci.tents.length; j++) if (i !== j) m = Math.min(m, Math.hypot(ci.tents[i][1] - ci.tents[j][1], ci.tents[i][2] - ci.tents[j][2]) - ci.tents[i][3] - ci.tents[j][3]); g.push(m); }
    tg = { min: +Math.min(...g).toFixed(2), max: +Math.max(...g).toFixed(2), mean: +(g.reduce((a, b) => a + b, 0) / g.length).toFixed(2) }; }
  return { dp: [Math.round(dp.x), Math.round(dp.z), Math.round(Math.hypot(dp.x, dp.z))], units: s.sim.units.length, army: { b0: +b0.toFixed(1), b1: +b1.toFixed(1), l0: +l0.toFixed(1), l1: +l1.toFixed(1) },
   camPos: [Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z), Math.round(Math.hypot(c.position.x, c.position.z))],
   camGround: Math.round(__bw.world.fastHeight(c.position.x, c.position.z)), terOff: +(s.terOff || 0).toFixed(1), cam: { dist: S.dist, pitch: S.pitch, az: +S.az.toFixed(2), tx: Math.round(S.tx), tz: Math.round(S.tz) },
   camp: ci ? { poleFound: ci.poleFound, fallback: ci.fallback, H0: ci.H0, tentH: ci.tents.map((t) => t[4]), Bs: +ci.Bs.toFixed(1), back1: +ci.back1.toFixed(1), n: ci.tents.length, pole: ci.pole.map((v) => +v.toFixed(1)), rect: s.camp.rect, armyToTentGap: +gap.toFixed(1), tentGap: tg } : null }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        for i in range(900):
            if os.environ.get('SKIPINTRO') or await pg.evaluate('!__bw.ctl.intro'): break
            await asyncio.sleep(1)
        print('intro done', T(), flush=True)
        await asyncio.sleep(3)
        if 'A' in PH:
            await pg.evaluate("document.querySelector('.bwa-btn') && 0")
            for k, (nm, js) in enumerate([
                ('0_default', ''),
                ('1_near', "const c=__bw.ctl; c.dist=c.minD;"),
                ('2_ref', "const c=__bw.ctl; c.dist=c.refD*0.8;"),
                ('3_far', "const c=__bw.ctl; c.dist=c.maxD;"),
                ('4_far_turn', "const c=__bw.ctl; c.dist=c.maxD; c.azim+=2.1;"),
                ('5_far_turn2', "const c=__bw.ctl; c.dist=c.maxD; c.azim+=2.1;"),
            ]):
                if js: await pg.evaluate('() => {' + js + '}')
                await asyncio.sleep(9)
                info = await pg.evaluate("() => { const c=__bw.camera, k=__bw.ctl; return { pos:[Math.round(c.position.x),Math.round(c.position.y),Math.round(c.position.z)], r:Math.round(Math.hypot(c.position.x,c.position.z)), dist:Math.round(k.dist), polar:+k.polar.toFixed(2), azim:+k.azim.toFixed(2), minD:k.minD, maxD:k.maxD }; }")
                print('HOME', nm, json.dumps(info), flush=True)
                await pg.screenshot(path=f'{OUT}_A{nm}.png', timeout=240000)
        if 'H' in PH:
            # the camp on the HOME map (same spot as in a battle): the camera over the muster plain behind the gate, then turned to look at the mountain
            for k, (nm, js) in enumerate([
                ('H0_camp_home', "const c=__bw.ctl; c.target.set(268, 0, 118); c.dist=260; c.polar=1.0; c.azim=1.33;"),
                ('H1_camp_home_back', "const c=__bw.ctl; c.target.set(268, 0, 118); c.dist=200; c.polar=0.75; c.azim=1.33+Math.PI;"),
            ]):
                await pg.evaluate('() => {' + js + '}')
                await asyncio.sleep(9)
                await pg.screenshot(path=f'{OUT}_{nm}.png', timeout=240000)
            await pg.evaluate("() => { const c=__bw.ctl; c.azim=1.33; c.dist=c.refD*0.8; }")
        if 'B' in PH or 'C' in PH:
            await pg.evaluate("() => { const c=__bw.ctl; c.dist=c.refD*0.8; }")
            await asyncio.sleep(3)
            ARMY = {'mid': {'spear': 60, 'sword': 40, 'archer': 40, 'cavalry': 15, 'giant': 3, 'dragon': 1, 'catapult': 4, 'mage': 8}, 'small': {'spear': 30, 'sword': 20, 'archer': 20, 'cavalry': 8}}.get(os.environ.get('ARMY', ''))
            await pg.evaluate("() => { const A = __bw.econ.st.army; window.__orig = JSON.parse(JSON.stringify({ army: A.army, guard: A.guard || {} })); }")
            if ARMY:
                await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", ARMY)
                print('army override', os.environ.get('ARMY'), flush=True)
            await pg.evaluate("document.querySelector('.bwa-btn').click()")
            for i in range(2400):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
            print('battle ready', T(), flush=True)
            for i in range(900):
                if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
                await asyncio.sleep(1)
            await asyncio.sleep(4)
            print('INFO0', json.dumps(await pg.evaluate('(' + INFO + ')()')), flush=True)
            print('TENTS', json.dumps(await pg.evaluate('__bw.battle.session.camp.info.tents.map((t) => [t[0], t[1], t[2], t[3]])')), flush=True)
            await pg.screenshot(path=OUT + '_B0_start.png', timeout=240000)
            await pg.evaluate("(()=>{const s=__bw.battle.session; s.hud.el.style.display='none';})()")
            if 'B' in PH:
                # the camp seen from above: camera over the tents, looking down
                for nm, d, pt, mode in (('B1_over', 380, 1.2, 'over'), ('B1b_camp', 170, 0.85, 'camp'), ('B1c_camp_low', 150, 0.5, 'low')):
                    await pg.evaluate("""(a) => { const s=__bw.battle.session, ci=s.camp.info, dp=s.sim.deploy, tx=-dp.nz, tz=dp.nx, r=s.camp.rect;
                      const az0 = window.__az0 = window.__az0 === undefined ? s.cam.az : window.__az0;
                      let l, b; if (a[2] === 'over') { l = (r.l0 + r.l1) / 2; b = (ci.back1 + r.b1) / 2 - 10; } else { l = ci.pole[0]; b = ci.pole[1]; }
                      s.cam.tx = dp.x + tx * l + dp.nx * b; s.cam.tz = dp.z + tz * l + dp.nz * b; s.cam.dist = a[0]; s.cam.pitch = a[1]; s.cam.az = a[2] === 'low' ? az0 + Math.PI : az0; }""", [d, pt, mode])
                    await asyncio.sleep(9)
                    print('INFO_' + nm, json.dumps(await pg.evaluate('(' + INFO + ')()')), flush=True)
                    await pg.screenshot(path=f'{OUT}_{nm}.png', timeout=240000)
                await pg.evaluate("() => { __bw.battle.session.cam.az = window.__az0; }")
                await pg.evaluate("(()=>{const s=__bw.battle.session, dp=s.sim.deploy; s.cam.tx=dp.x; s.cam.tz=dp.z; s.cam.pitch=0.9; s.cam.dist=300;})()"); await asyncio.sleep(9)
                print('INFO_far', json.dumps(await pg.evaluate('(' + INFO + ')()')), flush=True)
                await pg.screenshot(path=OUT + '_B2_far.png', timeout=240000)
                await pg.evaluate("(()=>{const s=__bw.battle.session; s.cam.dist=120;})()"); await asyncio.sleep(9)
                print('INFO_close', json.dumps(await pg.evaluate('(' + INFO + ')()')), flush=True)
                await pg.screenshot(path=OUT + '_B3_close.png', timeout=240000)
                await pg.evaluate("(()=>{const s=__bw.battle.session; s.cam.dist=170;})()"); await asyncio.sleep(5)
            if os.environ.get('ARMY2') and 'B' in PH:
                # second attack in the SAME page: the owner's full army (the stress case for the camp placement and the 7 rows)
                try:
                    await pg.evaluate("document.querySelector('.bwb-end.home') && document.querySelector('.bwb-end.home').click()")
                    for i in range(600):
                        await asyncio.sleep(1)
                        if await pg.evaluate('!(__bw.battle && __bw.battle.session)'): break
                    print('left battle', T(), flush=True)
                    await asyncio.sleep(8)
                    await pg.evaluate("() => { const A = __bw.econ.st.army; A.army = window.__orig.army; A.guard = window.__orig.guard; }")
                    await pg.evaluate("document.querySelector('.bwa-btn').click()")
                    for i in range(2400):
                        await asyncio.sleep(0.5)
                        if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
                    print('battle2 ready', T(), flush=True)
                    for i in range(900):
                        if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
                        await asyncio.sleep(1)
                    await asyncio.sleep(4)
                    print('INFO2_0', json.dumps(await pg.evaluate('(' + INFO + ')()')), flush=True)
                    await pg.screenshot(path=OUT + '_D0_start.png', timeout=240000)
                    await pg.evaluate("(()=>{const s=__bw.battle.session; s.hud.el.style.display='none';})()")
                    for nm, d, pt, mode in (('D1_over', 380, 1.2, 'over'), ('D1b_camp', 170, 0.85, 'camp'), ('D1c_camp_low', 150, 0.5, 'low')):
                        await pg.evaluate("""(a) => { const s=__bw.battle.session, ci=s.camp.info, dp=s.sim.deploy, tx=-dp.nz, tz=dp.nx, r=s.camp.rect;
                          const az0 = window.__az0 = window.__az0 === undefined ? s.cam.az : window.__az0;
                          let l, b; if (a[2] === 'over') { l = (r.l0 + r.l1) / 2; b = (ci.back1 + r.b1) / 2 - 10; } else { l = ci.pole[0]; b = ci.pole[1]; }
                          s.cam.tx = dp.x + tx * l + dp.nx * b; s.cam.tz = dp.z + tz * l + dp.nz * b; s.cam.dist = a[0]; s.cam.pitch = a[1]; s.cam.az = a[2] === 'low' ? az0 + Math.PI : az0; }""", [d, pt, mode])
                        await asyncio.sleep(9)
                        print('INFO2_' + nm, json.dumps(await pg.evaluate('(' + INFO + ')()')), flush=True)
                        await pg.screenshot(path=f'{OUT}_{nm}.png', timeout=240000)
                    await pg.evaluate("() => { __bw.battle.session.cam.az = window.__az0; }")
                    await pg.evaluate("(()=>{const s=__bw.battle.session, dp=s.sim.deploy; s.cam.tx=dp.x+dp.nx*40; s.cam.tz=dp.z+dp.nz*40; s.cam.pitch=0.9; s.cam.dist=300;})()"); await asyncio.sleep(9)
                    await pg.screenshot(path=OUT + '_D2_far.png', timeout=240000)
                    await pg.evaluate("(()=>{const s=__bw.battle.session, dp=s.sim.deploy; s.cam.tx=dp.x+dp.nx*30; s.cam.tz=dp.z+dp.nz*30; s.cam.pitch=0.75; s.cam.dist=150;})()"); await asyncio.sleep(9)
                    await pg.screenshot(path=OUT + '_D3_close.png', timeout=240000)
                except Exception as e:
                    print('ARMY2 failed', repr(e)[:300], flush=True)
            if 'C' in PH:
                await pg.evaluate("() => { window.__bwLumOn = true; window.__bwLum = []; }")
                async def run(tag, legacy, steps):
                    await pg.evaluate(f"() => {{ window.__bwLegacyResize = {str(legacy).lower()}; window.__bwLum = []; }}")
                    await asyncio.sleep(6)
                    n0 = await pg.evaluate('window.__bwLum.length')
                    for v in steps:
                        await pg.evaluate(f'() => __bw.dynTo({v})'); await asyncio.sleep(9)
                    lum = await pg.evaluate('window.__bwLum')
                    ends = [(x['f'], x['lum']) for x in lum if x['tag'] == 'end']; mids = [(x['f'], x['lum']) for x in lum if x['tag'] == 'mid']
                    base = sorted(v for _, v in ends)[len(ends) // 2] if ends else 0
                    low = [(f, v) for f, v in ends if v < base * 0.5]
                    print('LUM', tag, 'legacy' if legacy else 'new', 'frames', len(ends), 'median', base, 'min', min([v for _, v in ends] or [0]), 'frames<50%', low[:8], flush=True)
                await run('dyn', True, [0.8, 1.0])
                await run('dyn', False, [0.8, 1.0])
                # context loss and restore
                await pg.evaluate("() => { window.__bwLum = []; }")
                print('loseCtx', await pg.evaluate('__bw.loseCtx(900)'), flush=True)
                for k in range(4):
                    await asyncio.sleep(12)
                    lum = await pg.evaluate('window.__bwLum.slice(-3)')
                    print('CTX', k, 'lost', await pg.evaluate('__bw.ctlLost !== undefined ? 1 : __bw.ctxLost'), json.dumps(lum), flush=True)
                    await pg.screenshot(path=f'{OUT}_C_ctx{k}.png', timeout=240000)
        print('LOGS', json.dumps(logs[-10:]), flush=True)
        await b.close()
asyncio.run(main())
