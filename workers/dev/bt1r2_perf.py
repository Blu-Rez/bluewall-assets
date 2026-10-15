#!/usr/bin/env python3
# bt1r2_perf.py <tag> — BT1_R2 job 1: what does a battle cost?  Boots dev/bt1r2_<tag>.html (?pf=1, phone-sized landscape 844x390, software GL), starts an attack,
# and records (PF probe: calls / triangles / shadow calls / JS ms per system / frame times) at the battle camera in 4 phases, each at CPU throttle x1 and x4:
#   deploy (army standing at its camp, nobody sent)   ·   fight_wide (every squad sent at the keep, default battle camera)   ·   fight_close (camera 80 m from the gate)
# plus the scene census (draw calls / triangles per group) and the shader-program count before / after the load and at the end.
# Software GL measures the CPU side and the call counts, NOT the phone GPU (draw commands are swallowed: NODRAW=1, as in pf1_measure.py).
#   env: Q=low|high  LV=30  SECS=8  OUT=/home/claude/work/bt1r2  ARMY='{"spear":..}'  (default: the dev save's army)  NODRAW=1
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
TAG = sys.argv[1] if len(sys.argv) > 1 else 'before'
Q = os.environ.get('Q', 'low'); LV = int(os.environ.get('LV', 30)); SECS = float(os.environ.get('SECS', 8)); NODRAW = os.environ.get('NODRAW', '1') == '1'
OUT = os.environ.get('OUT', '/home/claude/work/bt1r2'); os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc']
R = {'tag': TAG, 'q': Q, 'lv': LV, 'viewport': '844x390', 'phases': {}, 'errors': []}
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def save(): json.dump(R, open('%s/perf_%s.json' % (OUT, TAG), 'w'), indent=1)

async def poker(pg, secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        try: await pg.evaluate("window.dispatchEvent(new Event('pointermove'))")
        except Exception: pass
        await asyncio.sleep(0.6)

async def record(pg, cdp, secs, th):
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': th})
    await asyncio.sleep(1.5)
    pk = asyncio.create_task(poker(pg, secs + 1))
    await pg.evaluate('__pf.start()'); await asyncio.sleep(secs); s = await pg.evaluate('__pf.stop()')
    await pk; await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1}); return s

async def phase(pg, cdp, name, setup=None, ths=(1, 4)):
    ph = R['phases'].setdefault(name, {})
    try:
        if setup: ph['setup'] = await pg.evaluate(setup)
        await asyncio.sleep(3)
        for th in ths:
            ph['x%d' % th] = await record(pg, cdp, SECS, th)
            log(name, 'x%d' % th, {k: ph['x%d' % th].get(k) for k in ('n', 'fps', 'avg', 'p95', 'js', 'render', 'calls', 'tris', 'shCalls')})
        ph['census'] = await pg.evaluate('__pf.census()'); ph['info'] = await pg.evaluate('__pf.info()')
        ph['sim'] = await pg.evaluate("(() => { const s = __bw.battle.session, sim = s.sim; return { t: +sim.time.toFixed(1), units: sim.units.filter(u => !u.dead).length, defs: sim.defenders.filter(d => !d.dead).length, bld: sim.buildings.filter(b => !b.dead).length, views: s.views.stats() }; })()")
    except Exception as e:
        R['errors'].append('%s: %s' % (name, str(e)[:300])); log('ERR', name, str(e)[:300])
    save()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
        if NODRAW:
            await ctx.add_init_script("(()=>{ window.__nd={on:true}; const P=[[WebGL2RenderingContext,'drawElements'],[WebGL2RenderingContext,'drawArrays'],[WebGL2RenderingContext,'drawElementsInstanced'],[WebGL2RenderingContext,'drawArraysInstanced'],[WebGL2RenderingContext,'drawRangeElements']]; for(const [C,k] of P){ const o=C.prototype[k]; C.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();")
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
        pg.on('pageerror', lambda e: R['errors'].append('page: ' + str(e)[:300]))
        pg.on('console', lambda m: R['errors'].append('console: ' + m.text[:200]) if m.type == 'error' and '404' not in m.text else None)
        await cdp.send('Performance.enable')
        await pg.goto('http://127.0.0.1:8777/bt1r2_%s.html?pf=1&q=%s&w=clear&h=14&wa=0.1&lv=%d' % (TAG, Q, LV))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        R['programs_home'] = await pg.evaluate('(__bw.renderer.info.programs||[]).length'); log('home programs', R['programs_home'])
        if os.environ.get('ARMY'): await pg.evaluate("(a) => { __bw.econ.st.army = Object.assign(__bw.econ.st.army || {}, { army: a }); }", json.loads(os.environ['ARMY']))
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': LV, 'wall': LV, 'towers': LV}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        t0 = time.time()
        await pg.evaluate('__bw.battle.start(%s)' % tgt)
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        R['load_s'] = round(time.time() - t0, 1); await asyncio.sleep(3)
        await pg.evaluate('__bw.battle.session.cam.intro = 0')
        R['programs_battle'] = await pg.evaluate('(__bw.renderer.info.programs||[]).length'); log('battle programs', R['programs_battle'], 'load', R['load_s'], 's')
        R['army'] = await pg.evaluate("(() => { const s = __bw.battle.session, c = {}; for (const u of s.sim.units) c[u.type] = (c[u.type] || 0) + 1; const d = {}; for (const u of s.sim.defenders) d[u.type] = (d[u.type] || 0) + 1; return { types: s.types, army: c, defenders: d, buildings: s.sim.buildings.length, camp: s.camp ? s.camp.info.tents.length : 0 }; })()")
        log('army', R['army']); save()
        await phase(pg, cdp, 'deploy')
        await phase(pg, cdp, 'fight_wide', "(() => { const s = __bw.battle.session, k = __bw.world.baseMeta.keep; let n = 0; for (const t of s.types) n += s.sim.send(t, k.x, k.z) || 0; s.started = true; return { sent: n }; })()")
        await asyncio.sleep(10)
        await phase(pg, cdp, 'fight_close', "(() => { const s = __bw.battle.session, g = __bw.world.baseMeta.keep, d = s.sim.deploy; s.cam.tx = (g.x + d.x) / 2; s.cam.tz = (g.z + d.z) / 2; s.cam.dist = 80; return { cam: [s.cam.tx, s.cam.tz, s.cam.dist] }; })()")
        R['programs_end'] = await pg.evaluate('(__bw.renderer.info.programs||[]).length'); log('end programs', R['programs_end'])
        if os.environ.get('SHOT'):
            await pg.evaluate('window.__nd && (window.__nd.on = false)'); await asyncio.sleep(2); await pg.screenshot(path='%s/perf_%s.png' % (OUT, TAG), timeout=180000)
        save(); await b.close()
asyncio.run(main())
