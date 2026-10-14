import asyncio, sys, os, json
from playwright.async_api import async_playwright
# u3_perf.py TAG  — battle perf of the two units in the REAL game: draw calls / triangles per kind, programs, build times.  OFF=1 -> the old looks (A/B).  Output: /home/claude/work/u3/perf_<TAG>.json
TAG = sys.argv[1]; OFF = os.environ.get('OFF') == '1'
ARMY = {"lich": 12, "darkrider": 2, "spear": 14, "sword": 8, "archer": 8}
KIND = """() => { const s = __bw.battle.session, K = s.views.kinds, out = {};
  for (const n of ['lich', 'darkrider']) { const k = K[n]; if (!k) { out[n] = null; continue; } const rows = [];
    k.group.traverse((o) => { if (o.isInstancedMesh) { const g = o.geometry, ix = g.index ? g.index.count : g.attributes.position.count; rows.push([o.name || '', o.visible, o.count, Math.round(ix / 3), o.castShadow ? 1 : 0]); } });
    out[n] = { meshes: rows.length, drawn: k.drawn, rows }; }
  return out; }"""
FOCUS = """(a) => { const s = __bw.battle.session, us = s.sim.units.filter((u) => u.type === a[0] && !u.dead); let x = 0, z = 0; for (const u of us) { x += u.x; z += u.z; } x /= us.length; z /= us.length; const c = s.cam; c.tx = x; c.tz = z; c.dist = a[1]; c.pitch = a[2]; c.intro = 0; return us.length; }"""
MEAS = """async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const t0 = bw.frames; await new Promise((res) => { const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 50); });
  const n = bw.frames - t0, i = r.info; const o = { calls: Math.round(i.render.calls / n), tris: Math.round(i.render.triangles / n), programs: i.programs.length, geometries: i.memory.geometries, textures: i.memory.textures }; r.info.autoReset = true; return o; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1); logs = []
        if OFF: await pg.add_init_script('window.__U3_OFF = 1;')
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        pre = await pg.evaluate(MEAS)
        await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", ARMY)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        res = {'off': OFF, 'home_before_battle': pre, 'kinds': await pg.evaluate(KIND), 'u3t': await pg.evaluate('globalThis.__u3t || null')}
        for u, d, pt in (('lich', 46, 0.62), ('darkrider', 58, 0.62)):
            await pg.evaluate(FOCUS, [u, d, pt]); await asyncio.sleep(3); res['view_' + u] = await pg.evaluate(MEAS)
        await pg.evaluate("(()=>{ const s=__bw.battle.session; for (const n of ['lich','darkrider']) if (s.views.kinds[n]) s.views.kinds[n].group.visible = false; })()"); await asyncio.sleep(2)
        res['view_darkrider_kinds_hidden'] = await pg.evaluate(MEAS)
        await pg.evaluate(FOCUS, ['lich', 46, 0.62]); await asyncio.sleep(3); res['view_lich_kinds_hidden'] = await pg.evaluate(MEAS)
        res['logs'] = logs[:6]; json.dump(res, open(f'/home/claude/work/u3/perf_{TAG}.json', 'w'), indent=1); print(json.dumps(res)[:3000], flush=True); await b.close()
asyncio.run(main())
