import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
TAG = sys.argv[1] if len(sys.argv) > 1 else 'w1'
OUT = '/home/claude/work/v37w_' + TAG
ARMYS = {'mid': {'spear': 60, 'sword': 40, 'archer': 40, 'cavalry': 15, 'giant': 3, 'dragon': 1, 'catapult': 4, 'mage': 8}, 'small': {'spear': 30, 'sword': 20, 'archer': 20, 'cavalry': 8}, 'g4': {'giant': 4, 'spear': 20, 'ram': 4, 'catapult': 3}}
MEASURE = """() => { const s = __bw.battle.session, sim = s.sim, out = { rings: [], solid: 0, n: 0 };
  for (const t of s.types) { const i = s.rings.info(t); if (i) out.rings.push({ t, cx: i.cx, cz: i.cz, r: i.r }); }
  let min = 1e9, ov = []; for (let a = 0; a < out.rings.length; a++) for (let b = a + 1; b < out.rings.length; b++) { const A = out.rings[a], B = out.rings[b], g = Math.hypot(A.cx - B.cx, A.cz - B.cz) - A.r - B.r; if (g < min) min = g; if (g < 0) ov.push([A.t, B.t, +g.toFixed(2)]); }
  out.minGap = +min.toFixed(2); out.overlaps = ov; out.maxR = +Math.max(...out.rings.map((r) => r.r)).toFixed(1);
  const nav = s.nav; for (const u of sim.units) { if (u.air) continue; out.n++; if (nav && nav.isSolid && nav.isSolid(u.x, u.z)) out.solid++; }
  out.solids = nav && nav.isSolid ? 'yes' : 'no'; return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': int(os.environ.get('W', 1100)), 'height': int(os.environ.get('H', 620))}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        A = ARMYS.get(os.environ.get('ARMY', ''))
        if A: await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", A)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        print('battle ready', flush=True)
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(4)
        print('MEASURE', json.dumps(await pg.evaluate(MEASURE)), flush=True)
        print('PLAN', json.dumps(await pg.evaluate('(() => { const i = __bw.battle.session.camp.info; return { back1: i.back1, Bs: i.Bs, n: i.tents.length, poleFound: i.poleFound, fallback: i.fallback }; })()')), flush=True)
        await pg.evaluate("(()=>{const s=__bw.battle.session; s.hud.el.style.display='none';})()")
        await pg.screenshot(path=OUT + '_0_start.png', timeout=240000)
        for nm, fwd, pt, d in (('1_top', 80, 1.5, 330), ('2_oblique', 70, 0.72, 250)):
            await pg.evaluate("(a)=>{const s=__bw.battle.session, dp=s.sim.deploy; s.cam.tx=dp.x+dp.nx*a[0]; s.cam.tz=dp.z+dp.nz*a[0]; s.cam.dist=a[2]; s.cam.pitch=a[1];}", [fwd, pt, d])
            await asyncio.sleep(10)
            print('CAM', nm, json.dumps(await pg.evaluate('(()=>{const c=__bw.battle.session.cam; return {dist:c.dist,pitch:c.pitch,az:c.az};})()')), flush=True)
            await pg.screenshot(path=f'{OUT}_{nm}.png', timeout=240000)
        await b.close()
asyncio.run(main())
